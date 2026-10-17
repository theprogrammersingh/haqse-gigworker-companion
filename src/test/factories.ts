import type { DocumentRecord, Earning, Profile, Scheme } from '@/lib/schemas'

let n = 0
export function earning(overrides: Partial<Earning> = {}): Earning {
  n += 1
  return {
    id: `e${n}`,
    date: '2026-10-17',
    platform: 'zomato',
    gross: 1000,
    tips: 0,
    fuel: 200,
    otherCosts: 0,
    hours: 8,
    source: 'manual',
    createdAt: 0,
    ...overrides,
  }
}

export const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'me',
  language: 'en',
  platforms: [],
  ...overrides,
})

export const doc = (
  overrides: Partial<DocumentRecord> & Pick<DocumentRecord, 'id'>,
): DocumentRecord => ({
  have: true,
  updatedAt: 0,
  ...overrides,
})

export const scheme = (overrides: Partial<Scheme> = {}): Scheme => ({
  id: 'test',
  name: 'Test scheme',
  level: 'central',
  summary: { en: 'x', hi: 'x', pa: 'x' },
  benefits: [],
  eligibility: {},
  documents: [],
  howToApply: '',
  url: 'https://example.gov.in',
  helpline: '14434',
  verifiedOn: '2026-10-17',
  ...overrides,
})
