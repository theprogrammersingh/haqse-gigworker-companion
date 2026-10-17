import { describe, expect, it } from 'vitest'
import { shouldShowInstallNudge } from './nudge'

const now = Date.UTC(2026, 9, 17)
const day = 86_400_000

describe('shouldShowInstallNudge', () => {
  it('waits for the second launch', () => {
    expect(
      shouldShowInstallNudge({ method: 'prompt', launchCount: 1, dismissedAt: undefined, now }),
    ).toBe(false)
    expect(
      shouldShowInstallNudge({ method: 'prompt', launchCount: 2, dismissedAt: undefined, now }),
    ).toBe(true)
  })

  it('never nags once installed or where install is impossible', () => {
    expect(
      shouldShowInstallNudge({ method: 'installed', launchCount: 9, dismissedAt: undefined, now }),
    ).toBe(false)
    expect(
      shouldShowInstallNudge({
        method: 'unsupported',
        launchCount: 9,
        dismissedAt: undefined,
        now,
      }),
    ).toBe(false)
  })

  it('comes back three days after "Not now"', () => {
    expect(
      shouldShowInstallNudge({
        method: 'ios-share',
        launchCount: 5,
        dismissedAt: now - 2 * day,
        now,
      }),
    ).toBe(false)
    expect(
      shouldShowInstallNudge({
        method: 'ios-share',
        launchCount: 5,
        dismissedAt: now - 3 * day,
        now,
      }),
    ).toBe(true)
  })
})
