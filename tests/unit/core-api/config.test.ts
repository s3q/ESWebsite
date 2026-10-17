import { describe, expect, it } from 'vitest'
import { DEFAULTS, fixturesAllowed, normaliseBaseUrl, resolveCoreConfig } from '@/lib/core-api/config.server'

const prod = { NODE_ENV: 'production' }
const vercelProd = { NODE_ENV: 'production', VERCEL_ENV: 'production' }

describe('resolveCoreConfig', () => {
  it('uses HTTP mode with defaults when a base URL is set', () => {
    expect(resolveCoreConfig({ ...prod, CORE_API_BASE_URL: 'https://core.example.test' })).toEqual({
      mode: 'http',
      baseUrl: 'https://core.example.test',
      apiKey: null,
      timeoutMs: DEFAULTS.timeoutMs,
      revalidateSeconds: DEFAULTS.revalidateSeconds,
      registrationEnabled: false,
    })
  })

  it('normalises the base URL: trailing slashes go, a path prefix stays', () => {
    const config = resolveCoreConfig({ ...prod, CORE_API_BASE_URL: ' https://core.example.test/platform/ ' })
    expect(config).toMatchObject({ mode: 'http', baseUrl: 'https://core.example.test/platform' })
  })

  it('reads the optional key, timeout, cache lifetime and registration switch', () => {
    const config = resolveCoreConfig({
      ...prod,
      CORE_API_BASE_URL: 'https://core.example.test',
      CORE_EVENTS_API_KEY: ' test-key ',
      CORE_API_TIMEOUT_MS: '2500',
      CORE_EVENTS_REVALIDATE_SECONDS: '0',
      CORE_REGISTRATION_ENABLED: 'true',
    })
    expect(config).toMatchObject({ apiKey: 'test-key', timeoutMs: 2500, revalidateSeconds: 0, registrationEnabled: true })
  })

  it('falls back to defaults for out-of-range or non-numeric numbers', () => {
    const config = resolveCoreConfig({ ...prod, CORE_API_BASE_URL: 'https://core.example.test', CORE_API_TIMEOUT_MS: '99999', CORE_EVENTS_REVALIDATE_SECONDS: 'soon' })
    expect(config).toMatchObject({ timeoutMs: DEFAULTS.timeoutMs, revalidateSeconds: DEFAULTS.revalidateSeconds })
  })

  it('is unconfigured, not silently pointed anywhere, when the base URL is missing in production', () => {
    expect(resolveCoreConfig(prod)).toEqual({ mode: 'unconfigured', problem: 'missing-base-url' })
    expect(resolveCoreConfig(vercelProd)).toEqual({ mode: 'unconfigured', problem: 'missing-base-url' })
  })

  it('defaults to fixtures only in local development without a base URL', () => {
    expect(resolveCoreConfig({ NODE_ENV: 'development' })).toEqual({ mode: 'fixtures', scenario: 'default', reason: 'development-default' })
    expect(resolveCoreConfig({ NODE_ENV: 'development', CORE_API_MODE: 'http' })).toEqual({ mode: 'unconfigured', problem: 'missing-base-url' })
    expect(resolveCoreConfig({ NODE_ENV: 'test' })).toEqual({ mode: 'unconfigured', problem: 'missing-base-url' })
  })

  it('never serves fixtures on a Vercel production deployment, whatever the variables say', () => {
    expect(resolveCoreConfig({ ...vercelProd, CORE_API_MODE: 'fixtures', CORE_API_ALLOW_FIXTURES: 'true' })).toEqual({
      mode: 'unconfigured',
      problem: 'fixtures-not-allowed',
    })
  })

  it('allows explicit fixtures in a local production build only with CORE_API_ALLOW_FIXTURES', () => {
    expect(resolveCoreConfig({ ...prod, CORE_API_MODE: 'fixtures' })).toMatchObject({ mode: 'unconfigured', problem: 'fixtures-not-allowed' })
    expect(resolveCoreConfig({ ...prod, CORE_API_MODE: 'fixtures', CORE_API_ALLOW_FIXTURES: 'true', CORE_API_FIXTURE_SCENARIO: 'empty' })).toEqual({
      mode: 'fixtures',
      scenario: 'empty',
      reason: 'explicit',
    })
  })

  it('ignores an unknown fixture scenario', () => {
    expect(resolveCoreConfig({ NODE_ENV: 'development', CORE_API_MODE: 'fixtures', CORE_API_FIXTURE_SCENARIO: 'chaos' })).toMatchObject({ scenario: 'default' })
  })

  it('rejects an unknown mode, a malformed key and unsafe URLs', () => {
    expect(resolveCoreConfig({ ...prod, CORE_API_MODE: 'graphql' })).toEqual({ mode: 'unconfigured', problem: 'invalid-mode' })
    expect(resolveCoreConfig({ ...prod, CORE_API_BASE_URL: 'https://core.example.test', CORE_EVENTS_API_KEY: 'two words' })).toEqual({
      mode: 'unconfigured',
      problem: 'invalid-api-key',
    })
    expect(resolveCoreConfig({ ...prod, CORE_API_BASE_URL: 'http://core.example.test' })).toEqual({ mode: 'unconfigured', problem: 'insecure-base-url' })
  })
})

describe('normaliseBaseUrl', () => {
  const env = { NODE_ENV: 'production' }
  it.each([
    ['not a url', 'invalid-base-url'],
    ['ftp://core.example.test', 'invalid-base-url'],
    ['https://user:pass@core.example.test', 'invalid-base-url'],
    ['https://core.example.test?x=1', 'invalid-base-url'],
    ['https://core.example.test#v1', 'invalid-base-url'],
    ['https://core.example.test/v1', 'invalid-base-url'],
    ['https://core.example.test/api/v2/', 'invalid-base-url'],
    ['http://core.example.test', 'insecure-base-url'],
  ])('rejects %s', (raw, problem) => {
    expect(normaliseBaseUrl(raw, env)).toEqual({ ok: false, problem })
  })

  it('allows plain HTTP only on this machine, and never on Vercel production', () => {
    expect(normaliseBaseUrl('http://localhost:4010', env)).toEqual({ ok: true, value: 'http://localhost:4010' })
    expect(normaliseBaseUrl('http://127.0.0.1:4010/', env)).toEqual({ ok: true, value: 'http://127.0.0.1:4010' })
    expect(normaliseBaseUrl('http://localhost:4010', { VERCEL_ENV: 'production' })).toEqual({ ok: false, problem: 'insecure-base-url' })
  })
})

describe('fixturesAllowed', () => {
  it.each([
    [{ NODE_ENV: 'development' }, true],
    [{ NODE_ENV: 'test' }, true],
    [{ NODE_ENV: 'production' }, false],
    [{ NODE_ENV: 'production', CORE_API_ALLOW_FIXTURES: 'true' }, true],
    [{ NODE_ENV: 'production', VERCEL_ENV: 'preview' }, true],
    [{ NODE_ENV: 'production', VERCEL_ENV: 'production', CORE_API_ALLOW_FIXTURES: 'true' }, false],
    [{ NODE_ENV: 'development', VERCEL_ENV: 'production' }, false],
  ])('%j → %s', (env, allowed) => {
    expect(fixturesAllowed(env)).toBe(allowed)
  })
})
