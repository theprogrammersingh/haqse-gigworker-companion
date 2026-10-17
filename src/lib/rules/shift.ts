import { NIGHT_END_HOUR, NIGHT_START_HOUR } from '../constants'

export type Condition = 'night' | 'heat' | 'rain'

export interface ShiftContext {
  isNight: boolean
  conditions: Condition[]
  /** SOS gets visual priority on Home. */
  sosProminent: boolean
}

export const isNightHour = (hour: number): boolean =>
  hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR

/** Derives the shift context from the local hour and user-flagged weather. */
export function shiftContext(
  hour: number,
  flags: { heat?: boolean; rain?: boolean } = {},
): ShiftContext {
  const isNight = isNightHour(hour)
  const conditions: Condition[] = []
  if (isNight) conditions.push('night')
  if (flags.heat) conditions.push('heat')
  if (flags.rain) conditions.push('rain')
  return { isNight, conditions, sosProminent: conditions.length > 0 }
}

export type ShiftType = 'morning' | 'day' | 'evening' | 'night'

export function shiftType(hour: number): ShiftType {
  if (isNightHour(hour)) return 'night'
  if (hour < 11) return 'morning'
  if (hour < 17) return 'day'
  return 'evening'
}
