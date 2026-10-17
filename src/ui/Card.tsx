import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import { Icon, type IconName } from './Icon'
import { TONE_STYLES, type Tone } from './tones'

export function Card({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cx('rounded-2xl border border-line bg-surface p-4', className)} {...rest} />
  )
}

interface AlertCardProps {
  tone: Tone
  title: ReactNode
  children?: ReactNode
  actions?: ReactNode
  icon?: IconName
  headingLevel?: 2 | 3
}

/** Status card: colour is never the only signal, so it always has an icon and a title. */
export function AlertCard({
  tone,
  title,
  children,
  actions,
  icon,
  headingLevel = 3,
}: AlertCardProps) {
  const s = TONE_STYLES[tone]
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <section className={cx('rounded-2xl border-l-4 p-4', s.box)}>
      <div className="flex gap-3">
        <span className={cx('mt-0.5 shrink-0', s.text)}>
          <Icon name={icon ?? s.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <Heading className="font-bold">{title}</Heading>
          {children && <div className="mt-1 text-ink">{children}</div>}
        </div>
      </div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </section>
  )
}

/** Small labelled status chip (icon + text, never colour alone). */
export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const s = TONE_STYLES[tone]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-semibold',
        s.box,
        s.text,
      )}
    >
      <Icon name={s.icon} size={16} />
      {children}
    </span>
  )
}
