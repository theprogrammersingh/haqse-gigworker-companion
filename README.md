# HaqSe — GenAI Gig Worker Companion

**HaqSe** ("by right") is a **GenAI-powered assistant for gig and informal workers**: delivery partners, cab and bike-taxi drivers, and daily-wage domestic and construction workers. It uses **Google Gemini as its core** to give **multilingual guidance, in simple language**, across the five areas the brief names: **earnings tracking, safety practices, rights and welfare scheme awareness, document help, and grievance or dispute drafting.**

**Live:** https://haqse.programmersingh.dev · installable on any phone, works offline · English, हिंदी, ਪੰਜਾਬੀ

<img src="docs/screenshot.jpg" alt="HaqSe home screen: today's take-home ₹690, a Zomato payout-drop alert with a Draft complaint button, and the bottom navigation" width="300">

---

## The problem statement

> **Gig Worker Companion**
>
> Design and build a GenAI-powered assistant that supports gig and informal workers such as delivery partners, drivers, and daily-wage workers. The solution must leverage Generative AI as a core component to provide multilingual guidance on earnings tracking, safety practices, rights and welfare scheme awareness, document help, and grievance or dispute drafting in simple language.
>
> _Pro-Tip:_ Functional checks are designed to evaluate your application as a whole, not just a single feature. Solutions with thoughtfully connected workflows and meaningful functionality provide evaluators with multiple opportunities to experience your application as intended. A well-rounded application is also more resilient to isolated implementation issues, reducing the likelihood of a single broken flow impacting the overall functional evaluation.

## How HaqSe answers it, requirement by requirement

