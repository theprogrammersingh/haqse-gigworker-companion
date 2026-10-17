import { useRef, useState } from 'react'
import { useTranslation } from '@/i18n'
import { SOS_HOLD_MS } from '@/lib/constants'
import { Button, cx, Icon, Sheet } from '@/ui'
import { SosSheet } from './SosSheet'

/**
 * SOS: press and hold to open help immediately, or tap and confirm.
 * The confirm path is the single-pointer alternative to the gesture (WCAG 2.5.1).
 */
export function SosButton({
  prominent,
  startConfirming,
  onSettled,
}: {
  prominent?: boolean
  /** Open the confirm step on mount (the "SOS" app shortcut). */
  startConfirming?: boolean
  /** Called when the SOS flow returns to idle. */
  onSettled?: () => void
}) {
  const { t } = useTranslation()
  const [stage, setStageState] = useState<'idle' | 'confirm' | 'open'>(() =>
    startConfirming ? 'confirm' : 'idle',
  )
  const setStage = (s: 'idle' | 'confirm' | 'open'): void => {
    setStageState(s)
    if (s === 'idle') onSettled?.()
  }
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const held = useRef(false)

  const startHold = (): void => {
    held.current = false
    timer.current = setTimeout(() => {
      held.current = true
      navigator.vibrate?.(80)
      setStage('open')
    }, SOS_HOLD_MS)
  }
  const endHold = (): void => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  return (
    <>
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (!held.current) setStage('confirm')
        }}
        aria-describedby="sos-hint"
        className={cx(
          'flex w-full select-none items-center justify-center gap-3 rounded-2xl bg-bad font-extrabold text-surface shadow-md',
          prominent ? 'min-h-20 text-2xl' : 'min-h-16 text-xl',
        )}
      >
        <Icon name="sos" size={prominent ? 36 : 28} />
        {t('suraksha.sos')}
      </button>
      <p id="sos-hint" className="mt-1 text-center text-sm text-muted">
        {t('suraksha.sosHint')}
      </p>

      <Sheet
        open={stage === 'confirm'}
        onClose={() => setStage('idle')}
        title={t('suraksha.sosConfirmTitle')}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setStage('idle')}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" icon="sos" onClick={() => setStage('open')}>
              {t('suraksha.sosConfirm')}
            </Button>
          </div>
        }
      >
        <p>{t('suraksha.sosConfirmBody')}</p>
      </Sheet>
      {stage === 'open' && <SosSheet onClose={() => setStage('idle')} />}
    </>
  )
}
