import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { useDocuments, useProfile, useSchemes, useToday } from '@/hooks'
import { documentGaps, isApplyBlocked, matchScheme } from '@/lib/rules/eligibility'
import type { Language } from '@/lib/schemas'
import { AlertCard, Card, EmptyState, Icon, LinkButton, PageHeader, ReadAloud, Spinner } from '@/ui'
import { AskOneQuestion } from './components/AskOneQuestion'
import { ChecksList } from './components/ChecksList'
import { ExplainPanel } from './components/ExplainPanel'
import { VerdictPill } from './components/VerdictPill'

/** Scheme detail: why you match, what papers you need (→ Kagaz), how to apply (flow 2). */
export function SchemePage() {
  const { schemeId } = useParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language
  const today = useToday()
  const profile = useProfile()
  const schemes = useSchemes()
  const docs = useDocuments()
  if (!profile || !schemes || !docs) return <Spinner />
  const scheme = schemes.find((s) => s.id === schemeId)
  if (!scheme)
    return (
      <EmptyState icon="scale" title={t('haq.notFound')}>
        <LinkButton to="/haq">{t('haq.title')}</LinkButton>
      </EmptyState>
    )

  const match = matchScheme(scheme, profile)
  const gaps = documentGaps(scheme, docs, today)
  const blocked = isApplyBlocked(gaps)
  const gapByType = new Map(gaps.map((g) => [g.type, g]))

  return (
    <>
      <PageHeader title={scheme.name} subtitle={t(`haq.level.${scheme.level}`)} />
      <div className="space-y-4">
        <VerdictPill verdict={match.verdict} />
        <p className="text-lg">{scheme.summary[lang]}</p>
        <ReadAloud text={scheme.summary[lang]} />
        {match.missingFields[0] && (
          <AskOneQuestion field={match.missingFields[0]} profile={profile} />
        )}

        <Card>
          <h2 className="mb-2 text-lg font-bold">{t('haq.whyTitle')}</h2>
          <ChecksList checks={match.checks} />
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-bold">{t('haq.benefits')}</h2>
          <ul lang="en" className="list-disc space-y-1 pl-5">
            {scheme.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-bold">{t('haq.documents')}</h2>
          <ul className="space-y-2">
            {scheme.documents.map((d) => {
              const gap = gapByType.get(d)
              return (
                <li key={d} className="flex items-center gap-2">
                  <span
                    className={
                      gap ? (gap.state === 'expiring' ? 'text-warn' : 'text-bad') : 'text-ok'
                    }
                  >
                    <Icon name={gap ? 'alert' : 'check'} size={20} />
                  </span>
                  <span className="flex-1">{t(`enum.doc.${d}`)}</span>
                  <span className="text-sm font-semibold">
                    {t(`kagaz.state.${gap?.state ?? 'ok'}`)}
                  </span>
                </li>
              )
            })}
          </ul>
          {gaps.length > 0 && (
            <LinkButton
              to={`/kagaz?for=${scheme.id}`}
              variant="secondary"
              icon="file"
              className="mt-3"
            >
              {t('haq.fixDocuments')}
            </LinkButton>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-bold">{t('haq.howToApply')}</h2>
          <p lang="en">{scheme.howToApply}</p>
          <p className="mt-2">
            {t('haq.helpline')}:{' '}
            {/^\d[\d ]+$/.test(scheme.helpline) ? (
              <a
                href={`tel:${scheme.helpline.replace(/\s/g, '')}`}
                className="font-bold text-brand underline"
              >
                {scheme.helpline}
              </a>
            ) : (
              <span className="font-semibold">{scheme.helpline}</span>
            )}
          </p>
          <p className="text-sm text-muted">{t('haq.verifiedOn', { date: scheme.verifiedOn })}</p>
        </Card>

        {blocked ? (
          <AlertCard tone="warn" title={t('haq.applyBlocked')}>
            {t('haq.applyBlockedBody')}
          </AlertCard>
        ) : (
          <a
            href={scheme.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-tap w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 font-semibold text-brand-ink"
          >
            {t('haq.apply')}
            <Icon name="external" />
            <span className="sr-only">({t('common.newTab')})</span>
          </a>
        )}

        <ExplainPanel scheme={scheme} />
        <p className="text-sm text-muted">{t('common.disclaimer')}</p>
      </div>
    </>
  )
}
