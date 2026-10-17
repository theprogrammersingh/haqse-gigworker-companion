import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { UPDATE_CHECK_INTERVAL_MS } from '@/lib/constants'
import { usePwa } from '@/stores/pwa'
import { toast } from '@/stores/toast'

/**
 * Registers the service worker (prompt mode) and feeds update events into the
 * PWA store. Checks for a new version hourly and when the app regains focus.
 * Install events are captured earlier, in installEvents.ts.
 */
export function PwaProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { setNeedRefresh, setRegistration, setUpdater } = usePwa()

  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh: () => setNeedRefresh(true),
    onOfflineReady: () => toast(t('pwa.offlineReady'), { tone: 'ok' }),
    onRegisteredSW: (_url, registration) => {
      if (!registration) return
      setRegistration(registration)
      const check = (): void => {
        if (navigator.onLine && !registration.installing)
          void registration.update().catch(() => undefined)
      }
      setInterval(check, UPDATE_CHECK_INTERVAL_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  useEffect(() => setUpdater(updateServiceWorker), [setUpdater, updateServiceWorker])

  return children
}
