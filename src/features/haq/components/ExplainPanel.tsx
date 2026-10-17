import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { currentContext, useAiReady, useAiTask } from '@/hooks'
import { explain } from '@/lib/ai/tasks/explain'
import type { Language, Scheme } from '@/lib/schemas'
import { AiNotice, Button, Card, ReadAloud, Spinner, TextField } from '@/ui'

/** Grounded Q&A over a single scheme's bundled data (FR-13). */
export function ExplainPanel({ scheme }: { scheme: Scheme }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language
  const ready = useAiReady()
  const [question, setQuestion] = useState('')
  const task = useAiTask(async (config, signal, q: string) =>
    explain(
      config,
      { question: q, grounding: scheme, context: await currentContext('haq'), language: lang },
      signal,
    ),
  )
  const ask = (q: string): void => void task.run(q)
  const s = task.state

  return (
    <Card className="space-y-3" aria-labelledby="explain-title">
      <h2 id="explain-title" className="text-lg font-bold">
        {t('haq.askTitle')}
      </h2>
      {!ready ? (
        <p className="text-muted">{t('haq.askNoAi')}</p>
      ) : (
        <>
          <Button
            variant="secondary"
            icon="sparkles"
            onClick={() => ask(t('haq.explainPrompt'))}
            disabled={s.status === 'loading'}
          >
            {t('haq.explainSimply')}
          </Button>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (question.trim()) ask(question)
            }}
          >
            <TextField
              label={t('haq.yourQuestion')}
              value={question}
              onValueChange={setQuestion}
              voice
            />
            <Button type="submit" icon="send" disabled={!question.trim() || s.status === 'loading'}>
              {t('common.ask')}
            </Button>
          </form>
        </>
      )}
      {s.status === 'loading' && <Spinner label={t('common.thinking')} />}
      {s.status === 'error' && <AiNotice error={s.error} />}
      {s.status === 'done' && (
        <div aria-live="polite" className="space-y-2 rounded-xl bg-surface-2 p-3">
          <p className="whitespace-pre-line">{s.value}</p>
          <p className="text-sm">
            {t('haq.source')}:{' '}
            <a
              href={scheme.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand underline"
            >
              {new URL(scheme.url).hostname}
            </a>
          </p>
          <ReadAloud text={s.value} />
        </div>
      )}
    </Card>
  )
}
