import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useProfile, useToday } from '@/hooks'
import { loadDemoData, updateSettings } from '@/lib/db'
import { ApiKeyForm, LanguagePicker, ProfileForm } from '@/features/settings'
import { Button, Card, Icon } from '@/ui'

type Step = 'language' | 'profile' | 'key'
const STEPS: Step[] = ['language', 'profile', 'key']

/** Language → 5 quick questions → key (or skip). Every step is skippable; target < 60 s (FR-1..4). */
export function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useProfile()
  const today = useToday()
  const [step, setStep] = useState<Step>('language')
  const index = STEPS.indexOf(step)

  const finish = async (withDemo: boolean): Promise<void> => {
    if (withDemo) await loadDemoData(today)
    await updateSettings({ onboarded: true })
    navigate('/', { replace: true })
  }
  const next = (): void => setStep(STEPS[index + 1] ?? 'key')

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-xl bg-brand text-2xl font-extrabold text-brand-ink"
        >
          H
        </span>
        <div>
          <p className="text-2xl font-extrabold text-brand">HaqSe</p>
          <p className="text-muted">{t('onboarding.tagline')}</p>
        </div>
      </div>

      <p className="mb-2 text-sm font-semibold text-muted" aria-live="polite">
        {t('onboarding.step', { current: index + 1, total: STEPS.length })}
      </p>

      {step === 'language' && (
        <section aria-labelledby="ob-title" className="flex-1 space-y-4">
          <h1 id="ob-title" className="text-2xl font-bold">
            {t('onboarding.languageTitle')}
          </h1>
          <LanguagePicker />
          <Button block icon="chevron-right" onClick={next}>
            {t('common.next')}
          </Button>
        </section>
      )}

      {step === 'profile' && profile && (
        <section aria-labelledby="ob-title" className="flex-1 space-y-4">
          <h1 id="ob-title" className="text-2xl font-bold">
            {t('onboarding.profileTitle')}
          </h1>
          <p className="text-muted">{t('onboarding.profileHint')}</p>
          <ProfileForm
            profile={profile}
            fields={['workType', 'platforms', 'vehicle', 'state', 'ageBand']}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={next}>
              {t('common.skip')}
            </Button>
            <Button icon="chevron-right" onClick={next}>
              {t('common.next')}
            </Button>
          </div>
        </section>
      )}

      {step === 'key' && (
        <section aria-labelledby="ob-title" className="flex-1 space-y-4">
          <h1 id="ob-title" className="text-2xl font-bold">
            {t('onboarding.keyTitle')}
          </h1>
          <p className="text-muted">{t('onboarding.keyHint')}</p>
          <Card>
            <ApiKeyForm />
          </Card>
          <Button block icon="check" onClick={() => void finish(false)}>
            {t('onboarding.start')}
          </Button>
          <Card className="space-y-2 bg-brand-soft">
            <p className="flex items-center gap-2 font-semibold">
              <Icon name="sparkles" />
              {t('onboarding.demoTitle')}
            </p>
            <p className="text-sm">{t('onboarding.demoHint')}</p>
            <Button variant="secondary" block icon="sparkles" onClick={() => void finish(true)}>
              {t('onboarding.demo')}
            </Button>
          </Card>
          <p className="text-sm text-muted">{t('onboarding.noKeyNote')}</p>
        </section>
      )}
    </main>
  )
}
