import type { Profile } from '../schemas'
import { DEFAULT_MIN_HOURLY, STATE_MIN_HOURLY } from '../constants'

export interface HourlyFloor {
  value: number
  source: 'target' | 'state' | 'default'
}

/** User target wins, then the state reference, then the default floor. */
export function hourlyFloor(profile: Pick<Profile, 'minHourlyTarget' | 'state'>): HourlyFloor {
  if (profile.minHourlyTarget) return { value: profile.minHourlyTarget, source: 'target' }
  const ref = profile.state ? STATE_MIN_HOURLY[profile.state] : undefined
  if (ref) return { value: ref, source: 'state' }
  return { value: DEFAULT_MIN_HOURLY, source: 'default' }
}

/** True when there is logged work and net per hour is under the floor. */
export const isLowEarning = (netPerHour: number, hours: number, floor: HourlyFloor): boolean =>
  hours > 0 && netPerHour < floor.value
