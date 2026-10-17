import { useId, type ReactNode } from 'react'
import { cx } from './cx'
import { Icon, type IconName } from './Icon'

interface Option<T extends string> {
  value: T
  label: string
  icon?: IconName
}

interface ChipGroupProps<T extends string> {
  legend: ReactNode
  options: readonly Option<T>[]
  hint?: ReactNode
  /** Visually hide the legend when a heading already labels the group. */
  hideLegend?: boolean
}

interface SingleProps<T extends string> extends ChipGroupProps<T> {
  multiple?: false
  value: T | undefined
  onChange: (v: T) => void
}

interface MultiProps<T extends string> extends ChipGroupProps<T> {
  multiple: true
  value: readonly T[]
  onChange: (v: T[]) => void
}

/** Big tappable choices built on real radio/checkbox inputs (keyboard and screen-reader native). */
export function ChipGroup<T extends string>(props: SingleProps<T> | MultiProps<T>) {
  const name = useId()
  const isOn = (v: T): boolean => (props.multiple ? props.value.includes(v) : props.value === v)
  const toggle = (v: T): void => {
    if (props.multiple)
      props.onChange(isOn(v) ? props.value.filter((x) => x !== v) : [...props.value, v])
    else props.onChange(v)
  }
  return (
    <fieldset className="space-y-2">
      <legend className={cx('font-semibold', props.hideLegend && 'sr-only')}>{props.legend}</legend>
      {props.hint && <p className="text-sm text-muted">{props.hint}</p>}
      <div className="flex flex-wrap gap-2">
        {props.options.map((o) => (
          <label
            key={o.value}
            className={cx(
              'inline-flex min-h-tap cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2',
              isOn(o.value)
                ? 'border-brand bg-brand-soft text-ink'
                : 'border-field bg-surface text-ink',
            )}
          >
            <input
              type={props.multiple ? 'checkbox' : 'radio'}
              name={name}
              value={o.value}
              checked={isOn(o.value)}
              onChange={() => toggle(o.value)}
              className="sr-only"
            />
            {isOn(o.value) ? (
              <Icon name="check" size={20} />
            ) : (
              o.icon && <Icon name={o.icon} size={20} />
            )}
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
