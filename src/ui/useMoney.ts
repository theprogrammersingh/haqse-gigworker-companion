import { useTranslation } from 'react-i18next'
import { formatINR, localeFor } from '@/lib/utils/money'

/** Formatter for ₹ amounts in the current UI language. */
export function useMoney(): (n: number) => string {
  const { i18n } = useTranslation()
  return (n) => formatINR(n, localeFor(i18n.language))
}
