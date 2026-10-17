import { describe, expect, it } from 'vitest'
import { earning } from '@/test/factories'
import { anomalyEvidence, defaultTarget, evidenceIds, incidentEvidence } from './evidence'
import { fillTemplate } from './template'

const history = [
  earning({ id: 'a', date: '2026-10-13', gross: 1000, hours: 10 }),
  earning({ id: 'b', date: '2026-10-14', gross: 1000, hours: 10 }),
  earning({ id: 'c', date: '2026-10-15', gross: 1000, hours: 10 }),
]
const low = earning({ id: 'low', date: '2026-10-16', gross: 600, hours: 10 })

describe('anomalyEvidence', () => {
  it('recomputes the anomaly from the ledger', () => {
    const e = anomalyEvidence('low', [...history, low])
    expect(e).toEqual({
      kind: 'anomaly',
      entryIds: ['low'],
      platform: 'zomato',
      days: [{ date: '2026-10-16', hours: 10, paid: 600, expected: 1000 }],
    })
    expect(defaultTarget(e!)).toBe('platform')
    expect(evidenceIds(e!)).toEqual(['low'])
  })

  it('returns null for unknown or normal entries', () => {
    expect(anomalyEvidence('nope', history)).toBeNull()
    expect(anomalyEvidence('c', history)).toBeNull()
  })
})

describe('fillTemplate', () => {
  it('puts the correct dates and amounts into the letter (FR-20 acceptance)', () => {
    const d = fillTemplate({
      target: 'platform',
      evidence: anomalyEvidence('low', [...history, low])!,
    })
    expect(d.subject).toContain('16 October 2026')
    expect(d.formal).toContain('Dear Zomato Support Team')
    expect(d.formal).toContain('Rs. 600')
    expect(d.formal).toContain('Rs. 1,000')
    expect(d.formal).toContain('Rs. 400')
  })

  it('drafts an incident report for the right recipient', () => {
    const inc = incidentEvidence({
      id: 'i',
      datetime: new Date(2026, 9, 15, 23, 15).getTime(),
      type: 'accident',
      locationLabel: 'Ferozepur Road',
      notes: 'Slipped on wet road.',
    })
    expect(defaultTarget(inc)).toBe('insurer')
    const d = fillTemplate({ target: 'police', evidence: inc, note: 'Bike mirror broken' })
    expect(d.formal).toContain('To the Station House Officer')
    expect(d.formal).toContain('Ferozepur Road')
    expect(d.formal).toContain('Additional details: Bike mirror broken')
  })
})
