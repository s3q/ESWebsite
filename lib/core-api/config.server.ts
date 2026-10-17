import 'server-only'

/*
 * Core API configuration: read once from the server environment, validated, and resolved into
 * one of three modes. Nothing here is ever sent to the browser except, for registration, the
 * public base URL (see events.server.ts → getRegistrationTransport).
 *
 *   http          Core is configured: events come from {CORE_API_BASE_URL}/v1.
 *   fixtures      Development/test only: synthetic contract fixtures (lib/core-api/fixtures).
 *   unconfigured  Nothing usable: event surfaces show an honest "temporarily unavailable" state
 *                 and the rest of the site renders normally.
 *
 * Safety rules:
 * - There is no hard-coded production URL and no silent fallback to one.
 * - Fixtures never run on a Vercel production deployment, whatever the variables say, and a
 *   production build elsewhere uses them only with an explicit CORE_API_ALLOW_FIXTURES=true.
 * - The API key is server-only; there is no NEXT_PUBLIC_ variant, by design.
 */

export type FixtureScenario = 'default' | 'empty' | 'unavailable' | 'malformed'
export const FIXTURE_SCENARIOS: readonly FixtureScenario[] = ['default', 'empty', 'unavailable', 'malformed']

export type ConfigProblem =
  | 'missing-base-url'
  | 'invalid-base-url'
  | 'insecure-base-url'
  | 'invalid-mode'
  | 'invalid-api-key'
  | 'fixtures-not-allowed'

export interface HttpCoreConfig {
  mode: 'http'
  /** Origin (and optional path prefix) without a trailing slash and without `/v1`. */
  baseUrl: string
  /** Sent as `Authorization: Bearer …` on server-side event reads only, if Core requires it. */
  apiKey: string | null
  timeoutMs: number
  /** Event-list/detail cache lifetime; 0 disables caching. */
  revalidateSeconds: number
  /** Whether the browser registration form posts to Core (off until Core publishes the contract). */
  registrationEnabled: boolean
}

export interface FixtureCoreConfig {
  mode: 'fixtures'
  scenario: FixtureScenario
  /** Why fixtures are active, for the README's mode table and the dev log line. */
  reason: 'explicit' | 'development-default'
}

export interface UnconfiguredCoreConfig {
  mode: 'unconfigured'
  problem: ConfigProblem
}

export type CoreConfig = HttpCoreConfig | FixtureCoreConfig | UnconfiguredCoreConfig

type Env = Record<string, string | undefined>

export const DEFAULTS = { timeoutMs: 4000, revalidateSeconds: 45 } as const
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

const isOn = (value: string | undefined) => value?.trim().toLowerCase() === 'true'

function intInRange(value: string | undefined, fallback: number, min: number, max: number) {
  if (value === undefined || value.trim() === '') return fallback
  const n = Number(value)
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback
}

/** Whether this deployment may serve fixtures: never in Vercel production. */
export function fixturesAllowed(env: Env) {
  if (env.VERCEL_ENV === 'production') return false
  if (env.NODE_ENV !== 'production') return true
  return env.VERCEL_ENV === 'preview' || isOn(env.CORE_API_ALLOW_FIXTURES)
}

function fixtureScenario(env: Env): FixtureScenario {
  const s = env.CORE_API_FIXTURE_SCENARIO?.trim() as FixtureScenario | undefined
  return s && FIXTURE_SCENARIOS.includes(s) ? s : 'default'
}

/** Validates the base URL; returns the normalised value or the problem. */
export function normaliseBaseUrl(raw: string, env: Env): { ok: true; value: string } | { ok: false; problem: ConfigProblem } {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return { ok: false, problem: 'invalid-base-url' }
  }
  if (url.username || url.password || url.search || url.hash) return { ok: false, problem: 'invalid-base-url' }
  const path = url.pathname.replace(/\/+$/, '')
  // The client adds /v1 itself; a base URL that already ends in a version is a mistake.
  if (/\/v\d+$/i.test(path)) return { ok: false, problem: 'invalid-base-url' }
  if (url.protocol === 'http:') {
    // Plain HTTP only for a Core running on this machine (local development, E2E mocks).
    if (!LOOPBACK.has(url.hostname) || env.VERCEL_ENV === 'production') return { ok: false, problem: 'insecure-base-url' }
  } else if (url.protocol !== 'https:') {
    return { ok: false, problem: 'invalid-base-url' }
  }
  return { ok: true, value: `${url.origin}${path}` }
}

/** Pure: resolves the configuration from an environment object (tests pass their own). */
export function resolveCoreConfig(env: Env): CoreConfig {
  const mode = env.CORE_API_MODE?.trim().toLowerCase()
  if (mode && mode !== 'http' && mode !== 'fixtures') return { mode: 'unconfigured', problem: 'invalid-mode' }

  if (mode === 'fixtures') {
    return fixturesAllowed(env) ? { mode: 'fixtures', scenario: fixtureScenario(env), reason: 'explicit' } : { mode: 'unconfigured', problem: 'fixtures-not-allowed' }
  }

  const rawBase = env.CORE_API_BASE_URL?.trim()
  if (!rawBase) {
    // Local development works without any Core credentials; nowhere else falls back to fixtures.
    if (mode !== 'http' && env.NODE_ENV === 'development' && fixturesAllowed(env)) {
      return { mode: 'fixtures', scenario: fixtureScenario(env), reason: 'development-default' }
    }
    return { mode: 'unconfigured', problem: 'missing-base-url' }
  }

  const base = normaliseBaseUrl(rawBase, env)
  if (!base.ok) return { mode: 'unconfigured', problem: base.problem }

  const key = env.CORE_EVENTS_API_KEY?.trim() ?? ''
  if (key && /\s/.test(key)) return { mode: 'unconfigured', problem: 'invalid-api-key' }

  return {
    mode: 'http',
    baseUrl: base.value,
    apiKey: key || null,
    timeoutMs: intInRange(env.CORE_API_TIMEOUT_MS, DEFAULTS.timeoutMs, 500, 15000),
    revalidateSeconds: intInRange(env.CORE_EVENTS_REVALIDATE_SECONDS, DEFAULTS.revalidateSeconds, 0, 3600),
    registrationEnabled: isOn(env.CORE_REGISTRATION_ENABLED),
  }
}

let resolved: CoreConfig | null = null

/** The deployment's configuration, resolved once per server process. */
export function getCoreConfig(): CoreConfig {
  resolved ??= resolveCoreConfig(process.env)
  return resolved
}
