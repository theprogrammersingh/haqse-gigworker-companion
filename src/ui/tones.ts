import type { IconName } from './Icon'

export type Tone = 'info' | 'ok' | 'warn' | 'bad'

export const TONE_STYLES: Record<Tone, { box: string; text: string; icon: IconName }> = {
  info: { box: 'bg-brand-soft border-brand', text: 'text-ink', icon: 'info' },
  ok: { box: 'bg-ok-soft border-ok', text: 'text-ok', icon: 'check-circle' },
  warn: { box: 'bg-warn-soft border-warn', text: 'text-warn', icon: 'alert' },
  bad: { box: 'bg-bad-soft border-bad', text: 'text-bad', icon: 'alert' },
}
