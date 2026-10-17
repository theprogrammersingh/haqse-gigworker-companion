import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useProfile, useSettings, useToday } from '@/hooks'
import {
  deleteAll,
  exportAll,
  loadDemoData,
  saveProfile,
  updateProfile,
  updateSettings,
} from '@/lib/db'
import type { Theme } from '@/lib/schemas'
import { downloadText } from '@/lib/utils/share'
import { ContactsEditor } from '@/features/suraksha'
import { toast } from '@/stores/toast'
import { Button, Card, ChipGroup, NumberField, PageHeader, SectionTitle, Sheet, Switch } from '@/ui'
import { ApiKeyForm } from './components/ApiKeyForm'
import { LanguagePicker } from './components/LanguagePicker'
import { ProfileForm } from './components/ProfileForm'

const THEMES: Theme[] = ['system', 'light', 'dark']

export function SettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useProfile()
  const settings = useSettings()
  const today = useToday()
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!profile || !settings) return null

  return (
    <>
      <PageHeader title={t('settings.title')} />

      <SectionTitle>{t('settings.language')}</SectionTitle>
      <LanguagePicker />

      <SectionTitle id="ai">{t('settings.ai')}</SectionTitle>
      <Card className="space-y-4">
        <ApiKeyForm />
        <Switch
          label={t('settings.economy')}
          hint={t('settings.economyHint')}
          checked={settings.economyMode}
          onChange={(economyMode) => void updateSettings({ economyMode })}
        />
      </Card>

      <SectionTitle>{t('settings.profile')}</SectionTitle>
      <Card className="space-y-6">
        <ProfileForm profile={profile} />
        <NumberField
          label={t('settings.minHourly')}
          hint={t('settings.minHourlyHint')}
          prefix="₹"
          value={profile.minHourlyTarget ?? ''}
          onValueChange={(v) => {
            const { minHourlyTarget: _drop, ...rest } = profile
            void (v === '' || v <= 0 ? saveProfile(rest) : updateProfile({ minHourlyTarget: v }))
          }}
        />
      </Card>

      <SectionTitle>{t('settings.contacts')}</SectionTitle>
      <Card>
        <ContactsEditor />
      </Card>

      <SectionTitle>{t('settings.theme')}</SectionTitle>
      <ChipGroup
        legend={t('settings.theme')}
        hideLegend
        value={settings.theme}
        onChange={(theme) => void updateSettings({ theme })}
        options={THEMES.map((v) => ({
          value: v,
          label: t(`settings.themes.${v}`),
          icon: v === 'dark' ? 'moon' : 'sun',
        }))}
      />

      <SectionTitle>{t('settings.data')}</SectionTitle>
      <Card className="space-y-3">
        <p className="text-muted">{t('settings.dataHint')}</p>
        <Button
          variant="secondary"
          block
          icon="download"
          onClick={async () => downloadText(`haqse-${today}.json`, await exportAll())}
        >
          {t('settings.export')}
        </Button>
        <Button
          variant="secondary"
          block
          icon="sparkles"
          onClick={async () => {
            await loadDemoData(today)
            toast(t('onboarding.demoLoaded'), { tone: 'ok' })
            navigate('/')
          }}
        >
          {t('onboarding.demo')}
        </Button>
        <Button variant="danger" block icon="trash" onClick={() => setConfirmDelete(true)}>
          {t('settings.deleteAll')}
        </Button>
      </Card>

      <p className="mt-6 text-sm text-muted">{t('common.disclaimer')}</p>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('settings.deleteConfirmTitle')}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={async () => {
                await deleteAll()
                setConfirmDelete(false)
                navigate('/welcome', { replace: true })
              }}
            >
              {t('settings.deleteConfirm')}
            </Button>
          </div>
        }
      >
        <p>{t('settings.deleteConfirmBody')}</p>
      </Sheet>
    </>
  )
}
