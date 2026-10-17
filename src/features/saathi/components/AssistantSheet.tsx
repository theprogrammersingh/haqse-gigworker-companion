import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  currentContext,
  useAiReady,
  useAiTask,
  useDocuments,
  useIncidents,
  useLedger,
  useSchemes,
} from '@/hooks'
import { askAssistant, type ToolCall } from '@/lib/ai/tasks/assistant'
import { expiryStatus } from '@/lib/rules/expiry'
import type { Language } from '@/lib/schemas'
import { LANGUAGES } from '@/lib/schemas/enums'
import { formatDate } from '@/lib/utils/date'
import { formatINR, localeFor } from '@/lib/utils/money'
import { useSession } from '@/stores/session'
import { AiNotice, Button, cx, ReadAloud, SelectField, Sheet, Spinner, TextField } from '@/ui'
import { toAction } from '../logic/actions'
import { matchIntent } from '../logic/localIntent'
import { ToolConfirm } from './ToolConfirm'

interface Turn {
  id: number
  role: 'user' | 'saathi'
  text: string
  lang: Language
  tool?: ToolCall | null
}

const LANG_NAMES: Record<Language, string> = { en: 'English', hi: 'हिंदी', pa: 'ਪੰਜਾਬੀ' }
let turnId = 0

/** Global assistant: answers from local context, proposes app actions that need confirmation (FR-26..28). */
export function AssistantSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const ready = useAiReady()
  const screen = useSession((s) => s.screen)
  const setPendingLogText = useSession((s) => s.setPendingLogText)
  const ledger = useLedger()
  const docs = useDocuments()
  const incidents = useIncidents()
  const schemes = useSchemes()
  const [replyLang, setReplyLang] = useState<Language>(i18n.language as Language)
  const [input, setInput] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const schemeIds = schemes?.map((s) => s.id) ?? []

  const task = useAiTask(async (config, signal, utterance: string) => {
    const grounding = {
      schemes: schemes?.map((s) => ({
        id: s.id,
        name: s.name,
        summary: s.summary.en,
        helpline: s.helpline,
        url: s.url,
      })),
      documents: docs?.map((d) => ({ type: d.id, have: d.have, expiry: d.expiry ?? null })),
    }
    return askAssistant(
      config,
      {
        utterance,
        context: await currentContext(screen),
        grounding,
        schemeIds,
        language: replyLang,
      },
      signal,
    )
  })

  const say = (text: string, tool: ToolCall | null = null): void =>
    setTurns((ts) => [...ts, { id: ++turnId, role: 'saathi', text, lang: replyLang, tool }])

  /** Rule-based reply used without a key, offline, or when AI fails. */
  const answerLocally = (utterance: string): void => {
    const today = ledger?.today ?? ''
    const intent = matchIntent(utterance, today)
    if (intent.kind === 'tool')
      return say(t(`saathi.propose.${intent.call.name}`, { lng: replyLang }), intent.call)
    if (intent.kind === 'doc-expiry') {
      const doc = docs?.find((d) => d.id === intent.type)
      const name = t(`enum.doc.${intent.type}`, { lng: replyLang })
      if (!doc?.expiry)
        return say(t('saathi.docUnknown', { doc: name, lng: replyLang }), {
          name: 'addDocument',
          args: { type: intent.type },
        })
      const { daysLeft } = expiryStatus(doc.expiry, today)
      return say(
        t((daysLeft ?? 0) < 0 ? 'saathi.docExpired' : 'saathi.docValid', {
          doc: name,
          date: formatDate(doc.expiry, localeFor(replyLang)),
          count: Math.abs(daysLeft ?? 0),
          lng: replyLang,
        }),
      )
    }
    if (intent.kind === 'earnings-summary' && ledger) {
      const money = (n: number): string => formatINR(n, localeFor(replyLang))
      return say(
        t('saathi.earnings', {
          week: money(ledger.summary.weekNet),
          perHour: money(ledger.summary.netPerHour),
          lng: replyLang,
        }),
      )
    }
    say(t('saathi.help', { lng: replyLang }))
  }

  const send = async (utterance: string): Promise<void> => {
    const text = utterance.trim()
    if (!text) return
    setInput('')
    setTurns((ts) => [...ts, { id: ++turnId, role: 'user', text, lang: replyLang }])
    if (!ready) return answerLocally(text)
    const res = await task.run(text)
    if (!res.ok) {
      if (res.error.kind !== 'aborted') answerLocally(text)
      return
    }
    say(
      res.value.text ||
        (res.value.tool
          ? t(`saathi.propose.${res.value.tool.name}`, { lng: replyLang })
          : t('saathi.help', { lng: replyLang })),
      res.value.tool,
    )
  }

  const execute = (call: ToolCall): void => {
    const action = toAction(call, {
      anomalies: ledger?.anomalies ?? [],
      incidents: incidents ?? [],
      schemeIds,
    })
    onClose()
    if (action.kind === 'log') {
      setPendingLogText(action.text)
      navigate('/kamai')
    } else navigate(action.to)
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('saathi.title')}>
      <div className="space-y-4">
        <SelectField
          label={t('saathi.replyIn')}
          value={replyLang}
          onValueChange={setReplyLang}
          options={LANGUAGES.map((l) => ({ value: l, label: LANG_NAMES[l] }))}
        />
        {!ready && <p className="text-sm text-muted">{t('saathi.offlineMode')}</p>}

        <ol aria-live="polite" className="space-y-3">
          {turns.length === 0 && (
            <li className="rounded-2xl bg-surface-2 p-3">{t('saathi.intro')}</li>
          )}
          {turns.map((turn) => (
            <li
              key={turn.id}
              lang={turn.lang}
              className={cx(
                'rounded-2xl p-3',
                turn.role === 'user' ? 'ml-8 bg-brand-soft' : 'mr-4 border border-line bg-surface',
              )}
            >
              <p className="sr-only">
                {turn.role === 'user' ? t('saathi.you') : t('saathi.title')}:
              </p>
              <p className="whitespace-pre-line">{turn.text}</p>
              {turn.role === 'saathi' && (
                <>
                  <ReadAloud text={turn.text} language={turn.lang} />
                  {turn.tool && (
                    <ToolConfirm
                      call={turn.tool}
                      onConfirm={() => execute(turn.tool as ToolCall)}
                    />
                  )}
                </>
              )}
            </li>
          ))}
        </ol>

        {task.state.status === 'loading' && <Spinner label={t('common.thinking')} />}
        {task.state.status === 'error' &&
          task.state.error.kind !== 'rate-limit' &&
          task.state.error.kind !== 'offline' && <AiNotice error={task.state.error} />}

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            void send(input)
          }}
        >
          <TextField
            label={t('saathi.ask')}
            hint={t('saathi.examples')}
            value={input}
            onValueChange={setInput}
            voice
          />
          <Button
            type="submit"
            block
            icon="send"
            disabled={!input.trim() || task.state.status === 'loading'}
          >
            {t('common.send')}
          </Button>
        </form>
      </div>
    </Sheet>
  )
}
