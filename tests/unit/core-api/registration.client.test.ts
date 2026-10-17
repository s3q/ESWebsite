import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FIXTURE_LATENCY_MS, fixtureRegistrationOutcome } from '@/lib/core-api/fixtures/registration'
import { registerForEvent, registrationEndpoint } from '@/lib/core-api/registration.client'
import { jsonResponse } from '../support/events'

const transport = { kind: 'http', baseUrl: 'https://core.example.test' } as const
const input = { fullName: ' Test Visitor ', email: 'visitor@example.test' }
const options = { locale: 'ar', availability: 'open' as const }

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

describe('registerForEvent over HTTP', () => {
  it('POSTs the draft body straight to Core, with no credentials or secrets', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { status: 'registered' }))
    await expect(registerForEvent(transport, 'evt-1', input, options)).resolves.toEqual({ kind: 'registered' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://core.example.test/v1/events/evt-1/registrations')
    expect(init).toMatchObject({ method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store' })
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Language': 'ar' })
    expect(JSON.parse(init.body)).toEqual({ fullName: 'Test Visitor', email: 'visitor@example.test' })
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('encodes the event id in the path', () => {
    expect(registrationEndpoint('https://core.example.test', 'a b/c')).toBe('https://core.example.test/v1/events/a%20b%2Fc/registrations')
  })

  it('makes exactly one attempt when the network fails, and reports it as unavailable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(registerForEvent(transport, 'evt-1', input, options)).resolves.toEqual({ kind: 'unavailable' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('makes exactly one attempt on a server error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(503, null))
    await expect(registerForEvent(transport, 'evt-1', input, options)).resolves.toEqual({ kind: 'unavailable' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('passes Core’s answer through the draft mapping', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { error: { code: 'ALREADY_REGISTERED' } }))
    await expect(registerForEvent(transport, 'evt-1', input, options)).resolves.toEqual({ kind: 'already-registered' })
    fetchMock.mockResolvedValueOnce(jsonResponse(429, null, { 'retry-after': '12' }))
    await expect(registerForEvent(transport, 'evt-1', input, options)).resolves.toEqual({ kind: 'rate-limited', retryAfterSeconds: 12 })
    fetchMock.mockResolvedValueOnce(new Response('not json', { status: 201 }))
    await expect(registerForEvent(transport, 'evt-1', input, options)).resolves.toEqual({ kind: 'unconfirmed' })
  })

  it('sends nothing when registration is disabled', async () => {
    await expect(registerForEvent({ kind: 'disabled', reason: 'not-enabled' }, 'evt-1', input, options)).resolves.toEqual({ kind: 'unavailable' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('registerForEvent with fixtures (development only)', () => {
  it('simulates without sending anything', async () => {
    vi.useFakeTimers()
    const pending = registerForEvent({ kind: 'fixtures' }, 'evt-1', input, { ...options, availability: 'waitlist' })
    await vi.advanceTimersByTimeAsync(FIXTURE_LATENCY_MS)
    await expect(pending).resolves.toEqual({ kind: 'waitlisted' })
    expect(fetchMock).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it.each([
    ['visitor@example.test', 'open', 'registered'],
    ['visitor@example.test', 'waitlist', 'waitlisted'],
    ['Already@Example.test', 'open', 'already-registered'],
    ['already-waitlisted@example.test', 'waitlist', 'already-waitlisted'],
    ['full@example.test', 'open', 'event-full'],
    ['closed@example.test', 'open', 'registration-closed'],
    ['ratelimited@example.test', 'open', 'rate-limited'],
    ['unavailable@example.test', 'open', 'unavailable'],
    ['invalid@example.test', 'open', 'invalid'],
    ['unconfirmed@example.test', 'open', 'unconfirmed'],
    ['rejected@example.test', 'open', 'rejected'],
  ] as const)('%s on a %s event → %s', (email, availability, kind) => {
    expect(fixtureRegistrationOutcome({ fullName: 'Test', email }, availability).kind).toBe(kind)
  })
})
