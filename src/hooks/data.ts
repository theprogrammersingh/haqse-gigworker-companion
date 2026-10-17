import { useLiveQuery } from 'dexie-react-hooks'
import { db, earningsSince, getProfile, getSettings } from '@/lib/db'
import type {
  Contact,
  DocumentRecord,
  Earning,
  Grievance,
  Incident,
  Profile,
  Settings,
} from '@/lib/schemas'
import { LOOKBACK_DAYS } from '@/lib/constants'

export const useProfile = (): Profile | undefined => useLiveQuery(getProfile, [])
export const useSettings = (): Settings | undefined => useLiveQuery(getSettings, [])

/** Two lookback windows, so medians for the oldest days in view still have history. */
export function useEarnings(today: string): Earning[] | undefined {
  return useLiveQuery(() => earningsSince(today, LOOKBACK_DAYS * 2), [today])
}

export const useDocuments = (): DocumentRecord[] | undefined =>
  useLiveQuery(() => db.documents.toArray(), [])
export const useIncidents = (): Incident[] | undefined =>
  useLiveQuery(() => db.incidents.orderBy('datetime').reverse().limit(50).toArray(), [])
export const useGrievances = (): Grievance[] | undefined =>
  useLiveQuery(() => db.grievances.orderBy('createdAt').reverse().toArray(), [])
export const useContacts = (): Contact[] | undefined =>
  useLiveQuery(() => db.contacts.toArray(), [])
