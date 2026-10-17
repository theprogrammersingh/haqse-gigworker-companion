import { useEffect, useState } from 'react'
import type { Localized, Right, Scheme } from '@/lib/schemas'

export interface SafetyTip {
  id: string
  conditions: ('night' | 'heat' | 'rain' | 'general')[]
  vehicles: string[]
  text: Localized
}

/** Curated JSON is code-split and fetched once per session (cache-first in the service worker). */
const loaders = {
  schemes: () => import('@/data/schemes.json').then((m) => m.default as Scheme[]),
  rights: () => import('@/data/rights.json').then((m) => m.default as Right[]),
  tips: () => import('@/data/safety-tips.json').then((m) => m.default as SafetyTip[]),
}

type Key = keyof typeof loaders
type Value<K extends Key> = Awaited<ReturnType<(typeof loaders)[K]>>

const cache = new Map<Key, Promise<unknown>>()

export function loadStatic<K extends Key>(key: K): Promise<Value<K>> {
  let p = cache.get(key)
  if (!p) {
    p = loaders[key]()
    cache.set(key, p)
  }
  return p as Promise<Value<K>>
}

export function useStatic<K extends Key>(key: K): Value<K> | undefined {
  const [value, setValue] = useState<Value<K>>()
  useEffect(() => {
    let live = true
    void loadStatic(key).then((v) => live && setValue(v))
    return () => {
      live = false
    }
  }, [key])
  return value
}

export const useSchemes = (): Scheme[] | undefined => useStatic('schemes')
export const useRights = (): Right[] | undefined => useStatic('rights')
export const useSafetyTips = (): SafetyTip[] | undefined => useStatic('tips')
