import { describe, expect, it } from 'vitest'
import { doc } from '@/test/factories'
import { checkDocument, expiringDocuments, expiryStatus } from './expiry'

describe('expiryStatus', () => {
  it('warns at 29 days, expires in the past, unknown for null', () => {
    expect(expiryStatus('2026-11-15', '2026-10-17')).toEqual({ status: 'expiring', daysLeft: 29 })
    expect(expiryStatus('2026-10-01', '2026-10-17').status).toBe('expired')
    expect(expiryStatus(null, '2026-10-17')).toEqual({ status: 'unknown', daysLeft: null })
    expect(expiryStatus('2027-06-01', '2026-10-17').status).toBe('valid')
  })
})

describe('checkDocument', () => {
  it('treats absent or not-held documents as missing', () => {
    expect(checkDocument('pan', undefined, '2026-10-17').state).toBe('missing')
    expect(checkDocument('pan', doc({ id: 'pan', have: false }), '2026-10-17').state).toBe(
      'missing',
    )
    expect(checkDocument('pan', doc({ id: 'pan' }), '2026-10-17').state).toBe('ok')
  })

  it('lists expired before expiring', () => {
    const list = expiringDocuments(
      [
        doc({ id: 'dl', expiry: '2026-11-01' }),
        doc({ id: 'insurance', expiry: '2026-10-01' }),
        doc({ id: 'pan' }),
      ],
      '2026-10-17',
    )
    expect(list.map((d) => d.type)).toEqual(['insurance', 'dl'])
  })
})
