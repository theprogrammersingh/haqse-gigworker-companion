import { useId, type ReactNode } from 'react'

/** Checkbox styled as a switch (role="switch" so state is announced as on/off). */
export function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: ReactNode
  hint?: ReactNode
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </label>
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="relative h-8 w-14 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-field bg-surface-2 transition-colors before:absolute before:top-0.5 before:left-0.5 before:size-6 before:rounded-full before:bg-field before:transition-transform checked:border-brand checked:bg-brand checked:before:translate-x-6 checked:before:bg-brand-ink"
      />
    </div>
  )
}
