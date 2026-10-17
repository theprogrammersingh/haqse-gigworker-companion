import { create } from 'zustand'

/** The non-standard event Chromium fires when the app is installable. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'
export type UpdateCheck = 'updating' | 'up-to-date' | 'offline' | 'unavailable'

interface PwaState {
  promptEvent: BeforeInstallPromptEvent | null
  installed: boolean
  needRefresh: boolean
  /** Hidden for this session after "Later". */
  updateDeferred: boolean
  registration: ServiceWorkerRegistration | null
  /** Set by PwaProvider: activates the waiting worker and reloads. */
  updateServiceWorker: (reload: boolean) => Promise<void>
  setPromptEvent: (e: BeforeInstallPromptEvent | null) => void
  setInstalled: () => void
  setNeedRefresh: (v: boolean) => void
  deferUpdate: () => void
  setRegistration: (r: ServiceWorkerRegistration) => void
  setUpdater: (fn: (reload: boolean) => Promise<void>) => void
  install: () => Promise<InstallOutcome>
  applyUpdate: () => Promise<void>
  checkForUpdate: () => Promise<UpdateCheck>
}

/** Install and update state for the PWA. One store, fed by PwaProvider. */
export const usePwa = create<PwaState>((set, get) => ({
  promptEvent: null,
  installed: false,
  needRefresh: false,
  updateDeferred: false,
  registration: null,
  updateServiceWorker: async () => undefined,
  setPromptEvent: (promptEvent) => set({ promptEvent }),
  setInstalled: () => set({ installed: true, promptEvent: null }),
  setNeedRefresh: (needRefresh) =>
    set({ needRefresh, ...(needRefresh ? { updateDeferred: false } : {}) }),
  deferUpdate: () => set({ updateDeferred: true }),
  setRegistration: (registration) => set({ registration }),
  setUpdater: (updateServiceWorker) => set({ updateServiceWorker }),

  install: async () => {
    const event = get().promptEvent
    if (!event) return 'unavailable'
    await event.prompt()
    const { outcome } = await event.userChoice
    // A prompt event can only be used once.
    set({ promptEvent: null })
    return outcome
  },

  applyUpdate: () => get().updateServiceWorker(true),

  checkForUpdate: async () => {
    const reg = get().registration
    if (!reg) return 'unavailable'
    if (!navigator.onLine) return 'offline'
    if (reg.waiting) {
      set({ needRefresh: true, updateDeferred: false })
      return 'updating'
    }
    await reg.update()
    if (reg.installing || reg.waiting) return 'updating'
    return 'up-to-date'
  },
}))
