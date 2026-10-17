import { useTranslation } from 'react-i18next'
import { useRights } from '@/hooks'
import type { Language } from '@/lib/schemas'
import { Card, Icon, ReadAloud, Spinner, type IconName } from '@/ui'

/** "Know your rights" cards from bundled data (FR-14). */
export function RightsCards() {
  const { t, i18n } = useTranslation()
  const rights = useRights()
  const lang = i18n.language as Language
  if (!rights) return <Spinner />
  return (
    <div className="space-y-3">
      {rights.map((r) => (
        <Card key={r.id}>
          <details>
            <summary className="flex min-h-tap cursor-pointer list-none items-center gap-3 font-bold">
              <span className="text-brand">
                <Icon name={r.icon as IconName} />
              </span>
              <span className="flex-1">{r.title[lang]}</span>
              <Icon name="chevron-right" />
            </summary>
            <div className="mt-2 space-y-2">
              <p>{r.body[lang]}</p>
              <p className="text-sm text-muted">
                {t('haq.source')}:{' '}
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand underline"
                >
                  {r.source}
                </a>
              </p>
              <ReadAloud text={r.body[lang]} />
            </div>
          </details>
        </Card>
      ))}
    </div>
  )
}
