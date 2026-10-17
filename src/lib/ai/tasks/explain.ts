import type { AiContext } from '../../context/buildContext'
import type { Language } from '../../schemas'
import { ok, type Result } from '../../result'
import { cached } from '../cache'
import type { AiConfig } from '../client'
import { EXPLAIN, WEEKLY_SUMMARY, baseInstruction, dataBlock } from '../prompts'
import { answerSchema } from '../schemas'
import { runStructured, textPart } from './run'

export interface ExplainInput {
  question: string
  /** Bundled facts (scheme or right JSON); the only source of truth. */
  grounding: unknown
  context: AiContext
  language: Language
}

/** Grounded answer, cached for 24 h per question + grounding + language. */
export function explain(
  config: AiConfig,
  input: ExplainInput,
  signal?: AbortSignal,
): Promise<Result<string>> {
  const key = {
    q: input.question.trim().toLowerCase(),
    g: input.grounding,
    l: input.language,
    p: input.context.profile,
  }
  return cached('explain', key, async () => {
    const res = await runStructured(config, {
      schema: answerSchema,
      systemInstruction: `${baseInstruction(input.language)}\n\n${EXPLAIN}`,
      parts: [
        textPart(`GROUNDING:\n${JSON.stringify(input.grounding)}`),
        textPart(`CONTEXT:\n${JSON.stringify(input.context)}`),
        textPart(dataBlock('USER DATA', `Question: ${input.question}`)),
      ],
      thinking: 'low',
      signal,
    })
    return res.ok ? ok(res.value.answer) : res
  })
}

/** Weekly earnings summary in the user's language, cached per ISO week (PRD FR-10). */
export function weeklySummary(
  config: AiConfig,
  context: AiContext,
  weekKey: string,
  language: Language,
  signal?: AbortSignal,
): Promise<Result<string>> {
  return cached(
    'weekly',
    { weekKey, language, e: context.earnings14d.weekNet, n: context.anomalies.length },
    async () => {
      const res = await runStructured(config, {
        schema: answerSchema,
        systemInstruction: `${baseInstruction(language)}\n\n${WEEKLY_SUMMARY}`,
        parts: [textPart(`CONTEXT:\n${JSON.stringify(context)}`)],
        thinking: 'low',
        signal,
      })
      return res.ok ? ok(res.value.answer) : res
    },
    7 * 24 * 60 * 60 * 1000,
  )
}
