import type { DocumentType, IncidentType, Platform } from '../schemas'
import { addDays, fromISODate } from '../utils/date'
import { newId } from '../utils/id'
import { db } from './dexie'
import { updateProfile } from './repositories/profile'
import { updateSettings } from './repositories/settings'

interface SeedFile {
  profile: {
    state: 'PB'
    workType: 'delivery'
    platforms: Platform[]
    vehicle: 'bike'
    ageBand: '18-29'
    incomeBand: 'upto-15k'
  }
  earnings: {
    dayOffset: number
    platform: Platform
    gross: number
    tips: number
    fuel: number
    otherCosts: number
    hours: number
    trips: number
  }[]
  documents: { id: DocumentType; have: boolean; holderName?: string; expiryOffset?: number }[]
  incidents: {
    dayOffset: number
    hour: number
    minute: number
    type: IncidentType
    locationLabel: string
    notes: string
  }[]
  contacts: { name: string; phone: string }[]
}

/**
 * Loads 14 days of realistic demo data with dates rebased to `today`:
 * one payout anomaly, one expiring licence and one night incident (PRD FR-4).
 * Replaces existing earnings, documents, incidents and contacts.
 */
export async function loadDemoData(today: string): Promise<void> {
  const seed = (await import('@/data/seed.json')).default as SeedFile
  const now = Date.now()
  await db.transaction(
    'rw',
    [db.earnings, db.documents, db.incidents, db.contacts, db.profile, db.settings],
    async () => {
      await Promise.all([
        db.earnings.clear(),
        db.documents.clear(),
        db.incidents.clear(),
        db.contacts.clear(),
      ])
      await db.earnings.bulkAdd(
        seed.earnings.map(({ dayOffset, ...e }) => ({
          ...e,
          id: newId(),
          date: addDays(today, dayOffset),
          source: 'seed' as const,
          createdAt: now,
        })),
      )
      await db.documents.bulkAdd(
        seed.documents.map(({ expiryOffset, holderName, ...d }) => ({
          ...d,
          ...(holderName ? { holderName } : {}),
          ...(expiryOffset !== undefined ? { expiry: addDays(today, expiryOffset) } : {}),
          updatedAt: now,
        })),
      )
      await db.incidents.bulkAdd(
        seed.incidents.map(({ dayOffset, hour, minute, ...i }) => {
          const d = fromISODate(addDays(today, dayOffset))
          d.setHours(hour, minute)
          return { ...i, id: newId(), datetime: d.getTime() }
        }),
      )
      await db.contacts.bulkAdd(seed.contacts.map((c) => ({ ...c, id: newId() })))
      await updateProfile(seed.profile)
      await updateSettings({ demoLoaded: true, dismissedAnomalies: [] })
    },
  )
}
