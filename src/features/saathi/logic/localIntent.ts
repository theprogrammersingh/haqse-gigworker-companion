import type { ToolCall } from '@/lib/ai/tasks/assistant'
import { parseEarningText } from '@/lib/parse/localEarningParser'
import type { DocumentType } from '@/lib/schemas'

export type LocalIntent =
  | { kind: 'tool'; call: ToolCall }
  | { kind: 'doc-expiry'; type: DocumentType }
  | { kind: 'earnings-summary' }
  | { kind: 'help' }

const has = (text: string, words: readonly string[]): boolean => words.some((w) => text.includes(w))
/** Whole-word match for short tokens such as "dl" or "rc". */
const wordIn = (text: string, word: string): boolean =>
  new RegExp(`[\\s,.?!]${word}[\\s,.?!]`).test(text)

const W = {
  complaint: ['complaint', 'shikayat', 'shikaayat', 'शिकायत', 'ਸ਼ਿਕਾਇਤ', 'dispute', 'grievance'],
  payment: [
    'payment',
    'payout',
    'paisa',
    'paise',
    'kam aaye',
    'cut',
    'katauti',
    'भुगतान',
    'पैसे',
    'ਪੈਸੇ',
    'ਭੁਗਤਾਨ',
  ],
  incident: [
    'accident',
    'hadsa',
    'haadsa',
    'theft',
    'chori',
    'harass',
    'हादसा',
    'चोरी',
    'ਹਾਦਸਾ',
    'ਚੋਰੀ',
  ],
  expiry: ['expire', 'expiry', 'kab tak', 'kab khatam', 'valid', 'खत्म', 'समाप्त', 'ਖਤਮ', 'ਮਿਆਦ'],
  scheme: [
    'scheme',
    'yojana',
    'yojna',
    'pension',
    'bima',
    'insurance',
    'eshram',
    'e-shram',
    'योजना',
    'पेंशन',
    'बीमा',
    'ਸਕੀਮ',
    'ਯੋਜਨਾ',
    'ਪੈਨਸ਼ਨ',
    'ਬੀਮਾ',
  ],
  safety: [
    'safety',
    'safe',
    'suraksha',
    'raat',
    'night',
    'barish',
    'baarish',
    'rain',
    'garmi',
    'heat',
    'सुरक्षा',
    'रात',
    'बारिश',
    'गर्मी',
    'ਸੁਰੱਖਿਆ',
    'ਰਾਤ',
    'ਮੀਂਹ',
    'ਗਰਮੀ',
  ],
  earnings: ['kamai', 'kitna kamaya', 'earning', 'income', 'कमाई', 'ਕਮਾਈ'],
} as const

const DOC_WORDS: [DocumentType, readonly string[]][] = [
  ['dl', ['licence', 'license', 'dl', 'लाइसेंस', 'ਲਾਇਸੈਂਸ']],
  ['insurance', ['insurance', 'bima', 'बीमा', 'ਬੀਮਾ']],
  ['rc', ['rc', 'registration', 'आरसी', 'ਆਰਸੀ']],
  ['income', ['income certificate', 'aay praman', 'आय प्रमाण']],
]

function conditionOf(text: string): 'night' | 'heat' | 'rain' | undefined {
  if (has(text, ['raat', 'night', 'रात', 'ਰਾਤ'])) return 'night'
  if (has(text, ['barish', 'baarish', 'rain', 'बारिश', 'ਮੀਂਹ'])) return 'rain'
  if (has(text, ['garmi', 'heat', 'गर्मी', 'ਗਰਮੀ'])) return 'heat'
  return undefined
}

/**
 * Keyword intent matcher for when Gemini is unavailable. Covers the PRD
 * acceptance phrases in Roman Hindi/Punjabi, Devanagari and Gurmukhi.
 */
export function matchIntent(utterance: string, today: string): LocalIntent {
  const text = ` ${utterance.toLowerCase()} `

  if (has(text, W.complaint)) {
    const about = has(text, W.payment) ? 'anomaly' : has(text, W.incident) ? 'incident' : 'other'
    const target =
      about === 'incident' && has(text, ['accident', 'hadsa', 'haadsa', 'हादसा', 'ਹਾਦਸਾ'])
        ? 'insurer'
        : 'platform'
    return {
      kind: 'tool',
      call: {
        name: 'draftGrievance',
        args: { target, about, ...(about === 'other' ? { note: utterance } : {}) },
      },
    }
  }

  if (has(text, W.expiry)) {
    const doc = DOC_WORDS.find(([, words]) =>
      words.some((w) => (w.length <= 3 ? wordIn(text, w) : text.includes(w))),
    )
    if (doc) return { kind: 'doc-expiry', type: doc[0] }
  }

  if (parseEarningText(utterance, today).length > 0)
    return { kind: 'tool', call: { name: 'logEarning', args: { text: utterance } } }
  if (has(text, W.earnings)) return { kind: 'earnings-summary' }
  if (has(text, W.safety)) {
    const condition = conditionOf(text)
    return { kind: 'tool', call: { name: 'showSafetyTips', args: condition ? { condition } : {} } }
  }
  if (has(text, W.scheme))
    return { kind: 'tool', call: { name: 'openScheme', args: { schemeId: '' } } }
  return { kind: 'help' }
}
