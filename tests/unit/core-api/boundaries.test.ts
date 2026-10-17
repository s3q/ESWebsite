import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Static guards for the integration's security boundary, so a later change can't quietly
 * move a Core secret into the browser or point the site at production by default.
 */

const ROOT = join(__dirname, '..', '..', '..')
const SOURCE_DIRS = ['app', 'components', 'lib', 'content']

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx|mjs|js)$/.test(name) ? [path] : []
  })
}

const files = [...SOURCE_DIRS.flatMap((d) => walk(join(ROOT, d))), join(ROOT, 'next.config.ts')].map((path) => ({
  path: relative(ROOT, path).replace(/\\/g, '/'),
  text: readFileSync(path, 'utf8'),
}))

describe('Core API boundaries', () => {
  it('exposes no Core variable to the browser (no NEXT_PUBLIC_CORE_*)', () => {
    expect(files.filter((f) => /NEXT_PUBLIC_CORE/.test(f.text)).map((f) => f.path)).toEqual([])
  })

  it('reads Core credentials only in server-only modules', () => {
    const readers = files.filter((f) => /CORE_EVENTS_API_KEY|CORE_API_BASE_URL/.test(f.text) && !f.path.endsWith('.md'))
    for (const f of readers) {
      expect(f.path, f.path).toMatch(/\.server\.ts$/)
      expect(f.text.startsWith("import 'server-only'"), f.path).toBe(true)
    }
  })

  it('marks every lib/core-api server module as server-only', () => {
    for (const f of files.filter((x) => x.path.startsWith('lib/core-api/') && x.path.endsWith('.server.ts'))) {
      expect(f.text.startsWith("import 'server-only'"), f.path).toBe(true)
    }
  })

  it('never imports a server module from a client component', () => {
    const offenders = files.filter((f) => /^['"]use client['"]/.test(f.text) && /from ['"][^'"]+\.server['"]/.test(f.text)).map((f) => f.path)
    expect(offenders).toEqual([])
  })

  it('keeps the browser registration call free of keys and credentials', () => {
    for (const path of ['lib/core-api/registration.client.ts', 'lib/core-api/registration.ts']) {
      const code = files.find((f) => f.path === path)!.text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      expect(code, path).not.toMatch(/apiKey|API_KEY|Authorization|credentials:\s*'include'/)
    }
  })

  it('hard-codes no Core address: the base URL always comes from the environment', () => {
    const offenders = files.filter((f) => /https?:\/\/(?:api\.)?essqu\.com|https?:\/\/admin\.essqu\.com/.test(f.text)).map((f) => f.path)
    expect(offenders).toEqual([])
  })
})
