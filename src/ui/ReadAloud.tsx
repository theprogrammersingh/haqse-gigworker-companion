import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { canSpeak, speak } from '@/lib/utils/speech'
import { Button } from './Button'

/** Reads text aloud on request. Audio never autoplays (WCAG). */
export function ReadAloud({ text, language }: { text: string; language?: string }) {
  const { t, i18n } = useTranslation()
  const [stop, setStop] = useState<null | (() => void)>(null)
  useEffect(() => () => stop?.(), [stop])
  if (!canSpeak() || !text) return null
  return (
    <Button
      variant="ghost"
      icon={stop ? 'stop' : 'speaker'}
      aria-pressed={!!stop}
      onClick={() => {
        if (stop) {
          stop()
          setStop(null)
          return
        }
        const cancel = speak(text, language ?? i18n.language, () => setStop(null))
        setStop(() => cancel)
      }}
    >
      {stop ? t('common.stopReading') : t('common.readAloud')}
    </Button>
  )
}
