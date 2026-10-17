import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n'
import { Icon, type IconName } from './Icon'

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation()
  return (
    <output className="inline-flex items-center gap-2 text-muted">
      <span
        className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden
      />
      {label ?? t('common.loading')}
    </output>
  )
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: IconName
  title: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line px-4 py-8 text-center">
      <span className="text-muted">
        <Icon name={icon} size={36} />
      </span>
      <p className="font-semibold">{title}</p>
      {children}
    </div>
  )
}

/** Page title (one h1 per screen) with an optional line of help text and actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      {actions}
    </header>
  )
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-6 mb-2 text-lg font-bold">
      {children}
    </h2>
  )
}

/** Stat with a big number and a plain label underneath. */
export function Stat({ label, value, icon }: { label: string; value: ReactNode; icon?: IconName }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <dt className="flex items-center gap-1 text-sm text-muted">
        {icon && <Icon name={icon} size={16} />}
        {label}
      </dt>
      <dd className="text-xl font-bold tabular-nums">{value}</dd>
    </div>
  )
}
