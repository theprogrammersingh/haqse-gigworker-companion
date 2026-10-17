import { useTranslation } from '@/i18n'
import { useAiReady, useAiTask, currentContext, useToday } from '@/hooks'
import { weeklySummary } from '@/lib/ai/tasks/explain'
import type { Language } from '@/lib/schemas'
import { isoWeekKey } from '@/lib/utils/date'
import { AiNotice, Button, Card, ReadAloud, Spinner } from '@/ui'

/** Weekly summary in the user's language, cached per ISO week (FR-10). */
export function WeeklySummary() {
  const { t, i18n } = useTranslation()
  const today = useToday()
  const ready = useAiReady()
  const lang = i18n.language as Language
  const task = useAiTask(async (config, signal) =>
    weeklySummary(config, await currentContext('kamai'), isoWeekKey(today), lang, signal),
  )
  const s = task.state
  return (
    <Card className="space-y-3" aria-labelledby="weekly-title">
      <h2 id="weekly-title" className="text-lg font-bold">
        {t('kamai.weeklyTitle')}
      </h2>
      {s.status === 'idle' && (
        <>
          <p className="text-muted">{ready ? t('kamai.weeklyHint') : t('kamai.weeklyNoAi')}</p>
          <Button
            variant="secondary"
            icon="sparkles"
            disabled={!ready}
            onClick={() => void task.run()}
          >
            {t('kamai.weeklyButton')}
          </Button>
        </>
      )}
      {s.status === 'loading' && <Spinner label={t('common.thinking')} />}
      {s.status === 'error' && <AiNotice error={s.error} onRetry={() => void task.run()} />}
      {s.status === 'done' && (
        <div aria-live="polite" className="space-y-2">
          <p className="whitespace-pre-line">{s.value}</p>
          <ReadAloud text={s.value} />
        </div>
      )}
    </Card>
  )
}
