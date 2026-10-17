import { useTranslation } from 'react-i18next'
import { LANGUAGES, type Language } from '@/lib/schemas/enums'
import { LANGUAGE_LABELS, setLanguage } from './language'
import { cx, Icon } from '@/ui'

/** Large-icon language choice (FR-1). Sets <html lang> and persists to the profile. */
export function LanguagePicker({ onPicked }: { onPicked?: (lang: Language) => void }) {
  const { i18n, t } = useTranslation()
  return (
    <fieldset>
      <legend className="sr-only">{t('settings.language')}</legend>
      <div className="grid gap-3">
        {LANGUAGES.map((lang) => {
          const active = i18n.language === lang
          return (
            <label
              key={lang}
              lang={lang}
              className={cx(
                'flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 text-xl font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2',
                active ? 'border-brand bg-brand-soft' : 'border-field bg-surface',
              )}
            >
              <input
                type="radio"
                name="language"
                value={lang}
                checked={active}
                className="sr-only"
                onChange={async () => {
                  await setLanguage(lang)
                  onPicked?.(lang)
                }}
              />
              <span
                aria-hidden
                className="grid size-10 place-items-center rounded-full bg-surface-2 text-brand"
              >
                <Icon name={active ? 'check' : 'globe'} />
              </span>
              <span>
                {LANGUAGE_LABELS[lang].native}
                {lang !== 'en' && (
                  <span lang="en" className="block text-sm font-normal text-muted">
                    {LANGUAGE_LABELS[lang].english}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
