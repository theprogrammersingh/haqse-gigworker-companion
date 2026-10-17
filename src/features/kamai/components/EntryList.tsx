import { useTranslation } from 'react-i18next'
import { addEarnings, deleteEarning } from '@/lib/db'
import { netOf } from '@/lib/rules/ledger'
import type { Earning } from '@/lib/schemas'
import { formatDate } from '@/lib/utils/date'
import { localeFor } from '@/lib/utils/money'
import { toast } from '@/stores/toast'
import { IconButton, useMoney } from '@/ui'

/** Recent entries with delete + 5 s undo (PRD §7). */
export function EntryList({
  entries,
  limit = 10,
}: {
  entries: readonly Earning[]
  limit?: number
}) {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const locale = localeFor(i18n.language)
  const rows = [...entries]
    .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
    .slice(0, limit)

  const remove = async (e: Earning): Promise<void> => {
    await deleteEarning(e.id)
    toast(t('kamai.deleted'), {
      action: { label: t('common.undo'), run: () => void addEarnings([e]) },
    })
  }

  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {rows.map((e) => (
        <li key={e.id} className="flex items-center gap-3 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {t(`enum.platform.${e.platform}`)} · {formatDate(e.date, locale)}
            </p>
            <p className="text-sm text-muted">
              {t('kamai.entryLine', {
                gross: money(e.gross + e.tips),
                costs: money(e.fuel + e.otherCosts),
                hours: e.hours,
              })}
            </p>
          </div>
          <span className="text-lg font-bold tabular-nums">{money(netOf(e))}</span>
          <IconButton
            icon="trash"
            label={t('kamai.deleteEntry', {
              platform: t(`enum.platform.${e.platform}`),
              date: formatDate(e.date, locale),
            })}
            onClick={() => void remove(e)}
          />
        </li>
      ))}
    </ul>
  )
}
