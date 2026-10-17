import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { useNavigate, useSearchParams } from 'react-router'
import { useAiReady, useAiTask, useEarnings, useIncidents, useToday } from '@/hooks'
import { draftGrievance } from '@/lib/ai/tasks/draftGrievance'
import { linkIncident, putGrievance } from '@/lib/db'
import type { GrievanceEvidence, GrievanceRequest, GrievanceTarget, Language } from '@/lib/schemas'
import { GRIEVANCE_TARGETS } from '@/lib/schemas/enums'
import { formatDate } from '@/lib/utils/date'
import { newId } from '@/lib/utils/id'
import { localeFor } from '@/lib/utils/money'
import { AiNotice, Button, ChipGroup, PageHeader, Spinner, TextArea, type IconName } from '@/ui'
import { EvidenceSummary } from './components/EvidenceSummary'
import { anomalyEvidence, defaultTarget, evidenceIds, incidentEvidence } from './logic/evidence'
import { fillTemplate } from './logic/template'

const TARGET_ICONS: Record<GrievanceTarget, IconName> = {
  platform: 'wallet',
  insurer: 'shield',
  labour: 'scale',
  police: 'alert',
}

/** Builds the evidence from route params by re-reading local data (FR-20). */
function useEvidence(): GrievanceEvidence | null | undefined {
  const [params] = useSearchParams()
  const today = useToday()
  const entries = useEarnings(today)
  const incidents = useIncidents()
  const from = params.get('from')
  if (from === 'anomaly') {
    if (!entries) return undefined
    return anomalyEvidence(params.get('entry') ?? '', entries)
  }
  if (from === 'incident') {
    if (!incidents) return undefined
    const inc = incidents.find((i) => i.id === params.get('id'))
    return inc ? incidentEvidence(inc) : null
  }
  return { kind: 'general', note: params.get('note') ?? '' }
}

export function NewGrievancePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const evidence = useEvidence()
  const aiReady = useAiReady()
  const lang = i18n.language as Language
  const [target, setTarget] = useState<GrievanceTarget | undefined>(
    (GRIEVANCE_TARGETS as readonly string[]).includes(params.get('target') ?? '')
      ? (params.get('target') as GrievanceTarget)
      : undefined,
  )
  const [note, setNote] = useState(params.get('from') ? '' : (params.get('note') ?? ''))
  const draft = useAiTask(
    (config, signal, req: GrievanceRequest) => draftGrievance(config, req, lang, signal),
    'draft',
  )

  if (evidence === undefined) return <Spinner />
  const ev: GrievanceEvidence = evidence ?? { kind: 'general', note: '' }
  const chosen = target ?? defaultTarget(ev)

  /** Simple version without AI: a short summary in the user's language. */
  const simpleFallback = (): string => {
    if (ev.kind === 'anomaly' && ev.days[0])
      return t('shikayat.simpleAnomaly', {
        date: formatDate(ev.days[0].date, localeFor(lang)),
        paid: ev.days[0].paid,
        expected: ev.days[0].expected,
      })
    if (ev.kind === 'incident')
      return t('shikayat.simpleIncident', { type: t(`enum.incident.${ev.type}`) })
    return t('shikayat.simpleGeneral')
  }

  const create = async (useAi: boolean): Promise<void> => {
    const request: GrievanceRequest = {
      target: chosen,
      evidence: ev.kind === 'general' ? { kind: 'general', note } : ev,
      ...(ev.kind !== 'general' && note.trim() ? { note } : {}),
    }
    let subject: string
    let simpleText: string
    let formalText: string
    const res = useAi ? await draft.run(request) : null
    if (res?.ok) {
      ;({ subject, simple: simpleText, formal: formalText } = res.value)
    } else {
      if (res && !res.ok) return
      const tpl = fillTemplate(request)
      subject = tpl.subject
      formalText = tpl.formal
      simpleText = simpleFallback()
    }
    const id = newId()
    await putGrievance({
      id,
      target: chosen,
      subject,
      simpleText,
      formalText,
      evidenceIds: evidenceIds(request.evidence),
      status: 'draft',
      createdAt: Date.now(),
    })
    if (ev.kind === 'incident') await linkIncident(ev.incidentId, id)
    navigate(`/shikayat/${id}`, { replace: true })
  }

  const busy = draft.state.status === 'loading'

  return (
    <>
      <PageHeader title={t('shikayat.newTitle')} subtitle={t('shikayat.newSubtitle')} />
      <div className="space-y-5">
        {evidence === null && <p className="text-muted">{t('shikayat.evidenceMissing')}</p>}
        <EvidenceSummary evidence={ev} />
        <ChipGroup
          legend={t('shikayat.target')}
          value={chosen}
          onChange={setTarget}
          options={GRIEVANCE_TARGETS.map((v) => ({
            value: v,
            label: t(`enum.target.${v}`),
            icon: TARGET_ICONS[v],
          }))}
        />
        <TextArea
          label={ev.kind === 'general' ? t('shikayat.whatHappened') : t('shikayat.addDetails')}
          hint={t('shikayat.noIds')}
          value={note}
          onValueChange={setNote}
          voice
          rows={3}
        />
        {busy && <Spinner label={t('shikayat.drafting')} />}
        {draft.state.status === 'error' && (
          <>
            <AiNotice error={draft.state.error} onRetry={() => void create(true)} />
            <Button variant="secondary" block icon="pencil" onClick={() => void create(false)}>
              {t('shikayat.useTemplate')}
            </Button>
          </>
        )}
        {draft.state.status !== 'error' && (
          <Button
            block
            icon={aiReady ? 'sparkles' : 'pencil'}
            disabled={busy || (ev.kind === 'general' && !note.trim())}
            onClick={() => void create(aiReady)}
          >
            {aiReady ? t('shikayat.createAi') : t('shikayat.createTemplate')}
          </Button>
        )}
        <p className="text-sm text-muted">{t('shikayat.neverSent')}</p>
      </div>
    </>
  )
}
