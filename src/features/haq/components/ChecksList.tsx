import { useTranslation } from '@/i18n'
import type { CriterionCheck } from '@/lib/rules/eligibility'
import { cx, Icon, type IconName } from '@/ui'

const ICON: Record<CriterionCheck['result'], { icon: IconName; cls: string }> = {
  pass: { icon: 'check', cls: 'text-ok' },
  partial: { icon: 'info', cls: 'text-brand' },
  fail: { icon: 'x', cls: 'text-bad' },
  unknown: { icon: 'info', cls: 'text-warn' },
}

/** Why a scheme was ranked the way it was, criterion by criterion. */
export function ChecksList({ checks }: { checks: readonly CriterionCheck[] }) {
  const { t } = useTranslation()
  if (checks.length === 0) return <p className="text-muted">{t('haq.noCriteria')}</p>
  return (
    <ul className="space-y-1">
      {checks.map((c) => (
        <li key={c.criterion} className="flex items-start gap-2">
          <span className={cx('mt-0.5', ICON[c.result].cls)}>
            <Icon name={ICON[c.result].icon} size={20} />
          </span>
          <span>{t(`haq.check.${c.criterion}.${c.result}`)}</span>
        </li>
      ))}
    </ul>
  )
}
