import { useRef, useState } from 'react'
import { useTranslation } from '@/i18n'
import { useAiTask } from '@/hooks'
import { explainForm, readDocument } from '@/lib/ai/tasks/readDocument'
import type { DocumentType, Language } from '@/lib/schemas'
import { prepareImage, type InlineImage } from '@/lib/utils/image'
import { AiNotice, AlertCard, Button, ReadAloud, Sheet, Spinner } from '@/ui'
import type { DocumentPrefill } from './DocumentEditor'

interface ScanSheetProps {
  mode: 'document' | 'form'
  onClose: () => void
  onRead: (type: DocumentType, prefill: DocumentPrefill) => void
}

/**
 * Photo → in-memory downscale → Gemini. The image is never stored: it lives in a
 * local variable for the duration of one request and is then dropped (FR-16, FR-17).
 */
export function ScanSheet({ mode, onClose, onRead }: ScanSheetProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language
  const input = useRef<HTMLInputElement>(null)
  const [unknownType, setUnknownType] = useState(false)
  const read = useAiTask(
    (config, signal, img: InlineImage) => readDocument(config, img, lang, signal),
    'parse',
  )
  const explain = useAiTask((config, signal, img: InlineImage) =>
    explainForm(config, img, lang, signal),
  )

  const onFile = async (file: File | undefined): Promise<void> => {
    if (!file) return
    setUnknownType(false)
    const image = await prepareImage(file)
    if (mode === 'form') {
      await explain.run(image)
      return
    }
    const res = await read.run(image)
    if (!res.ok) return
    const v = res.value
    if (v.type === 'unknown') {
      setUnknownType(true)
      return
    }
    onRead(v.type, {
      have: true,
      ...(v.expiry ? { expiry: v.expiry } : {}),
      ...(v.holderName ? { holderName: v.holderName } : {}),
      ...(v.notes ? { notes: v.notes } : {}),
    })
  }

  const state = mode === 'form' ? explain.state : read.state

  return (
    <Sheet
      open
      onClose={onClose}
      title={mode === 'form' ? t('kagaz.formTitle') : t('kagaz.scanTitle')}
    >
      <div className="space-y-4">
        <AlertCard tone="warn" title={t('kagaz.maskTitle')}>
          {t('kagaz.maskBody')}
        </AlertCard>
        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <Button
          block
          icon="camera"
          disabled={state.status === 'loading'}
          onClick={() => input.current?.click()}
        >
          {t('kagaz.takePhoto')}
        </Button>
        <p className="text-sm text-muted">{t('kagaz.notStored')}</p>
        {state.status === 'loading' && <Spinner label={t('kamai.reading')} />}
        {state.status === 'error' && <AiNotice error={state.error} />}
        {unknownType && <p role="alert">{t('kagaz.unknownType')}</p>}
        {mode === 'form' && explain.state.status === 'done' && (
          <div aria-live="polite" className="space-y-2 rounded-xl bg-surface-2 p-3">
            <p className="whitespace-pre-line">{explain.state.value}</p>
            <ReadAloud text={explain.state.value} />
          </div>
        )}
      </div>
    </Sheet>
  )
}
