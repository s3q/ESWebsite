import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dto, jsonResponse } from '../support/events'

/**
 * The event functions read their configuration once per process, so each test sets the
 * environment and loads a fresh copy of the module.
 */
async function load(env: Record<string, string>) {
  vi.resetModules()
  vi.stubEnv('NODE_ENV', 'test')
  for (const key of ['CORE_API_BASE_URL', 'CORE_EVENTS_API_KEY', 'CORE_API_MODE', 'CORE_API_FIXTURE_SCENARIO', 'CORE_API_ALLOW_FIXTURES', 'CORE_REGISTRATION_ENABLED', 'VERCEL_ENV']) {
    vi.stubEnv(key, '')
  }
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return import('@/lib/core-api/events.server')
}

const http = { CORE_API_BASE_URL: 'https://core.example.test' }

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('listPublicEvents', () => {
  it('reads, validates, adapts and sorts Core events', async () => {
    const { listPublicEvents } = await load(http)
    fetchMock.mockResolvedValue(
      jsonResponse(200, { events: [dto({ id: 'later', eventDate: '2099-05-02' }), dto({ id: 'sooner', eventDate: '2099-05-01T10:00:00+04:00' })] }),
    )
    const result = await listPublicEvents('en')
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.sample).toBe(false)
    expect(result.events.map((e) => e.id)).toEqual(['sooner', 'later'])
    expect(result.events[0]).toMatchObject({ href: '/events/sooner', phase: 'upcoming', availability: 'open' })
  })

  it('returns an empty list as ok, which is not the same as unavailable', async () => {
    const { listPublicEvents } = await load(http)
    fetchMock.mockResolvedValue(jsonResponse(200, { events: [] }))
    expect(await listPublicEvents('en')).toMatchObject({ status: 'ok', events: [] })
  })

  it.each([
    ['Core is down', () => jsonResponse(503, {}), 'unavailable'],
    ['the response is malformed', () => jsonResponse(200, { events: [{ id: 1 }] }), 'invalid-response'],
    ['the key is refused', () => jsonResponse(401, {}), 'unauthorized'],
  ])('is unavailable, without throwing, when %s', async (_, response, reason) => {
    const { listPublicEvents } = await load(http)
    fetchMock.mockImplementation(async () => response())
    await expect(listPublicEvents('en')).resolves.toMatchObject({ status: 'unavailable', reason })
  })

  it('is unavailable, and calls nothing, when Core is not configured', async () => {
    const { listPublicEvents } = await load({})
    await expect(listPublicEvents('en')).resolves.toMatchObject({ status: 'unavailable', reason: 'not-configured' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('never shows fixtures on a production deployment', async () => {
    const { listPublicEvents } = await load({ NODE_ENV: 'production', VERCEL_ENV: 'production', CORE_API_MODE: 'fixtures', CORE_API_ALLOW_FIXTURES: 'true' })
    await expect(listPublicEvents('en')).resolves.toMatchObject({ status: 'unavailable', reason: 'not-configured' })
  })

  describe('fixtures', () => {
    it('serves every presentation state, labelled as a sample, through the same validation', async () => {
      const { listPublicEvents } = await load({ CORE_API_MODE: 'fixtures' })
      const result = await listPublicEvents('ar')
      expect(result).toMatchObject({ status: 'ok', sample: true })
      if (result.status !== 'ok') return
      expect(new Set(result.events.map((e) => e.availability))).toEqual(new Set(['open', 'waitlist', 'full', 'closed', 'unknown']))
      expect(result.events.some((e) => e.phase === 'past')).toBe(true)
      expect(result.events.some((e) => !e.hasTime)).toBe(true)
      expect(result.events[0]!.title).toMatch(/[؀-ۿ]/)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it.each([
      ['empty', { status: 'ok', events: [] }],
      ['unavailable', { status: 'unavailable', reason: 'unavailable' }],
      ['malformed', { status: 'unavailable', reason: 'invalid-response' }],
    ])('scenario %s', async (scenario, expected) => {
      const { listPublicEvents } = await load({ CORE_API_MODE: 'fixtures', CORE_API_FIXTURE_SCENARIO: scenario })
      await expect(listPublicEvents('en')).resolves.toMatchObject(expected)
    })
  })
})

describe('getPublicEvent', () => {
  it('reads one event by its encoded id', async () => {
    const { getPublicEvent } = await load(http)
    fetchMock.mockResolvedValue(jsonResponse(200, { event: dto({ id: 'evt-9' }) }))
    expect(await getPublicEvent('evt-9', 'en')).toMatchObject({ status: 'ok', event: { id: 'evt-9' }, sample: false })
    expect(fetchMock.mock.calls[0]![0]).toBe('https://core.example.test/v1/events/evt-9')
    expect(fetchMock.mock.calls[0]![1].next.tags).toEqual(['core-events', 'core-event:evt-9'])
  })

  it('is a 404 for an id that cannot exist, without asking Core', async () => {
    const { getPublicEvent } = await load(http)
    for (const id of ['../v1/admin', 'a b', '', 'x'.repeat(200)]) {
      expect(await getPublicEvent(id, 'en')).toEqual({ status: 'not-found' })
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('is a 404 when Core says so', async () => {
    const { getPublicEvent } = await load(http)
    fetchMock.mockResolvedValue(jsonResponse(404, {}))
    expect(await getPublicEvent('gone', 'en')).toEqual({ status: 'not-found' })
  })

  it('refuses a record for a different id', async () => {
    const { getPublicEvent } = await load(http)
    fetchMock.mockResolvedValue(jsonResponse(200, dto({ id: 'someone-else' })))
    expect(await getPublicEvent('evt-1', 'en')).toEqual({ status: 'unavailable', reason: 'invalid-response' })
  })

  it('is unavailable when Core fails', async () => {
    const { getPublicEvent } = await load(http)
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    expect(await getPublicEvent('evt-1', 'en')).toEqual({ status: 'unavailable', reason: 'unavailable' })
  })

  it('finds fixtures by id', async () => {
    const { getPublicEvent } = await load({ CORE_API_MODE: 'fixtures' })
    expect(await getPublicEvent('smart-campus-hackathon-fixture', 'en')).toMatchObject({ status: 'ok', sample: true, event: { hasTime: false } })
    expect(await getPublicEvent('no-such-fixture', 'en')).toEqual({ status: 'not-found' })
  })
})

describe('getRegistrationTransport', () => {
  it('is disabled until registration is switched on, then posts to the public base URL', async () => {
    expect((await load(http)).getRegistrationTransport()).toEqual({ kind: 'disabled', reason: 'not-enabled' })
    expect((await load({ ...http, CORE_REGISTRATION_ENABLED: 'true' })).getRegistrationTransport()).toEqual({ kind: 'http', baseUrl: 'https://core.example.test' })
  })

  it('never hands the browser the API key', async () => {
    const transport = (await load({ ...http, CORE_EVENTS_API_KEY: 'server-secret', CORE_REGISTRATION_ENABLED: 'true' })).getRegistrationTransport()
    expect(JSON.stringify(transport)).not.toContain('server-secret')
  })

  it('simulates in fixture mode, and is disabled when unconfigured', async () => {
    expect((await load({ CORE_API_MODE: 'fixtures' })).getRegistrationTransport()).toEqual({ kind: 'fixtures' })
    expect((await load({})).getRegistrationTransport()).toEqual({ kind: 'disabled', reason: 'not-configured' })
  })
})