| The brief asks for…                                          | HaqSe delivers                                                                                                                                                                         | Generative AI (Gemini) role                                                                                                                  | Try it                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **A GenAI-powered assistant**                                | **Saathi**, an assistant on every screen. It answers from your own data and _does_ things in the app: log earnings, open a scheme, start a complaint, add a document, show safety tips | Gemini **function calling** picks the action and its arguments; every action needs one tap to confirm                                        | Tap **Ask Saathi** → "complaint likhna hai kal ke payment ka"   |
| **…that supports gig and informal workers**                  | Built for three personas: a 2-app delivery rider, a cab driver and a cash-paid daily-wage worker. 9 platforms plus "Other / cash", and 5 work types (delivery, ride, domestic, construction, other) | The context Gemini sees is the worker's profile, ledger, documents and shift, compacted to ≤ 1.5 KB with no names or IDs                    | Onboarding → pick work type, apps, vehicle, state, age          |
| **Generative AI as a core component**                        | Seven Gemini tasks drive the product (table below): multimodal parsing, document reading, grounded explanations, weekly summaries, complaint drafting and the agentic assistant | Gemini Flash (user-selectable) with structured JSON output validated by Zod, grounded prompts and a shared safety system prompt             | Settings → AI help → paste a free key → choose a model         |
| **Multilingual guidance**                                    | Full UI in **English, Hindi and Punjabi**. Understands Roman Hindi/Punjabi ("aaj Zomato se 1400, petrol 250, 9 ghante"), Devanagari and Gurmukhi digits. Voice in, **Read aloud** out | Every Gemini answer is written in the worker's language. Saathi has a **Reply in** switch. Complaint letters come in two versions: simple (your language) and formal (English) | Settings → Language → ਪੰਜਾਬੀ                                    |
| **…on earnings tracking**                                    | **Kamai**: log by **voice, text or payout screenshot**; real take-home after fuel and costs; net per hour; 14-day chart; per-app comparison; automatic **payout-drop detection**     | Gemini reads voice notes and screenshots into entries (confirmed before saving) and writes a **weekly summary with one tip**                | Earnings → **Log earnings** → Speak / Screenshot                |
| **…on safety practices**                                     | **Suraksha**: one-press **SOS** (112, SMS with live location to trusted contacts; works offline); tips that change for **night, heat and rain** and by vehicle; incident log with next steps | The assistant explains tips and next steps in your language. An incident turns into a GenAI-drafted complaint to police or insurer         | Safety → toggle **It is raining** → tips change                 |
| **…on rights and welfare scheme awareness**                  | **Haq**: 10 curated schemes (e-Shram, PM-JAY, PM-SYM, PMSBY, PMJJBY, APY, NFSA, Rajasthan/Karnataka gig-worker boards, Punjab construction board) **ranked for your profile** with reasons; Know-your-rights cards | **"Explain simply"** and follow-up Q&A, **grounded only in the bundled scheme data**, cite the official link and refuse to guess              | Schemes → PM-SYM → **Explain simply**                           |
| **…on document help**                                        | **Kagaz**: checklist of 9 documents with expiry alerts; the papers each scheme needs; **"Apply" blocked** until they are ready                                                       | **Photo → Gemini reads** the document type, name and expiry (ID numbers scrubbed, image never stored), and **explains any form or letter** in simple words | Documents → **Scan a document** / **Explain a form**            |
| **…on grievance or dispute drafting**                        | **Shikayat**: complaints pre-filled from **your own evidence** (payout records, incidents) to the platform, insurer, labour department or police. Edit, copy, share, email or WhatsApp; track draft → sent → resolved | Gemini drafts a **simple version in your language and a formal English letter** from the evidence only; placeholders where facts are missing | Home → payout-drop card → **Draft complaint**                   |
| **…in simple language**                                      | 18 px text, icons on every action, one primary action per screen, voice everywhere, read-aloud                                                                                       | A shared system prompt fixes **class-6 reading level, short sentences, no jargon**, and "say so and give the helpline" when unsure          | Any AI answer → **Read aloud**                                  |
| **Pro-tip: thoughtfully connected workflows**                | One worker profile and one earnings ledger feed every module. Three end-to-end flows hand off automatically (below)                                                                  | Gemini sees the same shared context in every task, so answers change with the worker's situation                                             | See the [2-minute tour](#evaluator-tour-2-minutes)              |
| **Pro-tip: meaningful functionality**                        | Real calculations (median-based payout-drop rule, take-home per hour, eligibility rules), real scheme data with helplines, real share/SMS/112 actions, installable PWA              | Gemini turns the rule results into advice and letters, not decoration                                                                        | **Try with demo data** on first open                            |
| **Pro-tip: resilient to isolated implementation issues**     | Every GenAI feature has a working non-AI path (local parser, letter templates, rule-based assistant). Error boundary per screen. Offline-first. 150+ automated tests                  | One retry on 429/5xx, automatic fall-through to the next model if one is retired, typed errors with a plain-language next step              | Use the app with **no key**, or **offline**                     |

## Generative AI at the core

Rules decide **what** matters (a payout drop, an expiring licence, an eligible scheme). Gemini decides **how to say it** to this worker, in their language, and does the language-heavy work a worker can't easily do alone.

| Gemini task                       | Input                                        | What Gemini produces                                                       | Used in                     | Without AI          |
| --------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- | --------------------------- | ------------------- |
| 1. **Parse earnings**             | Voice note, typed text, or payout screenshot | Structured entries (platform, payout, tips, fuel, costs, hours, trips)      | Kamai log                   | Local parser / form |
| 2. **Weekly earnings summary**    | 14-day ledger summary                        | 5 short sentences in your language with one practical tip                   | Kamai                       | Rule-based insights |
| 3. **Explain a scheme or right**  | Scheme JSON (grounding) + profile + question | Simple answer citing the official link; declines out-of-scope questions     | Haq                         | Static summary      |
| 4. **Read a document**            | Photo (in memory, downscaled)                | Type, holder name, expiry, a plain-language note; ID numbers scrubbed       | Kagaz                       | Manual entry        |
| 5. **Explain a form or letter**   | Photo                                        | What it is, what to do, deadline, what to watch out for                     | Kagaz                       | n/a                 |
| 6. **Draft a grievance**          | Evidence (ledger days or incident) + target  | Subject, simple version (your language), formal English letter              | Shikayat (from Kamai, Suraksha) | Fill-in template |
| 7. **Saathi assistant**           | Utterance + current screen + shared context  | Answer + one **function call** (`logEarning`, `openScheme`, `draftGrievance`, `addDocument`, `showSafetyTips`) | Every screen | Local intent matcher |

