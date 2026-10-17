import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from '@/i18n'
import { IconButton } from './Button'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

/** Modal bottom sheet on native <dialog>: focus trap, Esc and inert background for free. */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal?.()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      // Only user intent closes the sheet (Esc or the close button). The native `close` event also
      // fires on our own programmatic close, which would wrongly reset a parent opening the next sheet.
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col">
          <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <h2 id="sheet-title" className="text-lg font-bold">
              {title}
            </h2>
            <IconButton icon="x" label={t('common.close')} onClick={onClose} />
          </header>
          <div className="overflow-y-auto px-4 py-4">{children}</div>
          {footer && (
            <footer className="safe-bottom border-t border-line px-4 py-3">{footer}</footer>
          )}
        </div>
      )}
    </dialog>
  )
}
