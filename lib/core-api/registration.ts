/*
 * Event registration: the shapes shared by the server (which decides the transport) and the
 * browser (which submits). Client-safe: no secrets, no server imports.
 *
 * The landing displays the form; Core decides the outcome. Nothing here allocates places,
 * detects duplicates, orders waitlists or retries a submission.
 *
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │ DRAFT — the request fields, success body and error codes below are placeholders     │
 * │ pending Core's published registration contract. Replace them in this one file.      │
 * └──────────────────────────────────────────────────────────────────────────────────────┘
 */

/** How the browser reaches Core for this deployment (decided on the server, never a secret). */
export type RegistrationTransport =
  /** POST {baseUrl}/v1/events/{eventId}/registrations, straight from the browser. */
  | { kind: 'http'; baseUrl: string }
  /** Development/test only: simulated outcomes, nothing leaves the browser. */
  | { kind: 'fixtures' }
  /** No submission possible: Core not configured, or registration not switched on yet. */
  | { kind: 'disabled'; reason: 'not-configured' | 'not-enabled' }

/** DRAFT request fields. Order and labels live in the form; validation is UX only. */
export const DRAFT_REGISTRATION_FIELDS = [
  { name: 'fullName', type: 'text', autoComplete: 'name', maxLength: 120 },
  { name: 'email', type: 'email', autoComplete: 'email', maxLength: 254 },
] as const

export type RegistrationField = (typeof DRAFT_REGISTRATION_FIELDS)[number]['name']
export type RegistrationInput = Record<RegistrationField, string>
export type FieldProblem = 'required' | 'invalid'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Client-side checks for a better form experience. Core validates again and has the final say. */
export function validateRegistrationInput(input: RegistrationInput): Partial<Record<RegistrationField, FieldProblem>> {
  const problems: Partial<Record<RegistrationField, FieldProblem>> = {}
  const name = input.fullName.trim()
  if (!name) problems.fullName = 'required'
  else if (name.length < 2 || name.length > 120) problems.fullName = 'invalid'
  const email = input.email.trim()
  if (!email) problems.email = 'required'
  else if (email.length > 254 || !EMAIL.test(email)) problems.email = 'invalid'
  return problems
}

/** The DRAFT request body. */
export function registrationPayload(input: RegistrationInput) {
  return { fullName: input.fullName.trim(), email: input.email.trim() }
}

/** Every outcome the form can show. Only `registered` and `waitlisted` are successes. */
export type RegistrationOutcome =
  | { kind: 'registered' }
  | { kind: 'waitlisted' }
  | { kind: 'already-registered' }
  | { kind: 'already-waitlisted' }
  | { kind: 'event-full' }
  | { kind: 'registration-closed' }
  | { kind: 'invalid'; fields: Partial<Record<RegistrationField, FieldProblem>> }
  | { kind: 'rate-limited'; retryAfterSeconds: number | null }
  | { kind: 'unavailable' }
  /** Core answered, but the landing could not confirm what happened: never claimed as success. */
  | { kind: 'unconfirmed' }
  /** Core declined for a reason the landing has no specific message for. */
  | { kind: 'rejected' }

/** DRAFT: Core error codes the landing recognises, in `{ error: { code } }`. */
export const REGISTRATION_ERROR_CODES: Readonly<Record<string, RegistrationOutcome['kind']>> = {
  ALREADY_REGISTERED: 'already-registered',
  ALREADY_WAITLISTED: 'already-waitlisted',
  EVENT_FULL: 'event-full',
  REGISTRATION_CLOSED: 'registration-closed',
  VALIDATION_FAILED: 'invalid',
  RATE_LIMITED: 'rate-limited',
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function retryAfter(header: string | null): number | null {
  if (!header) return null
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds)
  const at = Date.parse(header)
  return Number.isNaN(at) ? null : Math.max(0, Math.round((at - Date.now()) / 1000))
}

function fieldProblems(value: unknown): Partial<Record<RegistrationField, FieldProblem>> {
  const fields: Partial<Record<RegistrationField, FieldProblem>> = {}
  if (!isRecord(value)) return fields
  for (const f of DRAFT_REGISTRATION_FIELDS) {
    const v = value[f.name]
    if (v === 'required' || v === 'invalid') fields[f.name] = v
    else if (typeof v === 'string' && v) fields[f.name] = 'invalid'
  }
  return fields
}

/** Reads Core's answer to a registration POST. DRAFT mapping; see the box at the top. */
export function mapRegistrationResponse(status: number, body: unknown, retryAfterHeader: string | null = null): RegistrationOutcome {
  if (status >= 200 && status < 300) {
    const result = isRecord(body) ? (isRecord(body.registration) ? body.registration.status : body.status) : undefined
    if (result === 'registered' || result === 'confirmed') return { kind: 'registered' }
    if (result === 'waitlisted') return { kind: 'waitlisted' }
    return { kind: 'unconfirmed' }
  }
  if (status === 429) return { kind: 'rate-limited', retryAfterSeconds: retryAfter(retryAfterHeader) }
  if (status >= 500) return { kind: 'unavailable' }
  const error = isRecord(body) && isRecord(body.error) ? body.error : null
  const code = error && typeof error.code === 'string' ? error.code.toUpperCase() : null
  const kind = code ? REGISTRATION_ERROR_CODES[code] : undefined
  if (kind === 'invalid' || (!kind && (status === 400 || status === 422))) return { kind: 'invalid', fields: fieldProblems(error?.fields) }
  if (kind === 'rate-limited') return { kind: 'rate-limited', retryAfterSeconds: retryAfter(retryAfterHeader) }
  if (kind) return { kind } as RegistrationOutcome
  return { kind: 'rejected' }
}

/** Successes; everything else leaves the form in place so the visitor can act on the message. */
export const isSuccess = (o: RegistrationOutcome) => o.kind === 'registered' || o.kind === 'waitlisted'
/** Outcomes that settle the matter for this event: the form is not shown again. */
export const isFinal = (o: RegistrationOutcome) =>
  isSuccess(o) || o.kind === 'already-registered' || o.kind === 'already-waitlisted' || o.kind === 'event-full' || o.kind === 'registration-closed'
