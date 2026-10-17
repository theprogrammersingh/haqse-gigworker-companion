import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useAiReady, useDocuments, useSchemes, useToday } from '@/hooks'
import { checkDocument, type DocumentState } from '@/lib/rules/expiry'
import type { DocumentType } from '@/lib/schemas'
import { DOCUMENT_TYPES } from '@/lib/schemas/enums'
import { formatDate } from '@/lib/utils/date'
import { localeFor } from '@/lib/utils/money'
import {
  AlertCard,
  Button,
  Icon,
  PageHeader,
  SectionTitle,
  Spinner,
  StatusPill,
  type Tone,
} from '@/ui'
import { DocumentEditor, type DocumentPrefill } from './components/DocumentEditor'
import { ScanSheet } from './components/ScanSheet'

const STATE_TONE: Record<DocumentState, Tone> = {
  ok: 'ok',
  expiring: 'warn',
  expired: 'bad',
  missing: 'info',
}
const STATE_ORDER: Record<DocumentState, number> = { expired: 0, expiring: 1, missing: 2, ok: 3 }

/** Document checklist with expiry tracking (FR-15, FR-18). */
export function KagazPage() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useSearchParams()
  const today = useToday()
  const docs = useDocuments()
  const schemes = useSchemes()
  const aiReady = useAiReady()
  const [editing, setEditing] = useState<{ type: DocumentType; prefill?: DocumentPrefill } | null>(
    null,
  )
  const [scan, setScan] = useState<'document' | 'form' | null>(null)

  // Deep link from Saathi: /kagaz?add=dl&expiry=2027-01-31 opens the editor pre-filled.
  const add = params.get('add')
  const expiryParam = params.get('expiry')
  const linked =
    add && (DOCUMENT_TYPES as readonly string[]).includes(add)
      ? {
          type: add as DocumentType,
          prefill: { have: true, ...(expiryParam ? { expiry: expiryParam } : {}) },
        }
      : null
  const editor = editing ?? linked
  const closeEditor = (): void => {
    setEditing(null)
    if (linked) setParams({}, { replace: true })
  }

  if (!docs) return <Spinner />
  const forScheme = schemes?.find((s) => s.id === params.get('for'))
  const byType = new Map(docs.map((d) => [d.id, d]))
  const checks = DOCUMENT_TYPES.map((type) => checkDocument(type, byType.get(type), today))
  const needed = new Set(forScheme?.documents ?? [])
  const sorted = [...checks].sort(
    (a, b) =>
      Number(needed.has(b.type)) - Number(needed.has(a.type)) ||
      STATE_ORDER[a.state] - STATE_ORDER[b.state],
  )
  const locale = localeFor(i18n.language)

  return (
    <>
      <PageHeader title={t('kagaz.title')} subtitle={t('kagaz.subtitle')} />
      {forScheme && (
        <AlertCard tone="info" title={t('kagaz.forScheme', { scheme: forScheme.name })}>
          {t('kagaz.forSchemeBody')}
        </AlertCard>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button icon="camera" onClick={() => setScan('document')} disabled={!aiReady}>
          {t('kagaz.scan')}
        </Button>
        <Button variant="secondary" icon="file" onClick={() => setScan('form')} disabled={!aiReady}>
          {t('kagaz.explainForm')}
        </Button>
      </div>
      {!aiReady && <p className="mt-2 text-sm text-muted">{t('kagaz.noAiHint')}</p>}

      <SectionTitle>{t('kagaz.checklist')}</SectionTitle>
      <ul className="space-y-2">
        {sorted.map((c) => (
          <li key={c.type}>
            <button
              type="button"
              onClick={() => setEditing({ type: c.type })}
              className="flex min-h-tap w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {t(`enum.doc.${c.type}`)}
                  {needed.has(c.type) && (
                    <span className="ml-2 text-sm font-normal text-muted">
                      ({t('kagaz.neededForScheme')})
                    </span>
                  )}
                </p>
                {c.record?.expiry && (
                  <p className="text-sm text-muted">
                    {t('kagaz.validTill', { date: formatDate(c.record.expiry, locale) })}
                    {c.daysLeft !== null &&
                      c.daysLeft >= 0 &&
                      ` · ${t('kagaz.daysLeft', { count: c.daysLeft })}`}
                  </p>
                )}
              </div>
              <StatusPill tone={STATE_TONE[c.state]}>{t(`kagaz.state.${c.state}`)}</StatusPill>
              <Icon name="chevron-right" />
            </button>
          </li>
        ))}
      </ul>

      {editor && (
        <DocumentEditor
          key={editor.type}
          type={editor.type}
          record={byType.get(editor.type)}
          {...(editor.prefill ? { prefill: editor.prefill } : {})}
          onClose={closeEditor}
        />
      )}
      {scan && (
        <ScanSheet
          mode={scan}
          onClose={() => setScan(null)}
          onRead={(type, prefill) => {
            setScan(null)
            setEditing({ type, prefill })
          }}
        />
      )}
    </>
  )
}
