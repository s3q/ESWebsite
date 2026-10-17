import type { CorePublicEventV1 } from './types'

/*
 * Runtime validation of what Core sends, at the HTTP boundary. Hand-written on purpose: the
 * draft contract is seven string fields, and a schema library would add weight (and, for the
 * registration client, browser bundle) for no gain. Unknown extra fields are ignored, so Core
 * can add fields without breaking the landing.
 *
 * DRAFT TOLERANCE: until OpenAPI v1 fixes the envelopes, a list may arrive as a bare array or as
 * `{ events: [...] }` / `{ data: [...] }`, and a single event bare or as `{ event }` / `{ data }`.
 * Narrow this to the published shape once it exists.
 */

export type ParseResult<T> = { ok: true; value: T } | { ok: false; issue: string }

/** Opaque ids: letters, digits, hyphen and underscore (UUIDs, slugs, prefixed ids), at most 128. */
const EVENT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/
/** ISO 8601 date, or date-time with optional seconds, fraction and zone. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/
const LIMITS = { title: 300, description: 20_000, location: 300, committeeName: 200, availability: 64 } as const
/** A list larger than this is treated as a malformed response, not rendered. */
const MAX_EVENTS = 500

export function isEventId(value: unknown): value is string {
  return typeof value === 'string' && EVENT_ID.test(value)
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value))
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function text(obj: Record<string, unknown>, key: keyof typeof LIMITS, required: boolean): string | null {
  const v = obj[key]
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  if (required && !trimmed) return null
  if (trimmed.length > LIMITS[key]) return null
  return trimmed
}

export function parsePublicEvent(value: unknown): ParseResult<CorePublicEventV1> {
  if (!isRecord(value)) return { ok: false, issue: 'event is not an object' }
  if (!isEventId(value.id)) return { ok: false, issue: 'id' }
  if (!isIsoDate(value.eventDate)) return { ok: false, issue: 'eventDate' }
  const title = text(value, 'title', true)
  const description = text(value, 'description', false)
  const location = text(value, 'location', false)
  const committeeName = text(value, 'committeeName', false)
  const availability = text(value, 'availability', true)
  if (title === null) return { ok: false, issue: 'title' }
  if (description === null) return { ok: false, issue: 'description' }
  if (location === null) return { ok: false, issue: 'location' }
  if (committeeName === null) return { ok: false, issue: 'committeeName' }
  if (availability === null) return { ok: false, issue: 'availability' }
  return { ok: true, value: { id: value.id, title, description, eventDate: value.eventDate, location, committeeName, availability } }
}

/**
 * A list of events. The envelope must be right; individual events that don't validate are
 * left out (and counted, for telemetry) so one bad record can't take the whole list down.
 */
export function parsePublicEventList(value: unknown): ParseResult<{ events: CorePublicEventV1[]; dropped: number }> {
  const items = Array.isArray(value) ? value : isRecord(value) ? (Array.isArray(value.events) ? value.events : Array.isArray(value.data) ? value.data : null) : null
  if (!items) return { ok: false, issue: 'list envelope' }
  if (items.length > MAX_EVENTS) return { ok: false, issue: 'list too long' }
  const events: CorePublicEventV1[] = []
  const seen = new Set<string>()
  let dropped = 0
  for (const item of items) {
    const parsed = parsePublicEvent(item)
    if (!parsed.ok || seen.has(parsed.value.id)) {
      dropped += 1
      continue
    }
    seen.add(parsed.value.id)
    events.push(parsed.value)
  }
  if (items.length > 0 && events.length === 0) return { ok: false, issue: 'no valid events' }
  return { ok: true, value: { events, dropped } }
}

export function parsePublicEventDetail(value: unknown): ParseResult<CorePublicEventV1> {
  const item = isRecord(value) && !('id' in value) ? (isRecord(value.event) ? value.event : isRecord(value.data) ? value.data : value) : value
  return parsePublicEvent(item)
}
