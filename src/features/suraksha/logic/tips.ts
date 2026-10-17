import type { Condition } from '@/lib/rules/shift'
import type { Vehicle } from '@/lib/schemas'

export interface TipLike {
  id: string
  conditions: readonly string[]
  vehicles: readonly string[]
}

/** Maximum tips shown at once, so the list stays readable. */
export const MAX_TIPS = 6

const fitsVehicle = (tip: TipLike, vehicle: Vehicle | undefined): boolean =>
  tip.vehicles.length === 0 || (vehicle !== undefined && tip.vehicles.includes(vehicle))

/**
 * Tips for the current conditions first (night/heat/rain), then general ones,
 * filtered to the worker's vehicle (FR-24). Tips change with the time of day.
 */
export function selectTips<T extends TipLike>(
  tips: readonly T[],
  conditions: readonly Condition[],
  vehicle: Vehicle | undefined,
): T[] {
  const active = new Set<string>(conditions)
  const matching = tips.filter((t) => fitsVehicle(t, vehicle))
  const situational = matching.filter((t) => t.conditions.some((c) => active.has(c)))
  const general = matching.filter((t) => t.conditions.includes('general'))
  return [...situational, ...general].slice(0, MAX_TIPS)
}
