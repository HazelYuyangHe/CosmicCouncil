import { test, expect } from '@playwright/test'

test.describe('Cosmic Council — homepage', () => {

  test('page loads with the correct title and key UI elements', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Cosmic Council/)
    await expect(page.getByRole('heading', { name: /Cosmic Council/i })).toBeVisible()
    await expect(page.getByText('Describe your situation. Three advisors will speak.')).toBeVisible()
  })

  test('form and submit button are present', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByLabel('Your Situation')).toBeVisible()
    await expect(page.getByRole('button', { name: /Summon the Council/i })).toBeVisible()
  })

  test('three advisor cards are always visible before submission', async ({ page }) => {
    await page.goto('/')

    // Cards are static DOM — visible without any interaction
    const grid = page.locator('.advisors-grid')
    await expect(grid).toBeVisible()
    await expect(grid.locator('.advisor-card')).toHaveCount(3)
    await expect(grid.locator('[data-agent="astrology"]')).toBeVisible()
    await expect(grid.locator('[data-agent="behavioral"]')).toBeVisible()
    await expect(grid.locator('[data-agent="history"]')).toBeVisible()
  })

  test('happy path: submitting a situation shows an API response', async ({ page }) => {
    await page.goto('/')

    // Wait for Clerk to finish loading (sign-in button appears)
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible({ timeout: 8000 })

    // Fill in and submit the form
    await page.getByLabel('Your Situation').fill(
      'I have been dating someone for six months and I am not sure if we are compatible long-term.'
    )
    await page.getByRole('button', { name: /Summon the Council/i }).click()

    // Unauthenticated — the API returns 401, which the frontend shows as an error
    await expect(page.locator('.error-banner')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.error-banner')).toContainText('401')
  })

  test('character counter updates as user types', async ({ page }) => {
    await page.goto('/')

    const textarea = page.getByLabel('Your Situation')
    await textarea.fill('Hello world')

    await expect(page.locator('.char-count')).toContainText('11 / 1000')
  })

})
