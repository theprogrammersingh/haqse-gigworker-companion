import type { LedgerSummary } from '@/lib/rules/ledger'
import { isLowEarning, type HourlyFloor } from '@/lib/rules/lowEarnings'

export type Advice = 'cost-share-high' | 'below-floor' | 'best-platform' | 'none'

/** Share of payout above which costs are called out (fuel + other costs). */
export const HIGH_COST_SHARE = 0.3

export interface EarningsInsight {
  lowEarning: boolean
  advice: Advice[]
  /** Best platform by net per hour when there are two or more. */
  bestPlatform: string | null
}

/** Rule-based advice shown with or without AI (PRD §4 "Low net earnings"). */
export function earningsInsight(summary: LedgerSummary, floor: HourlyFloor): EarningsInsight {
  const lowEarning = isLowEarning(summary.netPerHour, summary.periodHours, floor)
  const advice: Advice[] = []
  if (lowEarning) advice.push('below-floor')
  if (summary.periodGross > 0 && summary.costShare > HIGH_COST_SHARE) advice.push('cost-share-high')
  const ranked = [...summary.perPlatform]
    .filter((p) => p.hours > 0)
    .sort((a, b) => b.netPerHour - a.netPerHour)
  const bestPlatform = ranked.length > 1 ? (ranked[0]?.platform ?? null) : null
  if (bestPlatform) advice.push('best-platform')
  return { lowEarning, advice: advice.length ? advice : ['none'], bestPlatform }
}
