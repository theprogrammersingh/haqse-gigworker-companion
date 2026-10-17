import { createRequire } from 'node:module'
import { expect, type Page } from '@playwright/test'

const require = createRequire(import.meta.url)
const AXE_PATH = require.resolve('axe-core/axe.min.js')

/** Onboards with demo data (FR-4) and lands on Home. */
export async function startWithDemo(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Choose your language' })).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.getByRole('button', { name: 'Try with demo data' }).click()
  await expect(page.getByText('Take-home today')).toBeVisible()
}

/** Runs axe-core (WCAG 2.x A/AA) on the current page and returns violation ids. */
export async function axeViolations(page: Page): Promise<string[]> {
  await page.addScriptTag({ path: AXE_PATH })
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            ctx: Document,
            opts: object,
          ) => Promise<{ violations: { id: string; nodes: unknown[] }[] }>
        }
      }
    ).axe
    const res = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    })
    return res.violations.map((v) => `${v.id} (${v.nodes.length})`)
  })
}
