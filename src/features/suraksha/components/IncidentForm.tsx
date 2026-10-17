import { useState } from 'react'
import { useNow } from '@/hooks'
import { useTranslation } from '@/i18n'
import { putIncident } from '@/lib/db'
import type { IncidentType } from '@/lib/schemas'
import { INCIDENT_TYPES } from '@/lib/schemas/enums'
import { newId } from '@/lib/utils/id'
import { Button, ChipGroup, Sheet, TextArea, TextField } from '@/ui'

const pad = (n: number): string => String(n).padStart(2, '0')
const toLocalInput = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

/** Logs time, place, type and notes (FR-25). Returns the new incident id. */
export function IncidentForm({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const { t } = useTranslation()
  const [type, setType] = useState<IncidentType | undefined>()
  const now = useNow()
  const [when, setWhen] = useState(() => toLocalInput(new Date(now)))
  const [place, setPlace] = useState('')
  const [notes, setNotes] = useState('')
  const [showError, setShowError] = useState(false)

  const save = async (): Promise<void> => {
    if (!type) {
      setShowError(true)
      return
    }
    const id = newId()
    await putIncident({
      id,
      type,
      datetime: new Date(when).getTime(),
      locationLabel: place.trim(),
      notes: notes.trim(),
    })
    onSaved(id)
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('suraksha.reportTitle')}
      footer={
        <Button block icon="check" onClick={() => void save()}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="space-y-4">
        <ChipGroup
          legend={t('suraksha.incidentType')}
          value={type}
          onChange={setType}
          options={INCIDENT_TYPES.map((v) => ({ value: v, label: t(`enum.incident.${v}`) }))}
        />
        {showError && !type && (
          <p role="alert" className="font-semibold text-bad">
            {t('suraksha.typeRequired')}
          </p>
        )}
        <div className="space-y-1">
          <label htmlFor="inc-when" className="block font-semibold">
            {t('suraksha.when')}
          </label>
          <input
            id="inc-when"
            type="datetime-local"
            value={when}
            max={toLocalInput(new Date(now + 60_000))}
            onChange={(e) => setWhen(e.target.value)}
            className="block min-h-tap w-full rounded-xl border-2 border-field bg-surface px-3 text-ink"
          />
        </div>
        <TextField
          label={t('suraksha.where')}
          hint={t('suraksha.whereHint')}
          value={place}
          onValueChange={setPlace}
          voice
        />
        <TextArea
          label={t('suraksha.notes')}
          hint={t('suraksha.notesHint')}
          value={notes}
          onValueChange={setNotes}
          voice
          rows={4}
        />
      </div>
    </Sheet>
  )
}
