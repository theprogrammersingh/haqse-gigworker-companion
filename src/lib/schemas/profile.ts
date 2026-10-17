import { z } from 'zod'
import {
  AGE_BANDS,
  INCOME_BANDS,
  LANGUAGES,
  PLATFORMS,
  STATES,
  VEHICLES,
  WORK_TYPES,
} from './enums'

export const languageSchema = z.enum(LANGUAGES)
export const workTypeSchema = z.enum(WORK_TYPES)
export const vehicleSchema = z.enum(VEHICLES)
export const ageBandSchema = z.enum(AGE_BANDS)
export const incomeBandSchema = z.enum(INCOME_BANDS)
export const stateSchema = z.enum(STATES)
export const platformSchema = z.enum(PLATFORMS)

export const profileSchema = z.object({
  id: z.literal('me'),
  language: languageSchema,
  state: stateSchema.optional(),
  workType: workTypeSchema.optional(),
  platforms: z.array(platformSchema),
  vehicle: vehicleSchema.optional(),
  ageBand: ageBandSchema.optional(),
  incomeBand: incomeBandSchema.optional(),
  minHourlyTarget: z.number().positive().optional(),
})

export type Profile = z.infer<typeof profileSchema>

/** A profile field the app may need to ask for in context. */
export type ProfileField = 'state' | 'workType' | 'vehicle' | 'ageBand' | 'incomeBand' | 'platforms'
