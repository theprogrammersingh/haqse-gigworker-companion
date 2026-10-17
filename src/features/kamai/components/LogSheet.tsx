import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/i18n'
import { useNavigate } from 'react-router'
import { useAiReady, useAiTask, useProfile, useToday } from '@/hooks'
import { parseEarnings, type EarningInput, type ParsedResult } from '@/lib/ai/tasks/parseEarnings'
import { addEarnings, earningsSince } from '@/lib/db'
import type { EarningDraft } from '@/lib/parse/localEarningParser'
import { checkAnomaly } from '@/lib/rules/anomaly'
import type { EarningSource, Language } from '@/lib/schemas'
import { canRecord, startRecording, type Recording } from '@/lib/utils/audio'
import { newId } from '@/lib/utils/id'
import { prepareImage } from '@/lib/utils/image'
import { toast } from '@/stores/toast'
import { AiNotice, Button, Icon, Sheet, Spinner, Tabs, TextArea } from '@/ui'
import { blankDraft, draftErrors, toEarning } from '../logic/entries'
import { DraftEditor } from './DraftEditor'

type Mode = 'voice' | 'text' | 'photo' | 'manual'

interface LogSheetProps {
  open: boolean
  onClose: () => void
  initialText?: string | null
}

/** Log by voice, text, payout screenshot or manual form; always confirm before saving (FR-6, FR-7). */
export function LogSheet({ open, onClose, initialText }: LogSheetProps) {
  const { t, i18n } = useTranslation()
  const today = useToday()
  const profile = useProfile()
  const navigate = useNavigate()
  const aiReady = useAiReady()
  const [mode, setMode] = useState<Mode>(initialText ? 'text' : 'voice')
  const [text, setText] = useState(initialText ?? '')
  const [drafts, setDrafts] = useState<EarningDraft[] | null>(null)
  const [source, setSource] = useState<EarningSource>('manual')
  const [via, setVia] = useState<ParsedResult['via'] | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [recording, setRecording] = useState<Recording | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const parse = useAiTask(
    (config, signal, input: EarningInput) =>
      parseEarnings(config, input, today, i18n.language as Language, signal),
    'parse',
  )

  useEffect(() => () => recording?.cancel(), [recording])

  const defaultPlatform = profile?.platforms[0] ?? 'other'

  const runParse = async (input: EarningInput, src: EarningSource): Promise<void> => {
    const res = await parse.run(input)
    if (res.ok) {
      setDrafts(res.value.drafts)
      setVia(res.value.via)
      setSource(src)
    }
  }

  const toggleRecording = async (): Promise<void> => {
    if (recording) {
      setRecording(null)
      const audio = await recording.stop()
      await runParse({ kind: 'audio', ...audio }, 'voice')
      return
    }
    try {
      setRecording(await startRecording())
    } catch {
      toast(t('kamai.micDenied'), { tone: 'warn' })
    }
  }

  const onPhoto = async (file: File | undefined): Promise<void> => {
    if (!file) return
    const image = await prepareImage(file)
    await runParse({ kind: 'image', ...image }, 'image')
  }

  const save = async (): Promise<void> => {
    if (!drafts) return
    if (drafts.some((d) => draftErrors(d, today).length)) {
      setShowErrors(true)
      return
    }
    const now = Date.now()
    const entries = drafts.map((d) => toEarning(d, source, newId(), now))
    await addEarnings(entries)
    const history = await earningsSince(today)
    const flagged = entries.map((e) => checkAnomaly(e, history)).find(Boolean)
    onClose()
    if (flagged) {
      toast(t('kamai.lowPayoutToast'), {
        tone: 'warn',
        action: {
          label: t('kamai.draftComplaint'),
          run: () => navigate(`/shikayat/new?from=anomaly&entry=${flagged.entryId}`),
        },
        ms: 10_000,
      })
    } else toast(t('kamai.saved', { count: entries.length }), { tone: 'ok' })
  }

  const busy = parse.state.status === 'loading'

  if (drafts) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        title={t('kamai.confirmTitle')}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon="chevron-left" onClick={() => setDrafts(null)}>
              {t('common.back')}
            </Button>
            <Button icon="check" onClick={save}>
              {t('common.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-muted">
            {via === 'local'
              ? t('kamai.parsedLocal')
              : via === 'ai'
                ? t('kamai.parsedAi')
                : t('kamai.manualHint')}
          </p>
          {drafts.map((d, i) => (
            <DraftEditor
              key={i}
              index={i}
              draft={d}
              today={today}
              errors={showErrors ? draftErrors(d, today) : []}
              onChange={(nd) => setDrafts(drafts.map((x, j) => (j === i ? nd : x)))}
            />
          ))}
          <Button
            variant="ghost"
            icon="plus"
            onClick={() => setDrafts([...drafts, blankDraft(today, defaultPlatform)])}
          >
            {t('kamai.addAnother')}
          </Button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('kamai.logTitle')}>
      <Tabs
        label={t('kamai.logHow')}
        active={mode}
        onChange={(m) => {
          setMode(m)
          parse.reset()
          if (m === 'manual') {
            setSource('manual')
            setVia(null)
            setDrafts([blankDraft(today, defaultPlatform)])
          }
        }}
        tabs={[
          { id: 'voice', label: t('kamai.modes.voice'), icon: 'mic' },
          { id: 'text', label: t('kamai.modes.text'), icon: 'keyboard' },
          { id: 'photo', label: t('kamai.modes.photo'), icon: 'image' },
          { id: 'manual', label: t('kamai.modes.manual'), icon: 'pencil' },
        ]}
      >
        <div className="space-y-4">
          {mode === 'voice' &&
            (aiReady && canRecord() ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <p className="text-muted">{t('kamai.voiceHint')}</p>
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={busy}
                  aria-pressed={!!recording}
                  className={`grid size-28 place-items-center rounded-full text-brand-ink shadow-lg ${recording ? 'bg-bad' : 'bg-brand'}`}
                >
                  <Icon name={recording ? 'stop' : 'mic'} size={44} />
                  <span className="sr-only">
                    {recording ? t('kamai.stopRecording') : t('kamai.startRecording')}
                  </span>
                </button>
                <p aria-live="polite" className="font-semibold">
                  {recording ? t('kamai.listening') : t('kamai.tapToSpeak')}
                </p>
              </div>
            ) : (
              <>
                <p className="text-muted">{t('kamai.voiceFallbackHint')}</p>
                <TextArea
                  label={t('kamai.saySomething')}
                  value={text}
                  onValueChange={setText}
                  voice
                  rows={3}
                />
                <Button
                  block
                  icon="check"
                  disabled={!text.trim() || busy}
                  onClick={() => runParse({ kind: 'text', text }, 'voice')}
                >
                  {t('kamai.read')}
                </Button>
              </>
            ))}

          {mode === 'text' && (
            <>
              <TextArea
                label={t('kamai.typeHere')}
                hint={t('kamai.textExample')}
                value={text}
                onValueChange={setText}
                voice
                rows={3}
              />
              <Button
                block
                icon="check"
                disabled={!text.trim() || busy}
                onClick={() => runParse({ kind: 'text', text }, 'text')}
              >
                {t('kamai.read')}
              </Button>
            </>
          )}

          {mode === 'photo' && (
            <>
              <p className="text-muted">{t('kamai.photoHint')}</p>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  void onPhoto(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              <Button
                block
                icon="image"
                disabled={busy || !aiReady}
                onClick={() => fileInput.current?.click()}
              >
                {t('kamai.choosePhoto')}
              </Button>
              {!aiReady && <AiNotice error={{ kind: 'no-key', message: '' }} />}
            </>
          )}

          {busy && <Spinner label={t('kamai.reading')} />}
          {parse.state.status === 'error' && (
            <>
              <AiNotice error={parse.state.error} />
              {parse.state.error.kind === 'bad-output' && <p>{t('kamai.couldNotRead')}</p>}
              <Button
                variant="secondary"
                block
                icon="pencil"
                onClick={() => {
                  setSource('manual')
                  setVia(null)
                  setDrafts([blankDraft(today, defaultPlatform)])
                }}
              >
                {t('kamai.enterManually')}
              </Button>
            </>
          )}
        </div>
      </Tabs>
    </Sheet>
  )
}
