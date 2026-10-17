import { describe, expect, it } from 'vitest'
import { doc, profile, scheme } from '@/test/factories'
import { checkAge, documentGaps, isApplyBlocked, matchScheme, rankSchemes } from './eligibility'

const pmsym = scheme({
  id: 'pm-sym',
  eligibility: { ageMin: 18, ageMax: 40, maxMonthlyIncome: 15000 },
})
const rajasthan = scheme({
  id: 'rj',
  level: 'state',
  eligibility: { states: ['RJ'], platformWorker: true },
})

describe('checkAge', () => {
  it('passes, fails or partially matches bands', () => {
    expect(checkAge('18-29', 18, 40)).toBe('pass')
    expect(checkAge('16-17', 18, 40)).toBe('fail')
    expect(checkAge('60+', 18, 70)).toBe('partial')
    expect(checkAge(undefined, 18, 40)).toBe('unknown')
  })
})

describe('matchScheme', () => {
  it('age 17 is not eligible for PM-SYM', () => {
    expect(matchScheme(pmsym, profile({ ageBand: '16-17', incomeBand: 'upto-15k' })).verdict).toBe(
      'not-eligible',
    )
  })

  it('state mismatch is not eligible, with the state check failing', () => {
    const m = matchScheme(rajasthan, profile({ state: 'PB', workType: 'delivery' }))
    expect(m.verdict).toBe('not-eligible')
    expect(m.checks.find((c) => c.criterion === 'state')?.result).toBe('fail')
  })

  it('missing age means need info and names the field', () => {
    const m = matchScheme(pmsym, profile({ incomeBand: 'upto-15k' }))
    expect(m.verdict).toBe('need-info')
    expect(m.missingFields).toEqual(['ageBand'])
  })

  it('treats app platforms as platform work', () => {
    expect(
      matchScheme(
        rajasthan,
        profile({ state: 'RJ', workType: 'domestic', platforms: ['urbancompany'] }),
      ).verdict,
    ).toBe('eligible')
    expect(matchScheme(rajasthan, profile({ state: 'RJ', workType: 'construction' })).verdict).toBe(
      'not-eligible',
    )
  })
})

describe('rankSchemes', () => {
  it('changing the profile changes the ranking', () => {
    const young = rankSchemes(
      [rajasthan, pmsym],
      profile({ ageBand: '18-29', incomeBand: 'upto-15k' }),
    )
    expect(young[0]?.scheme.id).toBe('pm-sym')
    const rj = rankSchemes(
      [pmsym, rajasthan],
      profile({ ageBand: '41-50', state: 'RJ', workType: 'ride' }),
    )
    expect(rj[0]?.scheme.id).toBe('rj')
  })
})

describe('documentGaps', () => {
  it('blocks applying when a required document is expired or missing', () => {
    const s = scheme({ documents: ['aadhaar', 'dl'] })
    const gaps = documentGaps(
      s,
      [doc({ id: 'aadhaar' }), doc({ id: 'dl', expiry: '2026-10-01' })],
      '2026-10-17',
    )
    expect(gaps.map((g) => g.state)).toEqual(['expired'])
    expect(isApplyBlocked(gaps)).toBe(true)
    expect(
      isApplyBlocked(documentGaps(s, [doc({ id: 'aadhaar' }), doc({ id: 'dl' })], '2026-10-17')),
    ).toBe(false)
  })
})
