import { describe, expect, it } from 'vitest'
import { hourlyFloor, isLowEarning } from './lowEarnings'
import { isNightHour, shiftContext, shiftType } from './shift'

describe('shift', () => {
  it('treats 21:00–04:59 as night', () => {
    expect([20, 21, 2, 4, 5].map(isNightHour)).toEqual([false, true, true, true, false])
  })

  it('adds weather flags and makes SOS prominent', () => {
    expect(shiftContext(14)).toEqual({ isNight: false, conditions: [], sosProminent: false })
    expect(shiftContext(23, { rain: true }).conditions).toEqual(['night', 'rain'])
  })

  it('names the shift', () => {
    expect([8, 13, 19, 23].map(shiftType)).toEqual(['morning', 'day', 'evening', 'night'])
  })
})

describe('low earnings', () => {
  it('prefers the user target, then state reference, then default', () => {
    expect(hourlyFloor({ minHourlyTarget: 120, state: 'DL' })).toEqual({
      value: 120,
      source: 'target',
    })
    expect(hourlyFloor({ state: 'DL' }).source).toBe('state')
    expect(hourlyFloor({}).source).toBe('default')
  })

  it('flags only when work is logged', () => {
    const floor = { value: 100, source: 'target' as const }
    expect(isLowEarning(80, 10, floor)).toBe(true)
    expect(isLowEarning(0, 0, floor)).toBe(false)
    expect(isLowEarning(120, 10, floor)).toBe(false)
  })
})
