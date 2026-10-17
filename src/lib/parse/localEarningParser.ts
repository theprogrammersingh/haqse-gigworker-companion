import type { Platform } from '../schemas'
import { addDays } from '../utils/date'

/** An entry parsed from free text, before the user confirms it. */
export interface EarningDraft {
  date: string
  platform: Platform
  gross: number
  tips: number
  fuel: number
  otherCosts: number
  hours: number
  trips?: number
}

type Field = 'gross' | 'tips' | 'fuel' | 'otherCosts' | 'hours' | 'trips'

const PLATFORM_WORDS: Record<string, Platform> = {
  zomato: 'zomato',
  swiggy: 'swiggy',
  uber: 'uber',
  ola: 'ola',
  rapido: 'rapido',
  blinkit: 'blinkit',
  zepto: 'zepto',
  porter: 'porter',
  urban: 'urbancompany',
  urbancompany: 'urbancompany',
  ज़ोमैटो: 'zomato',
  जोमैटो: 'zomato',
  स्विगी: 'swiggy',
  उबर: 'uber',
  ओला: 'ola',
  ਜ਼ੋਮੈਟੋ: 'zomato',
  ਸਵਿੱਗੀ: 'swiggy',
}

const FIELD_WORDS: Record<string, Field> = {
  petrol: 'fuel',
  diesel: 'fuel',
  fuel: 'fuel',
  cng: 'fuel',
  tel: 'fuel',
  tael: 'fuel',
  gas: 'fuel',
  पेट्रोल: 'fuel',
  डीजल: 'fuel',
  ਪੈਟਰੋਲ: 'fuel',
  ਡੀਜ਼ਲ: 'fuel',
  tip: 'tips',
  tips: 'tips',
  bakshish: 'tips',
  टिप: 'tips',
  ਟਿੱਪ: 'tips',
  ghante: 'hours',
  ghanta: 'hours',
  ghanteyan: 'hours',
  hour: 'hours',
  hours: 'hours',
  hrs: 'hours',
  hr: 'hours',
  घंटे: 'hours',
  घंटा: 'hours',
  ਘੰਟੇ: 'hours',
  ਘੰਟਾ: 'hours',
  trip: 'trips',
  trips: 'trips',
  order: 'trips',
  orders: 'trips',
  ride: 'trips',
  rides: 'trips',
  delivery: 'trips',
  deliveries: 'trips',
  sawari: 'trips',
  ऑर्डर: 'trips',
  ਆਰਡਰ: 'trips',
  toll: 'otherCosts',
  parking: 'otherCosts',
  repair: 'otherCosts',
  khana: 'otherCosts',
  food: 'otherCosts',
  commission: 'otherCosts',
  kharcha: 'otherCosts',
  kharch: 'otherCosts',
  खर्चा: 'otherCosts',
  ਖਰਚਾ: 'otherCosts',
  kamai: 'gross',
  kamaya: 'gross',
  kamaye: 'gross',
  earned: 'gross',
  earning: 'gross',
  payout: 'gross',
  mila: 'gross',
  mile: 'gross',
  कमाई: 'gross',
  कमाए: 'gross',
  ਕਮਾਈ: 'gross',
}

const YESTERDAY = new Set(['kal', 'yesterday', 'कल', 'ਕੱਲ੍ਹ', 'ਕੱਲ'])
const MULTIPLIERS: Record<string, number> = {
  hazaar: 1000,
  hazar: 1000,
  thousand: 1000,
  k: 1000,
  sau: 100,
  hundred: 100,
  हज़ार: 1000,
  हजार: 1000,
  सौ: 100,
  ਹਜ਼ਾਰ: 1000,
  ਸੌ: 100,
}

