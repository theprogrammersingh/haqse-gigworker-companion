import { useState } from 'react'
import { useTranslation } from '@/i18n'
import type { ToolCall } from '@/lib/ai/tasks/assistant'
import { Button } from '@/ui'

/** Every assistant action waits for an explicit tap (prompt-injection guard, FR-27). */
export function ToolConfirm({ call, onConfirm }: { call: ToolCall; onConfirm: () => void }) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="mt-2 rounded-xl border-2 border-brand p-3">
      <p className="font-semibold">{t(`saathi.action.${call.name}`)}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setDismissed(true)}>
          {t('common.no')}
        </Button>
        <Button icon="check" onClick={onConfirm}>
          {t('common.yesDoIt')}
        </Button>
      </div>
    </div>
  )
}
