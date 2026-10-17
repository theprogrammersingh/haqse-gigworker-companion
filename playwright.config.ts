import { defineConfig, devices } from '@playwright/test'

const PORT = 4181
const OUT_DIR = 'dist-e2e'

/** One happy path per connected flow on a 360 px Android viewport, against the production build. */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...devices['Pixel 7'],
    viewport: { width: 360, height: 780 },
    locale: 'en-IN',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'mobile-chromium', use: { browserName: 'chromium' } }],
  // Own root-path build in dist-e2e/, so it never overwrites the deploy artifact in dist/
  // (whose base comes from VITE_BASE in CI).
  webServer: {
    command: `npx vite build --outDir ${OUT_DIR} && npx vite preview --outDir ${OUT_DIR} --host 127.0.0.1 --port ${PORT} --strictPort`,
    env: { VITE_BASE: '/' },
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
})
