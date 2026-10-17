import { useSyncExternalStore } from 'react'
import { LANGUAGES, type Language } from '@/lib/schemas/enums'
import en from './en.json'

/**
 * Minimal i18n (replaces i18next + react-i18next, ~47 KB raw): nested keys,
 * {{interpolation}}, Intl plural suffixes (_one/_other), arrays via returnObjects,
 * a per-call `lng`, and English fallback. English ships in the entry chunk so the
 * first paint never waits on a locale request; Hindi and Punjabi load on demand.
 */

type Bundle = Record<string, unknown>

export interface TOptions {
  /** Answer in a language other than the UI language. */
  lng?: Language
  /** Picks the plural form and is available as {{count}}. */
  count?: number
  /** Return arrays/objects instead of a string. */
  returnObjects?: boolean
  [variable: string]: unknown
}

export type TFunction = (key: string, options?: TOptions) => string

export interface I18n {
  language: Language
  t: TFunction
}

const bundles: Partial<Record<Language, Bundle>> = { en }

const loaders: Record<Exclude<Language, 'en'>, () => Promise<Bundle>> = {
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

const HINT_KEY = 'haqse.lang'
let current: Language = 'en'
const listeners = new Set<() => void>()
const pluralRules = new Map<Language, Intl.PluralRules>()

function lookup(bundle: Bundle | undefined, key: string): unknown {
  let node: unknown = bundle
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return node
}

function pluralCategory(lang: Language, count: number): string {
  let rules = pluralRules.get(lang)
  if (!rules) {
    rules = new Intl.PluralRules(lang)
    pluralRules.set(lang, rules)
  }
  return rules.select(count)
}

function resolve(lang: Language, key: string, count: number | undefined): unknown {
  const bundle = bundles[lang]
  if (count !== undefined) {
    const plural =
      lookup(bundle, `${key}_${pluralCategory(lang, count)}`) ?? lookup(bundle, `${key}_other`)
    if (plural !== undefined) return plural
  }
  return lookup(bundle, key)
}

const interpolate = (text: string, vars: TOptions): string =>
  text.replace(/{{(\w+)}}/g, (_, name: string) => {
    const v = vars[name]
    return v === undefined || v === null ? '' : String(v)
  })

/** Translates `key` in `lang`, falling back to English, then to the key itself. */
export function translate(lang: Language, key: string, options: TOptions = {}): string {
  const target = options.lng ?? lang
  const value = resolve(target, key, options.count) ?? resolve('en', key, options.count)
  if (value === undefined) return key
  if (options.returnObjects) return value as string
  return typeof value === 'string' ? interpolate(value, options) : key
}

/**
 * One snapshot per language. Its identity changes when the language changes, so
 * React Compiler memoisation that depends on `t` or `i18n` re-renders the text.
 */
const snapshots = new Map<Language, I18n>()
function snapshot(lang: Language): I18n {
  let s = snapshots.get(lang)
  if (!s) {
    s = { language: lang, t: (key, options) => translate(lang, key, options) }
    snapshots.set(lang, s)
  }
  return s
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Same shape as react-i18next's hook: `{ t, i18n }`. */
export function useTranslation(): { t: TFunction; i18n: I18n } {
  const lang = useSyncExternalStore(subscribe, () => current)
  const s = snapshot(lang)
  return { t: s.t, i18n: s }
}

/** Non-React access (toasts from event listeners, tests). */
export const i18n = {
  get language(): Language {
    return current
  },
  t: (key: string, options?: TOptions): string => translate(current, key, options),
}

async function ensureBundle(lang: Language): Promise<void> {
  if (lang !== 'en' && !bundles[lang]) bundles[lang] = await loaders[lang]()
}

function readHint(): Language {
  try {
    const v = localStorage.getItem(HINT_KEY)
    return (LANGUAGES as readonly string[]).includes(v ?? '') ? (v as Language) : 'en'
  } catch {
    return 'en'
  }
}

/** Switches the UI language, loading its strings and script font first. */
export async function changeLanguage(lang: Language): Promise<void> {
  await ensureBundle(lang)
  current = lang
  document.documentElement.lang = lang
  void fonts[lang]?.()
  try {
    localStorage.setItem(HINT_KEY, lang)
  } catch {
    // Private mode: the profile still remembers the language.
  }
  listeners.forEach((l) => l())
}

/**
 * Starts in the last-used language (a localStorage hint) so the first render
 * does not wait for IndexedDB. Instant for English; one small fetch otherwise.
 */
export function initI18n(): Promise<void> {
  return changeLanguage(readHint())
}
