import { useTranslation } from '@/i18n'
import { useSafetyTips } from '@/hooks'
import type { Condition } from '@/lib/rules/shift'
import type { Language, Vehicle } from '@/lib/schemas'
import { Card, Icon, Spinner, Switch } from '@/ui'
import { selectTips } from '../logic/tips'
import { useSession } from '@/stores/session'

/** Context tips by shift, weather and vehicle (FR-24). */
export function SafetyTips({
  conditions,
  vehicle,
}: {
  conditions: Condition[]
  vehicle: Vehicle | undefined
}) {
  const { t, i18n } = useTranslation()
  const tips = useSafetyTips()
  const { weather, setWeather } = useSession()
  const lang = i18n.language as Language
  if (!tips) return <Spinner />
  const list = selectTips(tips, conditions, vehicle)
  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <Switch
          label={t('suraksha.heat')}
          checked={weather.heat}
          onChange={(heat) => setWeather({ heat })}
        />
        <Switch
          label={t('suraksha.rain')}
          checked={weather.rain}
          onChange={(rain) => setWeather({ rain })}
        />
      </Card>
      {conditions.length > 0 && (
        <p className="flex items-center gap-2 font-semibold">
          <Icon
            name={
              conditions.includes('night') ? 'moon' : conditions.includes('rain') ? 'rain' : 'heat'
            }
          />
          {t('suraksha.tipsFor', {
            list: conditions.map((c) => t(`suraksha.condition.${c}`)).join(', '),
          })}
        </p>
      )}
      <ul className="space-y-2">
        {list.map((tip) => (
          <li key={tip.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-3">
            <span className="text-brand">
              <Icon name="shield" />
            </span>
            <span>{tip.text[lang]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