**How Gemini is used:**

- Official `@google/genai` SDK with stateless `generateContent`.
- Structured output via `responseJsonSchema` generated from Zod, then **re-validated with Zod**. Malformed output is never saved.
- `thinkingLevel` (`low`, or `medium` for drafts) instead of sampling parameters.
- **Grounding:** scheme facts, rights and helplines come only from bundled JSON injected per request.
- **Prompt-injection guard:** text from documents, screenshots and audio is wrapped as data.
- **BYOK:** you paste a free key. It is validated with a real `models.list` call, and **Settings lists the Gemini Flash models your key can use**. The key is stored only on the device. Prompts live in `src/lib/ai/prompts.ts`; all provider code is in `src/lib/ai/client.ts`.

## Connected workflows

```
            ┌───────── Worker profile ─────────┐   ┌──────── Earnings ledger ────────┐
            │ language, state, work, vehicle,  │   │ date, platform, payout, tips,   │
            │ platforms, age band, income band │   │ fuel, costs, hours, trips       │
            └───────────────┬──────────────────┘   └───────────────┬─────────────────┘
                            └──── rules decide · Gemini explains ──┘
                                             │
    ┌──────────┬───────────┬─────────────────┼─────────────┬────────────┬───────────────┐
  Kamai       Haq        Kagaz           Shikayat      Suraksha     Saathi (assistant)
 earnings   schemes &   documents &     grievance &   safety, SOS,  on every screen,
 tracking    rights      expiry          disputes      incidents    function calling
    │           │           │               ▲              │
    └── flow 1 ─┼───────────┼───────────────┤              │
                └─ flow 2 ──┘               └──── flow 3 ──┘
```

1. **Earnings → Insight → Dispute.** Log a day by voice or screenshot. HaqSe computes real take-home per hour and flags a payout below 75% of your 14-day median. **Draft complaint** opens a letter pre-filled with the date, hours, amount paid and expected amount.
2. **Profile → Schemes → Documents.** Your profile ranks the schemes. Each scheme lists its papers, and missing or expiring ones are surfaced in Documents first. "Apply" unlocks when they are ready.
3. **Incident → Safety → Grievance.** SOS or **Report incident** logs time, place and notes. Safety shows next steps for that kind of incident, and **Raise complaint** drafts the letter to the police, insurer, platform or labour department.
4. **Saathi ties it together.** Saying "complaint likhna hai kal ke payment ka" opens flow 1 pre-filled; "mera licence kab expire hoga" answers from your documents.

## Evaluator tour (2 minutes)

1. Open https://haqse.programmersingh.dev → choose a language → **Next** → **Skip** → **Try with demo data** (14 days of earnings, one payout drop, a licence expiring in 20 days, one night incident).
2. **Earnings tracking + grievance drafting:** on Home, the card "Zomato paid less on …" → **Draft complaint** → **Make the draft** (or **Write the draft with AI** with a key) → see the simple and formal versions → **Copy** / **Share**.
3. **Schemes + documents:** **Schemes** → _Ayushman Bharat PM-JAY_ → "Fix your papers first" → **Fix papers in Documents** → mark e-Shram as held → back: **Apply** is unlocked. With a key, tap **Explain simply**.
4. **Safety:** **Safety** → tips change at night or when you flag rain/heat → **SOS** → 112, SMS with location → **Raise complaint** on the logged incident.
5. **Assistant + multilingual:** **Ask Saathi** → "mera licence kab expire hoga" → **Read aloud**. Switch **Reply in** to ਪੰਜਾਬੀ, or change the whole app's language in Settings.
6. **GenAI with a key:** Settings → paste a Gemini key → choose a Flash model → in Earnings, **Log earnings** → **Speak** or **Screenshot**.

## Approach and logic

**Rules decide, Gemini explains.** Deterministic, unit-tested rules (`src/lib/rules/`) decide what is relevant. Gemini turns it into guidance and drafts, grounded in bundled data. This keeps advice predictable and safe from hallucination, and keeps every flow working when AI is unavailable.

