import { changeLanguage } from '@/i18n'
import { updateProfile } from '@/lib/db'
import type { Language } from '@/lib/schemas/enums'

/** Native names, so each option is readable by its own speakers. */
export const LANGUAGE_LABELS: Record<Language, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  hi: { native: 'हिंदी', english: 'Hindi' },
  pa: { native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
}

export async function setLanguage(lang: Language): Promise<void> {
  await Promise.all([changeLanguage(lang), updateProfile({ language: lang })])
}
