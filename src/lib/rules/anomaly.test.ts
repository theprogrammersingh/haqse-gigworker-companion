import { describe, expect, it } from 'vitest'
import { earning } from '@/test/factories'
import { checkAnomaly, findAnomalies } from './anomaly'

const history = [
  earning({ date: '2026-10-14', gross: 1000, hours: 10 }),
  earning({ date: '2026-10-15', gross: 1000, hours: 10 }),
  earning({ date: '2026-10-16', gross: 1000, hours: 10 }),
]

describe('checkAnomaly', () => {
  it('flags a day at 70% of the platform median', () => {
    const day = earning({ date: '2026-10-17', gross: 700, hours: 10 })
    const a = checkAnomaly(day, [...history, day])
    expect(a).toMatchObject({
      expectedPerHour: 100,
      expectedPayout: 1000,
      shortfall: 300,
      ratio: 0.7,
    })
  })

  it('does not flag a day at 80% of the median', () => {
    const day = earning({ date: '2026-10-17', gross: 800, hours: 10 })
    expect(checkAnomaly(day, [...history, day])).toBeNull()
  })

  it('needs at least 3 prior days on the same platform', () => {
    const day = earning({ date: '2026-10-17', gross: 100, hours: 10 })
    expect(checkAnomaly(day, [...history.slice(0, 2), day])).toBeNull()
  })

  it('ignores other platforms and days outside the window', () => {
    const day = earning({ date: '2026-10-17', gross: 100, hours: 10 })
    const noise = [
      earning({ date: '2026-10-16', platform: 'swiggy', gross: 5000, hours: 1 }),
      earning({ date: '2026-09-01', gross: 5000, hours: 1 }),
    ]
    expect(checkAnomaly(day, [...history, ...noise, day])?.expectedPerHour).toBe(100)
  })
})

describe('findAnomalies', () => {
  it('returns newest first and skips dismissed entries', () => {
    const low1 = earning({ date: '2026-10-17', gross: 300, hours: 10 })
    const all = [...history, low1]
    expect(findAnomalies(all, '2026-10-17').map((a) => a.entryId)).toEqual([low1.id])
    expect(findAnomalies(all, '2026-10-17', [low1.id])).toEqual([])
  })
})
