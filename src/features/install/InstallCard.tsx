import { lazy, Suspense, useState } from 'react'
import { useTranslation } from '@/i18n'
import { usePwa } from '@/stores/pwa'
import { toast } from '@/stores/toast'
import { Button, Card, Icon } from '@/ui'
import { usePlatform } from './usePlatform'

const InstallSheet = lazy(() => import('./InstallSheet').then((m) => ({ default: m.InstallSheet })))

interface InstallCardProps {
  /** Adds a "Not now" button (Home suggestion). */
  onDismiss?: () => void
  compact?: boolean
}

/**
 * One button that does the right thing for this browser: the native install
 * prompt where available, otherwise a guide with the exact steps.
 */
export function InstallCard({ onDismiss, compact }: InstallCardProps) {
  const { t } = useTranslation()
  const platform = usePlatform()
  const install = usePwa((s) => s.install)
  const [guide, setGuide] = useState(false)

  if (platform.method === 'installed') {
    return (
      <p className="flex items-center gap-2 font-semibold text-ok">
        <Icon name="check-circle" />
        {t('pwa.installedTitle')}
      </p>
    )
  }

  const primary = async (): Promise<void> => {
    if (platform.method !== 'prompt') return setGuide(true)
    const outcome = await install()
    if (outcome === 'unavailable') setGuide(true)
    else if (outcome === 'dismissed') toast(t('pwa.dismissedToast'))
  }

  return (
    <Card className={compact ? 'space-y-2' : 'space-y-3 bg-brand-soft'}>
      {!compact && (
        <>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Icon name="smartphone" />
            {t('pwa.cardTitle')}
          </h2>
          <p>{t('pwa.cardBody')}</p>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          icon={platform.method === 'prompt' ? 'install' : 'info'}
          onClick={() => void primary()}
        >
          {platform.method === 'prompt' ? t('pwa.install') : t('pwa.howToInstall')}
        </Button>
        {onDismiss && (
          <Button variant="ghost" onClick={onDismiss}>
            {t('pwa.notNow')}
          </Button>
        )}
      </div>
      {guide && (
        <Suspense fallback={null}>
          <InstallSheet platform={platform} onClose={() => setGuide(false)} />
        </Suspense>
      )}
    </Card>
  )
}
