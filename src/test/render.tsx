import { render, type RenderResult } from '@testing-library/react'
import i18n from 'i18next'
import type { ReactElement } from 'react'
import { initReactI18next } from 'react-i18next'
import { MemoryRouter } from 'react-router'
import en from '@/i18n/en.json'

void i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

/** Renders with English strings and a router, like the app shell does. */
export const renderUi = (ui: ReactElement, path = '/'): RenderResult =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)
