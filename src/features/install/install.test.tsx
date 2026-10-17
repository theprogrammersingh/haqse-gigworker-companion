import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePwa, type BeforeInstallPromptEvent } from '@/stores/pwa'
import { renderUi } from '@/test/render'
import { InstallCard } from './InstallCard'
import { InstallSteps } from './InstallSteps'
import { UpdateBanner } from './UpdateBanner'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36'

function setUserAgent(ua: string): void {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua)
}

beforeEach(() => {
  window.matchMedia = vi
    .fn<(q: string) => { matches: boolean }>()
    .mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
  usePwa.setState({
    promptEvent: null,
    installed: false,
    needRefresh: false,
    updateDeferred: false,
  })
})
afterEach(() => vi.restoreAllMocks())

describe('InstallCard', () => {
  it('uses the native prompt when the browser offers one', async () => {
    setUserAgent(CHROME_ANDROID)
    const prompt = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    }) as BeforeInstallPromptEvent
    usePwa.setState({ promptEvent: event })
    const user = userEvent.setup()
    renderUi(<InstallCard />)
    await user.click(screen.getByRole('button', { name: 'Install app' }))
    expect(prompt).toHaveBeenCalledOnce()
    expect(usePwa.getState().promptEvent).toBeNull()
  })

  it('shows Share-sheet steps on iPhone instead of an install button', async () => {
    setUserAgent(IPHONE)
    const user = userEvent.setup()
    renderUi(<InstallCard />)
    expect(screen.queryByRole('button', { name: 'Install app' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'How to install' }))
    expect(await screen.findByText(/install from the Share menu/)).toBeInTheDocument()
    expect(screen.getByText(/Scroll down and tap “Add to Home Screen”/)).toBeInTheDocument()
  })

  it('says installed when running as the app', () => {
    setUserAgent(CHROME_ANDROID)
    window.matchMedia = vi.fn<(q: string) => { matches: boolean }>((q) => ({
      matches: q.includes('standalone'),
    })) as unknown as typeof window.matchMedia
    renderUi(<InstallCard />)
    expect(screen.getByText('HaqSe is installed')).toBeInTheDocument()
  })

  it('offers "Not now" on the Home suggestion', async () => {
    setUserAgent(IPHONE)
    const onDismiss = vi.fn<() => void>()
    const user = userEvent.setup()
    const { container } = renderUi(<InstallCard onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button', { name: 'Not now' }))
    expect(onDismiss).toHaveBeenCalledOnce()
    const res = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(res.violations.map((v) => v.id)).toEqual([])
  })
})

describe('InstallSteps', () => {
  it('resolves every step text for each browser', () => {
    renderUi(<InstallSteps method="samsung-menu" />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[1]).toHaveTextContent('Tap “Add page to”.')
    expect(items.every((li) => !li.textContent?.includes('pwa.steps'))).toBe(true)
  })
})

describe('UpdateBanner', () => {
  it('appears when a new version is waiting and applies it on tap', async () => {
    const updateServiceWorker = vi
      .fn<(reload: boolean) => Promise<void>>()
      .mockResolvedValue(undefined)
    usePwa.setState({ needRefresh: true, updateServiceWorker })
    const user = userEvent.setup()
    renderUi(<UpdateBanner />)
    await user.click(screen.getByRole('button', { name: 'Update now' }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('hides for the session after "Later"', async () => {
    usePwa.setState({ needRefresh: true })
    const user = userEvent.setup()
    renderUi(<UpdateBanner />)
    await user.click(screen.getByRole('button', { name: 'Later' }))
    await waitFor(() => expect(screen.queryByText('A new version of HaqSe is ready.')).toBeNull())
  })
})

describe('checkForUpdate', () => {
  it('reports offline, waiting and up-to-date states', async () => {
    const update = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const reg = { waiting: null, installing: null, update } as unknown as ServiceWorkerRegistration
    usePwa.setState({ registration: reg })
    expect(await usePwa.getState().checkForUpdate()).toBe('up-to-date')
    expect(update).toHaveBeenCalledOnce()
    usePwa.setState({
      registration: { ...reg, waiting: {} } as unknown as ServiceWorkerRegistration,
    })
    expect(await usePwa.getState().checkForUpdate()).toBe('updating')
    expect(usePwa.getState().needRefresh).toBe(true)
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(await usePwa.getState().checkForUpdate()).toBe('offline')
  })
})
