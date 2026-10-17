export interface Recording {
  stop: () => Promise<{ base64: string; mimeType: string }>
  cancel: () => void
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result)
      resolve(url.slice(url.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

export const canRecord = (): boolean =>
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof MediaRecorder !== 'undefined'

/** Records a short voice note in memory for Gemini audio understanding. */
export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) =>
    MediaRecorder.isTypeSupported(t),
  )
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => chunks.push(e.data)
  recorder.start()
  const release = (): void => stream.getTracks().forEach((t) => t.stop())

  return {
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onstop = async () => {
          release()
          const type = (recorder.mimeType || 'audio/webm').split(';')[0] ?? 'audio/webm'
          try {
            resolve({ base64: await blobToBase64(new Blob(chunks, { type })), mimeType: type })
          } catch (e) {
            reject(e)
          }
        }
        recorder.stop()
      }),
    cancel: () => {
      recorder.onstop = null
      if (recorder.state !== 'inactive') recorder.stop()
      release()
    },
  }
}
