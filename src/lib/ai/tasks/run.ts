import type { Part } from '@google/genai'
import type { z } from 'zod'
import { err, ok, type Result } from '../../result'
import { generate, type AiConfig, type ThinkingLevelName } from '../client'
import { parseJson, toGeminiSchema } from '../schemas'

export interface StructuredRequest<T> {
  schema: z.ZodType<T>
  systemInstruction: string
  parts: Part[]
  thinking: ThinkingLevelName
  signal?: AbortSignal | undefined
}

/** Runs a structured task: JSON schema in, Zod-validated object out. */
export async function runStructured<T>(
  config: AiConfig,
  req: StructuredRequest<T>,
): Promise<Result<T>> {
  const res = await generate(config, {
    systemInstruction: req.systemInstruction,
    parts: req.parts,
    thinking: req.thinking,
    jsonSchema: toGeminiSchema(req.schema),
    ...(req.signal ? { signal: req.signal } : {}),
  })
  if (!res.ok) return res
  const value = parseJson(req.schema, res.value.text)
  return value === null ? err('bad-output', 'The answer was not in the expected shape.') : ok(value)
}

export const textPart = (text: string): Part => ({ text })
export const inlinePart = (base64: string, mimeType: string): Part => ({
  inlineData: { data: base64, mimeType },
})
