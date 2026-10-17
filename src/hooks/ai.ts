import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/i18n'
import { aiConfig } from '@/lib/ai/config'
import type { AiConfig } from '@/lib/ai/client'
import { buildContext, type AiContext } from '@/lib/context/buildContext'
import { db, getProfile, getSettings, updateSettings, earningsSince } from '@/lib/db'
import type { AiError, Result } from '@/lib/result'
import { toISODate } from '@/lib/utils/date'
import { useSession } from '@/stores/session'
import { toast } from '@/stores/toast'
import { useSettings } from './data'

/** Builds the shared AI context fresh from the database at call time. */
export async function currentContext(screen?: string): Promise<AiContext> {
  const now = new Date()
  const [profile, settings, earnings, documents, incidents] = await Promise.all([
    getProfile(),
    getSettings(),
    earningsSince(toISODate(now)),
    db.documents.toArray(),
    db.incidents.orderBy('datetime').reverse().limit(5).toArray(),
  ])
  return buildContext({
    profile,
    earnings,
    documents,
    incidents,
    now,
    dismissedAnomalies: settings.dismissedAnomalies,
    ...(screen ? { screen } : {}),
  })
}

type TaskState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; value: T }
  | { status: 'error'; error: AiError }

/**
 * Runs an AI task with an AbortController that is cancelled when the screen
 * unmounts or a new run starts (PRD §6). Never throws.
 */
export function useAiTask<T, A extends unknown[]>(
  task: (config: AiConfig, signal: AbortSignal, ...args: A) => Promise<Result<T>>,
  kind: 'parse' | 'chat' | 'draft' = 'chat',
) {
  const [state, setState] = useState<TaskState<T>>({ status: 'idle' })
  const controller = useRef<AbortController | null>(null)
  const { t } = useTranslation()

  useEffect(() => () => controller.current?.abort(), [])

  const run = async (...args: A): Promise<Result<T>> => {
    controller.current?.abort()
    const c = new AbortController()
    controller.current = c
    setState({ status: 'loading' })
    const res = await task(await aiConfig(kind), c.signal, ...args)
    if (c.signal.aborted) return res
    if (res.ok) {
      const switched = (res.value as { switchedTo?: string } | null)?.switchedTo
      if (switched) {
        await updateSettings({ model: switched })
        toast(t('ai.modelSwitched', { model: switched }), { tone: 'info' })
      }
      setState({ status: 'done', value: res.value })
    } else setState({ status: 'error', error: res.error })
    return res
  }

  const reset = (): void => {
    controller.current?.abort()
    setState({ status: 'idle' })
  }

  return { state, run, reset }
}

/** True when AI can be attempted right now (key present and online). */
export function useAiReady(): boolean {
  const online = useSession((s) => s.online)
  const settings = useSettings()
  return online && !!settings?.apiKey
}
