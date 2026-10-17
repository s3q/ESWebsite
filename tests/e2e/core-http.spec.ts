import { expect, test } from '@playwright/test'
import { coreLog, deliveredText, overflowsX, SERVER_KEY, setLocale } from './support'

/** The landing in HTTP mode against the mock Core API (see playwright.config.ts). */

const unique = (name: string) => `${name}-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.test`

async function register(page: import('@playwright/test').Page, email: string, button = 'Register') {
  await page.getByLabel('Full name').fill('E2E Visitor')
  await page.getByLabel('Email address').fill(email)
  await page.getByRole('button', { name: button }).click()
}

test('the homepage lists upcoming Core events and no sample notice', async ({ page }) => {
  await page.goto('/')
  const section = page.locator('#events')
  await expect(section.getByRole('heading', { name: 'E2E Open Workshop' })).toBeVisible()
  await expect(section.getByText('E2E Past Seminar')).toHaveCount(0)
  await expect(section.getByText('Sample listings.')).toHaveCount(0)
  await expect(section.getByRole('link', { name: 'Details and registration for E2E Open Workshop' })).toHaveAttribute('href', '/events/e2e-open#register')
  await expect(section.getByRole('link', { name: 'View event for E2E Full Visit' })).toHaveAttribute('href', '/events/e2e-full')
})

test('the timeline shows past and upcoming events with Core’s availability', async ({ page }) => {
  await page.goto('/events')
  const timeline = page.getByRole('region', { name: 'Event timeline' })
  await expect(timeline.getByRole('heading', { name: 'Already happened' })).toBeVisible()
  for (const [title, badge] of [
    ['E2E Open Workshop', 'Registration open'],
    ['E2E Waitlist Talk', 'Waitlist open'],
    ['E2E Full Visit', 'Full'],
    ['E2E Closed Hackathon', 'Registration closed'],
    ['E2E Past Seminar', 'Event completed'],
  ]) {
    const card = timeline.getByRole('link', { name: new RegExp(title) })
    await expect(card).toBeVisible()
    await expect(card.getByText(badge, { exact: true })).toBeVisible()
  }
  await expect(page.getByText('Development fixtures.')).toHaveCount(0)
})

test('registers through Core and shows its confirmation', async ({ page }) => {
  await page.goto('/events/e2e-open')
  await expect(page.getByRole('heading', { level: 1, name: 'E2E Open Workshop' })).toBeVisible()
  await register(page, unique('visitor'))
  await expect(page.getByRole('status').filter({ hasText: 'You’re registered' })).toBeFocused()
  await expect(page.getByLabel('Full name')).toHaveCount(0)
})

test('joins a waitlist through Core', async ({ page }) => {
  await page.goto('/events/e2e-waitlist')
  await register(page, unique('visitor'), 'Join the waitlist')
  await expect(page.getByText('You’re on the waitlist')).toBeVisible()
})

for (const [email, text, form] of [
  ['already@example.test', 'You’re already registered for this event.', false],
  ['full@example.test', 'This event filled up before your registration went through.', false],
  ['closed@example.test', 'Registration closed before your registration went through.', false],
  ['ratelimited@example.test', 'Too many attempts. Try again in 30 seconds.', true],
  ['invalid@example.test', 'Check the highlighted details and try again.', true],
  ['down@example.test', 'Your registration couldn’t be completed right now, and nothing was confirmed. Please try again in a moment.', true],
] as const) {
  test(`shows Core’s answer for ${email}`, async ({ page }) => {
    await page.goto('/events/e2e-open')
    await register(page, email)
    await expect(page.getByText(text)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Register' })).toHaveCount(form ? 1 : 0)
  })
}

test('asks for the details before anything is sent', async ({ page }) => {
  await page.goto('/events/e2e-open')
  const before = (await coreLog()).posts.length
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page.getByText('Enter your full name.')).toBeVisible()
  await expect(page.getByLabel('Full name')).toBeFocused()
  expect((await coreLog()).posts.length).toBe(before)
})

for (const [id, note] of [
  ['e2e-full', 'This event is full.'],
  ['e2e-closed', 'Registration has closed for this event.'],
  ['e2e-past', 'This event has finished.'],
]) {
  test(`offers no form for ${id}`, async ({ page }) => {
    await page.goto(`/events/${id}`)
    await expect(page.getByText(note)).toBeVisible()
    await expect(page.getByLabel('Email address')).toHaveCount(0)
  })
}

test('an id Core doesn’t know is the event 404', async ({ page }) => {
  await page.goto('/events/no-such-event')
  await expect(page.getByRole('heading', { name: 'No event at this address.' })).toBeVisible()
})

test('a Core that doesn’t answer gives an honest state, not an endless wait', async ({ page }) => {
  await page.goto('/events/slow-event')
  await expect(page.getByText('This event can’t be loaded right now').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: 'See all events' })).toBeVisible()
})

test('Arabic is right to left, with Arabic labels', async ({ page, baseURL }) => {
  await setLocale(page, baseURL!, 'ar')
  await page.goto('/events/e2e-open')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByLabel('الاسم الكامل')).toBeVisible()
  await expect(page.getByLabel('البريد الإلكتروني')).toHaveAttribute('dir', 'ltr')
  await expect(page.getByText('التسجيل مفتوح')).toBeVisible()
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  for (const path of ['/', '/events', '/events/e2e-open']) {
    test(`${path} has no sideways scroll`, async ({ page }) => {
      await page.goto(path)
      expect(await overflowsX(page)).toBe(false)
    })
  }
})

test.describe('the security boundary', () => {
  test('the server key is used server side and never reaches the browser', async ({ page }) => {
    for (const path of ['/', '/events', '/events/e2e-open']) {
      const delivered = await deliveredText(page, path)
      expect(delivered).not.toContain(SERVER_KEY)
    }
    const { reads } = await coreLog()
    expect(reads.length).toBeGreaterThan(0)
    expect(reads.every((r) => r.hasAuthorization)).toBe(true)
  })

  test('the browser posts registrations to Core itself, with no credentials and only the draft fields', async ({ page, baseURL }) => {
    await page.goto('/events/e2e-open')
    const request = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/v1/events/e2e-open/registrations'))
    await register(page, unique('boundary'))
    const sent = await request
    expect(sent.headers()['authorization']).toBeUndefined()
    expect(sent.headers()['cookie']).toBeUndefined()
    expect(Object.keys(sent.postDataJSON()).sort()).toEqual(['email', 'fullName'])
    await expect(page.getByText('You’re registered')).toBeVisible()
    const { posts } = await coreLog()
    expect(posts.length).toBeGreaterThan(0)
    expect(posts.every((p) => !p.hasAuthorization && !p.hasCookie && p.origin === baseURL)).toBe(true)
  })
})
