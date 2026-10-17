import type { DocumentRecord, DocumentType } from '../schemas'
import { EXPIRY_WINDOW_DAYS } from '../constants'
import { daysBetween } from '../utils/date'

export type ExpiryStatus = 'unknown' | 'valid' | 'expiring' | 'expired'

export interface ExpiryInfo {
  status: ExpiryStatus
  /** Days until expiry; negative when expired; null when unknown. */
  daysLeft: number | null
}

/** Classifies an expiry date against today with the EXPIRY_WINDOW_DAYS warning window. */
export function expiryStatus(expiry: string | undefined | null, today: string): ExpiryInfo {
  if (!expiry) return { status: 'unknown', daysLeft: null }
  const daysLeft = daysBetween(today, expiry)
  if (daysLeft < 0) return { status: 'expired', daysLeft }
  if (daysLeft <= EXPIRY_WINDOW_DAYS) return { status: 'expiring', daysLeft }
  return { status: 'valid', daysLeft }
}

/** Document types that carry an expiry date worth tracking. */
export const EXPIRING_TYPES: ReadonlySet<DocumentType> = new Set([
  'dl',
  'rc',
  'insurance',
  'income',
])

export type DocumentState = 'missing' | 'ok' | 'expiring' | 'expired'

export interface DocumentCheck {
  type: DocumentType
  state: DocumentState
  daysLeft: number | null
  record: DocumentRecord | undefined
}

/** Combines "do I have it" with expiry into one checklist state. */
export function checkDocument(
  type: DocumentType,
  record: DocumentRecord | undefined,
  today: string,
): DocumentCheck {
  if (!record?.have) return { type, state: 'missing', daysLeft: null, record }
  const { status, daysLeft } = expiryStatus(record.expiry, today)
  const state: DocumentState =
    status === 'expired' ? 'expired' : status === 'expiring' ? 'expiring' : 'ok'
  return { type, state, daysLeft, record }
}

/** Documents needing attention (expired first, then soonest expiring). */
export function expiringDocuments(
  records: readonly DocumentRecord[],
  today: string,
): DocumentCheck[] {
  return records
    .map((r) => checkDocument(r.id, r, today))
    .filter((c) => c.state === 'expired' || c.state === 'expiring')
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
}
