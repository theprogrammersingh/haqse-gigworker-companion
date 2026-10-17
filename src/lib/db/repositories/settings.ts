import { defaultSettings, type Settings } from '../../schemas/settings'
import { db } from '../dexie'
import { writeOnboardedHint } from '../hints'

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('app')) ?? defaultSettings()
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch, id: 'app' })
  if (patch.onboarded !== undefined) writeOnboardedHint(patch.onboarded)
}

/** Removes the key and every key-derived value (model list, chosen model). */
export async function removeApiKey(): Promise<void> {
  const { apiKey: _k, model: _m, modelList: _l, ...rest } = await getSettings()
  await db.settings.put(rest)
}

export async function dismissAnomaly(entryId: string): Promise<void> {
  const s = await getSettings()
  if (!s.dismissedAnomalies.includes(entryId))
    await updateSettings({ dismissedAnomalies: [...s.dismissedAnomalies, entryId] })
}

/** Counts app opens (used to delay the install suggestion to the second visit). */
export async function recordLaunch(): Promise<void> {
  const s = await getSettings()
  await updateSettings({ launchCount: (s.launchCount ?? 0) + 1 })
}
