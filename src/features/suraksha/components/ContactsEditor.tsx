import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useContacts } from '@/hooks'
import { deleteContact, putContact } from '@/lib/db'
import { newId } from '@/lib/utils/id'
import { toast } from '@/stores/toast'
import { Button, IconButton, TextField } from '@/ui'

const PHONE_RE = /^\+?[0-9 ]{6,16}$/

/** Trusted SOS contacts, stored only on this device. */
export function ContactsEditor() {
  const { t } = useTranslation()
  const contacts = useContacts()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState(false)

  const add = async (): Promise<void> => {
    if (!name.trim() || !PHONE_RE.test(phone.trim())) {
      setError(true)
      return
    }
    await putContact({ id: newId(), name: name.trim(), phone: phone.trim() })
    setName('')
    setPhone('')
    setError(false)
  }

  return (
    <div className="space-y-3">
      {contacts && contacts.length > 0 && (
        <ul className="divide-y divide-line">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-1">
              <span className="flex-1">
                <span className="font-semibold">{c.name}</span> ·{' '}
                <span className="tabular-nums">{c.phone}</span>
              </span>
              <IconButton
                icon="trash"
                label={t('suraksha.removeContact', { name: c.name })}
                onClick={async () => {
                  await deleteContact(c.id)
                  toast(t('kagaz.removed'), {
                    action: { label: t('common.undo'), run: () => void putContact(c) },
                  })
                }}
              />
            </li>
          ))}
        </ul>
      )}
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          void add()
        }}
      >
        <TextField
          label={t('suraksha.contactName')}
          value={name}
          onValueChange={setName}
          autoComplete="off"
        />
        <TextField
          label={t('suraksha.contactPhone')}
          value={phone}
          onValueChange={setPhone}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          error={error ? t('suraksha.contactError') : undefined}
        />
        <Button type="submit" variant="secondary" icon="plus">
          {t('suraksha.addContact')}
        </Button>
      </form>
    </div>
  )
}
