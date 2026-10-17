import { describe, expect, it } from 'vitest'
import tips from '@/data/safety-tips.json'
import { shiftContext } from '@/lib/rules/shift'
import { MAX_TIPS, selectTips } from './tips'

describe('selectTips', () => {
  it('changes with time of day', () => {
    const day = selectTips(tips, shiftContext(14).conditions, 'bike').map((t) => t.id)
    const night = selectTips(tips, shiftContext(23).conditions, 'bike').map((t) => t.id)
    expect(day.every((id) => id.startsWith('general'))).toBe(true)
    expect(night[0]).toBe('night-share-trip')
    expect(night).toContain('night-reflective')
  })

  it('filters by vehicle and caps the list', () => {
    const car = selectTips(tips, ['night', 'rain'], 'car').map((t) => t.id)
    expect(car).toContain('night-car-locks')
    expect(car).not.toContain('night-reflective')
    expect(car.length).toBeLessThanOrEqual(MAX_TIPS)
  })

  it('shows weather tips when the user flags heat', () => {
    expect(selectTips(tips, ['heat'], undefined)[0]?.id).toBe('heat-water')
  })
})
