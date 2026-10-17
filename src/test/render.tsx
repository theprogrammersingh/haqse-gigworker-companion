import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

/** Renders with English strings (the default bundle) and a router, like the app shell does. */
export const renderUi = (ui: ReactElement, path = '/'): RenderResult =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)
