import { describe, expect, it } from 'vitest'
import { CONTEXT_MAX_BYTES } from '@/lib/constants'
import { byteLength } from '@/lib/utils/hash'
import { doc, earning, profile } from '@/test/factories'
import { buildContext } from './buildContext'

const now = new Date(2026, 9, 17, 22, 30)

describe('buildContext', () => {
  it('stays under the size cap with 100 ledger entries', () => {
    const platforms = ['zomato', 'swiggy', 'uber', 'ola', 'rapido', 'blinkit'] as const
    const earnings = Array.from({ length: 100 }, (_, i) =>
      earning({
        date: `2026-10-${String(4 + (i % 14)).padStart(2, '0')}`,
        platform: platforms[i % 6] ?? 'zomato',
        gross: 500 + i * 7,
      }),
    )
    const ctx = buildContext({
      profile: profile({ state: 'PB', workType: 'delivery', platforms: [...platforms] }),
      earnings,
      documents: [],
      incidents: [],
      now,
    })
    expect(byteLength(JSON.stringify(ctx))).toBeLessThanOrEqual(CONTEXT_MAX_BYTES)
    expect(ctx.earnings14d.hours).toBeGreaterThan(0)
  })

  it('never includes names or notes', () => {
    const ctx = buildContext({
      profile: profile(),
      earnings: [],
      documents: [doc({ id: 'dl', holderName: 'Gurpreet Singh', expiry: '2026-11-01' })],
      incidents: [
        {
          id: 'i1',
          datetime: now.getTime(),
          type: 'theft',
          locationLabel: 'Model Town',
          notes: 'PB10AB1234',
        },
      ],
      now,
    })
    const json = JSON.stringify(ctx)
    expect(json).not.toContain('Gurpreet')
    expect(json).not.toContain('PB10AB1234')
    expect(json).not.toContain('Model Town')
    expect(ctx.docsAttention).toEqual([{ type: 'dl', daysLeft: 15 }])
    expect(ctx.shift).toBe('night')
  })
})
