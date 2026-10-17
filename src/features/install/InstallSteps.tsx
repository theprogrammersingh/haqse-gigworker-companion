import { useTranslation } from '@/i18n'
import { Icon } from '@/ui'
import { STEP_ICONS, type GuidedMethod } from './steps'

/** Numbered steps, each with a picture of the control to tap. */
export function InstallSteps({ method }: { method: GuidedMethod }) {
  const { t } = useTranslation()
  return (
    <ol className="space-y-3">
      {STEP_ICONS[method].map((icon, i) => (
        <li key={icon + i} className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-ink"
          >
            {i + 1}
          </span>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-field bg-surface-2 text-ink">
            <Icon name={icon} />
          </span>
          <span className="pt-1.5">{t(`pwa.steps.${method}.${i}`)}</span>
        </li>
      ))}
    </ol>
  )
}
