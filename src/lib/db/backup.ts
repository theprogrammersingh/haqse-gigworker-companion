import { db } from './dexie'

/** Everything the user owns, as JSON. The API key is deliberately excluded. */
export async function exportAll(): Promise<string> {
  const [profile, earnings, incidents, documents, grievances, contacts] = await Promise.all([
    db.profile.toArray(),
    db.earnings.toArray(),
    db.incidents.toArray(),
    db.documents.toArray(),
    db.grievances.toArray(),
    db.contacts.toArray(),
  ])
  return JSON.stringify(
    {
      app: 'haqse',
      exportedAt: new Date().toISOString(),
      profile,
      earnings,
      incidents,
      documents,
      grievances,
      contacts,
    },
    null,
    2,
  )
}

/** Wipes every table, including the key and cache (PRD FR-5). */
export async function deleteAll(): Promise<void> {
  await db.transaction('rw', db.tables, () => Promise.all(db.tables.map((t) => t.clear())))
}
