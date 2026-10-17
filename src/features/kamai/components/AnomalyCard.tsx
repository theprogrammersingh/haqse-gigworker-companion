import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { dismissAnomaly } from '@/lib/db'
import type { Anomaly } from '@/lib/rules/anomaly'
import { formatDate } from '@/lib/utils/date'
import { localeFor } from '@/lib/utils/money'
import { AlertCard, Button, useMoney } from '@/ui'

/** Payout-drop card with the handoff into Shikayat (flow 1). */
export function AnomalyCard({ anomaly, compact }: { anomaly: Anomaly; compact?: boolean }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const money = useMoney()
  return (
    <AlertCard
      tone="warn"
      icon="trend-down"
      title={t('kamai.anomalyTitle', {
        platform: t(`enum.platform.${anomaly.platform}`),
        date: formatDate(anomaly.date, localeFor(i18n.language)),
      })}
      actions={
        <>
          <Button
            icon="megaphone"
            onClick={() => navigate(`/shikayat/new?from=anomaly&entry=${anomaly.entryId}`)}
          >
            {t('kamai.draftComplaint')}
          </Button>
          {!compact && (
            <Button variant="ghost" onClick={() => void dismissAnomaly(anomaly.entryId)}>
              {t('common.dismiss')}
            </Button>
          )}
        </>
      }
    >
      <p>
        {t('kamai.anomalyBody', {
          paid: money(anomaly.actualPayout),
          expected: money(anomaly.expectedPayout),
          hours: anomaly.hours,
          pct: Math.round(anomaly.ratio * 100),
        })}
      </p>
    </AlertCard>
  )
}
