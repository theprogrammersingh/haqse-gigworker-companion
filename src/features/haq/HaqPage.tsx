import { Link } from 'react-router'
import { useTranslation } from '@/i18n'
import { useProfile, useSchemes } from '@/hooks'
import { rankSchemes, type SchemeMatch, type Verdict } from '@/lib/rules/eligibility'
import type { Language } from '@/lib/schemas'
import { Icon, PageHeader, SectionTitle, Spinner } from '@/ui'
import { AskOneQuestion } from './components/AskOneQuestion'
import { RightsCards } from './components/RightsCards'
import { VerdictPill } from './components/VerdictPill'

const GROUPS: Verdict[] = ['eligible', 'likely', 'need-info', 'not-eligible']

function SchemeRow({ match, lang }: { match: SchemeMatch; lang: Language }) {
  return (
    <li>
      <Link
        to={`/haq/${match.scheme.id}`}
        className="flex min-h-tap items-start gap-3 rounded-2xl border border-line bg-surface p-3"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-bold">{match.scheme.name}</p>
          <p className="text-sm text-muted">{match.scheme.summary[lang]}</p>
          <VerdictPill verdict={match.verdict} />
        </div>
        <span className="mt-1">
          <Icon name="chevron-right" />
        </span>
      </Link>
    </li>
  )
}

/** Rule-ranked schemes (FR-12): changing state or age in the profile changes this list. */
export function HaqPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language
  const profile = useProfile()
  const schemes = useSchemes()
  if (!profile || !schemes) return <Spinner />
  const ranked = rankSchemes(schemes, profile)
  const firstMissing = ranked.find((m) => m.verdict === 'need-info')?.missingFields[0]

  return (
    <>
      <PageHeader title={t('haq.title')} subtitle={t('haq.subtitle')} />
      {firstMissing && <AskOneQuestion field={firstMissing} profile={profile} />}
      {GROUPS.map((g) => {
        const items = ranked.filter((m) => m.verdict === g)
        if (items.length === 0) return null
        const list = (
          <ul className="space-y-2">
            {items.map((m) => (
              <SchemeRow key={m.scheme.id} match={m} lang={lang} />
            ))}
          </ul>
        )
        return g === 'not-eligible' ? (
          <details key={g} className="mt-6">
            <summary className="min-h-tap cursor-pointer py-2 text-lg font-bold">
              {t('haq.group.not-eligible')} ({items.length})
            </summary>
            {list}
          </details>
        ) : (
          <section key={g} aria-labelledby={`group-${g}`}>
            <SectionTitle id={`group-${g}`}>{t(`haq.group.${g}`)}</SectionTitle>
            {list}
          </section>
        )
      })}
      <SectionTitle>{t('haq.rights')}</SectionTitle>
      <RightsCards />
      <p className="mt-6 text-sm text-muted">{t('common.disclaimer')}</p>
    </>
  )
}
