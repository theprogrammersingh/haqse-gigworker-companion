import { useTranslation } from '@/i18n'
import { usePwa } from '@/stores/pwa'
import { Button, Icon } from '@/ui'

/** Non-modal "new version ready" bar; the user chooses when to reload. */
export function UpdateBanner() {
  const { t } = useTranslation()
  const { needRefresh, updateDeferred, applyUpdate, deferUpdate } = usePwa()
  const show = needRefresh && !updateDeferred
  return (
    <div aria-live="polite">
      {show && (
        <div className="border-b border-brand bg-brand-soft">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-2 px-4 py-2">
            <span className="text-brand">
              <Icon name="refresh" />
            </span>
            <p className="min-w-0 flex-1 font-semibold">{t('pwa.updateReady')}</p>
            <Button className="min-h-11" onClick={() => void applyUpdate()}>
              {t('pwa.updateNow')}
            </Button>
            <Button variant="ghost" className="min-h-11" onClick={deferUpdate}>
              {t('pwa.later')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
