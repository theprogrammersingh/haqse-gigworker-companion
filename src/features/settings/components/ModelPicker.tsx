import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/hooks'
import { DEFAULT_MODEL, FALLBACK_MODELS, isModelListFresh, listFlashModels } from '@/lib/ai/models'
import { updateSettings } from '@/lib/db'
import { formatDateTime } from '@/lib/utils/date'
import { localeFor } from '@/lib/utils/money'
import type { Result } from '@/lib/result'
import { toast } from '@/stores/toast'
import { Button, SelectField, Switch } from '@/ui'

interface Fetched {
  count: number
  /** Set when the saved model was not offered by the key and a new one was chosen. */
  switchedTo?: string
}

/** Lists the key's Flash models and stores them, keeping the saved model when still offered. */
async function fetchAndStoreModels(
  apiKey: string,
  current: string | undefined,
): Promise<Result<Fetched>> {
  const res = await listFlashModels(apiKey)
  if (!res.ok) return res
  const keep = !!current && res.value.includes(current)
  const model = keep && current ? current : (res.value[0] ?? DEFAULT_MODEL)
  await updateSettings({ modelList: { models: res.value, fetchedAt: Date.now() }, model })
  return {
    ok: true,
    value: { count: res.value.length, ...(current && !keep ? { switchedTo: model } : {}) },
  }
}

/**
 * Gemini Flash model choice, always visible. Without a key it offers the bundled
 * list so the choice is ready; with a key it lists what that key can use (FR-3).
 */
export function ModelPicker({ showEconomy = true }: { showEconomy?: boolean }) {
  const { t, i18n } = useTranslation()
  const settings = useSettings()
  const [refreshing, setRefreshing] = useState(false)
  const apiKey = settings?.apiKey
  const cached = settings?.modelList
  const models = apiKey && cached?.models.length ? cached.models : [...FALLBACK_MODELS]
  const selected =
    settings?.model && models.includes(settings.model)
      ? settings.model
      : (models[0] ?? DEFAULT_MODEL)

  const refresh = async (): Promise<void> => {
    if (!apiKey) return
    setRefreshing(true)
    const res = await fetchAndStoreModels(apiKey, settings?.model)
    setRefreshing(false)
    if (!res.ok) toast(t(`ai.error.${res.error.kind}.title`), { tone: 'warn' })
    else if (res.value.switchedTo)
      toast(t('ai.modelSwitched', { model: res.value.switchedTo }), { tone: 'info' })
    else toast(t('settings.model.refreshed', { count: res.value.count }), { tone: 'ok' })
  }

  // A key whose list is older than 24 h is refreshed quietly; fetchedAt then makes it fresh.
  const stale = !!apiKey && !isModelListFresh(cached?.fetchedAt)
  const savedModel = settings?.model
  useEffect(() => {
    if (stale && apiKey) void fetchAndStoreModels(apiKey, savedModel)
  }, [stale, apiKey, savedModel])

  if (!settings) return null

  return (
    <div className="space-y-3">
      <SelectField
        label={t('settings.model.label')}
        hint={apiKey ? t('settings.model.hint') : t('settings.model.hintNoKey')}
        value={selected}
        onValueChange={(model) => void updateSettings({ model })}
        options={models.map((m, i) => ({
          value: m,
          label: i === 0 ? `${m} (${t('settings.model.recommended')})` : m,
        }))}
      />
      {apiKey && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            icon="refresh"
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            {refreshing ? t('settings.key.checking') : t('settings.model.refresh')}
          </Button>
          {cached?.fetchedAt && (
            <span className="text-sm text-muted">
              {t('settings.model.updated', {
                time: formatDateTime(cached.fetchedAt, localeFor(i18n.language)),
              })}
            </span>
          )}
        </div>
      )}
      {showEconomy && (
        <Switch
          label={t('settings.economy')}
          hint={t('settings.economyHint')}
          checked={settings.economyMode}
          onChange={(economyMode) => void updateSettings({ economyMode })}
        />
      )}
    </div>
  )
}
