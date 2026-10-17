import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useGrievances } from '@/hooks'
import type { GrievanceStatus } from '@/lib/schemas'
import { formatDateTime } from '@/lib/utils/date'
import { localeFor } from '@/lib/utils/money'
import { EmptyState, Icon, LinkButton, PageHeader, Spinner, StatusPill, type Tone } from '@/ui'

const STATUS_TONE: Record<GrievanceStatus, Tone> = { draft: 'info', sent: 'warn', resolved: 'ok' }

export function ShikayatPage() {
  const { t, i18n } = useTranslation()
  const list = useGrievances()
  if (!list) return <Spinner />
  return (
    <>
      <PageHeader title={t('shikayat.title')} subtitle={t('shikayat.subtitle')} />
      <LinkButton to="/shikayat/new" block icon="plus">
        {t('shikayat.new')}
      </LinkButton>
      <div className="mt-5">
        {list.length === 0 ? (
          <EmptyState icon="megaphone" title={t('shikayat.empty')}>
            <p className="text-muted">{t('shikayat.emptyHint')}</p>
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {list.map((g) => (
              <li key={g.id}>
                <Link
                  to={`/shikayat/${g.id}`}
                  className="flex min-h-tap items-center gap-3 rounded-2xl border border-line bg-surface p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{g.subject}</p>
                    <p className="text-sm text-muted">
                      {t(`enum.target.${g.target}`)} ·{' '}
                      {formatDateTime(g.createdAt, localeFor(i18n.language))}
                    </p>
                  </div>
                  <StatusPill tone={STATUS_TONE[g.status]}>
                    {t(`enum.status.${g.status}`)}
                  </StatusPill>
                  <Icon name="chevron-right" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
