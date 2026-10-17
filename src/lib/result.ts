/** Every failure an AI call can surface to the UI. */
export type AiErrorKind =
  | 'no-key'
  | 'invalid-key'
  | 'offline'
  | 'rate-limit'
  | 'model-gone'
  | 'bad-output'
  | 'aborted'
  | 'unknown'

export interface AiError {
  kind: AiErrorKind
  message: string
}

/** Typed result so UI code never has to catch AI errors. */
export type Result<T, E = AiError> = { ok: true; value: T } | { ok: false; error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })

export const err = (kind: AiErrorKind, message: string = kind): Result<never> => ({
  ok: false,
  error: { kind, message },
})
