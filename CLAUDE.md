# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

HaqSe is a local-first React PWA for Indian gig and informal workers: earnings ledger, scheme eligibility, document help, grievance drafting and safety, in English, Hindi and Punjabi. It was built for the PromptWars "Gig Worker Companion" challenge. `HaqSe — Product Requirements Document.md` is the spec; FR-numbers in code comments refer to it.

## Commands

```bash
npm run dev               # Vite dev server (no CSP in dev; it is injected at build)
npm run build             # tsc -b, then vite build → dist/ (+ CSP meta, sw.js, 404.html)
npm run preview           # serve dist/
npm test                  # Vitest (unit, component, AI contract, i18n, data)
npm run test:coverage     # with 70% gates on src/lib and src/features/*/logic
npm run test:e2e          # Playwright, 360 px Android viewport; builds and serves on :4181
npm run lint              # oxlint --deny-warnings
npm run format            # Prettier (format:check in CI)
npm run typecheck         # tsc -b over app, node (vite.config) and e2e projects
npm run size              # initial JS gzip budget (200 KB) from dist/index.html
npx vitest run src/lib/rules/anomaly.test.ts -t "70%"   # single test
npx playwright test -g "flow 1"                           # single e2e test
```

CI (`.github/workflows/deploy.yml`) runs audit, format:check, lint, typecheck, coverage, build, size and e2e, then deploys `dist/` to GitHub Pages.

## Architecture

**Layers and dependency direction:** `lib/` (pure TS) ← `hooks/` + `stores/` + `ui/` ← `features/<module>/` ← `app/` (router, layout).

- `src/lib/rules/` and `src/lib/context/` must not import React or Dexie. All product decisions live here, with thresholds in `src/lib/constants.ts`.
- Features import each other only through their `index.ts` (e.g. Home uses `@/features/kamai`'s `AnomalyCard`). Pure feature logic lives in `features/*/logic/` and is unit-tested.
- Cross-module handoffs go through URL params plus Dexie, never shared component state. For example, `/shikayat/new?from=anomaly&entry=<id>` and `?from=incident&id=<id>`, `/kagaz?for=<schemeId>` and `?add=<docType>&expiry=`, `/suraksha?tips=night`. Evidence is always **recomputed from the ledger**, not trusted from the URL.

**Data:** Dexie DB in `src/lib/db/dexie.ts`. `profile` and `settings` are single rows (`id: 'me'` / `'app'`). Earnings are queried by `date` range (`earningsSince`), never by full scan. React reads go through `useLiveQuery` hooks in `src/hooks/data.ts`. `useLedger()` returns the summary and open anomalies.

**Rules decide, Gemini explains.** Every AI feature has a non-AI path:

- the text earnings log falls back to `lib/parse/localEarningParser.ts`
- grievances fall back to `features/shikayat/logic/template.ts`
- Saathi falls back to `features/saathi/logic/localIntent.ts`

**AI layer (`src/lib/ai/`):**

- `client.ts` is the only SDK-aware module. It lazy-loads `@google/genai`, which must stay out of the initial bundle.
- Every call returns `Result<T>` and never throws.
- `tasks/run.ts` turns a Zod schema into `responseJsonSchema` and re-validates the response.
- Gemini 3 rules: never send temperature, topP, topK or candidateCount. Use `thinkingConfig.thinkingLevel`.
- In UI code, call tasks via `useAiTask` (`src/hooks/ai.ts`), which handles abort-on-unmount and model-switch toasts. Get context from `currentContext()`.

**Bundle discipline:** import option arrays and types from `@/lib/schemas/enums` (no zod) in UI code. Zod schemas (`profile.ts`, `records.ts`, `scheme.ts`) pull zod in, so use them only in lazy paths (AI tasks, save validation, tests).

**i18n:** `src/i18n/{en,hi,pa}.json`, each lazy-loaded. `src/i18n/i18n.test.ts` fails if a `t('key')` used in code is missing from `en.json`, or if `hi`/`pa` differ from `en` in keys or `{{placeholders}}`. Plurals use `_one`/`_other`. Dynamic key families (`enum.*`, `ai.error.<kind>.*`, `haq.check.<criterion>.<result>`, `suraksha.steps.<type>` arrays) must exist in all three files.

## Conventions and gotchas

- React Compiler is on: no manual `useMemo`/`useCallback`. Lint enforces purity, so never call `Date.now()`/`new Date()` during render. Use `useNow`/`useHour`/`useToday` from `src/hooks/clock.ts`. Don't `setState` synchronously in effects; derive state instead.
- `exactOptionalPropertyTypes` is on: spread optional fields conditionally (`...(x ? { x } : {})`). To clear an optional profile field, use `saveProfile`, because `updateProfile` merges.
- Files that export components must export only components (fast-refresh lint). Put hooks and constants in sibling `.ts` files (e.g. `ui/useMoney.ts`, `ui/tones.ts`).
- `ui/Sheet.tsx` closes only on user intent (Esc or the close button). Don't wire the native dialog `close` event to `onClose`: it also fires on programmatic close and caused the SOS sheet to unmount itself.
- AI output is rendered as text only (`react/no-danger` is an error). Never persist images or ID/bank numbers. Run AI-returned text through `scrubNumbers`.
- Styling: Tailwind v4 tokens in `src/index.css` (`bg-surface`, `text-muted`, `bg-brand`, `min-h-tap` = 48 px). Status colours always go with an icon and text (`AlertCard`, `StatusPill`).
- Do not include ID-like numbers in seed or test data except to test scrubbing.

## Deployment and submission rules

- GitHub Pages via Actions at `haq-se.programmersingh.dev` (`public/CNAME`). The base path comes from `VITE_BASE`.
- Commit messages and PR descriptions carry no AI attribution: no `Co-Authored-By` trailer and no "Generated with" line.
- Hard gates: repo under 10 MB, **single `main` branch only** (commit directly to `main`; no feature branches pushed), public, no secrets, at most 3 submission attempts. See PRD §11.
