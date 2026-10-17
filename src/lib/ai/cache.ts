import { AI_CACHE_TTL_MS } from '../constants'
import { readCache, writeCache } from '../db/repositories/aiCache'
import { sha256 } from '../utils/hash'
import type { Result } from '../result'

/** Serves a cached AI text for task + input, or computes and stores it (24 h TTL). */
export async function cached(
  task: string,
  input: unknown,
  compute: () => Promise<Result<string>>,
  ttl = AI_CACHE_TTL_MS,
): Promise<Result<string>> {
  const hash = await sha256(`${task}:${JSON.stringify(input)}`)
  const hit = await readCache(hash)
  if (hit !== undefined) return { ok: true, value: hit }
  const res = await compute()
  if (res.ok) await writeCache(hash, task, res.value, Date.now() + ttl)
  return res
}
