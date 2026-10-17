import type { EventAvailability } from './types'
import { mapRegistrationResponse, registrationPayload, type RegistrationInput, type RegistrationOutcome, type RegistrationTransport } from './registration'

/*
 * The browser-safe registration call. It goes from the visitor's browser straight to Core
 *
 *   browser at essqu.com  →  POST api.essqu.com/v1/events/{eventId}/registrations
 *
 * so Core sees the visitor's own address for rate limiting, and no landing server sits in
 * between. It carries no secret of any kind: no API key, no cookie (`credentials: 'omit'`), no
 * custom header beyond what CORS needs to allow (Content-Type, Accept, Accept-Language).
 *
 * One attempt only. A registration is never retried automatically and never reported as a
 * success unless Core says so.
 */

export const REGISTRATION_TIMEOUT_MS = 15_000

export interface RegisterOptions {
  locale: string
  /** Used only by the development fixtures, which have no server to ask. */
  availability: EventAvailability
  signal?: AbortSignal
}

export function registrationEndpoint(baseUrl: string, eventId: string) {
  return `${baseUrl}/v1/events/${encodeURIComponent(eventId)}/registrations`
}

export async function registerForEvent(
  transport: RegistrationTransport,
  eventId: string,
  input: RegistrationInput,
  options: RegisterOptions,
): Promise<RegistrationOutcome> {
  if (transport.kind === 'disabled') return { kind: 'unavailable' }

  if (transport.kind === 'fixtures') {
    // Development/test only; this chunk never loads on a deployment that talks to Core.
    const { fixtureRegister } = await import('./fixtures/registration')
    return fixtureRegister(input, options.availability, options.signal)
  }

  const timeout = AbortSignal.timeout(REGISTRATION_TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  let response: Response
  try {
    response = await fetch(registrationEndpoint(transport.baseUrl, eventId), {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Language': options.locale },
      body: JSON.stringify(registrationPayload(input)),
      signal,
    })
  } catch {
    // Network failure, CORS refusal or timeout. Whether Core recorded anything is unknown, so
    // the visitor is told it didn't go through and may try again themselves.
    return { kind: 'unavailable' }
  }
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }
  return mapRegistrationResponse(response.status, body, response.headers.get('retry-after'))
}
