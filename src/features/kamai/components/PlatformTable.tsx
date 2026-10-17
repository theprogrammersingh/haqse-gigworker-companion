import { useTranslation } from 'react-i18next'
import type { PlatformStats } from '@/lib/rules/ledger'
import { useMoney } from '@/ui'

/** Per-platform comparison as a real table (screen-reader friendly). */
export function PlatformTable({ rows }: { rows: readonly PlatformStats[] }) {
  const { t } = useTranslation()
  const money = useMoney()
  if (rows.length === 0) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <caption className="sr-only">{t('kamai.platformCompare')}</caption>
        <thead>
          <tr className="border-b border-line text-sm text-muted">
            <th scope="col" className="py-2">
              {t('kamai.platform')}
            </th>
            <th scope="col" className="py-2 text-right">
              {t('kamai.takeHome')}
            </th>
            <th scope="col" className="py-2 text-right">
              {t('kamai.hours')}
            </th>
            <th scope="col" className="py-2 text-right">
              {t('kamai.perHour')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.platform} className="border-b border-line">
              <th scope="row" className="py-2 font-semibold">
                {t(`enum.platform.${r.platform}`)}
              </th>
              <td className="py-2 text-right tabular-nums">{money(r.net)}</td>
              <td className="py-2 text-right tabular-nums">{Math.round(r.hours * 10) / 10}</td>
              <td className="py-2 text-right font-semibold tabular-nums">{money(r.netPerHour)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
