import { MODEL_LIST_TTL_MS } from '../constants'
import { err, ok, type Result } from '../result'
import { classifyError, getClient } from './client'

/** Bundled fallback when listing fails (verified 17 Oct 2026, PRD §6). */
export const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
] as const
export const DEFAULT_MODEL = FALLBACK_MODELS[0]
export const ECONOMY_MODEL = 'gemini-3.5-flash-lite'

export interface ModelInfo {
  name: string
  supportedActions?: string[]
}

const VERSION_RE = /gemini-(\d+(?:\.\d+)?)/

/** Keeps Flash models that support generateContent, newest version first; lite after full. */
export function filterFlashModels(models: readonly ModelInfo[]): string[] {
  const names = models
    .filter((m) => /flash/i.test(m.name) && (m.supportedActions ?? []).includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((n) => !/image|tts|audio|live|embedding/i.test(n))
  const version = (n: string): number => Number(VERSION_RE.exec(n)?.[1] ?? 0)
  return [...new Set(names)].sort(
    (a, b) =>
      version(b) - version(a) ||
      Number(a.includes('lite')) - Number(b.includes('lite')) ||
      Number(a.includes('preview')) - Number(b.includes('preview')) ||
      a.localeCompare(b),
  )
}

/** Lists Flash models the key can use. A failed list with a valid key falls back to the bundle. */
export async function listFlashModels(apiKey: string): Promise<Result<string[]>> {
  try {
    const client = await getClient(apiKey)
    const pager = await client.models.list({ config: { pageSize: 100 } })
    const all: ModelInfo[] = []
    for await (const m of pager)
      all.push({
        name: m.name ?? '',
        ...(m.supportedActions ? { supportedActions: m.supportedActions } : {}),
      })
    const flash = filterFlashModels(all)
    return ok(flash.length ? flash : [...FALLBACK_MODELS])
  } catch (e) {
    const kind = classifyError(e)
    return err(kind, e instanceof Error ? e.message : kind)
  }
}

export const isModelListFresh = (fetchedAt: number | undefined, now = Date.now()): boolean =>
  fetchedAt !== undefined && now - fetchedAt < MODEL_LIST_TTL_MS

/** Preferred model first, then the rest of the known list as fallbacks. */
export function modelChain(
  preferred: string | undefined,
  known: readonly string[] | undefined,
): string[] {
  const list = known?.length ? known : FALLBACK_MODELS
  const first = preferred ?? list[0] ?? DEFAULT_MODEL
  return [first, ...list.filter((m) => m !== first)]
}
