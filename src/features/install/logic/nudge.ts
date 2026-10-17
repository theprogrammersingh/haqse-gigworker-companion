import { INSTALL_NUDGE_DELAY_DAYS } from '@/lib/constants'
import type { InstallMethod } from '@/lib/pwa/platform'

const DAY_MS = 86_400_000

interface NudgeInput {
  method: InstallMethod
  launchCount: number
  dismissedAt: number | undefined
  now: number
}

/**
 * Show the Home install suggestion from the second app open onward, when the
 * browser can install at all, and not again for a few days after "Not now".
 */
export function shouldShowInstallNudge({
  method,
  launchCount,
  dismissedAt,
  now,
}: NudgeInput): boolean {
  if (method === 'installed' || method === 'unsupported') return false
  if (launchCount < 2) return false
  return dismissedAt === undefined || now - dismissedAt >= INSTALL_NUDGE_DELAY_DAYS * DAY_MS
}
