import { devices, expect, test, type Page } from '@playwright/test'
import { startDeployServer } from './deploy-server'
import { startWithDemo } from './helpers'

// REST shape of models.list (the SDK maps supportedGenerationMethods → supportedActions).
const MODELS = {
  models: [
    {
      name: 'models/gemini-3.8-flash',
      supportedGenerationMethods: ['generateContent', 'countTokens'],
    },
    { name: 'models/gemini-4.0-flash', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-4.0-flash-lite', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-4.0-pro', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/text-embedding-005', supportedGenerationMethods: ['embedContent'] },
  ],
}

/** Waits until the service worker controls the page, so offline/update tests are meaningful. */
async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(() => navigator.serviceWorker.ready)
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
}

test('model selector: bundled list without a key, key-specific list after validation', async ({
  page,
  context,
}) => {
  // context.route (not page.route): once the service worker controls the page, Workbox
  // makes the Gemini request from the worker, which page-level routes cannot see.
  await context.route('https://generativelanguage.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MODELS) }),
  )
  await startWithDemo(page)
  await page.goto('/settings')
  const select = page.getByRole('combobox', { name: 'AI model' })
  await expect(select).toHaveValue('gemini-3.8-flash')

  await page.getByLabel('Gemini API key').fill('AIza-test-key-for-e2e')
  await page.getByRole('button', { name: 'Check and save key' }).click()
  await expect(page.getByRole('heading', { name: 'AI help is on' })).toBeVisible()
  // Newest Flash first; Pro and embedding models are filtered out.
  await expect(select.locator('option')).toHaveText([
    'gemini-4.0-flash (recommended)',
    'gemini-4.0-flash-lite',
    'gemini-3.8-flash',
  ])
  await select.selectOption('gemini-4.0-flash-lite')
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'AI model' })).toHaveValue(
    'gemini-4.0-flash-lite',
  )
})

test('install: one-tap prompt where the browser offers it', async ({ page }) => {
  await startWithDemo(page)
  await page.reload() // second launch: the Home suggestion may show
  await expect(page.getByText('Take-home today')).toBeVisible()
  await page.evaluate(() => {
    const w = window as unknown as { promptCount: number }
    w.promptCount = 0
    const e = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: async () => {
        w.promptCount += 1
      },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })
    window.dispatchEvent(e)
  })
  await page.getByRole('button', { name: 'Install app' }).click()
  expect(
    await page.evaluate(() => (window as unknown as { promptCount: number }).promptCount),
  ).toBe(1)
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')))
  await expect(page.getByText('HaqSe is installed. Open it from your home screen.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Install app' })).toHaveCount(0)
})

test('install: iPhone gets Share-sheet steps, no install button', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    ...devices['iPhone 15'],
    viewport: { width: 375, height: 760 },
    ...(baseURL ? { baseURL } : {}),
  })
  const page = await context.newPage()
  await startWithDemo(page)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Install app' })).toHaveCount(0)
  await page.getByRole('button', { name: 'How to install' }).click()
  await expect(page.getByText('On iPhone and iPad, install from the Share menu.')).toBeVisible()
  await expect(page.getByText(/Scroll down and tap “Add to Home Screen”/)).toBeVisible()
  await context.close()
})

test('offline: a deep link reloads from the service worker cache', async ({ page, context }) => {
  await startWithDemo(page)
  await waitForServiceWorker(page)
  await context.setOffline(true)
  await page.goto('/kamai')
  await expect(page.getByRole('heading', { level: 1, name: 'Earnings' })).toBeVisible()
  await expect(page.getByText('Offline')).toBeVisible()
})

test('update: a new deploy shows "Update now", which activates it', async ({ page }) => {
  // A private server on a copy of the build, so "deploying" cannot disturb parallel tests.
  const server = await startDeployServer()
  try {
    await startWithDemo(page, server.url)
    await waitForServiceWorker(page)
    server.deployNewVersion()
    await page.goto(`${server.url}/settings`)
    await page.getByRole('button', { name: 'Check for updates' }).click()
    await expect(page.getByText('A new version of HaqSe is ready.')).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: 'Update now' }).click()
    await page.waitForLoadState('load')
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
    await expect(page.getByText('A new version of HaqSe is ready.')).toHaveCount(0)
    // The demo data survived the update: it lives in IndexedDB, not in the service worker cache.
    await page.goto(`${server.url}/kamai`)
    await expect(page.getByText('Payout drops')).toBeVisible()
  } finally {
    server.stop()
  }
})
