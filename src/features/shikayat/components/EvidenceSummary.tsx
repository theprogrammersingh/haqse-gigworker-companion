import { useTranslation } from 'react-i18next'
import type { GrievanceEvidence } from '@/lib/schemas'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { localeFor } from '@/lib/utils/money'
import { Card, Icon, useMoney } from '@/ui'

/** Shows exactly which facts will go into the draft. */
export function EvidenceSummary({ evidence }: { evidence: GrievanceEvidence }) {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const locale = localeFor(i18n.language)
  return (
    <Card className="space-y-1 bg-surface-2">
      <h2 className="flex items-center gap-2 font-bold">
        <Icon name="receipt" />
        {t('shikayat.evidence')}
      </h2>
      {evidence.kind === 'anomaly' &&
        evidence.days.map((d) => (
          <p key={d.date}>
            {t('shikayat.evidenceAnomaly', {
              platform: t(`enum.platform.${evidence.platform}`),
              date: formatDate(d.date, locale),
              hours: d.hours,
              paid: money(d.paid),
              expected: money(d.expected),
            })}
          </p>
        ))}
      {evidence.kind === 'incident' && (
        <>
          <p className="font-semibold">
            {t(`enum.incident.${evidence.type}`)} · {formatDateTime(evidence.datetime, locale)}
          </p>
          {evidence.locationLabel && <p>{evidence.locationLabel}</p>}
          {evidence.notes && <p className="text-muted">{evidence.notes}</p>}
        </>
      )}
      {evidence.kind === 'general' && <p className="text-muted">{t('shikayat.evidenceGeneral')}</p>}
    </Card>
  )
}
