import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, isoWeekKey, toISODate } from './date'
import { fitWithin } from './image'
import { formatINR, localeFor } from './money'
import { mapsUrl, smsUrl, whatsappUrl } from './share'

describe('date', () => {
  it('does local-date arithmetic across month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(daysBetween('2026-10-17', '2026-11-15')).toBe(29)
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('computes ISO week keys', () => {
    expect(isoWeekKey('2026-10-17')).toBe('2026-W42')
    expect(isoWeekKey('2027-01-01')).toBe('2026-W53')
  })
})

describe('money', () => {
  it('formats rupees with Indian grouping', () => {
    expect(formatINR(123456.4)).toBe('₹1,23,456')
    expect(localeFor('pa')).toBe('pa-IN')
  })
})

describe('image', () => {
  it('scales the longest edge to 1024 without upscaling', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1024, height: 768 })
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
})

describe('share links', () => {
  it('builds sms, WhatsApp and maps links', () => {
    expect(smsUrl(['+91 98765 43210'], 'help')).toBe('sms:+919876543210?body=help')
    expect(whatsappUrl('hi there')).toBe('https://wa.me/?text=hi%20there')
    expect(mapsUrl(30.9, 75.85)).toBe('https://maps.google.com/?q=30.90000,75.85000')
  })
})
