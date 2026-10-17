import 'server-only'
import { cache } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { byDate, toEventView } from './adapter'
import { coreGetJson } from './client.server'
import { getCoreConfig, type CoreConfig, type FixtureCoreConfig } from './config.server'
import { CoreApiError, toCoreError } from './errors'
import { fixtureEventDetail, fixtureEventList, MALFORMED_EVENT_LIST } from './fixtures/events'
import type { RegistrationTransport } from './registration'
import { isEventId, parsePublicEventDetail, parsePublicEventList } from './schemas'
import { logCoreRequest, noticeCoreConfiguration } from './telemetry.server'
import type { EventDetailResult, EventListResult } from './types'

/*
 * The landing's only source of events. Pages and components call these functions and render
 * the result; none of them knows whether it came from Core, from fixtures, or not at all.
 *
 * Both functions resolve, never throw: a Core failure becomes `status: 'unavailable'` and the
 * page around it keeps working. They are memoised per request (React `cache`), so a page and
 * its metadata share one Core call; across requests, Next.js caches the HTTP reads
 * (client.server.ts). Revalidate on demand with the tags below (`revalidateTag('core-events')`).
 */

export const EVENTS_TAG = 'core-events'
export const eventTag = (id: string) => `core-event:${id}`

function unconfigured(config: Extract<CoreConfig, { mode: 'unconfigured' }>) {
  noticeCoreConfiguration(`Core API not configured (${config.problem}); event surfaces show their unavailable state.`)
}

// ------------------------------------------------------------------- fixtures (dev/test only)

function fixtureList(config: FixtureCoreConfig, locale: Locale, now: Date): unknown {
  if (config.scenario === 'unavailable') throw new CoreApiError('unavailable', 503)
  if (config.scenario === 'malformed') return MALFORMED_EVENT_LIST
  if (config.scenario === 'empty') return { events: [] }
  return fixtureEventList(locale, now)
}

function fixtureDetail(config: FixtureCoreConfig, id: string, locale: Locale, now: Date): unknown {
  if (config.scenario === 'unavailable') throw new CoreApiError('unavailable', 503)
  if (config.scenario === 'malformed') return MALFORMED_EVENT_LIST
  const body = config.scenario === 'empty' ? null : fixtureEventDetail(id, locale, now)
  if (body === null) throw new CoreApiError('not-found', 404)
  return body
}

// ------------------------------------------------------------------------------- the API

/** GET /v1/events → every public event, soonest first. */
export const listPublicEvents = cache(async (locale: Locale): Promise<EventListResult> => {
  const config = getCoreConfig()
  const now = new Date()
  if (config.mode === 'unconfigured') {
    unconfigured(config)
    return { status: 'unavailable', reason: 'not-configured', now: now.toISOString() }
  }
  try {
    const body =
      config.mode === 'fixtures'
        ? fixtureList(config, locale, now)
        : await coreGetJson(config, { path: '/v1/events', route: 'GET /v1/events', locale, tags: [EVENTS_TAG] })
    const parsed = parsePublicEventList(body)
    if (!parsed.ok) throw new CoreApiError('invalid-response')
    if (parsed.value.dropped > 0) {
      logCoreRequest({ route: 'GET /v1/events', status: 200, latencyMs: 0, requestId: 'validation', dropped: parsed.value.dropped })
    }
    const events = parsed.value.events.map((dto) => toEventView(dto, now)).sort(byDate)
    return { status: 'ok', events, sample: config.mode === 'fixtures', now: now.toISOString() }
  } catch (error) {
    const kind = toCoreError(error).kind
    if (kind === 'invalid-response') logCoreRequest({ route: 'GET /v1/events', status: 200, latencyMs: 0, requestId: 'validation', kind })
    return { status: 'unavailable', reason: kind, now: now.toISOString() }
  }
})

/** GET /v1/events/{eventId} → one public event, `not-found`, or `unavailable`. */
export const getPublicEvent = cache(async (id: string, locale: Locale): Promise<EventDetailResult> => {
  // Anything that can't be a Core id is a 404 without asking Core.
  if (!isEventId(id)) return { status: 'not-found' }
  const config = getCoreConfig()
  if (config.mode === 'unconfigured') {
    unconfigured(config)
    return { status: 'unavailable', reason: 'not-configured' }
  }
  const now = new Date()
  const route = 'GET /v1/events/{eventId}'
  try {
    const body =
      config.mode === 'fixtures'
        ? fixtureDetail(config, id, locale, now)
        : await coreGetJson(config, { path: `/v1/events/${encodeURIComponent(id)}`, route, locale, tags: [EVENTS_TAG, eventTag(id)] })
    const parsed = parsePublicEventDetail(body)
    // A record for another id is as wrong as no record at all.
    if (!parsed.ok || parsed.value.id !== id) throw new CoreApiError('invalid-response')
    return { status: 'ok', event: toEventView(parsed.value, now), sample: config.mode === 'fixtures', now: now.toISOString() }
  } catch (error) {
    const kind = toCoreError(error).kind
    if (kind === 'not-found') return { status: 'not-found' }
    if (kind === 'invalid-response') logCoreRequest({ route, status: 200, latencyMs: 0, requestId: 'validation', kind })
    return { status: 'unavailable', reason: kind }
  }
})

/**
 * How this deployment's registration form reaches Core. Only the public base URL ever leaves
 * the server: never the API key, which registration doesn't use.
 */
export function getRegistrationTransport(): RegistrationTransport {
  const config = getCoreConfig()
  if (config.mode === 'fixtures') return { kind: 'fixtures' }
  if (config.mode === 'unconfigured') return { kind: 'disabled', reason: 'not-configured' }
  return config.registrationEnabled ? { kind: 'http', baseUrl: config.baseUrl } : { kind: 'disabled', reason: 'not-enabled' }
}

/** Whether event listings are development/test samples (for the pages' sample notice). */
export function servesFixtures() {
  return getCoreConfig().mode === 'fixtures'
}
