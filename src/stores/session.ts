import { create } from 'zustand'
import type { ToolCall } from '@/lib/ai/tasks/assistant'

/** Ephemeral UI/session state. Persistent data lives in Dexie, never here. */
interface SessionState {
  online: boolean
  /** Route-level screen name, given to the assistant as context. */
  screen: string
  saathiOpen: boolean
  /** Text to prefill the earnings log with (from Saathi or Home). */
  pendingLogText: string | null
  /** Weather flags for safety tips (user-set, this session only). */
  weather: { heat: boolean; rain: boolean }
  setOnline: (online: boolean) => void
  setScreen: (screen: string) => void
  setSaathiOpen: (open: boolean) => void
  setPendingLogText: (text: string | null) => void
  setWeather: (w: Partial<SessionState['weather']>) => void
}

export const useSession = create<SessionState>((set, get) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  screen: 'home',
  saathiOpen: false,
  pendingLogText: null,
  weather: { heat: false, rain: false },
  setOnline: (online) => set({ online }),
  setScreen: (screen) => set({ screen }),
  setSaathiOpen: (saathiOpen) => set({ saathiOpen }),
  setPendingLogText: (pendingLogText) => set({ pendingLogText }),
  setWeather: (w) => set({ weather: { ...get().weather, ...w } }),
}))

export type { ToolCall }
