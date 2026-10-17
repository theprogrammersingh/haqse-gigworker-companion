import { useTranslation } from '@/i18n'
import type { TrendPoint } from '@/lib/rules/ledger'
import { formatDate } from '@/lib/utils/date'
import { localeFor } from '@/lib/utils/money'
import { useMoney } from './useMoney'

interface TrendChartProps {
  points: readonly TrendPoint[]
  /** Dates to mark as flagged (payout anomalies). */
  flagged?: ReadonlySet<string>
  title: string
}

const W = 320
const H = 140
const PAD = { top: 12, bottom: 22, left: 4, right: 4 }

/** Hand-rolled SVG bar chart with a data-table alternative (WCAG 1.1.1). */
export function TrendChart({ points, flagged, title }: TrendChartProps) {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const locale = localeFor(i18n.language)
  const max = Math.max(1, ...points.map((p) => p.net))
  const barW = (W - PAD.left - PAD.right) / Math.max(points.length, 1)
  const plotH = H - PAD.top - PAD.bottom

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG chart needs role="img"
        role="img"
        aria-labelledby="trend-title"
      >
        <title id="trend-title">{title}</title>
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
          className="stroke-line"
        />
        {points.map((p, i) => {
          const h = (Math.max(p.net, 0) / max) * plotH
          const x = PAD.left + i * barW + barW * 0.15
          const isFlag = flagged?.has(p.date)
          return (
            <g key={p.date}>
              <rect
                x={x}
                y={H - PAD.bottom - h}
                width={barW * 0.7}
                height={Math.max(h, p.net > 0 ? 2 : 0)}
                rx={2}
                className={isFlag ? 'fill-warn' : 'fill-brand'}
              />
              {isFlag && (
                <text
                  x={x + barW * 0.35}
                  y={H - PAD.bottom - h - 3}
                  textAnchor="middle"
                  className="fill-warn text-[10px] font-bold"
                >
                  !
                </text>
              )}
              {(i === 0 || i === points.length - 1 || i % 7 === 0) && (
                <text
                  x={x + barW * 0.35}
                  y={H - 6}
                  textAnchor="middle"
                  className="fill-muted text-[9px]"
                >
                  {formatDate(p.date, locale)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <details className="mt-2">
        <summary className="inline-flex min-h-tap cursor-pointer items-center font-semibold text-brand">
          {t('common.showTable')}
        </summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-1">
                {t('common.date')}
              </th>
              <th scope="col" className="py-1 text-right">
                {t('kamai.takeHome')}
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date} className="border-b border-line">
                <th scope="row" className="py-1 font-normal">
                  {formatDate(p.date, locale)}
                  {flagged?.has(p.date) && (
                    <span className="ml-1 font-semibold text-warn">({t('kamai.flagged')})</span>
                  )}
                </th>
                <td className="py-1 text-right tabular-nums">{money(p.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
