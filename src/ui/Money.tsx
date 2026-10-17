import { useTranslation } from '@/i18n'
import { formatINR, localeFor } from '@/lib/utils/money'
import { cx } from './cx'

/** Rupee amount in large, tabular digits with Indian grouping. */
export function Money({ amount, className }: { amount: number; className?: string }) {
  const { i18n } = useTranslation()
  return (
    <span className={cx('tabular-nums', className)}>
      {formatINR(amount, localeFor(i18n.language))}
    </span>
  )
}
