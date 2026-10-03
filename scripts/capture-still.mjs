// Regenerates the hero stills from the live 3D scene, so they always match the WebGL render:
//   pose 0 → public/hero/emblem-opening.webp    (desktop first paint; the canvas crossfades over it)
//   pose 1 → public/hero/emblem-assembled.webp  (reduced motion, Save-Data, no-WebGL fallback)
//   pose 2 → public/hero/emblem-stacked.webp    (phone/tablet first paint, under the compact scene)
//
//   1. npm run dev            (the /dev/emblem route only exists in development)
//   2. node scripts/capture-still.mjs 0 && node scripts/capture-still.mjs 1 && node scripts/capture-still.mjs 2
//
// Needs playwright-core with a Chromium build. It is deliberately not a project dependency:
// point PLAYWRIGHT_PATH at an existing install, or run `npm i -D playwright-core` locally.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright-core')
const pose = process.argv[2] ?? '0'
const base = process.env.URL || 'http://localhost:3000'

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 700, height: 700 }, deviceScaleFactor: 2 })
await page.goto(`${base}/dev/emblem?pose=${pose}`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => window.__emblemReady === true, null, { timeout: 60000 })
await page.waitForTimeout(2500)
const png = await page.locator('#capture').screenshot({ omitBackground: true })
await browser.close()

const name = pose === '2' ? 'emblem-stacked' : Number(pose) >= 1 ? 'emblem-assembled' : 'emblem-opening'
try {
  const { default: sharp } = await import('sharp')
  await sharp(png).webp({ quality: 86, effort: 6 }).toFile(`public/hero/${name}.webp`)
  console.log(`Wrote public/hero/${name}.webp`)
} catch {
  await writeFile(`${name}.png`, png)
  console.log(`sharp is unavailable: wrote ${name}.png. Convert it to WebP at public/hero/${name}.webp.`)
}
