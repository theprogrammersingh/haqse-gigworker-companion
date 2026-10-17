import type { AgeBand, DocumentRecord, IncomeBand, Profile, ProfileField, Scheme } from '../schemas'
import { checkDocument, type DocumentCheck } from './expiry'

export type CheckResult = 'pass' | 'partial' | 'fail' | 'unknown'
export type Verdict = 'eligible' | 'likely' | 'need-info' | 'not-eligible'

export interface CriterionCheck {
  criterion: 'age' | 'state' | 'workType' | 'income' | 'platformWorker'
  result: CheckResult
  /** Profile field to ask for when the result is unknown. */
  field: ProfileField
}

export interface SchemeMatch {
  scheme: Scheme
  verdict: Verdict
  checks: CriterionCheck[]
  missingFields: ProfileField[]
}

const AGE_RANGES: Record<AgeBand, readonly [number, number]> = {
  '16-17': [16, 17],
  '18-29': [18, 29],
  '30-40': [30, 40],
  '41-50': [41, 50],
  '51-59': [51, 59],
  '60+': [60, 120],
}

const INCOME_MAX: Record<IncomeBand, number> = {
  'upto-15k': 15_000,
  '15k-25k': 25_000,
  'above-25k': Number.POSITIVE_INFINITY,
}

/** Whole band inside the range → pass; overlapping → partial; disjoint → fail. */
export function checkAge(band: AgeBand | undefined, min = 0, max = 200): CheckResult {
  if (!band) return 'unknown'
  const [lo, hi] = AGE_RANGES[band]
  if (lo >= min && hi <= max) return 'pass'
  if (hi < min || lo > max) return 'fail'
  return 'partial'
}

export function checkIncome(band: IncomeBand | undefined, maxMonthly: number): CheckResult {
  if (!band) return 'unknown'
  return INCOME_MAX[band] <= maxMonthly ? 'pass' : 'fail'
}

export function checkPlatformWorker(profile: Profile): CheckResult {
  if (profile.platforms.some((p) => p !== 'other')) return 'pass'
  if (profile.workType === 'delivery' || profile.workType === 'ride') return 'pass'
  if (!profile.workType) return 'unknown'
  return 'fail'
}

const inList = <T>(value: T | undefined, list: readonly T[]): CheckResult =>
  value === undefined ? 'unknown' : list.includes(value) ? 'pass' : 'fail'

/** Runs every criterion the scheme defines against the profile. */
export function runChecks(scheme: Scheme, profile: Profile): CriterionCheck[] {
  const r = scheme.eligibility
  const checks: CriterionCheck[] = []
  if (r.ageMin !== undefined || r.ageMax !== undefined)
    checks.push({
      criterion: 'age',
      field: 'ageBand',
      result: checkAge(profile.ageBand, r.ageMin, r.ageMax),
    })
  if (r.states)
    checks.push({ criterion: 'state', field: 'state', result: inList(profile.state, r.states) })
  if (r.workTypes)
    checks.push({
      criterion: 'workType',
      field: 'workType',
      result: inList(profile.workType, r.workTypes),
    })
  if (r.maxMonthlyIncome !== undefined)
    checks.push({
      criterion: 'income',
      field: 'incomeBand',
      result: checkIncome(profile.incomeBand, r.maxMonthlyIncome),
    })
  if (r.platformWorker)
    checks.push({
      criterion: 'platformWorker',
      field: 'workType',
      result: checkPlatformWorker(profile),
    })
  return checks
}

/** Any fail → not eligible; any unknown → need info; any partial → likely; else eligible. */
export function verdictOf(checks: readonly CriterionCheck[]): Verdict {
  const results = new Set(checks.map((c) => c.result))
  if (results.has('fail')) return 'not-eligible'
  if (results.has('unknown')) return 'need-info'
  if (results.has('partial')) return 'likely'
  return 'eligible'
}

export function matchScheme(scheme: Scheme, profile: Profile): SchemeMatch {
  const checks = runChecks(scheme, profile)
  const missingFields = [
    ...new Set(checks.filter((c) => c.result === 'unknown').map((c) => c.field)),
  ]
  return { scheme, verdict: verdictOf(checks), checks, missingFields }
}

const VERDICT_ORDER: Record<Verdict, number> = {
  eligible: 0,
  likely: 1,
  'need-info': 2,
  'not-eligible': 3,
}

/** Ranks schemes Eligible → Likely → Need info → Not eligible; central before state within a tier. */
export function rankSchemes(schemes: readonly Scheme[], profile: Profile): SchemeMatch[] {
  return schemes
    .map((s) => matchScheme(s, profile))
    .sort(
      (a, b) =>
        VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] ||
        Number(b.scheme.level === 'state') - Number(a.scheme.level === 'state'),
    )
}

/** Required documents that are missing, expiring or expired for a scheme. */
export function documentGaps(
  scheme: Scheme,
  records: readonly DocumentRecord[],
  today: string,
): DocumentCheck[] {
  const byType = new Map(records.map((r) => [r.id, r]))
  return scheme.documents
    .map((t) => checkDocument(t, byType.get(t), today))
    .filter((c) => c.state !== 'ok')
}

/** Applying is blocked while a required document is expired or missing (PRD §4). */
export const isApplyBlocked = (gaps: readonly DocumentCheck[]): boolean =>
  gaps.some((g) => g.state === 'expired' || g.state === 'missing')
