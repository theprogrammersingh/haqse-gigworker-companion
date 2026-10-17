import { isRouteErrorResponse, useRouteError } from 'react-router'
import { useTranslation } from 'react-i18next'
import { AlertCard, Button, LinkButton } from '@/ui'

/** Per-route error screen: plain words and one way forward, never a stack trace. */
export function RouteError() {
  const error = useRouteError()
  const { t } = useTranslation()
  if (import.meta.env.DEV) console.error(error)
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <div className="mx-auto max-w-xl p-4">
      <AlertCard
        tone="warn"
        headingLevel={2}
        title={notFound ? t('error.notFound') : t('error.title')}
        actions={
          <>
            <Button icon="refresh" onClick={() => window.location.reload()}>
              {t('common.tryAgain')}
            </Button>
            <LinkButton to="/" variant="secondary" icon="home">
              {t('nav.home')}
            </LinkButton>
          </>
        }
      >
        {t('error.body')}
      </AlertCard>
    </div>
  )
}
