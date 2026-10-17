import { describe, expect, it } from 'vitest'
import type { Anomaly } from '@/lib/rules/anomaly'
import type { SchemeMatch } from '@/lib/rules/eligibility'
import type { DocumentCheck } from '@/lib/rules/expiry'
import { scheme } from '@/test/factories'
import { homeAlerts } from './alerts'

const anomaly = { entryId: 'e1', date: '2026-10-16' } as Anomaly
const doc: DocumentCheck = { type: 'dl', state: 'expiring', daysLeft: 20, record: undefined }
const eligible: SchemeMatch = {
  scheme: scheme(),
  verdict: 'eligible',
  checks: [],
  missingFields: [],
}
const needInfo: SchemeMatch = { ...eligible, verdict: 'need-info' }

describe('homeAlerts', () => {
  it('orders by urgency and caps at three', () => {
    const alerts = homeAlerts({
      anomalies: [anomaly, anomaly],
      documents: [doc],
      schemes: [eligible],
      lowEarning: { netPerHour: 40, floor: 60 },
    })
    expect(alerts.map((a) => a.kind)).toEqual(['anomaly', 'document', 'scheme'])
  })

  it('only suggests schemes the worker is eligible for', () => {
    expect(
      homeAlerts({ anomalies: [], documents: [], schemes: [needInfo], lowEarning: null }),
    ).toEqual([])
  })

  it('shows low earnings when there is room', () => {
    expect(
      homeAlerts({
        anomalies: [],
        documents: [],
        schemes: [],
        lowEarning: { netPerHour: 40, floor: 60 },
      })[0]?.kind,
    ).toBe('low-earning')
  })
})
