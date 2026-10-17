import { describe, expect, it } from 'vitest'
import { detectPlatform, type InstallMethod } from './platform'

const UA = {
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SM-A146B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  firefoxAndroid: 'Mozilla/5.0 (Android 14; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0',
  edgeAndroid:
    'Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 EdgA/141.0.0.0',
  operaAndroid:
    'Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 OPR/90.0.0.0',
  whatsappWebview:
    'Mozilla/5.0 (Linux; Android 14; K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.0.0 Mobile Safari/537.36 WhatsApp/2.25',
  instagramIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0',
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0 Mobile/15E148 Safari/604.1',
  ipadAsMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  winEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
  winFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
}

const method = (
  ua: string,
  opts: { touch?: number; standalone?: boolean; prompt?: boolean } = {},
): InstallMethod =>
  detectPlatform({
    userAgent: ua,
    maxTouchPoints: opts.touch ?? 0,
    standalone: opts.standalone ?? false,
    hasPromptEvent: opts.prompt ?? false,
  }).method

describe('detectPlatform', () => {
  it.each([
    ['chromeAndroid', 'chromium-menu'],
    ['samsung', 'samsung-menu'],
    ['firefoxAndroid', 'firefox-android-menu'],
    ['edgeAndroid', 'chromium-menu'],
    ['operaAndroid', 'chromium-menu'],
    ['whatsappWebview', 'open-in-browser'],
    ['instagramIos', 'open-in-browser'],
    ['iphoneSafari', 'ios-share'],
    ['iphoneChrome', 'ios-share'],
    ['macSafari', 'mac-safari-dock'],
    ['macChrome', 'chromium-menu'],
    ['winEdge', 'chromium-menu'],
    ['winFirefox', 'unsupported'],
  ] as const)('%s → %s', (key, expected) => {
    expect(method(UA[key])).toBe(expected)
  })

  it('treats an iPad that reports a Mac user agent as iOS', () => {
    expect(method(UA.ipadAsMac, { touch: 5 })).toBe('ios-share')
    expect(
      detectPlatform({
        userAgent: UA.ipadAsMac,
        maxTouchPoints: 5,
        standalone: false,
        hasPromptEvent: false,
      }).os,
    ).toBe('ios')
  })

  it('prefers the one-tap prompt when the browser offered it', () => {
    expect(method(UA.chromeAndroid, { prompt: true })).toBe('prompt')
    expect(method(UA.samsung, { prompt: true })).toBe('prompt')
  })

  it('reports installed when running standalone, whatever the browser', () => {
    expect(method(UA.iphoneSafari, { standalone: true })).toBe('installed')
    expect(method(UA.chromeAndroid, { standalone: true, prompt: true })).toBe('installed')
  })

  it('names the browser and OS', () => {
    expect(
      detectPlatform({
        userAgent: UA.samsung,
        maxTouchPoints: 5,
        standalone: false,
        hasPromptEvent: false,
      }),
    ).toMatchObject({
      os: 'android',
      browser: 'samsung',
    })
    expect(
      detectPlatform({
        userAgent: UA.winEdge,
        maxTouchPoints: 0,
        standalone: false,
        hasPromptEvent: false,
      }),
    ).toMatchObject({
      os: 'desktop',
      browser: 'edge',
    })
  })
})
