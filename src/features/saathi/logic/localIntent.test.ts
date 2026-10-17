import { describe, expect, it } from 'vitest'
import { matchIntent } from './localIntent'

const today = '2026-10-17'

describe('matchIntent', () => {
  it('answers licence expiry from local data (FR-26 acceptance)', () => {
    expect(matchIntent('mera licence kab expire hoga', today)).toEqual({
      kind: 'doc-expiry',
      type: 'dl',
    })
    expect(matchIntent('मेरा लाइसेंस कब खत्म होगा', today)).toEqual({
      kind: 'doc-expiry',
      type: 'dl',
    })
  })

  it('opens a payout complaint draft (FR-27 acceptance)', () => {
    expect(matchIntent('complaint likhna hai kal ke payment ka', today)).toEqual({
      kind: 'tool',
      call: { name: 'draftGrievance', args: { target: 'platform', about: 'anomaly' } },
    })
  })

  it('routes accident complaints to the insurer', () => {
    expect(matchIntent('hadsa hua, shikayat karni hai', today)).toMatchObject({
      call: { args: { target: 'insurer', about: 'incident' } },
    })
  })

  it('logs earnings said in a sentence', () => {
    expect(matchIntent('aaj zomato se 1400 mile', today)).toMatchObject({
      call: { name: 'logEarning' },
    })
  })

  it('finds safety tips and schemes, else offers help', () => {
    expect(matchIntent('raat ko safe kaise rahu', today)).toMatchObject({
      call: { name: 'showSafetyTips', args: { condition: 'night' } },
    })
    expect(matchIntent('pension yojana batao', today)).toMatchObject({
      call: { name: 'openScheme' },
    })
    expect(matchIntent('kitna kamaya is hafte', today)).toEqual({ kind: 'earnings-summary' })
    expect(matchIntent('namaste', today)).toEqual({ kind: 'help' })
  })
})
