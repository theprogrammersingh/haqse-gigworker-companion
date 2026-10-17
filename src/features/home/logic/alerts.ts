import { MAX_HOME_ALERTS } from '@/lib/constants'
import type { Anomaly } from '@/lib/rules/anomaly'
import type { SchemeMatch } from '@/lib/rules/eligibility'
import type { DocumentCheck } from '@/lib/rules/expiry'

export type HomeAlert =
  | { kind: 'anomaly'; anomaly: Anomaly }
  | { kind: 'document'; doc: DocumentCheck }
  | { kind: 'scheme'; match: SchemeMatch }
  | { kind: 'low-earning'; netPerHour: number; floor: number }

interface AlertInput {
  anomalies: readonly Anomaly[]
  documents: readonly DocumentCheck[]
  schemes: readonly SchemeMatch[]
  lowEarning: { netPerHour: number; floor: number } | null
}

/**
 * Up to MAX_HOME_ALERTS cards, one per kind, by urgency: payout anomaly,
 * expiring/expired document, eligible scheme, then low hourly earnings (PRD §7).
 */
export function homeAlerts({ anomalies, documents, schemes, lowEarning }: AlertInput): HomeAlert[] {
  const out: HomeAlert[] = []
  const anomaly = anomalies[0]
  if (anomaly) out.push({ kind: 'anomaly', anomaly })
  const doc = documents[0]
  if (doc) out.push({ kind: 'document', doc })
  const scheme = schemes.find((m) => m.verdict === 'eligible')
  if (scheme) out.push({ kind: 'scheme', match: scheme })
  if (lowEarning) out.push({ kind: 'low-earning', ...lowEarning })
  return out.slice(0, MAX_HOME_ALERTS)
}
