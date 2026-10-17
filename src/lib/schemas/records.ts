import { z } from 'zod'
import {
  DOCUMENT_TYPES,
  EARNING_SOURCES,
  GRIEVANCE_STATUSES,
  GRIEVANCE_TARGETS,
  INCIDENT_TYPES,
} from './enums'
import { platformSchema } from './profile'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
const money = z.number().min(0).max(1_000_000)

export const earningSchema = z.object({
  id: z.string(),
  date: isoDate,
  platform: platformSchema,
  gross: money,
  tips: money,
  fuel: money,
  otherCosts: money,
  hours: z.number().min(0.25).max(24),
  trips: z.number().int().min(0).max(500).optional(),
  source: z.enum(EARNING_SOURCES),
  createdAt: z.number(),
})

export const incidentSchema = z.object({
  id: z.string(),
  datetime: z.number(),
  type: z.enum(INCIDENT_TYPES),
  locationLabel: z.string().max(200),
  notes: z.string().max(2000),
  linkedGrievanceId: z.string().optional(),
})

/** No ID numbers and no images, by design (PRD FR-17). */
export const documentSchema = z.object({
  id: z.enum(DOCUMENT_TYPES),
  holderName: z.string().max(100).optional(),
  expiry: isoDate.optional(),
  have: z.boolean(),
  updatedAt: z.number(),
})

export const grievanceSchema = z.object({
  id: z.string(),
  target: z.enum(GRIEVANCE_TARGETS),
  subject: z.string().max(200),
  simpleText: z.string().max(5000),
  formalText: z.string().max(8000),
  evidenceIds: z.array(z.string()),
  status: z.enum(GRIEVANCE_STATUSES),
  createdAt: z.number(),
})

export const contactSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  phone: z.string().regex(/^\+?[0-9 ]{6,16}$/),
})

export type Earning = z.infer<typeof earningSchema>
export type Incident = z.infer<typeof incidentSchema>
export type DocumentRecord = z.infer<typeof documentSchema>
export type Grievance = z.infer<typeof grievanceSchema>
export type Contact = z.infer<typeof contactSchema>
