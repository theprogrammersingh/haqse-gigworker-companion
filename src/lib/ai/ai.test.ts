import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiContext } from '../context/buildContext'
import { deleteAll } from '../db'
import { generate } from './client'
import { filterFlashModels, listFlashModels, modelChain } from './models'
import { scrubNumbers } from './schemas'
import {
  askAssistant,
  draftGrievance,
  explain,
  parseEarnings,
  readDocument,
  toToolCall,
} from './tasks'

const generateContent =
  vi.fn<(req: { model: string; config: Record<string, unknown> }) => Promise<unknown>>()
const list = vi.fn<(req: unknown) => Promise<unknown>>()

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent, list }
  },
  ThinkingLevel: { LOW: 'LOW', MEDIUM: 'MEDIUM' },
}))

const apiError = (status: number, message = 'error') =>
  Object.assign(new Error(message), { status })
const reply = (text: string, functionCalls?: unknown[]) => ({ text, functionCalls })
const config = { apiKey: 'test-key', models: ['gemini-3.8-flash', 'gemini-3.6-flash'] }
const today = '2026-10-17'

const context: AiContext = {
  lang: 'en',
  today,
  hour: 10,
  shift: 'morning',
  profile: { platforms: [] },
  earnings14d: {
    net: 0,
    hours: 0,
    netPerHour: 0,
    floorPerHour: 60,
    costSharePct: 0,
    todayNet: 0,
    weekNet: 0,
  },
  anomalies: [],
  docsAttention: [],
  recentIncidents: [],
}

beforeEach(async () => {
  generateContent.mockReset()
  list.mockReset()
  await deleteAll()
})

describe('generate', () => {
  it('needs a key', async () => {
    expect(
      await generate(
        { apiKey: undefined, models: [] },
        { systemInstruction: '', parts: [], thinking: 'low' },
      ),
    ).toEqual({
      ok: false,
      error: { kind: 'no-key', message: 'no-key' },
    })
  })

  it('sends thinkingLevel and no sampling parameters', async () => {
    generateContent.mockResolvedValue(reply('hi'))
    await generate(config, { systemInstruction: 's', parts: [{ text: 'q' }], thinking: 'medium' })
    const { config: sent } = generateContent.mock.calls[0]![0]
    expect(sent.thinkingConfig).toEqual({ thinkingLevel: 'MEDIUM' })
    expect(sent).not.toHaveProperty('temperature')
    expect(sent).not.toHaveProperty('topP')
    expect(sent).not.toHaveProperty('topK')
    expect(sent).not.toHaveProperty('candidateCount')
  })

  it('retries once on 429, then succeeds', async () => {
    generateContent.mockRejectedValueOnce(apiError(429)).mockResolvedValueOnce(reply('ok'))
    const res = await generate(config, { systemInstruction: '', parts: [], thinking: 'low' })
    expect(res).toMatchObject({ ok: true, value: { text: 'ok' } })
    expect(generateContent).toHaveBeenCalledTimes(2)
  })

  it('gives up after one retry with a rate-limit error', async () => {
    generateContent.mockRejectedValue(apiError(429))
    const res = await generate(config, { systemInstruction: '', parts: [], thinking: 'low' })
    expect(res).toMatchObject({ ok: false, error: { kind: 'rate-limit' } })
    expect(generateContent).toHaveBeenCalledTimes(2)
  })

  it('falls through to the next model when one is retired', async () => {
    generateContent
      .mockRejectedValueOnce(apiError(404, 'model not found'))
      .mockResolvedValueOnce(reply('ok'))
    const res = await generate(config, { systemInstruction: '', parts: [], thinking: 'low' })
    expect(res).toMatchObject({ ok: true, value: { switchedTo: 'gemini-3.6-flash' } })
    expect(generateContent.mock.calls[1]![0].model).toBe('gemini-3.6-flash')
  })

  it('maps a bad key and an abort', async () => {
    generateContent.mockRejectedValueOnce(
      apiError(400, 'API key not valid. Please pass a valid API key.'),
    )
    expect(
      await generate(config, { systemInstruction: '', parts: [], thinking: 'low' }),
    ).toMatchObject({
      error: { kind: 'invalid-key' },
    })
    generateContent.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))
    expect(
      await generate(config, { systemInstruction: '', parts: [], thinking: 'low' }),
    ).toMatchObject({
      error: { kind: 'aborted' },
    })
  })
})

describe('parseEarnings', () => {
  const entry = {
    date: today,
    platform: 'zomato',
    gross: 1400,
    tips: 0,
    fuel: 250,
    otherCosts: 0,
    hours: 9,
    trips: 0,
  }

  it('accepts valid JSON', async () => {
    generateContent.mockResolvedValue(reply(JSON.stringify({ entries: [entry] })))
    const res = await parseEarnings(
      config,
      { kind: 'image', base64: 'x', mimeType: 'image/jpeg' },
      today,
      'en',
    )
    const { trips: _zeroTrips, ...expected } = entry
    expect(res).toEqual({ ok: true, value: { via: 'ai', drafts: [expected] } })
  })

  it('rejects malformed JSON for images', async () => {
    generateContent.mockResolvedValue(reply('{"entries":[{"gross":"lots"}]}'))
    const res = await parseEarnings(
      config,
      { kind: 'image', base64: 'x', mimeType: 'image/jpeg' },
      today,
      'en',
    )
    expect(res).toMatchObject({ ok: false, error: { kind: 'bad-output' } })
  })

  it('falls back to the local parser for text without a key', async () => {
    const res = await parseEarnings(
      { apiKey: undefined, models: [] },
      { kind: 'text', text: 'zomato 900 4 ghante' },
      today,
      'hi',
    )
    expect(res).toMatchObject({
      ok: true,
      value: { via: 'local', drafts: [{ gross: 900, hours: 4 }] },
    })
  })
})

