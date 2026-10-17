import type {
  Contact,
  DocumentRecord,
  DocumentType,
  Grievance,
  GrievanceStatus,
  Incident,
} from '../../schemas'
import { db } from '../dexie'

export const putIncident = (i: Incident): Promise<unknown> => db.incidents.put(i)
export const deleteIncident = (id: string): Promise<void> => db.incidents.delete(id)
export const recentIncidents = (limit = 20): Promise<Incident[]> =>
  db.incidents.orderBy('datetime').reverse().limit(limit).toArray()

/** Upserts a document; ID numbers and images are never part of the record. */
export const putDocument = (d: DocumentRecord): Promise<unknown> => db.documents.put(d)
export const deleteDocument = (id: DocumentType): Promise<void> => db.documents.delete(id)
export const allDocuments = (): Promise<DocumentRecord[]> => db.documents.toArray()

export const putGrievance = (g: Grievance): Promise<unknown> => db.grievances.put(g)
export const deleteGrievance = (id: string): Promise<void> => db.grievances.delete(id)
export const setGrievanceStatus = (id: string, status: GrievanceStatus): Promise<number> =>
  db.grievances.update(id, { status })
export const allGrievances = (): Promise<Grievance[]> =>
  db.grievances.orderBy('createdAt').reverse().toArray()

export const putContact = (c: Contact): Promise<unknown> => db.contacts.put(c)
export const deleteContact = (id: string): Promise<void> => db.contacts.delete(id)
export const allContacts = (): Promise<Contact[]> => db.contacts.toArray()

/** Links an incident to the grievance raised from it. */
export const linkIncident = (incidentId: string, grievanceId: string): Promise<number> =>
  db.incidents.update(incidentId, { linkedGrievanceId: grievanceId })
