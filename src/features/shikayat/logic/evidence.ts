import { checkAnomaly } from '@/lib/rules/anomaly'
import type { Earning, GrievanceEvidence, GrievanceTarget, Incident } from '@/lib/schemas'

/** Evidence for a flagged payout day, recomputed from the ledger (never trusted from the URL). */
export function anomalyEvidence(
  entryId: string,
  entries: readonly Earning[],
): GrievanceEvidence | null {
  const entry = entries.find((e) => e.id === entryId)
  if (!entry) return null
  const a = checkAnomaly(entry, entries)
  if (!a) return null
  return {
    kind: 'anomaly',
    entryIds: [entry.id],
    platform: entry.platform,
    days: [{ date: a.date, hours: a.hours, paid: a.actualPayout, expected: a.expectedPayout }],
  }
}

export const incidentEvidence = (i: Incident): GrievanceEvidence => ({
  kind: 'incident',
  incidentId: i.id,
  type: i.type,
  datetime: i.datetime,
  locationLabel: i.locationLabel,
  notes: i.notes,
})

/** Sensible default recipient for the evidence. */
export function defaultTarget(e: GrievanceEvidence): GrievanceTarget {
  if (e.kind === 'anomaly') return 'platform'
  if (e.kind === 'incident') {
    if (e.type === 'accident') return 'insurer'
    if (e.type === 'payment-dispute' || e.type === 'deactivation') return 'platform'
    return 'police'
  }
  return 'platform'
}

/** Ids of ledger entries or incidents the grievance relies on. */
export const evidenceIds = (e: GrievanceEvidence): string[] =>
  e.kind === 'anomaly' ? e.entryIds : e.kind === 'incident' ? [e.incidentId] : []
