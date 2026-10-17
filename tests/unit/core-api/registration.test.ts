import { describe, expect, it } from 'vitest'
import { isFinal, isSuccess, mapRegistrationResponse, registrationPayload, validateRegistrationInput } from '@/lib/core-api/registration'

describe('validateRegistrationInput (form UX only; Core validates again)', () => {
  it('passes a complete form', () => {
    expect(validateRegistrationInput({ fullName: 'Test Visitor', email: 'visitor@example.test' })).toEqual({})
  })

  it('flags missing and malformed fields', () => {
    expect(validateRegistrationInput({ fullName: '  ', email: '' })).toEqual({ fullName: 'required', email: 'required' })
    expect(validateRegistrationInput({ fullName: 'A', email: 'not-an-email' })).toEqual({ fullName: 'invalid', email: 'invalid' })
    expect(validateRegistrationInput({ fullName: 'x'.repeat(121), email: `${'a'.repeat(250)}@x.io` })).toEqual({ fullName: 'invalid', email: 'invalid' })
  })
})

describe('registrationPayload', () => {
  it('sends only the draft fields, trimmed', () => {
    expect(registrationPayload({ fullName: ' Test Visitor ', email: ' visitor@example.test ' })).toEqual({ fullName: 'Test Visitor', email: 'visitor@example.test' })
  })
})

describe('mapRegistrationResponse (DRAFT contract)', () => {
  it.each([
    [201, { status: 'registered' }, 'registered'],
    [200, { registration: { status: 'confirmed' } }, 'registered'],
    [201, { status: 'waitlisted' }, 'waitlisted'],
    [202, { status: 'pending' }, 'unconfirmed'],
    [200, null, 'unconfirmed'],
    [409, { error: { code: 'ALREADY_REGISTERED' } }, 'already-registered'],
    [409, { error: { code: 'already_waitlisted' } }, 'already-waitlisted'],
    [409, { error: { code: 'EVENT_FULL' } }, 'event-full'],
    [409, { error: { code: 'REGISTRATION_CLOSED' } }, 'registration-closed'],
    [409, { error: { code: 'SOMETHING_NEW' } }, 'rejected'],
    [403, null, 'rejected'],
    [404, {}, 'rejected'],
    [500, { error: { code: 'EVENT_FULL' } }, 'unavailable'],
    [503, null, 'unavailable'],
  ])('%i %j → %s', (status, body, kind) => {
    expect(mapRegistrationResponse(status, body).kind).toBe(kind)
  })

  it('never reports success without Core saying so', () => {
    for (const body of [{}, { ok: true }, { status: 'REGISTERED ' }, 'registered', []]) {
      expect(isSuccess(mapRegistrationResponse(200, body))).toBe(false)
    }
  })

  it('reads field problems from a validation error', () => {
    expect(mapRegistrationResponse(422, { error: { code: 'VALIDATION_FAILED', fields: { email: 'invalid', fullName: 'required', role: 'x' } } })).toEqual({
      kind: 'invalid',
      fields: { email: 'invalid', fullName: 'required' },
    })
    expect(mapRegistrationResponse(400, { error: { fields: { email: 'must be a university address' } } })).toEqual({ kind: 'invalid', fields: { email: 'invalid' } })
    expect(mapRegistrationResponse(400, null)).toEqual({ kind: 'invalid', fields: {} })
  })

  it('reads Retry-After as seconds or as a date', () => {
    expect(mapRegistrationResponse(429, null, '30')).toEqual({ kind: 'rate-limited', retryAfterSeconds: 30 })
    expect(mapRegistrationResponse(429, null, null)).toEqual({ kind: 'rate-limited', retryAfterSeconds: null })
    expect(mapRegistrationResponse(429, null, 'soon')).toEqual({ kind: 'rate-limited', retryAfterSeconds: null })
    const at = new Date(Date.now() + 90_000).toUTCString()
    const result = mapRegistrationResponse(429, null, at)
    expect(result.kind === 'rate-limited' && result.retryAfterSeconds).toBeGreaterThan(80)
    expect(mapRegistrationResponse(409, { error: { code: 'RATE_LIMITED' } }, '5')).toEqual({ kind: 'rate-limited', retryAfterSeconds: 5 })
  })
})

describe('isFinal', () => {
  it('settles successes and definite answers; leaves the form for everything else', () => {
    const final = ['registered', 'waitlisted', 'already-registered', 'already-waitlisted', 'event-full', 'registration-closed'] as const
    for (const kind of final) expect(isFinal({ kind } as never)).toBe(true)
    for (const outcome of [{ kind: 'unavailable' }, { kind: 'unconfirmed' }, { kind: 'rejected' }, { kind: 'invalid', fields: {} }, { kind: 'rate-limited', retryAfterSeconds: 1 }] as const) {
      expect(isFinal(outcome)).toBe(false)
    }
  })
})
