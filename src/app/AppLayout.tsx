import { lazy, Suspense, useEffect } from 'react'
import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/hooks'
import { useSession } from '@/stores/session'
import { Icon, Toaster } from '@/ui'
import { BottomNav } from './BottomNav'

const AssistantSheet = lazy(() =>
  import('@/features/saathi').then((m) => ({ default: m.AssistantSheet })),
)

/** Screen name from the first path segment, for the assistant's context. */
const screenOf = (path: string): string => path.split('/')[1] || 'home'

export function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const { online, saathiOpen, setOnline, setScreen, setSaathiOpen } = useSession()
  const settings = useSettings()

  useEffect(() => {
    const update = (): void => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [setOnline])

  useEffect(() => setScreen(screenOf(location.pathname)), [location.pathname, setScreen])

  useEffect(() => {
    const theme = settings?.theme ?? 'system'
    if (theme === 'system') delete document.documentElement.dataset['theme']
    else document.documentElement.dataset['theme'] = theme
  }, [settings?.theme])

  return (
    <div className="min-h-dvh pb-40">
      <a
        href="#main"
        className="sr-only-focusable fixed top-2 left-2 z-50 rounded-lg bg-brand px-4 py-3 font-bold text-brand-ink"
      >
        {t('nav.skip')}
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-1">
          <Link
            to="/"
            className="flex min-h-tap items-center gap-2 text-xl font-extrabold text-brand"
          >
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-lg bg-brand text-base text-brand-ink"
            >
              H
            </span>
            HaqSe
          </Link>
          <div className="flex items-center gap-1">
            {!online && (
              <output className="flex items-center gap-1 rounded-full bg-warn-soft px-2 py-1 text-sm font-semibold text-warn">
                <Icon name="alert" size={16} />
                {t('common.offline')}
              </output>
            )}
            <Link
              to="/settings"
              aria-label={t('nav.settings')}
              className="inline-flex size-tap items-center justify-center rounded-xl text-ink hover:bg-surface-2"
            >
              <Icon name="settings" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-4 outline-none">
        <Outlet />
      </main>

      <button
        type="button"
        onClick={() => setSaathiOpen(true)}
        aria-haspopup="dialog"
        className="fixed right-4 bottom-20 z-30 inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-5 font-bold text-brand-ink shadow-lg hover:bg-brand-hover"
      >
        <Icon name="mic" />
        {t('saathi.fab')}
      </button>

      {saathiOpen && (
        <Suspense fallback={null}>
          <AssistantSheet open onClose={() => setSaathiOpen(false)} />
        </Suspense>
      )}

      <Toaster />
      <BottomNav />
      <ScrollRestoration />
    </div>
  )
}
