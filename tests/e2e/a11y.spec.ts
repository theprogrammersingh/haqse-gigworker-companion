import { expect, test } from '@playwright/test'
import { axeViolations, startWithDemo } from './helpers'

// axe is injected as a script, which the app's own CSP (correctly) blocks.
test.use({ bypassCSP: true })

const PAGES = [
  '/',
  '/kamai',
  '/haq',
  '/haq/pm-sym',
  '/kagaz',
  '/shikayat',
  '/shikayat/new',
  '/suraksha',
  '/settings',
]

test('onboarding has no axe violations', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Choose your language' })).toBeVisible()
  expect(await axeViolations(page)).toEqual([])
})

for (const theme of ['light', 'dark'] as const) {
  test(`every page has no axe violations (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await startWithDemo(page)
    for (const path of PAGES) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect({ path, violations: await axeViolations(page) }).toEqual({ path, violations: [] })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} scrolls sideways`,
      ).toBe(true)
    }
  })
}
