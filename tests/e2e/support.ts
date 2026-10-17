import type { Page } from '@playwright/test'

/** Shared by playwright.config.ts and the specs. Test-only values; nothing here is real. */
export const MOCK_CORE = 'http://127.0.0.1:4010'
export const SERVER_KEY = 'e2e-server-only-key'
export const PORTS = { http: 3200, unconfigured: 3201, fixtures: 3202 } as const

/** What the mock Core saw: which headers were present (never their values) and the body's field names. */
export async function coreLog(): Promise<{
  reads: { path: string; hasAuthorization: boolean; language: string | null }[]
  posts: { path: string; origin: string | null; hasAuthorization: boolean; hasCookie: boolean; fields: string[] | null }[]
}> {
  return (await fetch(`${MOCK_CORE}/__log`)).json()
}

/** Every byte the browser received for a page: its HTML and each script it loaded. */
export async function deliveredText(page: Page, path: string) {
  const bodies: string[] = []
  page.on('response', async (response) => {
    const type = response.headers()['content-type'] ?? ''
    if (/javascript|html|json|x-component/.test(type)) bodies.push(await response.text().catch(() => ''))
  })
  await page.goto(path, { waitUntil: 'networkidle' })
  return bodies.join('\n')
}

export async function setLocale(page: Page, baseURL: string, locale: 'en' | 'ar') {
  await page.context().addCookies([{ name: 'es-locale', value: locale, url: baseURL }])
}

/** True when the page scrolls sideways (a layout bug on phones). */
export const overflowsX = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
