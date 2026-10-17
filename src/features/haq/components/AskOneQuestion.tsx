import { useTranslation } from '@/i18n'
import type { Profile, ProfileField } from '@/lib/schemas'
import { ProfileForm } from '@/features/settings'
import { Card, Icon } from '@/ui'

/** Asks for one missing profile field in context instead of a long form (PRD §4). */
export function AskOneQuestion({ field, profile }: { field: ProfileField; profile: Profile }) {
  const { t } = useTranslation()
  return (
    <Card className="space-y-3 border-2 border-warn">
      <p className="flex items-center gap-2 font-bold">
        <Icon name="info" />
        {t('haq.oneQuestion')}
      </p>
      <ProfileForm profile={profile} fields={[field]} />
    </Card>
  )
}
