import { useTranslation } from '@/i18n'
import type { LedgerSummary } from '@/lib/rules/ledger'
import type { HourlyFloor } from '@/lib/rules/lowEarnings'
import { AlertCard, Stat, useMoney } from '@/ui'
import { earningsInsight } from '../logic/insights'

/** Take-home numbers and rule-based advice (FR-8). */
export function Insights({ summary, floor }: { summary: LedgerSummary; floor: HourlyFloor }) {
  const { t } = useTranslation()
  const money = useMoney()
  const insight = earningsInsight(summary, floor)
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-2">
        <Stat label={t('kamai.today')} value={money(summary.todayNet)} icon="wallet" />
        <Stat label={t('kamai.thisWeek')} value={money(summary.weekNet)} icon="clock" />
        <Stat label={t('kamai.perHour')} value={money(summary.netPerHour)} icon="trend" />
        <Stat
          label={t('kamai.costShare')}
          value={`${Math.round(summary.costShare * 100)}%`}
          icon="receipt"
        />
      </dl>
      {insight.advice.includes('below-floor') && (
        <AlertCard tone="warn" title={t('kamai.belowFloorTitle', { floor: money(floor.value) })}>
          {t(`kamai.floorSource.${floor.source}`)} {t('kamai.belowFloorBody')}
        </AlertCard>
      )}
      {insight.advice.includes('cost-share-high') && (
        <AlertCard
          tone="info"
          title={t('kamai.costHighTitle', { pct: Math.round(summary.costShare * 100) })}
        >
          {t('kamai.costHighBody')}
        </AlertCard>
      )}
      {insight.bestPlatform && (
        <AlertCard
          tone="ok"
          icon="trend"
          title={t('kamai.bestPlatform', { platform: t(`enum.platform.${insight.bestPlatform}`) })}
        >
          {t('kamai.bestPlatformBody')}
        </AlertCard>
      )}
    </div>
  )
}
