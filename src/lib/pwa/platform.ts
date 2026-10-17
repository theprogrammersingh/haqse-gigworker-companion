export type Os = 'android' | 'ios' | 'desktop'
export type Browser =
  'chrome' | 'edge' | 'samsung' | 'opera' | 'firefox' | 'safari' | 'inapp' | 'other'

/** How this browser installs a PWA, most direct first. */
export type InstallMethod =
  | 'installed'
  | 'prompt'
  | 'open-in-browser'
  | 'ios-share'
  | 'mac-safari-dock'
  | 'firefox-android-menu'
  | 'samsung-menu'
  | 'chromium-menu'
  | 'unsupported'

export interface PlatformInput {
  userAgent: string
  maxTouchPoints: number
  /** Running as an installed app (display-mode standalone or navigator.standalone). */
  standalone: boolean
  /** A beforeinstallprompt event has been captured. */
  hasPromptEvent: boolean
}

export interface Platform {
  os: Os
  browser: Browser
  installed: boolean
  method: InstallMethod
}

const INAPP_RE = /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv\)|GSA\//

export function detectOs(ua: string, maxTouchPoints: number): Os {
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  // iPadOS 13+ reports a desktop Mac user agent; touch support gives it away.
  if (/Macintosh/.test(ua) && maxTouchPoints > 1) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

export function detectBrowser(ua: string): Browser {
  if (INAPP_RE.test(ua)) return 'inapp'
  if (/SamsungBrowser/.test(ua)) return 'samsung'
  if (/EdgA?\/|EdgiOS\//.test(ua)) return 'edge'
  if (/OPR\/|OPT\/|Opera/.test(ua)) return 'opera'
  if (/Firefox\/|FxiOS\//.test(ua)) return 'firefox'
  if (/Chrome\/|CriOS\//.test(ua)) return 'chrome'
  if (/Safari\//.test(ua)) return 'safari'
  return 'other'
}

/** Picks the install path for this browser (see plan: one tap where possible, steps elsewhere). */
export function detectPlatform(input: PlatformInput): Platform {
  const os = detectOs(input.userAgent, input.maxTouchPoints)
  const browser = detectBrowser(input.userAgent)
  const base = { os, browser, installed: input.standalone }
  if (input.standalone) return { ...base, method: 'installed' }
  if (input.hasPromptEvent) return { ...base, method: 'prompt' }
  if (browser === 'inapp') return { ...base, method: 'open-in-browser' }
  // Since iOS 16.4 every iOS browser can "Add to Home Screen" from the share sheet.
  if (os === 'ios') return { ...base, method: 'ios-share' }
  if (os === 'desktop' && browser === 'safari') return { ...base, method: 'mac-safari-dock' }
  if (browser === 'firefox')
    return { ...base, method: os === 'android' ? 'firefox-android-menu' : 'unsupported' }
  if (browser === 'samsung') return { ...base, method: 'samsung-menu' }
  if (browser === 'chrome' || browser === 'edge' || browser === 'opera')
    return { ...base, method: 'chromium-menu' }
  return { ...base, method: 'unsupported' }
}

/** Reads the live browser environment. */
export function currentPlatform(hasPromptEvent: boolean): Platform {
  const standalone =
    ['standalone', 'fullscreen', 'minimal-ui'].some(
      (m) => matchMedia(`(display-mode: ${m})`).matches,
    ) || (navigator as Navigator & { standalone?: boolean }).standalone === true
  return detectPlatform({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    standalone,
    hasPromptEvent,
  })
}

/** Browser names for "these steps are for <browser>". */
export const BROWSER_NAMES: Record<Browser, string> = {
  chrome: 'Chrome',
  edge: 'Edge',
  samsung: 'Samsung Internet',
  opera: 'Opera',
  firefox: 'Firefox',
  safari: 'Safari',
  inapp: 'in-app browser',
  other: 'your browser',
}