describe('readDocument', () => {
  it('scrubs ID numbers the model returns anyway', async () => {
    generateContent.mockResolvedValue(
      reply(
        JSON.stringify({
          type: 'dl',
          holderName: 'Ramesh Kumar',
          expiry: '2027-01-31',
          notes: 'Licence PB10 2019 0001234, valid till 2027-01-31',
        }),
      ),
    )
    const res = await readDocument(config, { base64: 'x', mimeType: 'image/jpeg' }, 'en')
    expect(res.ok && res.value.notes).toBe('Licence PB10 [hidden], valid till 2027-01-31')
  })
})

describe('draftGrievance', () => {
  it('returns simple and formal versions', async () => {
    generateContent.mockResolvedValue(
      reply(
        JSON.stringify({
          subject: 'Short payout',
          simple: 'Aapke paise kam aaye.',
          formal: 'Dear Support Team, my payout was short.',
        }),
      ),
    )
    const res = await draftGrievance(
      config,
      { target: 'platform', evidence: { kind: 'general', note: 'x' } },
      'hi',
    )
    expect(res).toMatchObject({ ok: true, value: { subject: 'Short payout' } })
    expect(generateContent.mock.calls[0]![0].config['thinkingConfig']).toEqual({
      thinkingLevel: 'MEDIUM',
    })
  })
})

describe('explain', () => {
  it('caches answers for the same question', async () => {
    generateContent.mockResolvedValue(reply(JSON.stringify({ answer: 'Yes.' })))
    const input = {
      question: 'Am I eligible?',
      grounding: { id: 's' },
      context,
      language: 'en' as const,
    }
    expect(await explain(config, input)).toEqual({ ok: true, value: 'Yes.' })
    expect(await explain(config, input)).toEqual({ ok: true, value: 'Yes.' })
    expect(generateContent).toHaveBeenCalledTimes(1)
  })
})

describe('assistant', () => {
  it('returns a validated tool call', async () => {
    generateContent.mockResolvedValue(
      reply('', [{ name: 'draftGrievance', args: { target: 'platform', about: 'anomaly' } }]),
    )
    const res = await askAssistant(config, {
      utterance: 'complaint likhna hai',
      context,
      grounding: [],
      schemeIds: [],
      language: 'hi',
    })
    expect(res).toMatchObject({
      ok: true,
      value: { tool: { name: 'draftGrievance', args: { about: 'anomaly' } } },
    })
  })

  it('drops unknown tools and bad arguments', () => {
    expect(toToolCall('deleteEverything', {})).toBeNull()
    expect(toToolCall('addDocument', { type: 'passport' })).toBeNull()
    expect(toToolCall('showSafetyTips', undefined)).toEqual({ name: 'showSafetyTips', args: {} })
  })
})

describe('models', () => {
  it('keeps text Flash models with generateContent, newest first', () => {
    const names = filterFlashModels([
      { name: 'models/gemini-3.5-flash-lite', supportedActions: ['generateContent'] },
      { name: 'models/gemini-3.8-flash', supportedActions: ['generateContent'] },
      { name: 'models/gemini-3.8-pro', supportedActions: ['generateContent'] },
      { name: 'models/gemini-3.8-flash-image', supportedActions: ['generateContent'] },
      { name: 'models/gemini-3.6-flash', supportedActions: ['embedContent'] },
    ])
    expect(names).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite'])
  })

  it('lists via the SDK pager', async () => {
    list.mockResolvedValue(
      (async function* () {
        yield { name: 'models/gemini-3.8-flash', supportedActions: ['generateContent'] }
      })(),
    )
    expect(await listFlashModels('k2')).toEqual({ ok: true, value: ['gemini-3.8-flash'] })
  })

  it('puts the preferred model first', () => {
    expect(modelChain('b', ['a', 'b', 'c'])).toEqual(['b', 'a', 'c'])
    expect(modelChain(undefined, undefined)[0]).toBe('gemini-3.8-flash')
  })
})

describe('scrubNumbers', () => {
  it('hides Aadhaar, account and PAN numbers but keeps dates and amounts', () => {
    expect(scrubNumbers('Aadhaar 1234 5678 9012, PAN ABCDE1234F, a/c 001234567890')).toBe(
      'Aadhaar [hidden], PAN [hidden], a/c [hidden]',
    )
    expect(scrubNumbers('Paid ₹1,400 on 2026-10-17')).toBe('Paid ₹1,400 on 2026-10-17')
  })
})
