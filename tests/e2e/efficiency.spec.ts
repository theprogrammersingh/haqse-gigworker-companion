import { expect, test } from '@playwright/test'

test('first visit loads only what the welcome screen needs', async ({ page }) => {
  const scripts: string[] = []
  page.on('request', (r) => {
    if (r.resourceType() === 'script') scripts.push(new URL(r.url()).pathname)
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Choose your language' })).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/welcome')

  const names = scripts.map((s) => s.replace(/^.*\/assets\//, '').replace(/-[\w-]{8}\.js$/, ''))
  // No Home/Earnings code, no Gemini SDK, no zod/AI task code, no other locales.
  for (const unwanted of ['home', 'kamai', 'web', 'run', 'hi', 'pa'])
    expect(names, `should not load "${unwanted}"`).not.toContain(unwanted)

  // Every script was announced up front (entry + modulepreload), so there is no waterfall.
  const preloaded = await page.evaluate(() =>
    [...document.querySelectorAll('script[src], link[rel="modulepreload"]')].map(
      (el) => new URL((el as HTMLScriptElement).src || (el as HTMLLinkElement).href).pathname,
    ),
  )
  const late = scripts.filter((s) => !preloaded.includes(s) && !s.includes('workbox-window'))
  expect(late).toEqual([])
})

test('returning user still opens Home directly', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.getByRole('button', { name: 'Try with demo data' }).click()
  await expect(page.getByText('Take-home today')).toBeVisible()
  await page.goto('/')
  await expect(page.getByText('Take-home today')).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/')
})
