import { IMAGE_MAX_PX, JPEG_QUALITY } from '../constants'

export interface InlineImage {
  base64: string
  mimeType: 'image/jpeg'
}

/** Longest edge scaled to `max`, aspect kept; never upscales. */
export function fitWithin(
  width: number,
  height: number,
  max = IMAGE_MAX_PX,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * Downscales a photo in a canvas and returns base64 JPEG. The image lives only
 * in memory: no blob is stored and the object URL is revoked (PRD FR-16).
 */
export async function prepareImage(file: Blob): Promise<InlineImage> {
  const bitmap = await createImageBitmap(file)
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
    canvas.width = canvas.height = 0
    return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), mimeType: 'image/jpeg' }
  } finally {
    bitmap.close()
  }
}
