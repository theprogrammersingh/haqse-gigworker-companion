import type { GrievanceTarget, IncidentType, Platform } from './enums'

/** Facts a grievance is built from. Only these ever reach the draft. */
export type GrievanceEvidence =
  | {
      kind: 'anomaly'
      entryIds: string[]
      platform: Platform
      days: { date: string; hours: number; paid: number; expected: number }[]
    }
  | {
      kind: 'incident'
      incidentId: string
      type: IncidentType
      datetime: number
      locationLabel: string
      notes: string
    }
  | { kind: 'general'; note: string }

export interface GrievanceRequest {
  target: GrievanceTarget
  evidence: GrievanceEvidence
  /** Optional extra words from the worker. */
  note?: string
}
