import 'server-only'
import type { CoreErrorKind } from './errors'

/*
 * Safe integration telemetry: one structured line per Core request. Only the fields below are
 * ever recorded: never the API key, never request or response bodies, never attendee details.
 * Failures are always logged (warn); successes only when CORE_API_DEBUG=true.
 */

export interface CoreRequestLog {
  /** The route template, e.g. `GET /v1/events/{eventId}`: never a full URL with values. */
  route: string
  status: number | 'error'
  latencyMs: number
  /** Core's `x-request-id` when it sends one, otherwise a local correlation id. */
  requestId: string
  kind?: CoreErrorKind
  /** Events that failed validation and were left out of a list. */
  dropped?: number
  attempt?: number
}

export function logCoreRequest(entry: CoreRequestLog) {
  const line = JSON.stringify({ source: 'core-api', ...entry })
  if (entry.kind || entry.status === 'error' || (entry.dropped ?? 0) > 0) console.warn(line)
  else if (process.env.CORE_API_DEBUG === 'true') console.info(line)
}

/** A one-time notice when Core is not configured, so an operator sees why events are hidden. */
let noticed = false
export function noticeCoreConfiguration(message: string) {
  if (noticed || process.env.NODE_ENV === 'test') return
  noticed = true
  console.warn(JSON.stringify({ source: 'core-api', notice: message }))
}
