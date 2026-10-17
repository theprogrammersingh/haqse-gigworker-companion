import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { listFlashModels, DEFAULT_MODEL } from '@/lib/ai/models'
import { GEMINI_KEY_URL } from '@/lib/constants'
import { removeApiKey, updateSettings } from '@/lib/db'
import { useSettings } from '@/hooks'
import { AlertCard, Button, Icon, TextField } from '@/ui'
import { toast } from '@/stores/toast'
import { ModelPicker } from './ModelPicker'

type Status = { kind: 'idle' } | { kind: 'checking' } | { kind: 'error'; message: string }

/**
 * Paste → validate with a real call → save (PRD FR-3). `withModelPicker` shows the
 * model choice right after a key validates (onboarding); Settings shows it separately.
 */
export function ApiKeyForm({
  onDone,
  withModelPicker = false,
}: {
  onDone?: () => void
  withModelPicker?: boolean
}) {
  const { t } = useTranslation()
  const settings = useSettings()
  const [key, setKey] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const hasKey = !!settings?.apiKey

  const validate = async (value: string): Promise<void> => {
    setStatus({ kind: 'checking' })
    const res = await listFlashModels(value.trim())
    if (!res.ok) {
      setStatus({ kind: 'error', message: t(`ai.error.${res.error.kind}.title`) })
      return
    }
    const current = settings?.model
    const model = current && res.value.includes(current) ? current : (res.value[0] ?? DEFAULT_MODEL)
    await updateSettings({
      apiKey: value.trim(),
      modelList: { models: res.value, fetchedAt: Date.now() },
      model,
    })
    setKey('')
    setStatus({ kind: 'idle' })
    toast(t('settings.key.saved'), { tone: 'ok' })
    onDone?.()
  }

  if (hasKey) {
    return (
      <div className="space-y-4">
        <AlertCard tone="ok" title={t('settings.key.active')}>
          <p>
            {t('settings.key.masked')}:{' '}
            <span className="font-mono">••••{settings.apiKey?.slice(-4)}</span>
          </p>
        </AlertCard>
        {withModelPicker && <ModelPicker showEconomy={false} />}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon="trash"
            onClick={async () => {
              await removeApiKey()
              toast(t('settings.key.removed'), { tone: 'info' })
            }}
          >
            {t('settings.key.remove')}
          </Button>
        </div>
        {status.kind === 'error' && (
          <p className="font-semibold text-bad" role="alert">
            {status.message}
          </p>
        )}
      </div>
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (key.trim()) void validate(key)
      }}
    >
      <TextField
        label={t('settings.key.label')}
        hint={t('settings.key.hint')}
        value={key}
        onValueChange={(v) => {
          setKey(v)
          if (status.kind === 'error') setStatus({ kind: 'idle' })
        }}
        type="password"
        autoComplete="off"
        spellCheck={false}
        error={status.kind === 'error' ? status.message : undefined}
      />
      <Button type="submit" block icon="key" disabled={!key.trim() || status.kind === 'checking'}>
        {status.kind === 'checking' ? t('settings.key.checking') : t('settings.key.check')}
      </Button>
      <a
        href={GEMINI_KEY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-tap items-center gap-1 font-semibold text-brand underline"
      >
        {t('settings.key.get')}
        <Icon name="external" size={18} />
        <span className="sr-only">({t('common.newTab')})</span>
      </a>
      <p className="text-sm text-muted">{t('settings.key.privacy')}</p>
    </form>
  )
}
