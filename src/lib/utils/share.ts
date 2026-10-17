export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

/** Web Share when available, otherwise copies to the clipboard. Never sends anything by itself. */
export async function shareText(text: string, title?: string): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text, ...(title ? { title } : {}) })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    }
  }
  return (await copyText(text)) ? 'copied' : 'failed'
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export const whatsappUrl = (text: string, phone?: string): string =>
  `https://wa.me/${phone ? phone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(text)}`

export const mailtoUrl = (subject: string, body: string): string =>
  `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

/** sms: link to one or more numbers; the OS composer opens, the user presses send. */
export const smsUrl = (phones: readonly string[], body: string): string =>
  `sms:${phones.map((p) => p.replace(/[^\d+]/g, '')).join(',')}?body=${encodeURIComponent(body)}`

export const mapsUrl = (lat: number, lon: number): string =>
  `https://maps.google.com/?q=${lat.toFixed(5)},${lon.toFixed(5)}`

/** Saves text as a file via a temporary object URL (revoked right after). */
export function downloadText(filename: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
