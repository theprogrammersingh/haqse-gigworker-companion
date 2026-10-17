import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { changeLanguage, translate, useTranslation } from '.'

describe('translate', () => {
  it('interpolates and picks plural forms', () => {
    expect(translate('en', 'kamai.saved', { count: 1 })).toBe('Saved 1 entry')
    expect(translate('en', 'kamai.saved', { count: 3 })).toBe('Saved 3 entries')
    expect(translate('en', 'onboarding.step', { current: 2, total: 3 })).toBe('Step 2 of 3')
  })

  it('returns arrays for returnObjects and falls back to the key', () => {
    const steps = translate('en', 'suraksha.steps.theft', { returnObjects: true }) as unknown
    expect(Array.isArray(steps)).toBe(true)
    expect(translate('en', 'no.such.key')).toBe('no.such.key')
    expect(translate('en', 'pwa.steps.ios-share.1')).toBe(
      'Scroll down and tap “Add to Home Screen”.',
    )
  })

  it('answers in another language with lng, falling back to English while it loads', () => {
    expect(translate('en', 'nav.home', { lng: 'hi' })).toBe('Home')
  })
})

describe('useTranslation', () => {
  it('re-renders with a new t and language after changeLanguage', async () => {
    const { result } = renderHook(() => useTranslation())
    const firstT = result.current.t
    expect(result.current.t('nav.home')).toBe('Home')
    await act(() => changeLanguage('pa'))
    expect(result.current.i18n.language).toBe('pa')
    expect(result.current.t('nav.home')).toBe('ਹੋਮ')
    expect(result.current.t).not.toBe(firstT)
    expect(document.documentElement.lang).toBe('pa')
    expect(localStorage.getItem('haqse.lang')).toBe('pa')
    await act(() => changeLanguage('en'))
  })
})
