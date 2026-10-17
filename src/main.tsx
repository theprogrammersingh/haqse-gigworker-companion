import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import { router } from './app/router'
import { initI18n } from './i18n'
import { listenForInstallEvents } from './app/installEvents'
import { PwaProvider } from './app/PwaProvider'
import { getProfile, pruneCache, recordLaunch } from './lib/db'

listenForInstallEvents()

async function start(): Promise<void> {
  const profile = await getProfile().catch(() => undefined)
  await initI18n(profile?.language ?? 'en')
  const root = document.getElementById('root')
  if (!root) return
  createRoot(root).render(
    <StrictMode>
      <PwaProvider>
        <RouterProvider router={router} />
      </PwaProvider>
    </StrictMode>,
  )
  void pruneCache().catch(() => undefined)
  void recordLaunch().catch(() => undefined)
}

void start()
