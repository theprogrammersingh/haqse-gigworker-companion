/** Rounds to whole rupees; amounts in this app are always whole ₹. */
export const roundRupees = (n: number): number => Math.round(n)

/** Formats ₹ with Indian digit grouping, e.g. ₹1,23,456. */
export function formatINR(amount: number, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(roundRupees(amount))
}

/** Maps app language to a number/date locale with Indian conventions. */
export function localeFor(language: string): string {
  if (language === 'hi') return 'hi-IN'
  if (language === 'pa') return 'pa-IN'
  return 'en-IN'
}
