import { currentPlatform, type Platform } from '@/lib/pwa/platform'
import { usePwa } from '@/stores/pwa'

/** The live install situation, re-evaluated when a prompt arrives or the app gets installed. */
export function usePlatform(): Platform {
  const hasPrompt = usePwa((s) => s.promptEvent !== null)
  const installedNow = usePwa((s) => s.installed)
  const p = currentPlatform(hasPrompt)
  return installedNow ? { ...p, installed: true, method: 'installed' } : p
}
