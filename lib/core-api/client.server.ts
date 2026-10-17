import 'server-only'
import type { HttpCoreConfig } from './config.server'
import { CoreApiError, isRetryable, kindForStatus, toCoreError } from './errors'
import { logCoreRequest } from './telemetry.server'

/*
 * The one place the landing's server talks HTTP to Core. Every request has a finite timeout,
 * sends only the headers below, converts every failure into a CoreApiError, and is logged
 * without secrets. GETs may be retried once on a connection error or a 502/503/504; there is no
 * write method here at all (registration goes from the browser straight to Core).
 *
 * Caching: reads are cached by Next.js for `revalidateSeconds` (keyed on URL and headers, so
 * per language) and tagged for on-demand revalidation. Only 200 responses are stored. No
 * per-request id is sent as a header, because it would make every cache key unique; Core's own
 * `x-request-id` is logged when present.
 */

export interface CoreGet {
  /** Path under the base URL, starting with `/v1/`. */
  path: string
  /** Route template for logs, e.g. `GET /v1/events/{eventId}`. */
  route: string
  /** Sent as Accept-Language (assumption: Core may localise; it may also ignore it). */
  locale: string
  tags: string[]
}

export const RETRY_DELAY_MS = 250

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const localId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `local-${Date.now()}`)

/** Headers for a server-side read. The key, if any, goes here and nowhere else. */
export function coreReadHeaders(config: HttpCoreConfig, locale: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Accept-Language': locale }
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`
  return headers
}

async function once(config: HttpCoreConfig, request: CoreGet, attempt: number): Promise<unknown> {
  const started = Date.now()
  const id = localId()
  try {
    const response = await fetch(`${config.baseUrl}${request.path}`, {
      method: 'GET',
      headers: coreReadHeaders(config, request.locale),
      signal: AbortSignal.timeout(config.timeoutMs),
      ...(config.revalidateSeconds > 0 ? { next: { revalidate: config.revalidateSeconds, tags: request.tags } } : { cache: 'no-store' as const }),
    })
    const requestId = response.headers.get('x-request-id') ?? id
    if (!response.ok) {
      const error = new CoreApiError(kindForStatus(response.status), response.status)
      logCoreRequest({ route: request.route, status: response.status, latencyMs: Date.now() - started, requestId, kind: error.kind, attempt })
      throw error
    }
    let body: unknown
    try {
      body = await response.json()
    } catch {
      const error = new CoreApiError('invalid-response', response.status)
      logCoreRequest({ route: request.route, status: response.status, latencyMs: Date.now() - started, requestId, kind: error.kind, attempt })
      throw error
    }
    logCoreRequest({ route: request.route, status: response.status, latencyMs: Date.now() - started, requestId, attempt })
    return body
  } catch (thrown) {
    const error = toCoreError(thrown)
    if (!(thrown instanceof CoreApiError)) {
      logCoreRequest({ route: request.route, status: 'error', latencyMs: Date.now() - started, requestId: id, kind: error.kind, attempt })
    }
    throw error
  }
}

/** GET JSON from Core, retrying once when that is safe. Throws CoreApiError. */
export async function coreGetJson(config: HttpCoreConfig, request: CoreGet): Promise<unknown> {
  try {
    return await once(config, request, 1)
  } catch (error) {
    const coreError = toCoreError(error)
    if (!isRetryable(coreError)) throw coreError
    await sleep(RETRY_DELAY_MS)
    return once(config, request, 2)
  }
}
