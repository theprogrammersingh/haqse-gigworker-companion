import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from './en.json'
import hi from './hi.json'
import pa from './pa.json'

type Tree = { [k: string]: string | string[] | Tree }

/** Flattens nested JSON to dotted keys; arrays count as one leaf. */
function flatten(tree: Tree, prefix = ''): Map<string, string | string[]> {
  const out = new Map<string, string | string[]>()
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string' || Array.isArray(v)) out.set(key, v)
    else for (const [kk, vv] of flatten(v, key)) out.set(kk, vv)
  }
  return out
}

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) return sourceFiles(p)
    return /\.tsx?$/.test(f) && !f.endsWith('.test.ts') ? [p] : []
  })

const enKeys = flatten(en as Tree)
const has = (key: string): boolean => enKeys.has(key) || enKeys.has(`${key}_other`)
const placeholders = (s: string): string[] =>
  [...s.matchAll(/{{(\w+)}}/g)].map((m) => m[1] ?? '').sort()

describe('translations', () => {
  it('defines every static key used in the code', () => {
    const src = sourceFiles(join(import.meta.dirname, '..'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
    const used = new Set([...src.matchAll(/\bt\(\s*'([\w.-]+)'/g)].map((m) => m[1] ?? ''))
    for (const extra of ['saathi.docValid', 'saathi.docExpired']) used.add(extra)
    expect([...used].filter((k) => !has(k))).toEqual([])
  })

  it.each([
    ['hi', hi],
    ['pa', pa],
  ])('%s has exactly the English keys with the same placeholders', (_lang, bundle) => {
    const keys = flatten(bundle as Tree)
    expect([...enKeys.keys()].filter((k) => !keys.has(k))).toEqual([])
    expect([...keys.keys()].filter((k) => !enKeys.has(k))).toEqual([])
    const mismatched = [...enKeys].filter(([k, v]) => {
      const other = keys.get(k)
      if (typeof v !== 'string' || typeof other !== 'string') return false
      return placeholders(v).join() !== placeholders(other).join()
    })
    expect(mismatched.map(([k]) => k)).toEqual([])
  })

  it('covers every dynamic enum family', () => {
    const families = [
      'enum.platform.zomato',
      'enum.doc.eshram',
      'enum.incident.unsafe-area',
      'ai.error.model-gone.title',
      'haq.check.platformWorker.unknown',
      'kagaz.state.missing',
      'saathi.action.showSafetyTips',
      'suraksha.steps.deactivation',
    ]
    expect(families.filter((k) => !has(k))).toEqual([])
  })
})
