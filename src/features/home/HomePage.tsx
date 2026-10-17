import { useTranslation } from '@/i18n'
import { useNavigate } from 'react-router'
import {
  useDocuments,
  useHour,
  useLedger,
  useNow,
  useProfile,
  useSchemes,
  useSettings,
} from '@/hooks'
import { InstallCard, shouldShowInstallNudge, usePlatform } from '@/features/install'
import { AnomalyCard } from '@/features/kamai'
import { SosButton } from '@/features/suraksha'
import { rankSchemes } from '@/lib/rules/eligibility'
import { expiringDocuments } from '@/lib/rules/expiry'
import { hourlyFloor, isLowEarning } from '@/lib/rules/lowEarnings'
import { shiftContext } from '@/lib/rules/shift'
import type { Language } from '@/lib/schemas'
import { updateSettings } from '@/lib/db'
import { formatDate } from '@/lib/utils/date'
import { localeFor } from '@/lib/utils/money'
import { useSession } from '@/stores/session'
import { AlertCard, Button, Card, LinkButton, Money, Spinner, useMoney } from '@/ui'
import { homeAlerts, type HomeAlert } from './logic/alerts'

function AlertView({ alert }: { alert: HomeAlert }) {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const lang = i18n.language as Language
  switch (alert.kind) {
    case 'anomaly':
      return <AnomalyCard anomaly={alert.anomaly} compact />
    case 'document': {
      const { doc } = alert
      return (
        <AlertCard
          tone={doc.state === 'expired' ? 'bad' : 'warn'}
          icon="file"
          title={
            doc.state === 'expired'
              ? t('home.docExpired', { doc: t(`enum.doc.${doc.type}`) })
              : t('home.docExpiring', { doc: t(`enum.doc.${doc.type}`), count: doc.daysLeft ?? 0 })
          }
          actions={
            <LinkButton to="/kagaz" variant="secondary" icon="file">
              {t('home.openDocuments')}
            </LinkButton>
          }
        >
          {doc.record?.expiry &&
            t('kagaz.validTill', { date: formatDate(doc.record.expiry, localeFor(lang)) })}
        </AlertCard>
      )
    }
    case 'scheme':
      return (
        <AlertCard
          tone="ok"
          icon="scale"
          title={t('home.schemeEligible', { scheme: alert.match.scheme.name })}
          actions={
            <LinkButton
              to={`/haq/${alert.match.scheme.id}`}
              variant="secondary"
              icon="chevron-right"
            >
              {t('home.seeScheme')}
            </LinkButton>
          }
        >
          {alert.match.scheme.summary[lang]}
        </AlertCard>
      )
    case 'low-earning':
      return (
        <AlertCard
          tone="warn"
          icon="trend-down"
          title={t('home.lowEarning', {
            perHour: money(alert.netPerHour),
            floor: money(alert.floor),
          })}
          actions={
            <LinkButton to="/kamai" variant="secondary" icon="wallet">
              {t('home.seeEarnings')}
            </LinkButton>
          }
        >
          {t('kamai.costHighBody')}
        </AlertCard>
      )
  }
}

/** Today's take-home, the most urgent alerts and SOS (PRD §7). */
export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ledger = useLedger()
  const profile = useProfile()
  const docs = useDocuments()
  const schemes = useSchemes()
  const { weather, setPendingLogText } = useSession()
  const hour = useHour()
  const now = useNow()
  const settings = useSettings()
  const platform = usePlatform()
  if (!ledger || !profile || !docs || !settings) return <Spinner />

  const { summary } = ledger
  const floor = hourlyFloor(profile)
  const low = isLowEarning(summary.netPerHour, summary.periodHours, floor)
  const alerts = homeAlerts({
    anomalies: ledger.anomalies,
    documents: expiringDocuments(docs, ledger.today),
    schemes: schemes ? rankSchemes(schemes, profile) : [],
    lowEarning: low ? { netPerHour: summary.netPerHour, floor: floor.value } : null,
  })
  const shift = shiftContext(hour, weather)
  const showInstall = shouldShowInstallNudge({
    method: platform.method,
    launchCount: settings.launchCount ?? 0,
    dismissedAt: settings.installNudgeDismissedAt,
    now,
  })

  return (
    <>
      <h1 className="sr-only">{t('nav.home')}</h1>
      {shift.sosProminent && (
        <div className="mb-4">
          <SosButton prominent />
        </div>
      )}
      <Card className="text-center">
        <p className="text-muted">{t('home.takeHomeToday')}</p>
        <p className="text-5xl font-extrabold tabular-nums">
          <Money amount={summary.todayNet} />
        </p>
        <p className="mt-1 text-muted">
          {t('home.weekLine')} <Money amount={summary.weekNet} className="font-semibold text-ink" />
        </p>
        <Button
          block
          icon="plus"
          className="mt-4 text-lg"
          onClick={() => {
            setPendingLogText('')
            navigate('/kamai')
          }}
        >
          {t('kamai.log')}
        </Button>
      </Card>

      <section aria-labelledby="alerts-title" className="mt-6 space-y-3">
        <h2 id="alerts-title" className="text-lg font-bold">
          {t('home.alerts')}
        </h2>
        {alerts.length === 0 ? (
          <AlertCard tone="ok" title={t('home.allClear')}>
            {t('home.allClearBody')}
          </AlertCard>
        ) : (
          alerts.map((a) => <AlertView key={a.kind} alert={a} />)
        )}
      </section>

      {showInstall && (
        <div className="mt-6">
          <InstallCard
            onDismiss={() => void updateSettings({ installNudgeDismissedAt: Date.now() })}
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2">
        <LinkButton to="/shikayat" variant="secondary" icon="megaphone">
          {t('home.complaints')}
        </LinkButton>
        <LinkButton to="/haq" variant="secondary" icon="scale">
          {t('home.schemes')}
        </LinkButton>
      </div>

      {!shift.sosProminent && (
        <div className="mt-6">
          <SosButton />
        </div>
      )}
    </>
  )
}