/** Converts Devanagari/Gurmukhi digits to ASCII and strips currency and separators. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966))
    .replace(/[੦-੯]/g, (d) => String(d.charCodeAt(0) - 0x0a66))
    .replace(/(\d),(\d)/g, '$1$2')
    .replace(/₹|(?<![a-z])(?:rs\.?|rupaye|rupees|rupay)(?![a-z])|रुपये|ਰੁਪਏ/g, ' ')
    .replace(/(\d)([a-zऀ-੿])/g, '$1 $2')
}

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'field'; field: Field }
  | { kind: 'platform'; platform: Platform }

export function tokenize(text: string): { tokens: Token[]; yesterday: boolean } {
  const words = normalizeText(text)
    .split(/[\s,.;:!?/()-]+/)
    .filter(Boolean)
  const tokens: Token[] = []
  let yesterday = false
  for (const w of words) {
    const last = tokens.at(-1)
    if (/^\d+(\.\d+)?$/.test(w)) tokens.push({ kind: 'num', value: Number(w) })
    else if (MULTIPLIERS[w] && last?.kind === 'num') last.value *= MULTIPLIERS[w]
    else if (PLATFORM_WORDS[w]) tokens.push({ kind: 'platform', platform: PLATFORM_WORDS[w] })
    else if (FIELD_WORDS[w]) tokens.push({ kind: 'field', field: FIELD_WORDS[w] })
    else if (YESTERDAY.has(w)) yesterday = true
  }
  return { tokens, yesterday }
}

const blank = (date: string, platform: Platform): EarningDraft => ({
  date,
  platform,
  gross: 0,
  tips: 0,
  fuel: 0,
  otherCosts: 0,
  hours: 0,
})

/** Folds costs logged before any platform name into the first real entry. */
function mergeOrphans(drafts: EarningDraft[]): EarningDraft[] {
  const orphan = drafts[0]
  const target = drafts.find((d) => d.platform !== 'other')
  if (!orphan || !target || orphan === target || orphan.platform !== 'other' || orphan.gross > 0)
    return drafts
  target.fuel += orphan.fuel
  target.otherCosts += orphan.otherCosts
  target.tips += orphan.tips
  target.hours += orphan.hours
  if (orphan.trips) target.trips = (target.trips ?? 0) + orphan.trips
  return drafts.slice(1)
}

/**
 * Deterministic parser for short spoken/typed logs such as
 * "aaj Zomato se 1400, petrol 250, 9 ghante". A number right after a platform
 * is its payout; other numbers bind to the nearest keyword (before or after);
 * a leftover number is payout. Used without an API key and as a pre-fill.
 * Returns [] when no payout is found.
 */
export function parseEarningText(text: string, today: string): EarningDraft[] {
  const { tokens, yesterday } = tokenize(text)
  const date = yesterday ? addDays(today, -1) : today
  const drafts: EarningDraft[] = []
  let current: EarningDraft | undefined
  let pendingNum: number | undefined
  let pendingField: Field | undefined
  let prev: Token | undefined

  const ensure = (): EarningDraft => {
    if (!current) {
      current = blank(date, 'other')
      drafts.push(current)
    }
    return current
  }
  const assign = (field: Field, value: number): void => {
    const d = ensure()
    if (field === 'trips') d.trips = (d.trips ?? 0) + value
    else d[field] += value
  }

  for (const t of tokens) {
    if (t.kind === 'platform') {
      const carried =
        pendingNum !== undefined && !(current && current.gross === 0) ? pendingNum : undefined
      if (pendingNum !== undefined && carried === undefined) assign('gross', pendingNum)
      current = blank(date, t.platform)
      if (carried !== undefined) current.gross = carried
      drafts.push(current)
      pendingNum = undefined
      pendingField = undefined
    } else if (t.kind === 'field') {
      if (pendingNum !== undefined) assign(t.field, pendingNum)
      else pendingField = t.field
      pendingNum = undefined
    } else if (prev?.kind === 'platform' && current?.gross === 0) {
      current.gross = t.value
    } else if (pendingField) {
      assign(pendingField, t.value)
      pendingField = undefined
    } else {
      if (pendingNum !== undefined) assign('gross', pendingNum)
      pendingNum = t.value
    }
    prev = t
  }
  if (pendingNum !== undefined) assign('gross', pendingNum)
  return mergeOrphans(drafts).filter((d) => d.gross > 0 || d.tips > 0)
}
