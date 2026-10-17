import { create } from 'zustand'
import { UNDO_MS } from '@/lib/constants'

export type ToastTone = 'info' | 'ok' | 'warn' | 'bad'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
  /** Shown as a button, e.g. Undo. */
  action?: { label: string; run: () => void }
}

interface ToastState {
  toasts: Toast[]
  show: (
    message: string,
    opts?: { tone?: ToastTone; action?: Toast['action']; ms?: number },
  ) => void
  dismiss: (id: number) => void
}

let nextId = 1

/** Polite, auto-dismissing notices; 5 s by default so Undo is reachable (PRD §7). */
export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, opts = {}) => {
    const id = nextId++
    const toast: Toast = {
      id,
      message,
      tone: opts.tone ?? 'info',
      ...(opts.action ? { action: opts.action } : {}),
    }
    set({ toasts: [...get().toasts.slice(-2), toast] })
    setTimeout(() => get().dismiss(id), opts.ms ?? UNDO_MS)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

/** Imperative helper for non-component code paths. */
export const toast = (...args: Parameters<ToastState['show']>): void =>
  useToasts.getState().show(...args)
