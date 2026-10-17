import { Dexie, type EntityTable } from 'dexie'
import type {
  Contact,
  DocumentRecord,
  Earning,
  Grievance,
  Incident,
  Profile,
  Settings,
} from '../schemas'

export interface AiCacheRow {
  hash: string
  task: string
  response: string
  expiresAt: number
}

/** The single local database. Nothing here is ever synced off the device. */
export class HaqSeDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  settings!: EntityTable<Settings, 'id'>
  earnings!: EntityTable<Earning, 'id'>
  incidents!: EntityTable<Incident, 'id'>
  documents!: EntityTable<DocumentRecord, 'id'>
  grievances!: EntityTable<Grievance, 'id'>
  contacts!: EntityTable<Contact, 'id'>
  aiCache!: EntityTable<AiCacheRow, 'hash'>

  constructor(name = 'haqse') {
    super(name)
    this.version(1).stores({
      profile: 'id',
      settings: 'id',
      earnings: 'id, date, platform, [platform+date]',
      incidents: 'id, datetime',
      documents: 'id',
      grievances: 'id, createdAt, status',
      contacts: 'id',
      aiCache: 'hash, expiresAt',
    })
  }
}

export const db = new HaqSeDB()
