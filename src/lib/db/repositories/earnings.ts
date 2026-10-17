import type { Earning } from '../../schemas'
import { LOOKBACK_DAYS } from '../../constants'
import { addDays } from '../../utils/date'
import { db } from '../dexie'

/** Entries in the last `days` days ending at `today`, via the date index (no full scan). */
export function earningsSince(today: string, days = LOOKBACK_DAYS * 2): Promise<Earning[]> {
  return db.earnings
    .where('date')
    .between(addDays(today, -(days - 1)), today, true, true)
    .toArray()
}

export const addEarnings = (entries: Earning[]): Promise<unknown> => db.earnings.bulkPut(entries)
export const deleteEarning = (id: string): Promise<void> => db.earnings.delete(id)
export const getEarnings = (ids: readonly string[]): Promise<(Earning | undefined)[]> =>
  db.earnings.bulkGet([...ids])

/** Most recent entries first, limited for list views. */
export const recentEarnings = (limit = 30): Promise<Earning[]> =>
  db.earnings.orderBy('date').reverse().limit(limit).toArray()
