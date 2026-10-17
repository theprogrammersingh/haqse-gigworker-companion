import type { Language } from '../../schemas'
import { parseEarningText, type EarningDraft } from '../../parse/localEarningParser'
import type { Result } from '../../result'
import type { AiConfig } from '../client'
import { PARSE_EARNINGS, baseInstruction, dataBlock } from '../prompts'
import { parsedEarningsSchema } from '../schemas'
import { inlinePart, runStructured, textPart } from './run'

export type EarningInput =
  { kind: 'text'; text: string } | { kind: 'audio' | 'image'; base64: string; mimeType: string }

export interface ParsedResult {
  drafts: EarningDraft[]
  /** 'local' when the rule-based parser answered instead of Gemini. */
  via: 'ai' | 'local'
}

const toDraft = (e: EarningDraft & { trips: number }): EarningDraft => {
  const { trips, ...rest } = e
  return trips > 0 ? { ...rest, trips } : rest
}

/**
 * Turns voice, text or a payout screenshot into draft entries for the user to confirm.
 * Text falls back to the local parser whenever AI is unavailable or returns nothing usable.
 */
export async function parseEarnings(
  config: AiConfig,
  input: EarningInput,
  today: string,
  language: Language,
  signal?: AbortSignal,
): Promise<Result<ParsedResult>> {
  const parts =
    input.kind === 'text'
      ? [textPart(dataBlock('USER DATA', input.text))]
      : [
          textPart(`Attached ${input.kind === 'audio' ? 'voice note' : 'payout screenshot'}:`),
          inlinePart(input.base64, input.mimeType),
        ]
  const res = await runStructured(config, {
    schema: parsedEarningsSchema,
    systemInstruction: `${baseInstruction(language)}\n\n${PARSE_EARNINGS}\nTODAY: ${today}`,
    parts,
    thinking: 'low',
    signal,
  })
  if (res.ok) {
    const drafts = res.value.entries.filter((e) => e.gross > 0 || e.tips > 0).map(toDraft)
    if (drafts.length) return { ok: true, value: { drafts, via: 'ai' } }
  }
  if (input.kind === 'text' && !(res.ok === false && res.error.kind === 'aborted')) {
    const drafts = parseEarningText(input.text, today)
    if (drafts.length) return { ok: true, value: { drafts, via: 'local' } }
  }
  return res.ok ? { ok: false, error: { kind: 'bad-output', message: 'No earnings found.' } } : res
}
