import type { DocumentRecord, Earning, Incident, Profile } from '../schemas'
import { CONTEXT_MAX_BYTES } from '../constants'
import { findAnomalies } from '../rules/anomaly'
import { expiringDocuments } from '../rules/expiry'
import { summarizeLedger } from '../rules/ledger'
import { hourlyFloor } from '../rules/lowEarnings'
import { shiftType } from '../rules/shift'
import { byteLength } from '../utils/hash'
import { toISODate } from '../utils/date'

export interface ContextInput {
  profile: Profile
  earnings: readonly Earning[]
  documents: readonly DocumentRecord[]
  incidents: readonly Incident[]
  dismissedAnomalies?: readonly string[]
  now: Date
  screen?: string
}

/** Compact, privacy-minimised summary sent to Gemini instead of raw records. */
export interface AiContext {
  lang: string
  screen?: string
  today: string
  hour: number
  shift: string
  profile: {
    state?: string
    work?: string
    vehicle?: string
    platforms: string[]
    age?: string
    income?: string
  }
  earnings14d: {
    net: number
    hours: number
    netPerHour: number
    floorPerHour: number
    costSharePct: number
    todayNet: number
    weekNet: number
    platforms?: { p: string; net: number; perHr: number }[]
    daily?: number[]
  }
  anomalies: { date: string; platform: string; paid: number; expected: number }[]
  docsAttention: { type: string; daysLeft: number | null }[]
  recentIncidents: { date: string; type: string }[]
}

const r = Math.round

/**
 * Assembles the shared AI context (PRD §4). Pure: same input, same output.
 * Never includes holder names, notes or any identifiers. Drops the least
 * important detail until the JSON fits CONTEXT_MAX_BYTES.
 */
export function buildContext(input: ContextInput): AiContext {
  const today = toISODate(input.now)
  const { profile } = input
  const ledger = summarizeLedger(input.earnings, today)
  const anomalies = findAnomalies(input.earnings, today, input.dismissedAnomalies)

  const ctx: AiContext = {
    lang: profile.language,
    ...(input.screen ? { screen: input.screen } : {}),
    today,
    hour: input.now.getHours(),
    shift: shiftType(input.now.getHours()),
    profile: {
      ...(profile.state ? { state: profile.state } : {}),
      ...(profile.workType ? { work: profile.workType } : {}),
      ...(profile.vehicle ? { vehicle: profile.vehicle } : {}),
      platforms: [...profile.platforms],
      ...(profile.ageBand ? { age: profile.ageBand } : {}),
      ...(profile.incomeBand ? { income: profile.incomeBand } : {}),
    },
    earnings14d: {
      net: r(ledger.periodNet),
      hours: r(ledger.periodHours * 10) / 10,
      netPerHour: r(ledger.netPerHour),
      floorPerHour: hourlyFloor(profile).value,
      costSharePct: r(ledger.costShare * 100),
      todayNet: r(ledger.todayNet),
      weekNet: r(ledger.weekNet),
      platforms: ledger.perPlatform.map((p) => ({
        p: p.platform,
        net: r(p.net),
        perHr: r(p.netPerHour),
      })),
      daily: ledger.trend.map((t) => r(t.net)),
    },
    anomalies: anomalies.map((a) => ({
      date: a.date,
      platform: a.platform,
      paid: a.actualPayout,
      expected: a.expectedPayout,
    })),
    docsAttention: expiringDocuments(input.documents, today).map((d) => ({
      type: d.type,
      daysLeft: d.daysLeft,
    })),
    recentIncidents: [...input.incidents]
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, 3)
      .map((i) => ({ date: toISODate(new Date(i.datetime)), type: i.type })),
  }
  return fitToBudget(ctx)
}

/** Progressively trims detail, least useful first, until under the byte cap. */
function fitToBudget(ctx: AiContext): AiContext {
  const trims: ((c: AiContext) => void)[] = [
    (c) => delete c.earnings14d.daily,
    (c) => (c.recentIncidents = c.recentIncidents.slice(0, 1)),
    (c) => (c.anomalies = c.anomalies.slice(0, 3)),
    (c) => (c.earnings14d.platforms = c.earnings14d.platforms?.slice(0, 3) ?? []),
    (c) => (c.docsAttention = c.docsAttention.slice(0, 3)),
    (c) => (c.anomalies = c.anomalies.slice(0, 1)),
    (c) => delete c.earnings14d.platforms,
  ]
  for (const trim of trims) {
    if (byteLength(JSON.stringify(ctx)) <= CONTEXT_MAX_BYTES) break
    trim(ctx)
  }
  return ctx
}
