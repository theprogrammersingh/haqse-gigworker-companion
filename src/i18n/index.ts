import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Language } from '@/lib/schemas'

type Bundle = Record<string, unknown>

/** Each locale is its own chunk; only the active one (plus English fallback) is fetched. */
const bundles: Record<Language, () => Promise<Bundle>> = {
  en: () => import('./en.json').then((m) => m.default),
  hi: () => import('./hi.json').then((m) => m.default),
  pa: () => import('./pa.json').then((m) => m.default),
}

/** Script fonts are self-hosted, subset to their script, and loaded only for that language. */
const fonts: Partial<Record<Language, () => Promise<unknown>>> = {
  hi: () =>
    Promise.all([
      import('@fontsource/noto-sans-devanagari/devanagari-400.css'),
      import('@fontsource/noto-sans-devanagari/devanagari-700.css'),
    ]),
  pa: () =>
    Promise.all([
      import('@fontsource/noto-sans-gurmukhi/gurmukhi-400.css'),
      import('@fontsource/noto-sans-gurmukhi/gurmukhi-700.css'),
    ]),
}

async function ensureBundle(lang: Language): Promise<void> {
  if (!i18n.hasResourceBundle(lang, 'translation'))
    i18n.addResourceBundle(lang, 'translation', await bundles[lang]())
}

function applyDocumentLanguage(lang: Language): void {
  document.documentElement.lang = lang
  void fonts[lang]?.()
}

export async function initI18n(lang: Language): Promise<void> {
  await i18n.use(initReactI18next).init({
    lng: lang,
    fallbackLng: 'en',
    resources: {},
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
  await Promise.all([ensureBundle(lang), lang === 'en' ? undefined : ensureBundle('en')])
  await i18n.changeLanguage(lang)
  applyDocumentLanguage(lang)
}

export async function changeLanguage(lang: Language): Promise<void> {
  await ensureBundle(lang)
  await i18n.changeLanguage(lang)
  applyDocumentLanguage(lang)
}

export { i18n }
