import type { Language, Profile } from '../../schemas'
import { db } from '../dexie'

export const emptyProfile = (language: Language = 'en'): Profile => ({
  id: 'me',
  language,
  platforms: [],
})

export async function getProfile(): Promise<Profile> {
  return (await db.profile.get('me')) ?? emptyProfile()
}

/** Merges fields into the single profile row, creating it when absent. */
export async function updateProfile(patch: Partial<Omit<Profile, 'id'>>): Promise<void> {
  const current = await getProfile()
  await db.profile.put({ ...current, ...patch, id: 'me' })
}

/** Replaces the whole profile row (use to clear optional fields). */
export const saveProfile = (profile: Profile): Promise<unknown> =>
  db.profile.put({ ...profile, id: 'me' })
