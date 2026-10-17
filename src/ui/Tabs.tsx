import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from './cx'
import { Icon, type IconName } from './Icon'

interface Tab<T extends string> {
  id: T
  label: string
  icon?: IconName
}

interface TabsProps<T extends string> {
  label: string
  tabs: readonly Tab<T>[]
  active: T
  onChange: (id: T) => void
  children: ReactNode
}

/** WAI-ARIA tabs with arrow-key navigation; only the active panel renders. */
export function Tabs<T extends string>({ label, tabs, active, onChange, children }: TabsProps<T>) {
  const base = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number): void => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (i + delta + tabs.length) % tabs.length
    const tab = tabs[next]
    if (!tab) return
    onChange(tab.id)
    refs.current[next]?.focus()
  }
  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-surface-2 p-1"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${tab.id}`}
            aria-selected={tab.id === active}
            aria-controls={`${base}-panel`}
            tabIndex={tab.id === active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cx(
              'flex min-h-tap flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-sm font-semibold',
              tab.id === active ? 'bg-surface text-brand shadow' : 'text-muted',
            )}
          >
            {tab.icon && <Icon name={tab.icon} size={20} />}
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${active}`}
        className="pt-4"
      >
        {children}
      </div>
    </div>
  )
}
