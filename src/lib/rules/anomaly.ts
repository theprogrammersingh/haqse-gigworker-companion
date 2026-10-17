import type { Earning, Platform } from '../schemas'
import { ANOMALY_RATIO, LOOKBACK_DAYS, MIN_PRIOR_DAYS } from '../constants'
import { daysBetween } from '../utils/date'
import { median, payoutPerHour } from './ledger'

export interface Anomaly {
  entryId: string
  date: string
  platform: Platform
  hours: number
  actualPayout: number
  payoutPerHour: number
  expectedPerHour: number
  /** Payout the worker would have received at the median rate. */
  expectedPayout: number
  shortfall: number
  /** actual / expected per hour (0–1). */
  ratio: number
}

/**
 * Flags an entry whose payout per hour is below ANOMALY_RATIO of the median
 * of the same platform's previous LOOKBACK_DAYS days. Needs MIN_PRIOR_DAYS of history.
 */
export function checkAnomaly(entry: Earning, history: readonly Earning[]): Anomaly | null {
  const prior: number[] = []
  for (const h of history) {
    if (h.id === entry.id || h.platform !== entry.platform) continue
    const gap = daysBetween(h.date, entry.date)
    if (gap > 0 && gap <= LOOKBACK_DAYS) prior.push(payoutPerHour(h))
  }
  if (prior.length < MIN_PRIOR_DAYS) return null

  const expectedPerHour = median(prior)
  const actualPerHour = payoutPerHour(entry)
  const ratio = actualPerHour / expectedPerHour
  if (!(ratio < ANOMALY_RATIO)) return null

  const actualPayout = entry.gross + entry.tips
  const expectedPayout = Math.round(expectedPerHour * entry.hours)
  return {
    entryId: entry.id,
    date: entry.date,
    platform: entry.platform,
    hours: entry.hours,
    actualPayout,
    payoutPerHour: Math.round(actualPerHour),
    expectedPerHour: Math.round(expectedPerHour),
    expectedPayout,
    shortfall: expectedPayout - actualPayout,
    ratio: Math.round(ratio * 100) / 100,
  }
}

/** All anomalies in the lookback window ending at `today`, newest first, excluding dismissed ids. */
export function findAnomalies(
  entries: readonly Earning[],
  today: string,
  dismissed: readonly string[] = [],
): Anomaly[] {
  const skip = new Set(dismissed)
  const out: Anomaly[] = []
  for (const e of entries) {
    const age = daysBetween(e.date, today)
    if (age < 0 || age >= LOOKBACK_DAYS || skip.has(e.id)) continue
    const a = checkAnomaly(e, entries)
    if (a) out.push(a)
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}
