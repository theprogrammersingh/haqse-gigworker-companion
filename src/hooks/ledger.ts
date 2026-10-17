import { findAnomalies, summarizeLedger, type Anomaly, type LedgerSummary } from '@/lib/rules'
import type { Earning } from '@/lib/schemas'
import { useToday } from './clock'
import { useEarnings, useSettings } from './data'

export interface LedgerView {
  today: string
  entries: Earning[]
  summary: LedgerSummary
  anomalies: Anomaly[]
}

/** Ledger aggregates and open anomalies for the current window. Undefined while loading. */
export function useLedger(): LedgerView | undefined {
  const today = useToday()
  const entries = useEarnings(today)
  const settings = useSettings()
  if (!entries || !settings) return undefined
  return {
    today,
    entries,
    summary: summarizeLedger(entries, today),
    anomalies: findAnomalies(entries, today, settings.dismissedAnomalies),
  }
}
