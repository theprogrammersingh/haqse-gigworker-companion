import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { rightSchema, schemeSchema } from '@/lib/schemas/scheme'
import { PLATFORMS } from '@/lib/schemas/enums'
import { profileSchema } from '@/lib/schemas/profile'
import rights from './rights.json'
import schemes from './schemes.json'
import seed from './seed.json'
import tips from './safety-tips.json'

/** Bundled facts are the only grounding the AI gets, so they must be well-formed. */
describe('bundled data', () => {
  it('has 8–12 valid schemes with unique ids and https links (FR-11)', () => {
    const parsed = z.array(schemeSchema).parse(schemes)
    expect(parsed.length).toBeGreaterThanOrEqual(8)
    expect(parsed.length).toBeLessThanOrEqual(12)
    expect(new Set(parsed.map((s) => s.id)).size).toBe(parsed.length)
    expect(parsed.every((s) => s.url.startsWith('https://'))).toBe(true)
    expect(
      parsed
        .filter((s) => s.level === 'state')
        .map((s) => s.eligibility.states?.[0])
        .sort(),
    ).toEqual(['KA', 'PB', 'RJ'])
  })

  it('has valid rights cards in all three languages', () => {
    const parsed = z.array(rightSchema).parse(rights)
    expect(parsed.every((r) => r.title.hi && r.title.pa && r.body.hi && r.body.pa)).toBe(true)
  })

  it('has safety tips for every condition in all three languages', () => {
    const conditions = new Set(tips.flatMap((t) => t.conditions))
    expect([...conditions].sort()).toEqual(['general', 'heat', 'night', 'rain'])
    expect(tips.every((t) => t.text.en && t.text.hi && t.text.pa)).toBe(true)
  })

  it('seed profile and earnings match the schemas', () => {
    expect(profileSchema.parse({ id: 'me', language: 'en', ...seed.profile }).state).toBe('PB')
    expect(
      seed.earnings.every(
        (e) => (PLATFORMS as readonly string[]).includes(e.platform) && e.hours > 0,
      ),
    ).toBe(true)
  })
})
