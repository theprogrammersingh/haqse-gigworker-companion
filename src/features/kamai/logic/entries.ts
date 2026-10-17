import type { EarningDraft } from '@/lib/parse/localEarningParser'
import { earningSchema } from '@/lib/schemas/records'
import type { Earning, EarningSource, Platform } from '@/lib/schemas'

export type DraftField = 'gross' | 'hours' | 'date'

/** Problems that block saving a draft; empty when it is valid. */
export function draftErrors(d: EarningDraft, today: string): DraftField[] {
  const errors: DraftField[] = []
  if (!(d.gross > 0 || d.tips > 0)) errors.push('gross')
  if (!(d.hours >= 0.25 && d.hours <= 24)) errors.push('hours')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || d.date > today) errors.push('date')
  return errors
}

export const blankDraft = (today: string, platform: Platform = 'other'): EarningDraft => ({
  date: today,
  platform,
  gross: 0,
  tips: 0,
  fuel: 0,
  otherCosts: 0,
  hours: 0,
})

/**
 * Converts a confirmed draft into a stored entry (amounts rounded to whole rupees).
 * Re-validated with the shared Zod schema so nothing malformed reaches the ledger.
 */
export function toEarning(
  d: EarningDraft,
  source: EarningSource,
  id: string,
  now: number,
): Earning {
  const r = (n: number): number => Math.max(0, Math.round(n))
  return earningSchema.parse({
    id,
    date: d.date,
    platform: d.platform,
    gross: r(d.gross),
    tips: r(d.tips),
    fuel: r(d.fuel),
    otherCosts: r(d.otherCosts),
    hours: Math.round(d.hours * 4) / 4,
    ...(d.trips ? { trips: Math.round(d.trips) } : {}),
    source,
    createdAt: now,
  })
}
