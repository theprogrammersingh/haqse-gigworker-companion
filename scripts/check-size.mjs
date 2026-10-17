// Sums gzipped size of the JS the browser loads before first render
// (entry script + modulepreloads in dist/index.html) and fails over budget.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_KB = 200
const dist = join(import.meta.dirname, '..', 'dist')
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const base = process.env.VITE_BASE ?? '/'
const files = [
  ...html.matchAll(/<(?:script[^>]+src|link[^>]+rel="modulepreload"[^>]+href)="([^"]+\.js)"/g),
]
  .map((m) => m[1].replace(base, ''))
  .filter((f) => f.startsWith('assets/'))

let total = 0
for (const f of files) {
  const kb = gzipSync(readFileSync(join(dist, f)), { level: 9 }).length / 1024
  total += kb
  console.log(`${kb.toFixed(1).padStart(7)} KB  ${f}`)
}
console.log(`${total.toFixed(1).padStart(7)} KB  initial JS (gzip), budget ${BUDGET_KB} KB`)
if (total > BUDGET_KB) {
  console.error('Initial JS is over budget.')
  process.exit(1)
}
