import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteGrievance, putGrievance, setGrievanceStatus } from '@/lib/db'
import type { Grievance, GrievanceStatus } from '@/lib/schemas'
import { GRIEVANCE_STATUSES } from '@/lib/schemas/enums'
import { copyText, mailtoUrl, shareText, whatsappUrl } from '@/lib/utils/share'
import { toast } from '@/stores/toast'
import {
  Button,
  ChipGroup,
  EmptyState,
  LinkButton,
  PageHeader,
  ReadAloud,
  Spinner,
  Tabs,
} from '@/ui'

type Version = 'simple' | 'formal'

/** Review, edit and send a draft yourself; the app never sends anything (FR-21, FR-22). */
export function GrievancePage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const g = useLiveQuery(() => db.grievances.get(id).then((x) => x ?? null), [id])
  const [version, setVersion] = useState<Version>('formal')
  const [editing, setEditing] = useState<string | null>(null)

  if (g === undefined) return <Spinner />
  if (g === null)
    return (
      <EmptyState icon="file" title={t('shikayat.notFound')}>
        <LinkButton to="/shikayat">{t('shikayat.title')}</LinkButton>
      </EmptyState>
    )

  const text = version === 'formal' ? g.formalText : g.simpleText
  const full = version === 'formal' ? `Subject: ${g.subject}\n\n${g.formalText}` : g.simpleText

  const saveEdit = async (): Promise<void> => {
    if (editing === null) return
    await putGrievance({
      ...g,
      ...(version === 'formal' ? { formalText: editing } : { simpleText: editing }),
    })
    setEditing(null)
    toast(t('common.saved'), { tone: 'ok' })
  }

  const remove = async (): Promise<void> => {
    const copy: Grievance = { ...g }
    await deleteGrievance(g.id)
    navigate('/shikayat', { replace: true })
    toast(t('shikayat.deleted'), {
      action: { label: t('common.undo'), run: () => void putGrievance(copy) },
    })
  }

  return (
    <>
      <PageHeader title={g.subject} subtitle={t(`enum.target.${g.target}`)} />
      <Tabs
        label={t('shikayat.versions')}
        active={version}
        onChange={(v) => {
          setVersion(v)
          setEditing(null)
        }}
        tabs={[
          { id: 'formal', label: t('shikayat.formal') },
          { id: 'simple', label: t('shikayat.simple') },
        ]}
      >
        {editing !== null ? (
          <div className="space-y-2">
            <label htmlFor="draft-edit" className="font-semibold">
              {t('shikayat.editLabel')}
            </label>
            <textarea
              id="draft-edit"
              value={editing}
              onChange={(e) => setEditing(e.target.value)}
              rows={14}
              className="block w-full rounded-xl border-2 border-field bg-surface p-3 text-ink"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                {t('common.cancel')}
              </Button>
              <Button icon="check" onClick={() => void saveEdit()}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p
              lang={version === 'formal' ? 'en' : i18n.language}
              className="rounded-2xl border border-line bg-surface p-4 whitespace-pre-wrap"
            >
              {text}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" icon="pencil" onClick={() => setEditing(text)}>
                {t('common.edit')}
              </Button>
              <ReadAloud text={text} language={version === 'formal' ? 'en' : i18n.language} />
            </div>
          </div>
        )}
      </Tabs>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          icon="copy"
          onClick={async () =>
            toast((await copyText(full)) ? t('common.copied') : t('common.copyFailed'), {
              tone: 'ok',
            })
          }
        >
          {t('common.copy')}
        </Button>
        <Button
          variant="secondary"
          icon="share"
          onClick={async () => {
            const r = await shareText(full, g.subject)
            if (r === 'copied') toast(t('common.copied'), { tone: 'ok' })
          }}
        >
          {t('common.share')}
        </Button>
        <a
          href={mailtoUrl(g.subject, text)}
          className="inline-flex min-h-tap items-center justify-center gap-2 rounded-xl border-2 border-field bg-surface px-4 font-semibold text-ink"
        >
          {t('shikayat.email')}
        </a>
        <a
          href={whatsappUrl(full)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-tap items-center justify-center gap-2 rounded-xl border-2 border-field bg-surface px-4 font-semibold text-ink"
        >
          WhatsApp
          <span className="sr-only">({t('common.newTab')})</span>
        </a>
      </div>

      <div className="mt-6">
        <ChipGroup<GrievanceStatus>
          legend={t('shikayat.status')}
          value={g.status}
          onChange={(s) => void setGrievanceStatus(g.id, s)}
          options={GRIEVANCE_STATUSES.map((s) => ({ value: s, label: t(`enum.status.${s}`) }))}
        />
      </div>

      <div className="mt-6">
        <Button variant="ghost" icon="trash" onClick={() => void remove()}>
          {t('shikayat.delete')}
        </Button>
      </div>
      <p className="mt-4 text-sm text-muted">{t('common.disclaimer')}</p>
    </>
  )
}
