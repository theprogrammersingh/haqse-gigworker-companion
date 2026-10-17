/**
 * Tiny synchronous mirror of "has this device finished onboarding?" in localStorage.
 * IndexedDB stays the source of truth; the hint only lets startup pick the right
 * first route before the database answers. Missing or stale hints are harmless.
 */
const ONBOARDED_KEY = 'haqse.onboarded'

export function readOnboardedHint(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1'
  } catch {
    return false
  }
}

export function writeOnboardedHint(onboarded: boolean): void {
  try {
    if (onboarded) localStorage.setItem(ONBOARDED_KEY, '1')
    else localStorage.removeItem(ONBOARDED_KEY)
  } catch {
    // Private mode: startup simply falls back to the database check.
  }
}
