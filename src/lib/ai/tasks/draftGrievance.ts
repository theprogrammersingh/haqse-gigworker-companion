import type { GrievanceRequest, Language } from '../../schemas'
import { ok, type Result } from '../../result'
import type { AiConfig } from '../client'
import { DRAFT_GRIEVANCE, baseInstruction, dataBlock } from '../prompts'
import { grievanceDraftSchema, scrubNumbers, type GrievanceDraft } from '../schemas'
import { runStructured, textPart } from './run'

const TARGET_NAMES = {
  platform: 'the platform company support / grievance officer',
  insurer: 'the insurance company claims team',
  labour: 'the state labour department / welfare board',
  police: 'the local police station (non-emergency complaint)',
} as const

/** Drafts simple + formal versions from evidence only. Never sends anything. */
export async function draftGrievance(
  config: AiConfig,
  request: GrievanceRequest,
  language: Language,
  signal?: AbortSignal,
): Promise<Result<GrievanceDraft>> {
  const res = await runStructured(config, {
    schema: grievanceDraftSchema,
    systemInstruction: `${baseInstruction(language)}\n\n${DRAFT_GRIEVANCE}`,
    parts: [
      textPart(`TARGET: ${TARGET_NAMES[request.target]}`),
      textPart(`EVIDENCE:\n${JSON.stringify(request.evidence)}`),
      ...(request.note ? [textPart(dataBlock('USER DATA', request.note))] : []),
    ],
    thinking: 'medium',
    signal,
  })
  if (!res.ok) return res
  const v = res.value
  return ok({
    subject: scrubNumbers(v.subject),
    simple: scrubNumbers(v.simple),
    formal: scrubNumbers(v.formal),
  })
}
