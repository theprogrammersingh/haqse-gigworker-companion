import { useTranslation } from '@/i18n'
import { useToasts } from '@/stores/toast'
import { TONE_STYLES } from './tones'
import { cx } from './cx'
import { Icon } from './Icon'

/** Live region for toasts, above the bottom nav. */
export function Toaster() {
  const { toasts, dismiss } = useToasts()
  const { t } = useTranslation()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-36 z-40 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => {
        const s = TONE_STYLES[toast.tone]
        return (
          <div
            key={toast.id}
            className={cx(
              'pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border-2 bg-surface px-3 py-2 shadow-lg',
              s.box,
            )}
          >
            <span className={s.text}>
              <Icon name={s.icon} />
            </span>
            <p className="flex-1 font-medium">{toast.message}</p>
            {toast.action && (
              <button
                type="button"
                className="min-h-tap rounded-lg px-3 font-bold text-brand underline"
                onClick={() => {
                  toast.action?.run()
                  dismiss(toast.id)
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              className="inline-flex size-tap items-center justify-center"
              aria-label={t('common.close')}
              onClick={() => dismiss(toast.id)}
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
