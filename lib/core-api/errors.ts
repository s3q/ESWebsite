/**
 * The landing's stable vocabulary for Core API failures. Whatever Core, the network or the
 * configuration does, the rest of the site sees one of these kinds and nothing else: no raw
 * status lines, provider messages, JSON or stack traces ever reach a page.
 */
export type CoreErrorKind =
  /** Core settings are missing or invalid for this deployment (see config.server.ts). */
  | 'not-configured'
  /** Core did not answer within the configured timeout. */
  | 'timeout'
  /** The request never completed (DNS, TLS, connection reset, CORS in the browser). */
  | 'network'
  /** Core answered with a server error or said it is unavailable (5xx). */
  | 'unavailable'
  /** Core refused the landing's credentials (401/403): a configuration problem, not the visitor's. */
  | 'unauthorized'
  /** The requested record does not exist (404). */
  | 'not-found'
  /** Core is rate limiting the caller (429). */
  | 'rate-limited'
  /** Core answered, but not with the shape the landing understands. */
  | 'invalid-response'
  /** Core rejected the request as malformed (400/422). */
  | 'bad-request'
  /** Anything else. */
  | 'unexpected'

export class CoreApiError extends Error {
  readonly kind: CoreErrorKind
  /** The HTTP status, when there was a response. Never the response body. */
  readonly status?: number

  constructor(kind: CoreErrorKind, status?: number) {
    // The message is deliberately generic: it may end up in server logs.
    super(`Core API ${kind}${status ? ` (${status})` : ''}`)
    this.name = 'CoreApiError'
    this.kind = kind
    this.status = status
  }
}

/** How an HTTP status (other than 2xx) reads in the landing's vocabulary. */
export function kindForStatus(status: number): CoreErrorKind {
  if (status === 404 || status === 410) return 'not-found'
  if (status === 401 || status === 403) return 'unauthorized'
  if (status === 429) return 'rate-limited'
  if (status === 400 || status === 422) return 'bad-request'
  if (status >= 500) return 'unavailable'
  return 'unexpected'
}

/** Turns anything thrown by fetch or parsing into a CoreApiError, without leaking details. */
export function toCoreError(error: unknown): CoreApiError {
  if (error instanceof CoreApiError) return error
  if (error instanceof DOMException || (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'))) {
    return new CoreApiError((error as Error).name === 'TimeoutError' ? 'timeout' : 'network')
  }
  if (error instanceof SyntaxError) return new CoreApiError('invalid-response')
  if (error instanceof TypeError) return new CoreApiError('network')
  return new CoreApiError('unexpected')
}

/** Retrying a GET once makes sense for these; never for writes. */
export function isRetryable(error: CoreApiError) {
  return error.kind === 'network' || (error.kind === 'unavailable' && (error.status === 502 || error.status === 503 || error.status === 504))
}
