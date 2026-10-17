import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { coreGetJson, coreReadHeaders, RETRY_DELAY_MS } from '@/lib/core-api/client.server'
import type { HttpCoreConfig } from '@/lib/core-api/config.server'
import { CoreApiError } from '@/lib/core-api/errors'
import { jsonResponse } from '../support/events'

const config: HttpCoreConfig = {
  mode: 'http',
  baseUrl: 'https://core.example.test',
  apiKey: null,
  timeoutMs: 4000,
  revalidateSeconds: 45,
  registrationEnabled: false,
}
const request = { path: '/v1/events', route: 'GET /v1/events', locale: 'ar', tags: ['core-events'] }

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
})

const caught = (promise: Promise<unknown>) => promise.then(() => null, (e: unknown) => e as CoreApiError)

describe('coreGetJson', () => {
  it('GETs {base}/v1/... with a timeout, the visitor language and Next.js caching', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { events: [] }))
    await expect(coreGetJson(config, request)).resolves.toEqual({ events: [] })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://core.example.test/v1/events')
    expect(init.method).toBe('GET')
    expect(init.headers).toEqual({ Accept: 'application/json', 'Accept-Language': 'ar' })
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(init.next).toEqual({ revalidate: 45, tags: ['core-events'] })
    expect(init.cache).toBeUndefined()
  })

  it('opts out of the cache when the lifetime is 0', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []))
    await coreGetJson({ ...config, revalidateSeconds: 0 }, request)
    const init = fetchMock.mock.calls[0]![1]
    expect(init.cache).toBe('no-store')
    expect(init.next).toBeUndefined()
  })

  it('sends the server key as a bearer token, only when one is configured', () => {
    expect(coreReadHeaders({ ...config, apiKey: 'server-secret' }, 'en')).toEqual({
      Accept: 'application/json',
      'Accept-Language': 'en',
      Authorization: 'Bearer server-secret',
    })
    expect(coreReadHeaders(config, 'en')).not.toHaveProperty('Authorization')
  })

  it.each([
    [404, 'not-found'],
    [401, 'unauthorized'],
    [429, 'rate-limited'],
    [500, 'unavailable'],
  ])('turns HTTP %i into %s, without retrying', async (status, kind) => {
    fetchMock.mockResolvedValue(jsonResponse(status, { error: { message: 'internal detail' } }))
    const error = await caught(coreGetJson(config, request))
    expect(error).toBeInstanceOf(CoreApiError)
    expect(error).toMatchObject({ kind, status })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('treats a body that is not JSON as an invalid response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, '<html>gateway</html>'))
    expect(await caught(coreGetJson(config, request))).toMatchObject({ kind: 'invalid-response' })
  })

  it('retries once, after a short pause, on 503 and on a connection error', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValueOnce(jsonResponse(503, {})).mockResolvedValueOnce(jsonResponse(200, { events: [] }))
    const pending = coreGetJson(config, request)
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS)
    await expect(pending).resolves.toEqual({ events: [] })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    fetchMock.mockReset()
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    const failing = caught(coreGetJson(config, request))
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS)
    expect(await failing).toMatchObject({ kind: 'network' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not retry a timeout', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))
    expect(await caught(coreGetJson(config, request))).toMatchObject({ kind: 'timeout' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('aborts a request that outlives the timeout', async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => init.signal!.addEventListener('abort', () => reject(init.signal!.reason))),
    )
    const error = await caught(coreGetJson({ ...config, timeoutMs: 500 }, request))
    expect(error).toMatchObject({ kind: 'timeout' })
  })

  it('logs one safe line per failure: route template, status and request id, never the key or a body', async () => {
    const warn = vi.mocked(console.warn)
    fetchMock.mockResolvedValue(jsonResponse(500, { secret: 'body-detail' }, { 'x-request-id': 'req-123' }))
    await caught(coreGetJson({ ...config, apiKey: 'server-secret' }, request))
    expect(warn).toHaveBeenCalledTimes(1)
    const line = JSON.parse(String(warn.mock.calls[0]![0]))
    expect(line).toMatchObject({ source: 'core-api', route: 'GET /v1/events', status: 500, requestId: 'req-123', kind: 'unavailable' })
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/server-secret|body-detail/)
  })
})