| Signal             | Rule (deterministic, tested)                                                   | What the worker sees                                      |
| ------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Payout drop        | Day payout/hour < 75% of the 14-day median for that platform (≥ 3 prior days) | Anomaly card → pre-filled dispute draft                   |
| Low net earnings   | Net/hour below the worker's target, else the state minimum-wage reference      | Cost-share and best-platform advice                       |
| Document expiry    | Expiry within 30 days, or already expired                                      | Home alert; **blocks "Apply"** on schemes that need it    |
| Scheme eligibility | Profile vs. each scheme's JSON rules (age band, state, work, income, platform) | Ranked Eligible / Likely / Need info, with reasons        |
| Shift context      | Local hour 21:00–05:00, or the worker flags heat/rain                          | Night/heat/rain tips; SOS made prominent                  |
| Incomplete profile | A rule needs a field the profile lacks                                         | Asks **one** question in context, not a long form         |
| No key / offline   | Key missing or invalid, or `navigator.onLine` false                            | Local parser, templates and static content; never queues  |

Before any AI call, a pure `buildContext()` builds a compact summary: ≤ 1.5 KB of JSON, with no raw ledger, names, notes or ID numbers.

## Resilience: one broken piece never breaks the app

| If…                          | HaqSe still…                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| No Gemini key                | Parses typed earnings locally, drafts letters from templates, and answers Saathi from local rules |
| Offline                      | Opens instantly (service worker); logs earnings; shows schemes, tips and documents; SOS uses `tel:`/`sms:` |
| Rate-limited (429) / 5xx     | Retries once with backoff, then shows a plain message and the non-AI path                          |
| A Gemini model is retired    | Falls through to the next listed Flash model and tells the worker                                 |
| AI returns malformed JSON    | Rejects it (Zod) and offers manual entry. Nothing malformed is saved                              |
| A screen crashes             | Shows that screen's error boundary with **Try again** / **Home**; the rest keeps working          |

## Install and updates (PWA)

HaqSe installs like an app, and it shows the right way to do it for the browser the worker is using (`src/lib/pwa/platform.ts`, tested on 15 real user agents):

- **Chrome, Edge, Opera, Samsung:** a one-tap **Install app** button.
- **iPhone and iPad (any browser):** illustrated Share → **Add to Home Screen** steps.
- **Samsung Internet, Firefox on Android, Safari on Mac:** step-by-step menu instructions.
- **WhatsApp, Instagram and Facebook browsers:** "open in your browser first", with a copy-link button.

Shortcuts on the app icon: **Log earnings**, **SOS**, **Complaints**. New versions never interrupt: an **Update now / Later** bar appears, and **Settings → App** shows the version and a **Check for updates** button.

## Security, accessibility, efficiency and testing

**Security**

- No secrets in the repo. The key lives only in IndexedDB; it is masked, never logged and excluded from exports.
- CSP meta tag: `default-src 'self'`, `connect-src 'self' https://generativelanguage.googleapis.com`, no inline scripts.
- AI output is rendered as text only (`react/no-danger` is a lint error).
- Every structured reply is Zod-validated, and tool calls need a tap.
- Document photos are never stored, and ID, account and PAN-shaped numbers are scrubbed from AI output.
- `npm audit` is clean (0 vulnerabilities).

**Accessibility (WCAG 2.2 AA)**

- axe-core reports **zero violations on every page, in light and dark themes** (Playwright, 360 px).
- Native `<dialog>`, real radio/checkbox chips, ARIA tabs, a skip link, `lang` on mixed-language text, 48 px targets, a 3 px focus ring.
- Status is never shown by colour alone. Read-aloud and voice input are available everywhere. SOS has a tap-and-confirm alternative to long-press.

**Efficiency.** Measured on a first visit under Lighthouse's mobile throttling (slow 4G, 4× CPU slowdown), median of 5 runs:

| Metric                              | Before | Now         |
| ----------------------------------- | ------ | ----------- |
| First / Largest Contentful Paint    | 2176 ms | **1452 ms** |
| Bytes transferred                   | 252 KB | **182 KB**  |
| Requests                            | 18     | **8**       |
| Service-worker precache (first visit) | 1435 KB | **796 KB** |

