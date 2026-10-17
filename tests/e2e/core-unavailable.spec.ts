import { expect, test } from '@playwright/test'

/** A deployment with no Core settings: honest unavailable states, never invented events. */

test('the homepage says events are unavailable and renders everything else', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#events').getByText('Upcoming events can’t be shown right now.')).toBeVisible()
  await expect(page.locator('#events').getByText('Intro to Robotics Workshop')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('#projects')).toBeVisible()
})

test('/events explains instead of showing an empty calendar', async ({ page }) => {
  await page.goto('/events')
  await expect(page.getByRole('alert').filter({ hasText: 'Events can’t be shown right now' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Try again' })).toBeVisible()
  await expect(page.getByText('Development fixtures.')).toHaveCount(0)
})

test('an event page is unavailable, not a fake event', async ({ page }) => {
  await page.goto('/events/8f2c6a1e-0b5d-4c7e-9a3f-1d2e3c4b5a60')
  await expect(page.getByText('This event can’t be loaded right now').first()).toBeVisible()
  await expect(page.getByLabel('Email address')).toHaveCount(0)
})

test('pages that don’t depend on Core are unaffected', async ({ page }) => {
  for (const path of ['/about', '/disciplines', '/activities']) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
  }
})
