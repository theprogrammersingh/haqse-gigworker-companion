import type { Language } from '../../schemas'
import { ok, type Result } from '../../result'
import type { AiConfig } from '../client'
import { EXPLAIN_FORM, READ_DOCUMENT, baseInstruction } from '../prompts'
import { answerSchema, documentReadSchema, scrubNumbers, type DocumentRead } from '../schemas'
import { inlinePart, runStructured, textPart } from './run'

/**
 * Reads a document photo held only in memory. Any ID-like number the model
 * returns anyway is scrubbed before it reaches the UI (PRD FR-17).
 */
export async function readDocument(
  config: AiConfig,
  image: { base64: string; mimeType: string },
  language: Language,
  signal?: AbortSignal,
): Promise<Result<DocumentRead>> {
  const res = await runStructured(config, {
    schema: documentReadSchema,
    systemInstruction: `${baseInstruction(language)}\n\n${READ_DOCUMENT}`,
    parts: [textPart('Document photo:'), inlinePart(image.base64, image.mimeType)],
    thinking: 'low',
    signal,
  })
  if (!res.ok) return res
  return ok({
    ...res.value,
    holderName: scrubNumbers(res.value.holderName),
    notes: scrubNumbers(res.value.notes),
  })
}

/** Plain-language explanation of any form or letter photo. */
export async function explainForm(
  config: AiConfig,
  image: { base64: string; mimeType: string },
  language: Language,
  signal?: AbortSignal,
): Promise<Result<string>> {
  const res = await runStructured(config, {
    schema: answerSchema,
    systemInstruction: `${baseInstruction(language)}\n\n${EXPLAIN_FORM}`,
    parts: [textPart('Form or letter photo:'), inlinePart(image.base64, image.mimeType)],
    thinking: 'low',
    signal,
  })
  return res.ok ? ok(scrubNumbers(res.value.answer)) : res
}
