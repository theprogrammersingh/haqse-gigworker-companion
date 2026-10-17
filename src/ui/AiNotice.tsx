import { useTranslation } from '@/i18n'
import type { AiError } from '@/lib/result'
import { AlertCard } from './Card'
import { Button, LinkButton } from './Button'

/** Plain-language AI error with one next step, never a code (PRD §7). */
export function AiNotice({ error, onRetry }: { error: AiError; onRetry?: () => void }) {
  const { t } = useTranslation()
  if (error.kind === 'aborted') return null
  const keyIssue = error.kind === 'no-key' || error.kind === 'invalid-key'
  return (
    <AlertCard
      tone={error.kind === 'no-key' ? 'info' : 'warn'}
      title={t(`ai.error.${error.kind}.title`)}
      actions={
        keyIssue ? (
          <LinkButton to="/settings#ai" variant="secondary" icon="key">
            {t('ai.addKey')}
          </LinkButton>
        ) : onRetry && error.kind !== 'offline' ? (
          <Button variant="secondary" icon="refresh" onClick={onRetry}>
            {t('common.tryAgain')}
          </Button>
        ) : undefined
      }
    >
      {t(`ai.error.${error.kind}.body`)}
    </AlertCard>
  )
}
