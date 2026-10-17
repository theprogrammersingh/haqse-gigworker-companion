import { z } from 'zod'
import { DOCUMENT_TYPES, STATES, WORK_TYPES } from './enums'

const localized = z.object({ en: z.string(), hi: z.string(), pa: z.string() })

export const eligibilitySchema = z.object({
  ageMin: z.number().optional(),
  ageMax: z.number().optional(),
  states: z.array(z.enum(STATES)).optional(),
  workTypes: z.array(z.enum(WORK_TYPES)).optional(),
  /** Monthly income ceiling in ₹. */
  maxMonthlyIncome: z.number().optional(),
  /** Only for app-based platform workers. */
  platformWorker: z.boolean().optional(),
})

export const schemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(['central', 'state']),
  summary: localized,
  benefits: z.array(z.string()),
  eligibility: eligibilitySchema,
  documents: z.array(z.enum(DOCUMENT_TYPES)),
  howToApply: z.string(),
  url: z.url(),
  helpline: z.string(),
  verifiedOn: z.string(),
})

export const rightSchema = z.object({
  id: z.string(),
  icon: z.string(),
  title: localized,
  body: localized,
  source: z.string(),
  url: z.url(),
})

export type Localized = z.infer<typeof localized>
export type EligibilityRules = z.infer<typeof eligibilitySchema>
export type Scheme = z.infer<typeof schemeSchema>
export type Right = z.infer<typeof rightSchema>
