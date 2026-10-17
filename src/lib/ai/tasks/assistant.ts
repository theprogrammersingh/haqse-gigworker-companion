import type { FunctionDeclaration } from '@google/genai'
import { z } from 'zod'
import type { AiContext } from '../../context/buildContext'
import type { Language } from '../../schemas'
import { DOCUMENT_TYPES, GRIEVANCE_TARGETS } from '../../schemas/enums'
import { ok, type Result } from '../../result'
import { generate, type AiConfig } from '../client'
import { ASSISTANT, baseInstruction, dataBlock } from '../prompts'
import { scrubNumbers } from '../schemas'
import { textPart } from './run'

/** App actions the assistant may propose; each needs user confirmation (PRD FR-27). */
export const toolArgSchemas = {
  logEarning: z.object({ text: z.string().max(300) }),
  openScheme: z.object({ schemeId: z.string().max(40) }),
  draftGrievance: z.object({
    target: z.enum(GRIEVANCE_TARGETS),
    about: z.enum(['anomaly', 'incident', 'other']),
    note: z.string().max(500).optional(),
  }),
  addDocument: z.object({ type: z.enum(DOCUMENT_TYPES), expiry: z.string().optional() }),
  showSafetyTips: z.object({ condition: z.enum(['night', 'heat', 'rain', 'general']).optional() }),
} as const

export type ToolName = keyof typeof toolArgSchemas
export type ToolCall = {
  [K in ToolName]: { name: K; args: z.infer<(typeof toolArgSchemas)[K]> }
}[ToolName]

export const toolDeclarations = (schemeIds: readonly string[]): FunctionDeclaration[] => [
  {
    name: 'logEarning',
    description: 'Open the earnings log pre-filled with what the worker said they earned or spent.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: "The worker's own words about the earning" },
      },
      required: ['text'],
    },
  },
  {
    name: 'openScheme',
    description: 'Open the details of one welfare scheme.',
    parametersJsonSchema: {
      type: 'object',
      properties: { schemeId: { type: 'string', enum: [...schemeIds] } },
      required: ['schemeId'],
    },
  },
  {
    name: 'draftGrievance',
    description: 'Start a complaint draft about a payout drop, an incident, or something else.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', enum: [...GRIEVANCE_TARGETS] },
        about: { type: 'string', enum: ['anomaly', 'incident', 'other'] },
        note: { type: 'string' },
      },
      required: ['target', 'about'],
    },
  },
  {
    name: 'addDocument',
    description:
      'Add or update a document in the checklist, optionally with its expiry date (YYYY-MM-DD).',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: [...DOCUMENT_TYPES] },
        expiry: { type: 'string' },
      },
      required: ['type'],
    },
  },
  {
    name: 'showSafetyTips',
    description: 'Show safety tips, optionally for night, heat or rain.',
    parametersJsonSchema: {
      type: 'object',
      properties: { condition: { type: 'string', enum: ['night', 'heat', 'rain', 'general'] } },
    },
  },
]

/** Validates a raw function call; unknown tools or bad args are dropped. */
export function toToolCall(name: string | undefined, args: unknown): ToolCall | null {
  if (!name || !(name in toolArgSchemas)) return null
  const parsed = toolArgSchemas[name as ToolName].safeParse(args ?? {})
  return parsed.success ? ({ name, args: parsed.data } as ToolCall) : null
}

export interface AssistantReply {
  text: string
  tool: ToolCall | null
  switchedTo?: string
}

export interface AssistantInput {
  utterance: string
  context: AiContext
  grounding: unknown
  schemeIds: readonly string[]
  language: Language
}

/** One stateless assistant turn with function calling. */
export async function askAssistant(
  config: AiConfig,
  input: AssistantInput,
  signal?: AbortSignal,
): Promise<Result<AssistantReply>> {
  const res = await generate(config, {
    systemInstruction: `${baseInstruction(input.language)}\n\n${ASSISTANT}`,
    parts: [
      textPart(`GROUNDING:\n${JSON.stringify(input.grounding)}`),
      textPart(`CONTEXT:\n${JSON.stringify(input.context)}`),
      textPart(dataBlock('USER DATA', input.utterance)),
    ],
    thinking: 'low',
    tools: toolDeclarations(input.schemeIds),
    ...(signal ? { signal } : {}),
  })
  if (!res.ok) return res
  const call = res.value.functionCalls[0]
  return ok({
    text: scrubNumbers(res.value.text),
    tool: call ? toToolCall(call.name, call.args) : null,
    ...(res.value.switchedTo ? { switchedTo: res.value.switchedTo } : {}),
  })
}
