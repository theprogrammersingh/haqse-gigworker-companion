import { getSettings } from '../db/repositories/settings'
import type { AiConfig } from './client'
import { ECONOMY_MODEL, modelChain } from './models'

/** Reads the user's key and model chain from local settings. */
export async function aiConfig(task: 'parse' | 'chat' | 'draft' = 'chat'): Promise<AiConfig> {
  const s = await getSettings()
  const chain = modelChain(s.model, s.modelList?.models)
  const models =
    s.economyMode && task === 'parse'
      ? [ECONOMY_MODEL, ...chain.filter((m) => m !== ECONOMY_MODEL)]
      : chain
  return { apiKey: s.apiKey, models }
}
