import type { InstallMethod } from '@/lib/pwa/platform'
import type { IconName } from '@/ui'

/** Methods that have step-by-step instructions, in "other browsers" display order. */
export const GUIDED_METHODS = [
  'chromium-menu',
  'ios-share',
  'samsung-menu',
  'firefox-android-menu',
  'mac-safari-dock',
  'open-in-browser',
] as const satisfies readonly InstallMethod[]

export type GuidedMethod = (typeof GUIDED_METHODS)[number]

/** The control to look for at each step; text lives in i18n under pwa.steps.<method>.<n>. */
export const STEP_ICONS: Record<GuidedMethod, readonly IconName[]> = {
  'chromium-menu': ['more-vertical', 'install', 'check'],
  'ios-share': ['share-ios', 'plus-square', 'check'],
  'samsung-menu': ['menu', 'plus-square', 'smartphone'],
  'firefox-android-menu': ['more-vertical', 'install', 'check'],
  'mac-safari-dock': ['file', 'plus-square', 'check'],
  'open-in-browser': ['more-vertical', 'external', 'install'],
}

export const isGuided = (m: InstallMethod): m is GuidedMethod =>
  (GUIDED_METHODS as readonly string[]).includes(m)
