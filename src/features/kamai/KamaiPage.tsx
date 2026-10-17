import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLedger, useProfile } from '@/hooks'
import { hourlyFloor } from '@/lib/rules/lowEarnings'
import { useSession } from '@/stores/session'
import { Button, Card, EmptyState, PageHeader, SectionTitle, Spinner, TrendChart } from '@/ui'
import { AnomalyCard } from './components/AnomalyCard'
import { EntryList } from './components/EntryList'
import { Insights } from './components/Insights'
import { LogSheet } from './components/LogSheet'
import { PlatformTable } from './components/PlatformTable'
import { WeeklySummary } from './components/WeeklySummary'

export function KamaiPage() {
  const { t } = useTranslation()
  const ledger = useLedger()
  const profile = useProfile()
  const { pendingLogText, setPendingLogText } = useSession()
  const [logOpen, setLogOpen] = useState(false)
  // Home and Saathi open the log by setting pendingLogText (possibly ''), so the sheet is derived from it.
  const sheetOpen = logOpen || pendingLogText !== null

  if (!ledger || !profile) return <Spinner />
  const { summary, anomalies, entries } = ledger
  const flagged = new Set(anomalies.map((a) => a.date))

  return (
    <>
      <PageHeader title={t('kamai.title')} subtitle={t('kamai.subtitle')} />
      <Button block icon="plus" onClick={() => setLogOpen(true)} className="text-lg">
        {t('kamai.log')}
      </Button>

      {summary.entryCount === 0 ? (
        <div className="mt-6">
          <EmptyState icon="wallet" title={t('kamai.empty')}>
            <p className="text-muted">{t('kamai.emptyHint')}</p>
          </EmptyState>
        </div>
      ) : (
        <>
          {anomalies.length > 0 && (
            <section aria-labelledby="anomalies" className="space-y-3">
              <SectionTitle id="anomalies">{t('kamai.anomalies')}</SectionTitle>
              {anomalies.map((a) => (
                <AnomalyCard key={a.entryId} anomaly={a} />
              ))}
            </section>
          )}

          <SectionTitle>{t('kamai.last14')}</SectionTitle>
          <Insights summary={summary} floor={hourlyFloor(profile)} />

          <SectionTitle>{t('kamai.trend')}</SectionTitle>
          <Card>
            <TrendChart points={summary.trend} flagged={flagged} title={t('kamai.trendTitle')} />
          </Card>

          {summary.perPlatform.length > 0 && (
            <>
              <SectionTitle>{t('kamai.platformCompare')}</SectionTitle>
              <PlatformTable rows={summary.perPlatform} />
            </>
          )}

          <div className="mt-6">
            <WeeklySummary />
          </div>

          <SectionTitle>{t('kamai.recent')}</SectionTitle>
          <EntryList entries={entries} />
        </>
      )}

      {sheetOpen && (
        <LogSheet
          open
          initialText={pendingLogText}
          onClose={() => {
            setLogOpen(false)
            setPendingLogText(null)
          }}
        />
      )}
    </>
  )
}
