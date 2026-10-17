import { useTranslation } from '@/i18n'
import type { Incident } from '@/lib/schemas'
import { formatDateTime } from '@/lib/utils/date'
import { localeFor } from '@/lib/utils/money'
import { Card, Icon, LinkButton } from '@/ui'

/** Logged incidents with follow-up steps and the handoff to Shikayat (flow 3). */
export function IncidentList({
  incidents,
  highlightId,
}: {
  incidents: readonly Incident[]
  highlightId?: string | null
}) {
  const { t, i18n } = useTranslation()
  return (
    <ul className="space-y-3">
      {incidents.map((i) => {
        const steps = t(`suraksha.steps.${i.type}`, { returnObjects: true }) as unknown
        return (
          <li key={i.id}>
            <Card className={i.id === highlightId ? 'border-2 border-brand' : undefined}>
              <p className="font-bold">
                {t(`enum.incident.${i.type}`)} ·{' '}
                {formatDateTime(i.datetime, localeFor(i18n.language))}
              </p>
              {i.locationLabel && (
                <p className="flex items-center gap-1 text-muted">
                  <Icon name="pin" size={16} />
                  {i.locationLabel}
                </p>
              )}
              {i.notes && <p className="mt-1">{i.notes}</p>}
              {Array.isArray(steps) && (
                <details className="mt-2" open={i.id === highlightId}>
                  <summary className="min-h-tap cursor-pointer py-2 font-semibold text-brand">
                    {t('suraksha.nextSteps')}
                  </summary>
                  <ol className="list-decimal space-y-1 pl-5">
                    {(steps as string[]).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </details>
              )}
              <div className="mt-3">
                {i.linkedGrievanceId ? (
                  <LinkButton
                    to={`/shikayat/${i.linkedGrievanceId}`}
                    variant="secondary"
                    icon="file"
                  >
                    {t('suraksha.openComplaint')}
                  </LinkButton>
                ) : (
                  <LinkButton to={`/shikayat/new?from=incident&id=${i.id}`} icon="megaphone">
                    {t('suraksha.raiseComplaint')}
                  </LinkButton>
                )}
              </div>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