- **A ~2 KB in-house i18n** replaces i18next (−47 KB raw). English ships in the entry; Hindi and Punjabi load only when chosen.
- **First visits skip the wrong route.** A `localStorage` hint sends them straight to `/welcome`, so the router never fetches Home only to redirect. A build plugin **modulepreloads** the welcome route, so there is no request waterfall (enforced by an e2e test).
- **The Gemini SDK (~70 KB gz) loads on the first AI call only.** The earnings parser, zod and AI-task code load only when the log sheet opens.
- **Precache only what is needed offline before first use.** The SDK, other locales and script fonts are cached at runtime, cache-first by content hash.
- **Initial JS: 170 KB gzipped**, including the preloaded first route (budget 200 KB, enforced by `npm run size`).
- Single-pass ledger aggregates. Anomaly detection groups by platform and compares ISO dates as strings, so there are no Date allocations in the hot loop. Dexie range queries use the `date` index. The React Compiler handles memoisation.

**Testing**

- **135 Vitest tests:**
  - every rule, including the PRD example cases
  - `buildContext` size cap and the guarantee that it contains no personal data
  - the local parser on Roman Hindi, Devanagari and Gurmukhi
  - the AI contracts with a mocked SDK: valid output accepted, malformed rejected, 429 retry, abort, model fall-through, bad key, no sampling parameters
  - the in-house i18n
  - a 15-UA platform matrix
  - component tests with axe
- **A translation-parity test** fails if Hindi or Punjabi miss a key or a `{{placeholder}}`.
- **17 Playwright tests:**
  - all three connected flows
  - typed earnings
  - Saathi with no key
  - language switching
  - offline SOS and offline reload
  - the model list (mocked REST)
  - one-tap install and iPhone install steps
  - a real service-worker update cycle
  - first-visit loading with no waterfall
  - axe on every page

## Assumptions

1. Workers use an Android phone with a modern Chromium browser and patchy internet. iPhone is supported too.
2. Evaluators bring their own Gemini key; a real deployment would put an NGO-, union- or cooperative-held key behind a thin proxy (one-file change in `src/lib/ai/client.ts`).
3. Scheme and rights data is a curated sample dated `verifiedOn` in the app. It is not exhaustive and **not legal advice**; the app always shows the official link and helpline.
4. Workers can read numbers and recognise icons even if reading text is hard.
5. Earnings are entered by the worker (voice, text or screenshot); there is no platform API access.
6. Minimum-wage and threshold values are configurable reference constants (`src/lib/constants.ts`).

## Getting started

```bash
npm ci
npm run dev          # http://localhost:5173
```

| Command                   | What it does                                                              |
| ------------------------- | ------------------------------------------------------------------------- |
| `npm run build`           | Type-check and build to `dist/` (CSP, PWA, first-route preload, `404.html`) |
| `npm run preview`         | Serve the production build                                                |
| `npm test`                | Unit, component, AI-contract and i18n tests (Vitest)                      |
| `npm run test:coverage`   | Same, with coverage gates on `src/lib` and `src/features/*/logic`         |
| `npm run test:e2e`        | Playwright on a 360 px Android viewport                                   |
| `npm run lint` / `format` | oxlint (zero warnings) / Prettier                                         |
| `npm run typecheck`       | `tsc -b` across app, config and e2e projects                              |
| `npm run size`            | Fails if initial JS is over 200 KB gzipped                                |

Every push to `main` runs all checks in GitHub Actions and deploys to GitHub Pages at the custom domain (`public/CNAME`).

## Limitations and future work

- Hindi and Punjabi strings were written for this build and **need a native-speaker review**.
- Scheme rules use age and income _bands_, so borderline cases show "Likely" rather than a hard yes/no.
- Voice capture without `MediaRecorder` falls back to on-device dictation, whose quality varies by device.
- Next: optional app lock (WebAuthn/PIN), a sponsor-key proxy with QR provisioning, more states' schemes, and push reminders for document expiry.

## License

MIT. See [LICENSE](LICENSE).
