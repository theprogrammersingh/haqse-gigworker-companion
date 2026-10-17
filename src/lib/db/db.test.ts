import { beforeEach, describe, expect, it } from 'vitest'
import { findAnomalies } from '../rules/anomaly'
import { expiringDocuments } from '../rules/expiry'
import { toISODate } from '../utils/date'
import {
  allContacts,
  allDocuments,
  db,
  deleteAll,
  dismissAnomaly,
  earningsSince,
  exportAll,
  getProfile,
  getSettings,
  loadDemoData,
  readCache,
  recentIncidents,
  removeApiKey,
  updateSettings,
  writeCache,
} from '.'

const today = toISODate(new Date())

beforeEach(() => deleteAll())

describe('demo data', () => {
  it('loads one anomaly, one expiring document and one incident (FR-4)', async () => {
    await loadDemoData(today)
    const earnings = await earningsSince(today)
    expect(earnings.length).toBeGreaterThan(14)
    expect(findAnomalies(earnings, today)).toHaveLength(1)
    expect(expiringDocuments(await allDocuments(), today).map((d) => d.type)).toEqual(['dl'])
    expect(await recentIncidents()).toHaveLength(1)
    expect(await allContacts()).toHaveLength(1)
    expect((await getProfile()).state).toBe('PB')
  })
})

describe('settings', () => {
  it('removes the key and its model data', async () => {
    await updateSettings({
      apiKey: 'k',
      model: 'm',
      modelList: { models: ['m'], fetchedAt: 1 },
      onboarded: true,
    })
    await removeApiKey()
    const s = await getSettings()
    expect(s.apiKey).toBeUndefined()
    expect(s.model).toBeUndefined()
    expect(s.onboarded).toBe(true)
  })

  it('records dismissed anomalies once', async () => {
    await dismissAnomaly('x')
    await dismissAnomaly('x')
    expect((await getSettings()).dismissedAnomalies).toEqual(['x'])
  })
})

describe('backup', () => {
  it('exports without the API key and deletes everything', async () => {
    await updateSettings({ apiKey: 'secret-key' })
    await loadDemoData(today)
    const json = await exportAll()
    expect(json).not.toContain('secret-key')
    expect(JSON.parse(json).earnings.length).toBeGreaterThan(0)
    await deleteAll()
    expect(await db.earnings.count()).toBe(0)
    expect((await getSettings()).apiKey).toBeUndefined()
  })
})

describe('aiCache', () => {
  it('expires rows after their TTL', async () => {
    await writeCache('h', 'explain', 'answer', 1000)
    expect(await readCache('h', 500)).toBe('answer')
    expect(await readCache('h', 1500)).toBeUndefined()
  })
})
