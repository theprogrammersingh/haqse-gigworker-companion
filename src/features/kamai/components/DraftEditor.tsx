import { useTranslation } from 'react-i18next'
import type { EarningDraft } from '@/lib/parse/localEarningParser'
import { PLATFORMS } from '@/lib/schemas/enums'
import { Money, NumberField, SelectField } from '@/ui'
import type { DraftField } from '../logic/entries'

interface DraftEditorProps {
  draft: EarningDraft
  index: number
  errors: readonly DraftField[]
  today: string
  onChange: (d: EarningDraft) => void
}

const num = (v: number | ''): number => (v === '' ? 0 : v)

/** Editable parsed entry: nothing AI-parsed is saved until the user checks it here. */
export function DraftEditor({ draft, index, errors, today, onChange }: DraftEditorProps) {
  const { t } = useTranslation()
  const set = <K extends keyof EarningDraft>(k: K, v: EarningDraft[K]): void =>
    onChange({ ...draft, [k]: v })
  const net = draft.gross + draft.tips - draft.fuel - draft.otherCosts
  return (
    <fieldset className="space-y-3 rounded-2xl border border-line p-3">
      <legend className="px-1 font-bold">{t('kamai.entryN', { n: index + 1 })}</legend>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t('kamai.platform')}
          value={draft.platform}
          onValueChange={(v) => set('platform', v)}
          options={PLATFORMS.map((p) => ({ value: p, label: t(`enum.platform.${p}`) }))}
        />
        <div className="space-y-1">
          <label className="block font-semibold" htmlFor={`date-${index}`}>
            {t('common.date')}
          </label>
          <input
            id={`date-${index}`}
            type="date"
            max={today}
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
            aria-invalid={errors.includes('date') || undefined}
            className="block min-h-tap w-full rounded-xl border-2 border-field bg-surface px-2 text-ink aria-invalid:border-bad"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t('kamai.gross')}
          prefix="₹"
          value={draft.gross || ''}
          onValueChange={(v) => set('gross', num(v))}
          error={errors.includes('gross') ? t('kamai.errors.gross') : undefined}
        />
        <NumberField
          label={t('kamai.hours')}
          value={draft.hours || ''}
          onValueChange={(v) => set('hours', num(v))}
          error={errors.includes('hours') ? t('kamai.errors.hours') : undefined}
        />
        <NumberField
          label={t('kamai.tips')}
          prefix="₹"
          value={draft.tips || ''}
          onValueChange={(v) => set('tips', num(v))}
        />
        <NumberField
          label={t('kamai.fuel')}
          prefix="₹"
          value={draft.fuel || ''}
          onValueChange={(v) => set('fuel', num(v))}
        />
        <NumberField
          label={t('kamai.otherCosts')}
          prefix="₹"
          value={draft.otherCosts || ''}
          onValueChange={(v) => set('otherCosts', num(v))}
        />
        <NumberField
          label={t('kamai.trips')}
          value={draft.trips ?? ''}
          onValueChange={(v) => set('trips', num(v))}
        />
      </div>
      <p className="rounded-xl bg-surface-2 px-3 py-2 font-semibold">
        {t('kamai.takeHome')}: <Money amount={net} className="text-lg" />
      </p>
    </fieldset>
  )
}
