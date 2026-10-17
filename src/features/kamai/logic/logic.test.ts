import { describe, expect, it } from 'vitest'
import { summarizeLedger } from '@/lib/rules/ledger'
import { earning } from '@/test/factories'
import { blankDraft, draftErrors, toEarning } from './entries'
import { earningsInsight } from './insights'

const today = '2026-10-17'

describe('drafts', () => {
  it('requires payout, sane hours and a past date', () => {
    expect(draftErrors(blankDraft(today), today)).toEqual(['gross', 'hours'])
    expect(
      draftErrors({ ...blankDraft(today), gross: 500, hours: 4, date: '2026-10-18' }, today),
    ).toEqual(['date'])
    expect(draftErrors({ ...blankDraft(today), gross: 500, hours: 4 }, today)).toEqual([])
  })

  it('rounds amounts and hours when saving', () => {
    const e = toEarning(
      { ...blankDraft(today, 'zomato'), gross: 1400.6, hours: 8.1, trips: 0 },
      'text',
      'id1',
      5,
    )
    expect(e).toMatchObject({ gross: 1401, hours: 8, source: 'text', createdAt: 5 })
    expect(e).not.toHaveProperty('trips')
  })

  it('refuses to build an entry the ledger schema rejects', () => {
    expect(() =>
      toEarning({ ...blankDraft(today), gross: 500, hours: 30 }, 'text', 'id2', 5),
    ).toThrow(/hours|24/i)
  })
})

describe('earningsInsight', () => {
  const floor = { value: 100, source: 'target' as const }

  it('flags low hourly take-home and high costs', () => {
    const s = summarizeLedger([earning({ gross: 800, fuel: 300, hours: 8 })], today)
    const i = earningsInsight(s, floor)
    expect(i.lowEarning).toBe(true)
    expect(i.advice).toEqual(['below-floor', 'cost-share-high'])
  })

  it('names the best platform when there are several', () => {
    const s = summarizeLedger(
      [
        earning({ gross: 2000, fuel: 100, hours: 8 }),
        earning({ platform: 'swiggy', gross: 900, fuel: 100, hours: 8 }),
      ],
      today,
    )
    expect(earningsInsight(s, floor)).toMatchObject({ bestPlatform: 'zomato', lowEarning: false })
  })

  it('has nothing to say about an empty ledger', () => {
    expect(earningsInsight(summarizeLedger([], today), floor).advice).toEqual(['none'])
  })
})
