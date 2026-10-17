import { describe, expect, it } from 'vitest'
import type { Anomaly } from '@/lib/rules/anomaly'
import { toAction } from './actions'

const ctx = {
  anomalies: [{ entryId: 'e9' } as Anomaly],
  incidents: [{ id: 'i1', datetime: 0, type: 'accident' as const, locationLabel: '', notes: '' }],
  schemeIds: ['pm-sym'],
}

describe('toAction', () => {
  it('pre-fills a dispute from the latest anomaly', () => {
    expect(
      toAction({ name: 'draftGrievance', args: { target: 'platform', about: 'anomaly' } }, ctx),
    ).toEqual({
      kind: 'navigate',
      to: '/shikayat/new?from=anomaly&entry=e9&target=platform',
    })
  })

  it('falls back to a general draft when there is no evidence', () => {
    expect(
      toAction(
        { name: 'draftGrievance', args: { target: 'labour', about: 'anomaly', note: 'no pay' } },
        { ...ctx, anomalies: [] },
      ),
    ).toEqual({ kind: 'navigate', to: '/shikayat/new?target=labour&note=no%20pay' })
  })

  it('only opens known schemes and valid dates', () => {
    expect(toAction({ name: 'openScheme', args: { schemeId: 'made-up' } }, ctx)).toEqual({
      kind: 'navigate',
      to: '/haq',
    })
    expect(toAction({ name: 'addDocument', args: { type: 'dl', expiry: 'soon' } }, ctx)).toEqual({
      kind: 'navigate',
      to: '/kagaz?add=dl',
    })
    expect(toAction({ name: 'logEarning', args: { text: 'zomato 900' } }, ctx)).toEqual({
      kind: 'log',
      text: 'zomato 900',
    })
  })
})
