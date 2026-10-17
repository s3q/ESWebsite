import { defineConfig, devices } from '@playwright/test'
import { MOCK_CORE, PORTS as port, SERVER_KEY } from './tests/e2e/support'

/**
 * End-to-end tests against a production build (`npm run build` first), in three deployments
 * of the same build, each started with different server environment:
 *
 *   http          Core configured → the mock Core API (tests/e2e/mock-core-server.mjs)
 *   unconfigured  no Core settings → honest "unavailable" states, the rest of the site intact
 *   fixtures      explicit development fixtures (CORE_API_ALLOW_FIXTURES, never on Vercel production)
 *
 * Nothing here talks to a real Core API or production data.
 */

const origin = (p: number) => `http://localhost:${p}`

const base = { NODE_ENV: 'production', CORE_API_MODE: '', CORE_API_BASE_URL: '', CORE_EVENTS_API_KEY: '', CORE_REGISTRATION_ENABLED: '', CORE_API_ALLOW_FIXTURES: '' }

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { trace: 'retain-on-failure', reducedMotion: 'reduce' },
  projects: [
    { name: 'http', testMatch: /core-http\.spec\.ts/, use: { ...devices['Desktop Chrome'], baseURL: origin(port.http) } },
    { name: 'unconfigured', testMatch: /core-unavailable\.spec\.ts/, use: { ...devices['Desktop Chrome'], baseURL: origin(port.unconfigured) } },
    { name: 'fixtures', testMatch: /core-fixtures\.spec\.ts/, use: { ...devices['Desktop Chrome'], baseURL: origin(port.fixtures) } },
  ],
  webServer: [
    {
      command: 'node tests/e2e/mock-core-server.mjs',
      url: `${MOCK_CORE}/__log`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_CORE_PORT: '4010', MOCK_CORE_KEY: SERVER_KEY, MOCK_CORE_ALLOWED_ORIGINS: origin(port.http) },
    },
    {
      command: `npx next start -p ${port.http}`,
      url: origin(port.http),
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...base,
        CORE_API_BASE_URL: MOCK_CORE,
        CORE_EVENTS_API_KEY: SERVER_KEY,
        CORE_REGISTRATION_ENABLED: 'true',
        CORE_API_TIMEOUT_MS: '1500',
        CORE_EVENTS_REVALIDATE_SECONDS: '0',
      },
    },
    {
      command: `npx next start -p ${port.unconfigured}`,
      url: origin(port.unconfigured),
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: base,
    },
    {
      command: `npx next start -p ${port.fixtures}`,
      url: origin(port.fixtures),
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...base, CORE_API_MODE: 'fixtures', CORE_API_ALLOW_FIXTURES: 'true' },
    },
  ],
})
