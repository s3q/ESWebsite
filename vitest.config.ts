import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * Unit and component tests (tests/unit). Node by default; component tests opt into jsdom with
 * a `@vitest-environment jsdom` comment. `server-only` resolves to an empty module here, as it
 * does in Next.js's server build; Next enforces the real boundary at build time.
 */
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: [
      { find: /^server-only$/, replacement: here('./tests/unit/support/server-only.ts') },
      { find: /^@\//, replacement: here('./') },
    ],
  },
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['tests/unit/support/setup.ts'],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
})
