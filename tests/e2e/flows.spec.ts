import { expect, test } from '@playwright/test'
import { startWithDemo } from './helpers'

test('flow 1: demo → anomaly → draft complaint → copy (PRD §10 happy path)', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await startWithDemo(page)

  const anomaly = page.getByRole('heading', { name: /Zomato paid less on/ })
  await expect(anomaly).toBeVisible()
  await page.getByRole('button', { name: 'Draft complaint' }).first().click()

  await expect(page.getByRole('heading', { name: 'New complaint' })).toBeVisible()
  await expect(page.getByText(/7 hours, paid ₹510, usual about ₹870/)).toBeVisible()
  // No AI key: the offline template is used, built only from ledger evidence.
  await page.getByRole('button', { name: 'Make the draft' }).click()

  await expect(page.getByRole('tab', { name: 'Formal (English)' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const letter = page.getByRole('tabpanel')
  await expect(letter).toContainText('Dear Zomato Support Team')
  await expect(letter).toContainText('Rs. 510')
  await expect(letter).toContainText('Rs. 870')

  await page.getByRole('button', { name: 'Copy' }).click()
  await expect(page.getByText('Copied')).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('Subject: Request to review short payout')

  await page
    .locator('label')
    .filter({ hasText: /^Sent$/ })
    .click()
  await expect(page.getByRole('radio', { name: 'Sent' })).toBeChecked()
  await page.goto('/shikayat')
  await expect(page.getByText('Sent', { exact: true })).toBeVisible()
})

test('flow 2: profile → schemes → missing documents', async ({ page }) => {
  await startWithDemo(page)
  await page.getByRole('link', { name: 'Schemes' }).first().click()
  await page.getByRole('link', { name: /Ayushman Bharat PM-JAY/ }).click()
  await expect(page.getByText('Fix your papers first')).toBeVisible()
  await page.getByRole('link', { name: 'Fix papers in Documents' }).click()
  await expect(page.getByRole('heading', { name: /Papers for Ayushman/ })).toBeVisible()
  await page.getByRole('button', { name: /e-Shram card.*Missing/ }).click()
  await page.getByRole('button', { name: 'Save' }).click()
  await page.goBack()
  await expect(page.getByRole('link', { name: 'Apply on the official website' })).toBeVisible()
})

test('flow 3: incident → next steps → grievance', async ({ page }) => {
  await startWithDemo(page)
  await page.getByRole('link', { name: 'Safety' }).click()
  await page.getByRole('button', { name: 'Report an incident' }).click()
  await page.getByText('Theft', { exact: true }).click()
  await page.getByLabel('Where').fill('Model Town market')
  await page.getByLabel('Details').fill('Phone stolen from bike holder')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Incident saved')).toBeVisible()
  await expect(page.getByText(/report the IMEI on the CEIR portal/)).toBeVisible()
  await page.getByRole('link', { name: 'Raise complaint' }).first().click()
  await expect(page.getByText('Model Town market')).toBeVisible()
  await page.locator('label').filter({ hasText: 'Police (non-emergency)' }).click()
  await page.getByRole('button', { name: 'Make the draft' }).click()
  await expect(page.getByRole('tabpanel')).toContainText('To the Station House Officer')
})

test('earnings: typed log is parsed locally, confirmed, and saved', async ({ page }) => {
  await startWithDemo(page)
  await page.getByRole('button', { name: 'Log earnings' }).click()
  await page.getByRole('tab', { name: 'Type' }).click()
  await page.getByLabel('Write what you earned').fill('aaj Swiggy se 1200, petrol 150, 5 ghante')
  await page.getByRole('button', { name: 'Read it' }).click()
  await expect(page.getByRole('heading', { name: 'Check before saving' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Payout' })).toHaveValue('1200')
  await expect(page.getByRole('textbox', { name: 'Hours' })).toHaveValue('5')
  await expect(page.getByRole('textbox', { name: 'Petrol / CNG' })).toHaveValue('150')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Saved 1 entry')).toBeVisible()
})

test('Saathi answers licence expiry from local data without a key (FR-26)', async ({ page }) => {
  await startWithDemo(page)
  await page.getByRole('button', { name: 'Ask Saathi' }).click()
  await page.getByLabel('Your message').fill('mera licence kab expire hoga')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(
    page.getByText(/Your Driving licence is valid till .*, 20 days from now/),
  ).toBeVisible()

  await page.getByLabel('Your message').fill('complaint likhna hai kal ke payment ka')
  await page.getByRole('button', { name: 'Send' }).click()
  await page.getByRole('button', { name: 'Yes, do it' }).click()
  await expect(page.getByRole('heading', { name: 'New complaint' })).toBeVisible()
  await expect(page.getByText(/paid ₹510/)).toBeVisible()
})

test('language switch sets <html lang> and translates the UI (FR-1)', async ({ page }) => {
  await page.goto('/')
  await page.getByText('ਪੰਜਾਬੀ').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pa')
  await expect(page.getByRole('heading', { name: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ' })).toBeVisible()
  await page.getByText('हिंदी').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi')
  await expect(page.getByRole('heading', { name: 'अपनी भाषा चुनें' })).toBeVisible()
})

test('SOS works offline: 112 and SMS fallbacks are present (FR-23)', async ({ page, context }) => {
  await startWithDemo(page)
  await context.setOffline(true)
  await page.getByRole('link', { name: 'Safety' }).click()
  await page.getByRole('button', { name: 'SOS' }).click()
  await page.getByRole('button', { name: 'Yes, get help' }).click()
  await expect(page.getByRole('link', { name: 'Call 112' })).toHaveAttribute('href', 'tel:112')
  await expect(page.getByRole('link', { name: /Send SMS to 1 contact/ })).toHaveAttribute(
    'href',
    /^sms:\+919876543210\?body=/,
  )
})
