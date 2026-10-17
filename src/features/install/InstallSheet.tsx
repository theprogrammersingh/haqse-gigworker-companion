import { useTranslation } from 'react-i18next'
import { BROWSER_NAMES, type Platform } from '@/lib/pwa/platform'
import { copyText } from '@/lib/utils/share'
import { toast } from '@/stores/toast'
import { AlertCard, Button, Sheet } from '@/ui'
import { InstallSteps } from './InstallSteps'
import { GUIDED_METHODS, isGuided } from './steps'

/** Browser-specific install guide, with every other browser's steps one tap away. */
export function InstallSheet({ platform, onClose }: { platform: Platform; onClose: () => void }) {
  const { t } = useTranslation()
  const { method } = platform
  const others = GUIDED_METHODS.filter((m) => m !== method)

  return (
    <Sheet open onClose={onClose} title={t('pwa.howTitle')}>
      <div className="space-y-4">
        {method === 'installed' && (
          <AlertCard tone="ok" title={t('pwa.installedTitle')}>
            {t('pwa.installedBody')}
          </AlertCard>
        )}
        {method === 'unsupported' && (
          <AlertCard
            tone="info"
            title={t('pwa.unsupportedTitle', { browser: BROWSER_NAMES[platform.browser] })}
          >
            {t('pwa.unsupportedBody')}
          </AlertCard>
        )}
        {isGuided(method) && (
          <>
            <p className="font-semibold">
              {t(`pwa.intro.${method}`, { browser: BROWSER_NAMES[platform.browser] })}
            </p>
            <InstallSteps method={method} />
            {method === 'open-in-browser' && (
              <Button
                variant="secondary"
                icon="link"
                onClick={async () =>
                  toast(
                    (await copyText(window.location.origin))
                      ? t('pwa.linkCopied')
                      : t('common.copyFailed'),
                    { tone: 'ok' },
                  )
                }
              >
                {t('pwa.copyLink')}
              </Button>
            )}
          </>
        )}
        <p className="text-sm text-muted">{t('pwa.why')}</p>
        <details>
          <summary className="inline-flex min-h-tap cursor-pointer items-center font-semibold text-brand">
            {t('pwa.otherBrowsers')}
          </summary>
          <div className="mt-2 space-y-5">
            {others.map((m) => (
              <section key={m} aria-labelledby={`steps-${m}`} className="space-y-2">
                <h3 id={`steps-${m}`} className="font-bold">
                  {t(`pwa.methodName.${m}`)}
                </h3>
                <InstallSteps method={m} />
              </section>
            ))}
          </div>
        </details>
      </div>
    </Sheet>
  )
}
