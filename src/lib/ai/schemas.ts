import { z } from 'zod'
import { DOCUMENT_TYPES, PLATFORMS } from '../schemas/enums'

const amount = z.number().min(0).max(200_000)

export const parsedEarningsSchema = z.object({
  entries: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        platform: z.enum(PLATFORMS),
        gross: amount,
        tips: amount,
        fuel: amount,
        otherCosts: amount,
        hours: z.number().min(0).max(24),
        trips: z.number().int().min(0).max(500),
      }),
    )
    .max(10),
})

export const documentReadSchema = z.object({
  type: z.enum([...DOCUMENT_TYPES, 'unknown']),
  holderName: z.string().max(100),
  expiry: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
  notes: z.string().max(600),
})

export const grievanceDraftSchema = z.object({
  subject: z.string().min(3).max(200),
  simple: z.string().min(10).max(3000),
  formal: z.string().min(20).max(6000),
})

export const answerSchema = z.object({ answer: z.string().min(1).max(3000) })

export type ParsedEarnings = z.infer<typeof parsedEarningsSchema>
export type DocumentRead = z.infer<typeof documentReadSchema>
export type GrievanceDraft = z.infer<typeof grievanceDraftSchema>

/** JSON Schema for Gemini's responseJsonSchema, without the $schema marker. */
export function toGeminiSchema(schema: z.ZodType): unknown {
  const { $schema: _drop, ...rest } = z.toJSONSchema(schema, { target: 'draft-7' }) as Record<
    string,
    unknown
  >
  return rest
}

/** Parses model JSON text and validates it; any mismatch is rejected, never saved. */
export function parseJson<T>(schema: z.ZodType<T>, text: string): T | null {
  try {
    const result = schema.safeParse(JSON.parse(text))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/** Hides anything shaped like an ID/account number: 8+ digits (spaces allowed) or a PAN. Dates survive. */
export const scrubNumbers = (text: string): string =>
  text.replace(/\b\d(?: ?\d){7,}\b/g, '[hidden]').replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '[hidden]')
