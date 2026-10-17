import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useHour, useIncidents, useProfile } from '@/hooks'
import { shiftContext } from '@/lib/rules/shift'
import { useSession } from '@/stores/session'
import { toast } from '@/stores/toast'
import { Button, EmptyState, PageHeader, SectionTitle, Spinner } from '@/ui'
import { IncidentForm } from './components/IncidentForm'
import { IncidentList } from './components/IncidentList'
import { SafetyTips } from './components/SafetyTips'
import { SosButton } from './components/SosButton'
import type { Condition } from '@/lib/rules/shift'

export function SurakshaPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const profile = useProfile()
  const incidents = useIncidents()
  const weather = useSession((s) => s.weather)
  const hour = useHour()
  const [reporting, setReporting] = useState(false)
  const [justSaved, setJustSaved] = useState<string | null>(null)
  if (!profile || !incidents) return <Spinner />

  const shift = shiftContext(hour, weather)
  const forced = params.get('tips') as Condition | null
  const conditions =
    forced && forced !== ('general' as string) && !shift.conditions.includes(forced)
      ? [...shift.conditions, forced]
      : shift.conditions

  return (
    <>
      <PageHeader title={t('suraksha.title')} subtitle={t('suraksha.subtitle')} />
      <SosButton
        prominent={shift.sosProminent}
        startConfirming={params.get('sos') === '1'}
        onSettled={() => params.has('sos') && setParams({}, { replace: true })}
      />

      <SectionTitle>{t('suraksha.tips')}</SectionTitle>
      <SafetyTips conditions={conditions} vehicle={profile.vehicle} />

      <SectionTitle>{t('suraksha.incidents')}</SectionTitle>
      <Button block variant="secondary" icon="plus" onClick={() => setReporting(true)}>
        {t('suraksha.report')}
      </Button>
      <div className="mt-3">
        {incidents.length === 0 ? (
          <EmptyState icon="shield" title={t('suraksha.noIncidents')} />
        ) : (
          <IncidentList incidents={incidents} highlightId={justSaved} />
        )}
      </div>

      {reporting && (
        <IncidentForm
          onClose={() => setReporting(false)}
          onSaved={(id) => {
            setReporting(false)
            setJustSaved(id)
            toast(t('suraksha.incidentSaved'), { tone: 'ok' })
          }}
        />
      )}
    </>
  )
}
