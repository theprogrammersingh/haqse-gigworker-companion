import { describe, expect, it } from 'vitest'
import { normalizeText, parseEarningText } from './localEarningParser'

const today = '2026-10-17'

describe('parseEarningText', () => {
  it('parses the PRD example', () => {
    expect(parseEarningText('aaj Zomato se 1400, petrol 250, 9 ghante', today)).toEqual([
      { date: today, platform: 'zomato', gross: 1400, tips: 0, fuel: 250, otherCosts: 0, hours: 9 },
    ])
  })

  it('handles yesterday, two platforms, tips and trips', () => {
    const [a, b] = parseEarningText('kal swiggy 800 tip 50 12 orders, uber 1200 4 ghante', today)
    expect(a).toMatchObject({
      date: '2026-10-16',
      platform: 'swiggy',
      gross: 800,
      tips: 50,
      trips: 12,
    })
    expect(b).toMatchObject({ platform: 'uber', gross: 1200, hours: 4 })
  })

  it('folds costs said before the platform into it', () => {
    const [a] = parseEarningText('petrol 300, rapido 1500', today)
    expect(a).toMatchObject({ platform: 'rapido', gross: 1500, fuel: 300 })
  })

  it('understands hazaar, ₹ and native digits', () => {
    expect(parseEarningText('zomato 2 hazaar', today)[0]?.gross).toBe(2000)
    expect(parseEarningText('₹1,250 kamai', today)[0]?.gross).toBe(1250)
    expect(parseEarningText('स्विगी १२०० पेट्रोल २००', today)[0]).toMatchObject({
      platform: 'swiggy',
      gross: 1200,
      fuel: 200,
    })
    expect(parseEarningText('ਜ਼ੋਮੈਟੋ ੯੦੦ ੮ ਘੰਟੇ', today)[0]).toMatchObject({ gross: 900, hours: 8 })
  })

  it('returns nothing without a payout', () => {
    expect(parseEarningText('aaj thak gaya', today)).toEqual([])
    expect(parseEarningText('petrol 200', today)).toEqual([])
  })
})

describe('normalizeText', () => {
  it('splits glued units', () => {
    expect(normalizeText('9hrs Rs.500')).toBe('9 hrs  500')
  })
})
