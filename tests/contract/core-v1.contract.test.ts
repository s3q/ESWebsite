import { describe, expect, it } from 'vitest'
import { parsePublicEventDetail, parsePublicEventList } from '@/lib/core-api/schemas'

/**
 * Contract tests against a real Core deployment: STAGING ONLY, read-only.
 *
 *   CORE_CONTRACT_BASE_URL=https://<staging core origin> CORE_CONTRACT_ENV=staging npm run test:contract
 *
 * They check only published HTTP behaviour (status codes and the response shapes the landing
 * parses), never Core's database. Skipped unless both variables are set, so `npm test` and CI
 * never call out. They never POST: registration contract tests stay BLOCKED until Core
 * publishes the registration contract and a staging test event exists.
 *
 * Until OpenAPI v1 exists, these encode the DRAFT contract (lib/core-api/types.ts). When it is
 * published, update the parsers first, then these.
 */

const base = process.env.CORE_CONTRACT_BASE_URL?.replace(/\/+$/, '')
const enabled = Boolean(base) && process.env.CORE_CONTRACT_ENV === 'staging'
const key = process.env.CORE_CONTRACT_API_KEY
const headers: Record<string, string> = { Accept: 'application/json', 'Accept-Language': 'en', ...(key ? { Authorization: `Bearer ${key}` } : {}) }
const get = (path: string) => fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(10_000) })

describe.skipIf(!enabled)('Core API v1 contract (staging, read-only)', () => {
  it('GET /v1/events answers 200 with a list the landing can parse', async () => {
    const response = await get('/v1/events')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
    const parsed = parsePublicEventList(await response.json())
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.value.dropped).toBe(0)
  })

  it('GET /v1/events/{id} answers 200 for a listed event, with the same id', async () => {
    const list = parsePublicEventList(await (await get('/v1/events')).json())
    if (!list.ok || list.value.events.length === 0) return
    const id = list.value.events[0]!.id
    const response = await get(`/v1/events/${encodeURIComponent(id)}`)
    expect(response.status).toBe(200)
    const parsed = parsePublicEventDetail(await response.json())
    expect(parsed.ok && parsed.value.id).toBe(id)
  })

  it('GET /v1/events/{unknown} answers 404', async () => {
    expect((await get('/v1/events/contract-test-unknown-id')).status).toBe(404)
  })

  it('does not allow a wildcard CORS origin on event reads', async () => {
    const response = await fetch(`${base}/v1/events`, { headers: { ...headers, Origin: 'https://not-allowed.example' } })
    expect(response.headers.get('access-control-allow-origin')).not.toBe('*')
  })

  it.todo('BLOCKED (Core contract): POST /v1/events/{id}/registrations request fields and success body')
  it.todo('BLOCKED (Core contract): registration error vocabulary (already registered, full, closed, validation)')
  it.todo('BLOCKED (Core contract): 429 semantics and Retry-After exposure via Access-Control-Expose-Headers')
  it.todo('BLOCKED (Core contract): CORS preflight allows https://engsoc.org and https://www.engsoc.org only')
  it.todo('BLOCKED (Core contract): pagination, if Core paginates GET /v1/events')
})

describe.skipIf(enabled)('Core API v1 contract', () => {
  it.skip('not configured: set CORE_CONTRACT_BASE_URL and CORE_CONTRACT_ENV=staging to run', () => {})
})
