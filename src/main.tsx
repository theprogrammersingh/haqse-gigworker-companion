import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import { router } from './app/router'
import { initI18n } from './i18n'
import { getProfile, pruneCache } from './lib/db'

async function start(): Promise<void> {
  const profile = await getProfile().catch(() => undefined)
  await initI18n(profile?.language ?? 'en')
  const root = document.getElementById('root')
  if (!root) return
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
  void pruneCache().catch(() => undefined)
}

void start()
