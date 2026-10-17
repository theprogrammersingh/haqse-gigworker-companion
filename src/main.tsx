import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import { createAppRouter } from './app/router'
import { changeLanguage, i18n, initI18n } from './i18n'
import { listenForInstallEvents } from './app/installEvents'
import { PwaProvider } from './app/PwaProvider'
import { getProfile, pruneCache, readOnboardedHint, recordLaunch } from './lib/db'

listenForInstallEvents()

async function start(): Promise<void> {
  // The language hint makes this instant for English; IndexedDB is not on the critical path.
  await initI18n()
  const root = document.getElementById('root')
  if (!root) return
  // First visit: go straight to /welcome so the router never fetches the Home screen's chunks
  // only to redirect after IndexedDB answers. RequireOnboarded still makes the final call.
  const base = import.meta.env.BASE_URL
  if (!readOnboardedHint() && location.pathname === base)
    history.replaceState(history.state, '', `${base}welcome`)
  const router = createAppRouter()
  createRoot(root).render(
    <StrictMode>
      <PwaProvider>
        <RouterProvider router={router} />
      </PwaProvider>
    </StrictMode>,
  )
  // Reconcile with the saved profile (e.g. first visit on a new device, or cleared storage).
  void getProfile()
    .then((p) => (p.language !== i18n.language ? changeLanguage(p.language) : undefined))
    .catch(() => undefined)
  void pruneCache().catch(() => undefined)
  void recordLaunch().catch(() => undefined)
}

void start()
