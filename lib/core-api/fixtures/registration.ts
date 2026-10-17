import type { EventAvailability } from '../types'
import type { RegistrationInput, RegistrationOutcome } from '../registration'

/*
 * DEVELOPMENT AND TEST FIXTURES ONLY: simulated registration outcomes for the fixture transport.
 * Loaded on demand, only when the server hands the browser the fixture transport (never in
 * production). Nothing is sent anywhere and nothing is stored.
 *
 * The event's availability decides the ordinary outcome; synthetic addresses at the reserved
 * `.test` domain trigger every other state, so each one can be seen and tested:
 *
 *   already@example.test             → already registered
 *   already-waitlisted@example.test  → already on the waitlist
 *   full@example.test                → event full
 *   closed@example.test              → registration closed
 *   ratelimited@example.test         → rate limited (retry in 60 s)
 *   unavailable@example.test         → Core temporarily unavailable
 *   invalid@example.test             → Core rejects the email field
 *   unconfirmed@example.test         → Core answers, but the result can't be confirmed
 *   rejected@example.test            → a domain rejection without a specific message
 */

export const FIXTURE_LATENCY_MS = 600

const BY_ADDRESS: Record<string, RegistrationOutcome> = {
  'already@example.test': { kind: 'already-registered' },
  'already-waitlisted@example.test': { kind: 'already-waitlisted' },
  'full@example.test': { kind: 'event-full' },
  'closed@example.test': { kind: 'registration-closed' },
  'ratelimited@example.test': { kind: 'rate-limited', retryAfterSeconds: 60 },
  'unavailable@example.test': { kind: 'unavailable' },
  'invalid@example.test': { kind: 'invalid', fields: { email: 'invalid' } },
  'unconfirmed@example.test': { kind: 'unconfirmed' },
  'rejected@example.test': { kind: 'rejected' },
}

export function fixtureRegistrationOutcome(input: RegistrationInput, availability: EventAvailability): RegistrationOutcome {
  const special = BY_ADDRESS[input.email.trim().toLowerCase()]
  if (special) return special
  if (availability === 'waitlist') return { kind: 'waitlisted' }
  if (availability === 'full') return { kind: 'event-full' }
  if (availability === 'closed') return { kind: 'registration-closed' }
  return { kind: 'registered' }
}

export async function fixtureRegister(input: RegistrationInput, availability: EventAvailability, signal?: AbortSignal): Promise<RegistrationOutcome> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, FIXTURE_LATENCY_MS)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })
  return fixtureRegistrationOutcome(input, availability)
}
