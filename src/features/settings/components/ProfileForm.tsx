import { useTranslation } from 'react-i18next'
import { updateProfile } from '@/lib/db'
import type { Platform, Profile } from '@/lib/schemas'
import {
  AGE_BANDS,
  INCOME_BANDS,
  PLATFORMS,
  STATES,
  VEHICLES,
  WORK_TYPES,
} from '@/lib/schemas/enums'
import { ChipGroup, type IconName } from '@/ui'

const WORK_ICONS: Record<(typeof WORK_TYPES)[number], IconName> = {
  delivery: 'wallet',
  ride: 'pin',
  domestic: 'home',
  construction: 'shield',
  other: 'user',
}

type FieldKey = 'workType' | 'platforms' | 'vehicle' | 'state' | 'ageBand' | 'incomeBand'

/** Tappable profile questions; each saves immediately and every one is optional (FR-2). */
export function ProfileForm({
  profile,
  fields,
}: {
  profile: Profile
  fields?: readonly FieldKey[]
}) {
  const { t } = useTranslation()
  const show = (f: FieldKey): boolean => !fields || fields.includes(f)
  return (
    <div className="space-y-6">
      {show('workType') && (
        <ChipGroup
          legend={t('profile.workType')}
          value={profile.workType}
          onChange={(workType) => void updateProfile({ workType })}
          options={WORK_TYPES.map((v) => ({
            value: v,
            label: t(`enum.work.${v}`),
            icon: WORK_ICONS[v],
          }))}
        />
      )}
      {show('platforms') && (
        <ChipGroup<Platform>
          multiple
          legend={t('profile.platforms')}
          hint={t('profile.platformsHint')}
          value={profile.platforms}
          onChange={(platforms) => void updateProfile({ platforms })}
          options={PLATFORMS.map((v) => ({ value: v, label: t(`enum.platform.${v}`) }))}
        />
      )}
      {show('vehicle') && (
        <ChipGroup
          legend={t('profile.vehicle')}
          value={profile.vehicle}
          onChange={(vehicle) => void updateProfile({ vehicle })}
          options={VEHICLES.map((v) => ({ value: v, label: t(`enum.vehicle.${v}`) }))}
        />
      )}
      {show('state') && (
        <ChipGroup
          legend={t('profile.state')}
          value={profile.state}
          onChange={(state) => void updateProfile({ state })}
          options={STATES.map((v) => ({ value: v, label: t(`enum.state.${v}`) }))}
        />
      )}
      {show('ageBand') && (
        <ChipGroup
          legend={t('profile.age')}
          value={profile.ageBand}
          onChange={(ageBand) => void updateProfile({ ageBand })}
          options={AGE_BANDS.map((v) => ({ value: v, label: t(`enum.age.${v}`) }))}
        />
      )}
      {show('incomeBand') && (
        <ChipGroup
          legend={t('profile.income')}
          hint={t('profile.incomeHint')}
          value={profile.incomeBand}
          onChange={(incomeBand) => void updateProfile({ incomeBand })}
          options={INCOME_BANDS.map((v) => ({ value: v, label: t(`enum.income.${v}`) }))}
        />
      )}
    </div>
  )
}
