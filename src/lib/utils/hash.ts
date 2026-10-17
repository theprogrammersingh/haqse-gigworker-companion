/** SHA-256 hex digest via Web Crypto, used for cache keys. */
export async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** UTF-8 byte length of a string. */
export const byteLength = (text: string): number => new TextEncoder().encode(text).length
