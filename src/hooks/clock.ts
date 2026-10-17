import { useSyncExternalStore } from 'react'
import { toISODate } from '@/lib/utils/date'

const TICK_MS = 60_000

/** Minute-resolution clock as an external store, so render stays pure (React Compiler). */
let now = Date.now()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (!timer)
    timer = setInterval(() => {
      now = Date.now()
      listeners.forEach((l) => l())
    }, TICK_MS)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

const getSnapshot = (): number => now

/** Current time in ms, updated every minute. */
export const useNow = (): number => useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

/** Local hour (0–23) for shift-aware UI. */
export const useHour = (): number => new Date(useNow()).getHours()

/** Today's local date; rolls over at midnight. */
export const useToday = (): string => toISODate(new Date(useNow()))
