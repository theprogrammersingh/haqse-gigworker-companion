import { db } from '../dexie'

export async function readCache(hash: string, now = Date.now()): Promise<string | undefined> {
  const row = await db.aiCache.get(hash)
  if (!row) return undefined
  if (row.expiresAt <= now) {
    await db.aiCache.delete(hash)
    return undefined
  }
  return row.response
}

export const writeCache = (
  hash: string,
  task: string,
  response: string,
  expiresAt: number,
): Promise<unknown> => db.aiCache.put({ hash, task, response, expiresAt })

/** Drops expired rows using the expiresAt index. */
export const pruneCache = (now = Date.now()): Promise<number> =>
  db.aiCache.where('expiresAt').belowOrEqual(now).delete()
