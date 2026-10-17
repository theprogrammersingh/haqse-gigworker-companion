/** Option lists with no runtime dependencies, safe to import from the initial bundle. */

export const LANGUAGES = ['en', 'hi', 'pa'] as const
export const WORK_TYPES = ['delivery', 'ride', 'domestic', 'construction', 'other'] as const
export const VEHICLES = ['bike', 'car', 'auto', 'cycle', 'none'] as const
/** Bands align with scheme age limits (16, 18, 40, 50, 59/60). */
export const AGE_BANDS = ['16-17', '18-29', '30-40', '41-50', '51-59', '60+'] as const
export const INCOME_BANDS = ['upto-15k', '15k-25k', 'above-25k'] as const
export const STATES = ['PB', 'DL', 'HR', 'RJ', 'KA', 'MH', 'UP', 'TN', 'WB', 'TG', 'OTHER'] as const
export const PLATFORMS = [
  'zomato',
  'swiggy',
  'uber',
  'ola',
  'rapido',
  'blinkit',
  'zepto',
  'porter',
  'urbancompany',
  'other',
] as const
export const EARNING_SOURCES = ['voice', 'text', 'image', 'manual', 'seed'] as const
export const INCIDENT_TYPES = [
  'accident',
  'harassment',
  'theft',
  'unsafe-area',
  'payment-dispute',
  'deactivation',
  'other',
] as const
export const DOCUMENT_TYPES = [
  'aadhaar',
  'pan',
  'dl',
  'rc',
  'insurance',
  'bank',
  'eshram',
  'ration',
  'income',
] as const
export const GRIEVANCE_TARGETS = ['platform', 'insurer', 'labour', 'police'] as const
export const GRIEVANCE_STATUSES = ['draft', 'sent', 'resolved'] as const

export type Language = (typeof LANGUAGES)[number]
export type WorkType = (typeof WORK_TYPES)[number]
export type Vehicle = (typeof VEHICLES)[number]
export type AgeBand = (typeof AGE_BANDS)[number]
export type IncomeBand = (typeof INCOME_BANDS)[number]
export type StateCode = (typeof STATES)[number]
export type Platform = (typeof PLATFORMS)[number]
export type EarningSource = (typeof EARNING_SOURCES)[number]
export type IncidentType = (typeof INCIDENT_TYPES)[number]
export type DocumentType = (typeof DOCUMENT_TYPES)[number]
export type GrievanceTarget = (typeof GRIEVANCE_TARGETS)[number]
export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number]
