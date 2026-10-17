import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { deleteDocument, putDocument } from '@/lib/db'
import { EXPIRING_TYPES } from '@/lib/rules/expiry'
import type { DocumentRecord, DocumentType } from '@/lib/schemas'
import { toast } from '@/stores/toast'
import { Button, Sheet, Switch, TextField } from '@/ui'

export interface DocumentPrefill {
  have?: boolean
  expiry?: string
  holderName?: string
  notes?: string
}

interface DocumentEditorProps {
  type: DocumentType
  record: DocumentRecord | undefined
  prefill?: DocumentPrefill
  onClose: () => void
}

/** Manual entry/edit of one document. Stores status, expiry and optional name only; never ID numbers. */
export function DocumentEditor({ type, record, prefill, onClose }: DocumentEditorProps) {
  const { t } = useTranslation()
  const [have, setHave] = useState(prefill?.have ?? record?.have ?? true)
  const [expiry, setExpiry] = useState(prefill?.expiry ?? record?.expiry ?? '')
  const [holderName, setHolderName] = useState(prefill?.holderName ?? record?.holderName ?? '')
  const tracksExpiry = EXPIRING_TYPES.has(type)

  const save = async (): Promise<void> => {
    await putDocument({
      id: type,
      have,
      ...(have && tracksExpiry && expiry ? { expiry } : {}),
      ...(have && holderName.trim() ? { holderName: holderName.trim() } : {}),
      updatedAt: Date.now(),
    })
    toast(t('common.saved'), { tone: 'ok' })
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t(`enum.doc.${type}`)}
      footer={
        <div className="grid grid-cols-2 gap-2">
          {record ? (
            <Button
              variant="secondary"
              icon="trash"
              onClick={async () => {
                await deleteDocument(type)
                toast(t('kagaz.removed'), {
                  action: { label: t('common.undo'), run: () => void putDocument(record) },
                })
                onClose()
              }}
            >
              {t('common.remove')}
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          )}
          <Button icon="check" onClick={() => void save()}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {prefill?.notes && (
          <p className="rounded-xl bg-surface-2 p-3" aria-live="polite">
            {prefill.notes}
          </p>
        )}
        <Switch label={t('kagaz.iHaveIt')} checked={have} onChange={setHave} />
        {have && tracksExpiry && (
          <div className="space-y-1">
            <label htmlFor="doc-expiry" className="block font-semibold">
              {t('kagaz.expiry')}
            </label>
            <p id="doc-expiry-hint" className="text-sm text-muted">
              {t('kagaz.expiryHint')}
            </p>
            <input
              id="doc-expiry"
              type="date"
              value={expiry}
              aria-describedby="doc-expiry-hint"
              onChange={(e) => setExpiry(e.target.value)}
              className="block min-h-tap w-full rounded-xl border-2 border-field bg-surface px-3 text-ink"
            />
          </div>
        )}
        {have && (
          <TextField
            label={t('kagaz.holderName')}
            hint={t('kagaz.holderNameHint')}
            value={holderName}
            onValueChange={setHolderName}
            autoComplete="off"
          />
        )}
        <p className="text-sm text-muted">{t('kagaz.noNumbers')}</p>
      </div>
    </Sheet>
  )
}
