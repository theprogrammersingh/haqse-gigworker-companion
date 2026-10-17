import { useTranslation } from '@/i18n'
import type { Verdict } from '@/lib/rules/eligibility'
import { StatusPill, type Tone } from '@/ui'

const TONES: Record<Verdict, Tone> = {
  eligible: 'ok',
  likely: 'info',
  'need-info': 'warn',
  'not-eligible': 'bad',
}

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const { t } = useTranslation()
  return <StatusPill tone={TONES[verdict]}>{t(`haq.verdict.${verdict}`)}</StatusPill>
}
