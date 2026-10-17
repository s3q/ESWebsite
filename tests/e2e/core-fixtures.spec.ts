import { expect, test } from '@playwright/test'

/** Explicit development fixtures (CORE_API_ALLOW_FIXTURES): labelled, simulated, nothing sent. */

test('fixture listings are labelled as development samples', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#events').getByText('Sample listings.')).toBeVisible()
  await page.goto('/events')
  const main = page.locator('#main')
  await expect(main.getByText('Development fixtures.')).toBeVisible()
  await expect(main.getByRole('link', { name: /Process Plant Visit/ }).getByText('Registration not available online')).toBeVisible()
})

test('registration is simulated and sends nothing', async ({ page }) => {
  const posts: string[] = []
  page.on('request', (r) => {
    if (r.method() === 'POST') posts.push(r.url())
  })
  await page.goto('/events/8f2c6a1e-0b5d-4c7e-9a3f-1d2e3c4b5a60')
  await expect(page.getByText(/Development fixture: nothing is sent/)).toBeVisible()
  await page.getByLabel('Full name').fill('Fixture Visitor')
  await page.getByLabel('Email address').fill('already@example.test')
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page.getByText('You’re already registered for this event.')).toBeVisible()
  expect(posts.filter((u) => u.includes('/registrations'))).toEqual([])
})

test('a date-only event shows no invented time', async ({ page }) => {
  await page.goto('/events/smart-campus-hackathon-fixture')
  await expect(page.getByRole('heading', { level: 1, name: 'Smart Campus Hackathon' })).toBeVisible()
  await expect(page.getByText('To be announced')).toBeVisible()
})
