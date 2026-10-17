import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { useTranslation } from 'react-i18next'
import { canDictate, dictate } from '@/lib/utils/speech'
import { cx } from './cx'
import { Icon } from './Icon'

const control =
  'block w-full min-h-tap rounded-xl border-2 border-field bg-surface px-3 py-2 text-ink placeholder:text-muted aria-invalid:border-bad'

interface FieldShellProps {
  id: string
  label: ReactNode
  hint?: ReactNode | undefined
  error?: ReactNode | undefined
  children: ReactNode
  trailing?: ReactNode
}

function FieldShell({ id, label, hint, error, children, trailing }: FieldShellProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        {trailing}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1 text-sm font-semibold text-bad"
          role="alert"
        >
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
    </div>
  )
}

const describedBy = (id: string, hint: unknown, error: unknown): string | undefined =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

/** Mic button that dictates into a field with on-device speech recognition. */
function DictateButton({ onText }: { onText: (text: string) => void }) {
  const { t, i18n } = useTranslation()
  const [listening, setListening] = useState<null | (() => void)>(null)
  if (!canDictate()) return null
  const toggle = async (): Promise<void> => {
    if (listening) return listening()
    const { result, stop } = dictate(i18n.language)
    setListening(() => stop)
    const text = await result
    setListening(null)
    if (text) onText(text)
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!!listening}
      aria-label={listening ? t('common.stopListening') : t('common.speak')}
      className={cx(
        'inline-flex size-tap shrink-0 items-center justify-center rounded-xl border-2 border-field',
        listening ? 'bg-bad text-surface' : 'bg-surface text-brand',
      )}
    >
      <Icon name={listening ? 'stop' : 'mic'} />
    </button>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: ReactNode
  value: string
  onValueChange: (v: string) => void
  hint?: ReactNode
  error?: ReactNode
  voice?: boolean
}

export function TextField({
  label,
  hint,
  error,
  value,
  onValueChange,
  voice,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId()
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      trailing={
        voice ? (
          <DictateButton onText={(t) => onValueChange(value ? `${value} ${t}` : t)} />
        ) : undefined
      }
    >
      <input
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(control, className)}
        {...rest}
      />
    </FieldShell>
  )
}

interface NumberFieldProps extends Omit<TextFieldProps, 'value' | 'onValueChange' | 'voice'> {
  value: number | ''
  onValueChange: (v: number | '') => void
  prefix?: string
}

/** Numeric keypad on phones (inputMode), no spinner arrows. */
export function NumberField({
  label,
  hint,
  error,
  value,
  onValueChange,
  prefix,
  ...rest
}: NumberFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        {prefix && (
          <span
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted"
            aria-hidden
          >
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.]/g, '')
            onValueChange(raw === '' ? '' : Number(raw))
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cx(control, prefix && 'pl-8', 'text-lg tabular-nums')}
          {...rest}
        />
      </div>
    </FieldShell>
  )
}

interface TextAreaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange' | 'value'
> {
  label: ReactNode
  value: string
  onValueChange: (v: string) => void
  hint?: ReactNode
  error?: ReactNode
  voice?: boolean
}

export function TextArea({
  label,
  hint,
  error,
  value,
  onValueChange,
  voice,
  rows = 4,
  ...rest
}: TextAreaProps) {
  const id = useId()
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      trailing={
        voice ? (
          <DictateButton onText={(t) => onValueChange(value ? `${value} ${t}` : t)} />
        ) : undefined
      }
    >
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={control}
        {...rest}
      />
    </FieldShell>
  )
}

interface SelectFieldProps<T extends string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value'
> {
  label: ReactNode
  value: T | ''
  onValueChange: (v: T) => void
  options: readonly { value: T; label: string }[]
  hint?: ReactNode
  placeholder?: string
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  onValueChange,
  options,
  placeholder,
  ...rest
}: SelectFieldProps<T>) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <select
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value as T)}
        aria-describedby={describedBy(id, hint, undefined)}
        className={control}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
