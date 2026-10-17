import { i18n } from '@/i18n'
import { usePwa, type BeforeInstallPromptEvent } from '@/stores/pwa'
import { toast } from '@/stores/toast'

/**
 * Chromium can fire beforeinstallprompt before React mounts (startup awaits the
 * database and translations), so listen from the moment the entry module runs.
 */
export function listenForInstallEvents(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    usePwa.getState().setPromptEvent(e as BeforeInstallPromptEvent)
  })
  window.addEventListener('appinstalled', () => {
    usePwa.getState().setInstalled()
    toast(i18n.t('pwa.installedToast'), { tone: 'ok' })
  })
}
