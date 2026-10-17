import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from './cx'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink hover:bg-brand-hover',
  secondary: 'bg-surface text-ink border-2 border-field hover:bg-surface-2',
  ghost: 'bg-transparent text-brand hover:bg-brand-soft',
  danger: 'bg-bad text-surface hover:opacity-90',
}

const base =
  'inline-flex min-h-tap min-w-tap items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

interface CommonProps {
  variant?: Variant
  icon?: IconName
  block?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  icon,
  block,
  className,
  children,
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx(base, VARIANTS[variant], block && 'w-full', className)}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  )
}

export function LinkButton({
  variant = 'primary',
  icon,
  block,
  className,
  children,
  ...rest
}: CommonProps & LinkProps) {
  return (
    <Link
      className={cx(base, VARIANTS[variant], block && 'w-full', 'no-underline', className)}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </Link>
  )
}

/** Icon-only button; `label` is required so it always has an accessible name. */
export function IconButton({
  icon,
  label,
  className,
  variant = 'ghost',
  ...rest
}: { icon: IconName; label: string; variant?: Variant } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(base, 'px-0', VARIANTS[variant], className)}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  )
}
