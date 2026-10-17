import { describe, expect, it } from 'vitest'
import { CoreApiError, isRetryable, kindForStatus, toCoreError } from '@/lib/core-api/errors'

describe('kindForStatus', () => {
  it.each([
    [400, 'bad-request'],
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [404, 'not-found'],
    [410, 'not-found'],
    [418, 'unexpected'],
    [422, 'bad-request'],
    [429, 'rate-limited'],
    [500, 'unavailable'],
    [503, 'unavailable'],
  ])('%i → %s', (status, kind) => {
    expect(kindForStatus(status)).toBe(kind)
  })
})

describe('toCoreError', () => {
  it('maps what fetch and parsing throw', () => {
    expect(toCoreError(new DOMException('timed out', 'TimeoutError')).kind).toBe('timeout')
    expect(toCoreError(new DOMException('aborted', 'AbortError')).kind).toBe('network')
    expect(toCoreError(new TypeError('fetch failed')).kind).toBe('network')
    expect(toCoreError(new SyntaxError('Unexpected token')).kind).toBe('invalid-response')
    expect(toCoreError('???').kind).toBe('unexpected')
  })

  it('keeps a CoreApiError as it is', () => {
    const error = new CoreApiError('rate-limited', 429)
    expect(toCoreError(error)).toBe(error)
  })

  it('never carries upstream details in its message', () => {
    const error = toCoreError(new TypeError('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2'))
    expect(error.message).toBe('Core API network')
    expect(new CoreApiError('unavailable', 503).message).toBe('Core API unavailable (503)')
  })
})

describe('isRetryable', () => {
  it('retries connection errors and gateway failures only', () => {
    expect(isRetryable(new CoreApiError('network'))).toBe(true)
    for (const status of [502, 503, 504]) expect(isRetryable(new CoreApiError('unavailable', status))).toBe(true)
    expect(isRetryable(new CoreApiError('unavailable', 500))).toBe(false)
    expect(isRetryable(new CoreApiError('timeout'))).toBe(false)
    expect(isRetryable(new CoreApiError('not-found', 404))).toBe(false)
    expect(isRetryable(new CoreApiError('rate-limited', 429))).toBe(false)
  })
})
