import { useEffect, useState } from 'react'
import { useTranslation } from '@/i18n'
import { useContacts } from '@/hooks'
import { EMERGENCY_NUMBER } from '@/lib/constants'
import { mapsUrl, shareText, smsUrl } from '@/lib/utils/share'
import { Button, Icon, LinkButton, Sheet } from '@/ui'

type Location =
  { status: 'locating' } | { status: 'found'; url: string } | { status: 'unavailable' }

const LOCATE_TIMEOUT_MS = 8000

/** Help actions that work offline: tel:112 and a pre-composed SMS with the location link (FR-23). */
export function SosSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const contacts = useContacts()
  const [loc, setLoc] = useState<Location>(() =>
    'geolocation' in navigator ? { status: 'locating' } : { status: 'unavailable' },
  )

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ status: 'found', url: mapsUrl(p.coords.latitude, p.coords.longitude) }),
      () => setLoc({ status: 'unavailable' }),
      { enableHighAccuracy: true, timeout: LOCATE_TIMEOUT_MS, maximumAge: 60_000 },
    )
  }, [])

  const message =
    loc.status === 'found'
      ? t('suraksha.sosMessage', { link: loc.url })
      : t('suraksha.sosMessageNoLoc')
  const phones = (contacts ?? []).map((c) => c.phone)

  return (
    <Sheet open onClose={onClose} title={t('suraksha.sosTitle')}>
      <div className="space-y-3">
        <a
          href={`tel:${EMERGENCY_NUMBER}`}
          className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-bad text-2xl font-extrabold text-surface"
        >
          <Icon name="phone" size={32} />
          {t('suraksha.call112')}
        </a>
        <output className="block text-sm text-muted">
          {loc.status === 'locating' && t('suraksha.locating')}
          {loc.status === 'found' && t('suraksha.located')}
          {loc.status === 'unavailable' && t('suraksha.noLocation')}
        </output>
        {phones.length > 0 ? (
          <a
            href={smsUrl(phones, message)}
            className="flex min-h-tap items-center justify-center gap-2 rounded-xl bg-brand px-4 font-semibold text-brand-ink"
          >
            <Icon name="chat" />
            {t('suraksha.smsContacts', { count: phones.length })}
          </a>
        ) : (
          <LinkButton to="/settings" variant="secondary" block icon="user" onClick={onClose}>
            {t('suraksha.addContacts')}
          </LinkButton>
        )}
        <Button
          variant="secondary"
          block
          icon="share"
          onClick={() => void shareText(message, t('suraksha.sos'))}
        >
          {t('suraksha.shareLocation')}
        </Button>
        {contacts?.map((c) => (
          <a
            key={c.id}
            href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}
            className="flex min-h-tap items-center gap-2 rounded-xl border-2 border-field px-4 font-semibold"
          >
            <Icon name="phone" />
            {t('suraksha.callContact', { name: c.name })}
          </a>
        ))}
      </div>
    </Sheet>
  )
}
