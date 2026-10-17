import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/** Contract tests against staging Core (tests/contract): `npm run test:contract`. */
export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('./', import.meta.url)) }],
  },
  test: {
    include: ['tests/contract/**/*.test.ts'],
    environment: 'node',
    testTimeout: 15_000,
  },
})
