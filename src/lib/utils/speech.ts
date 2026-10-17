import { localeFor } from './money'

/** Reads text aloud with the device voice for the language (never autoplays; user-triggered only). */
export function speak(text: string, language: string, onEnd?: () => void): () => void {
  if (typeof speechSynthesis === 'undefined') return () => undefined
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = localeFor(language)
  u.rate = 0.95
  if (onEnd) u.onend = u.onerror = () => onEnd()
  speechSynthesis.speak(u)
  return () => speechSynthesis.cancel()
}

export const canSpeak = (): boolean => typeof speechSynthesis !== 'undefined'

interface RecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type RecognitionCtor = new () => RecognitionLike

const recognitionCtor = (): RecognitionCtor | undefined => {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const canDictate = (): boolean => recognitionCtor() !== undefined

/** On-device speech-to-text for any text field; resolves with the transcript or ''. */
export function dictate(language: string): { result: Promise<string>; stop: () => void } {
  const Ctor = recognitionCtor()
  if (!Ctor) return { result: Promise.resolve(''), stop: () => undefined }
  const rec = new Ctor()
  rec.lang = localeFor(language)
  rec.interimResults = false
  rec.maxAlternatives = 1
  const result = new Promise<string>((resolve) => {
    let text = ''
    rec.onresult = (e) => {
      text = Array.from(e.results, (r) => r[0]?.transcript ?? '').join(' ')
    }
    rec.onerror = () => resolve(text)
    rec.onend = () => resolve(text)
  })
  rec.start()
  return { result, stop: () => rec.stop() }
}
