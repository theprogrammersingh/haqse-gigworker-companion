import type {
  FunctionCall,
  FunctionDeclaration,
  GenerateContentConfig,
  GoogleGenAI,
  Part,
} from '@google/genai'
import { RETRY_BASE_MS } from '../constants'
import { err, ok, type AiErrorKind, type Result } from '../result'

/** The only module that knows about the Gemini SDK (swap point for a proxy, PRD §6). */

export type ThinkingLevelName = 'low' | 'medium'

export interface AiConfig {
  apiKey: string | undefined
  /** Preferred model first; later entries are fallbacks for retired models. */
  models: readonly string[]
}

export interface GenerateRequest {
  systemInstruction: string
  parts: Part[]
  thinking: ThinkingLevelName
  /** JSON Schema for structured output. */
  jsonSchema?: unknown
  tools?: FunctionDeclaration[]
  signal?: AbortSignal
}

export interface GenerateResponse {
  text: string
  functionCalls: FunctionCall[]
  /** Set when the preferred model was gone and a fallback answered. */
  switchedTo?: string
}

type SdkModule = typeof import('@google/genai')
let sdkPromise: Promise<SdkModule> | undefined
const clients = new Map<string, GoogleGenAI>()

/** Loads the SDK on first use so it never weighs on the initial bundle. */
export const loadSdk = (): Promise<SdkModule> => (sdkPromise ??= import('@google/genai'))

export async function getClient(apiKey: string): Promise<GoogleGenAI> {
  const cached = clients.get(apiKey)
  if (cached) return cached
  const { GoogleGenAI } = await loadSdk()
  const client = new GoogleGenAI({ apiKey })
  clients.set(apiKey, client)
  return client
}

/** Maps SDK/network failures to the app's error kinds. */
export function classifyError(e: unknown): AiErrorKind {
  if (e instanceof DOMException && e.name === 'AbortError') return 'aborted'
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline'
  const status = typeof e === 'object' && e !== null && 'status' in e ? Number(e.status) : 0
  const message = e instanceof Error ? e.message : String(e)
  if (status === 429) return 'rate-limit'
  if (
    status === 401 ||
    status === 403 ||
    /api key not valid|API_KEY_INVALID|permission/i.test(message)
  )
    return 'invalid-key'
  if (status === 404 || /not found|is not supported|retired|deprecated/i.test(message))
    return 'model-gone'
  if (e instanceof TypeError) return 'offline'
  return 'unknown'
}

const isRetryable = (e: unknown): boolean => {
  const status = typeof e === 'object' && e !== null && 'status' in e ? Number(e.status) : 0
  return status === 429 || status >= 500
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

async function callModel(client: GoogleGenAI, sdk: SdkModule, model: string, req: GenerateRequest) {
  const config: GenerateContentConfig = {
    systemInstruction: req.systemInstruction,
    thinkingConfig: {
      thinkingLevel: req.thinking === 'medium' ? sdk.ThinkingLevel.MEDIUM : sdk.ThinkingLevel.LOW,
    },
    ...(req.jsonSchema
      ? { responseMimeType: 'application/json', responseJsonSchema: req.jsonSchema }
      : {}),
    ...(req.tools ? { tools: [{ functionDeclarations: req.tools }] } : {}),
    ...(req.signal ? { abortSignal: req.signal } : {}),
  }
  const res = await client.models.generateContent({
    model,
    contents: [{ role: 'user', parts: req.parts }],
    config,
  })
  return { text: res.text ?? '', functionCalls: res.functionCalls ?? [] }
}

/** One attempt plus a single jittered retry on 429/5xx (PRD §6). */
async function withRetry<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (!isRetryable(e) || signal?.aborted) throw e
    await sleep(RETRY_BASE_MS * (1 + Math.random()), signal)
    return fn()
  }
}

/**
 * Stateless generateContent call. Never throws: every failure becomes a typed error.
 * Falls through to the next configured model when one is retired or not found.
 */
export async function generate(
  config: AiConfig,
  req: GenerateRequest,
): Promise<Result<GenerateResponse>> {
  if (!config.apiKey) return err('no-key')
  if (typeof navigator !== 'undefined' && !navigator.onLine) return err('offline')
  try {
    const [sdk, client] = await Promise.all([loadSdk(), getClient(config.apiKey)])
    for (const [i, model] of config.models.entries()) {
      try {
        const out = await withRetry(() => callModel(client, sdk, model, req), req.signal)
        return ok(i > 0 ? { ...out, switchedTo: model } : out)
      } catch (e) {
        if (classifyError(e) !== 'model-gone' || i === config.models.length - 1) throw e
      }
    }
    return err('model-gone')
  } catch (e) {
    const kind = classifyError(e)
    return err(kind, e instanceof Error ? e.message : kind)
  }
}
