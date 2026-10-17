import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { usePwa } from '@/stores/pwa'
import { toast } from '@/stores/toast'
import { Button } from '@/ui'
import { InstallCard } from './InstallCard'

/** Settings → App: install status, version and a manual update check. */
export function AppStatus() {
  const { t } = useTranslation()
  const checkForUpdate = usePwa((s) => s.checkForUpdate)
  const [checking, setChecking] = useState(false)

  const check = async (): Promise<void> => {
    setChecking(true)
    const result = await checkForUpdate()
    setChecking(false)
    toast(t(`pwa.check.${result}`), { tone: result === 'up-to-date' ? 'ok' : 'info' })
  }

  return (
    <div className="space-y-4">
      <InstallCard compact />
      <p>
        {t('pwa.version')}:{' '}
        <span className="font-mono font-semibold">
          {__APP_VERSION__} ({__BUILD_SHA__})
        </span>
      </p>
      <Button variant="secondary" icon="refresh" disabled={checking} onClick={() => void check()}>
        {checking ? t('pwa.checking') : t('pwa.checkUpdates')}
      </Button>
      <p className="text-sm text-muted">{t('pwa.updateHint')}</p>
    </div>
  )
}
