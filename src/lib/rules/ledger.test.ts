import { describe, expect, it } from 'vitest'
import { earning } from '@/test/factories'
import { median, netOf, summarizeLedger } from './ledger'

describe('median', () => {
  it('handles odd, even and empty lists', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
    expect(median([])).toBeNaN()
  })
})

describe('summarizeLedger', () => {
  const entries = [
    earning({ date: '2026-10-17', gross: 1400, tips: 100, fuel: 250, otherCosts: 50, hours: 9 }),
    earning({ date: '2026-10-17', platform: 'swiggy', gross: 600, fuel: 100, hours: 3 }),
    earning({ date: '2026-10-12', gross: 1000, fuel: 200, hours: 8 }),
    earning({ date: '2026-09-01', gross: 9999, hours: 1 }),
  ]
  const s = summarizeLedger(entries, '2026-10-17')

  it('computes take-home per entry', () => {
    expect(netOf(entries[0]!)).toBe(1200)
  })

  it('aggregates today, week and the 14-day window only', () => {
    expect(s.todayNet).toBe(1700)
    expect(s.todayHours).toBe(12)
    expect(s.weekNet).toBe(2500)
    expect(s.entryCount).toBe(3)
    expect(s.netPerHour).toBeCloseTo(2500 / 20)
  })

  it('breaks down per platform, best first', () => {
    expect(s.perPlatform.map((p) => p.platform)).toEqual(['zomato', 'swiggy'])
    expect(s.perPlatform[0]).toMatchObject({ days: 2, net: 2000 })
  })

  it('returns a dense 14-point trend', () => {
    expect(s.trend).toHaveLength(14)
    expect(s.trend.at(-1)).toEqual({ date: '2026-10-17', net: 1700 })
    expect(s.trend[0]?.date).toBe('2026-10-04')
  })

  it('handles an empty ledger', () => {
    const empty = summarizeLedger([], '2026-10-17')
    expect(empty.netPerHour).toBe(0)
    expect(empty.costShare).toBe(0)
  })
})
