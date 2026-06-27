# Count Me In

**Subject:** Contest counting and probability — permutations, combinations, and probability intuition for competitions.

**Who it's for:** middle/high-school students prepping for math contests (and the contest-curious) who learn best by *doing*, not by watching.

Count Me In is a Brilliant-style learn-by-doing app. Learners discover math through interactive puzzles, visual manipulation, and instant feedback — not passive videos or multiple-choice drills.

## Deployed link

**Live:** [https://count-me-in-2cdc6.web.app](https://count-me-in-2cdc6.web.app) (Firebase Hosting)

Deploy a fresh build with `npm run build && npx firebase-tools@latest deploy --only hosting`.

## Quick start

```bash
npm install
cp .env.example .env   # add Firebase credentials
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_AI_ENABLED` | `true` to enable the Phase 2 AI Challenge Mode (requires the Cloudflare Worker deployed); `false` runs the app with no AI |
| `VITE_AI_PROXY_URL` | URL of the deployed Cloudflare Worker that proxies OpenAI (the OpenAI key lives there as a secret, never in the client) |

### Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google** and **Anonymous** sign-in under Authentication
3. Create a Firestore database (production mode is fine; add rules below)
4. Register a web app and copy config into `.env`
5. **(Phase 2 AI Challenge Mode)** Deploy the OpenAI proxy — a Cloudflare Worker (free, no Firebase billing):
   - `cd worker && npm install`
   - Log in to Cloudflare (free, no card): `npx wrangler login`
   - Store your OpenAI key as a Worker secret: `npx wrangler secret put OPENAI_API_KEY`
   - Deploy: `npx wrangler deploy` — copy the printed `*.workers.dev` URL.
   - Put that URL in `VITE_AI_PROXY_URL`, set `VITE_AI_ENABLED=true`, and redeploy hosting. The OpenAI key stays in the Worker as a secret; it is never shipped to the browser.

**Firestore rules (development):**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Architecture

```
src/
├── app/              # Router + App shell
├── components/       # Shared UI (Button, Card, ProgressBar, …)
├── content/          # Course + lesson data (typed, data-driven)
├── features/
│   ├── auth/         # Firebase Auth provider + login
│   ├── challenge/    # Phase 2 AI Challenge Mode (grounding, prompts, deterministic transfer, UI)
│   ├── course/       # Course path, lesson locking
│   ├── lesson/       # Lesson engine + step renderers
│   ├── progress/     # Firestore persistence, streaks, mastery
│   └── simulation/   # Interactive manipulatives + permutation math
├── firebase/         # Client init + types + OpenAI proxy client
└── pages/            # Landing page

worker/               # Cloudflare Worker: OpenAI (gpt-4o) Challenge Mode proxy
```

### Content model

Lessons are defined as typed data in `src/content/`. Each lesson has steps with a `type` field — one of `intro`, `multiple-choice`, `numeric-question`, `arrangement`, `connection`, `tree`, `simulation`, `factorial-discovery`, `probability`, `outcome-select`, `condensing`, `combined-experiment`, `dependence-pairing`, `completion`. The `StepRenderer` dispatches to the correct interactive component — **add new lessons by adding data, not by rewriting the player.** Randomized steps use a per-play-through seed (persisted in Firestore) so a learner sees the same numbers on every device. Mastery is scored across the whole lesson: the fraction of graded questions (`multiple-choice` + `numeric-question`) answered correctly on the first attempt maps to a red / yellow / green tier.

### Lesson engine

- **LessonRenderer** — progress bar, step navigation, seeded randomization, Firestore autosave + resume
- **StepRenderer** — type-based dispatch to step components
- **ArrangementBoard / OrderingsList** — drag/tap to reorder distinct objects, tracking unique orderings
- **ConnectionBoard** — pointer/touch line-drawing to match outcomes
- **CombinationTree** — branch-by-branch tree of a multi-stage choice
- **FactorialDiscovery** — tap-to-reveal counting principle, introduces n! naturally
- **DiceSimulation / CombinedExperiment** — run thousands of trials and watch the distribution form
- **ProbabilityGamble** — slider that tunes odds against a live area-model visual

## The course (7 complete lessons)

A sequential path; each lesson unlocks the next once it's mastered.

1. **The Counting Principle** — multiply choices across stages
2. **Arranging Distinct Objects** — permutations and factorials
3. **Arranging Identical Objects** — dividing out repeats
4. **Combinations vs Permutations** — when order does (and doesn't) matter
5. **Independent Events** — the multiply rule for probability
6. **Probability & Distributions** — simulate trials, watch patterns emerge
7. **Expected Value** — turn payouts into a single number

## What's shipped

- Firebase Auth (Google + anonymous demo) with display-name capture
- Course path with sequential unlocking + mastery tiers + "recommended next"
- 7 complete interactive lessons (drag, tap, connect, slider, simulate, reorder)
- Interactive visuals that respond to input (SVG connections, area model, live charts)
- Instant, misconception-specific feedback (including per-wrong-choice messages)
- Progress persistence that survives reload **and device switches** (step index, answers, attempts, randomization seed)
- Streaks, daily activity, and milestone tracking
- Mobile-responsive UI with touch support
- Works fully without any AI features

## Phase 2 — AI (shipped)

Two AI surfaces, both grounded in structured lesson state and both fully optional
(the app works unchanged with AI off). Pip, the companion, is a hand-drawn SVG cat.

**In-lesson AI help** (`lessonAi.ts`, `StepHelp.tsx`) — on any graded question:

- **Ask Pip for a hint** — an adaptive nudge grounded in the question + concept,
  without revealing the answer.
- **"Why was that wrong?"** — after a wrong answer, feedback tuned to the learner's
  actual answer vs. the verified correct one.
- **Relearn pointers** — the AI may point back to a specific earlier step; that
  progress-bar segment **glows**, a "Revisit" button appears, and the hint persists
  when the learner returns. With AI off, the hand-written two-tier hint renders.

**Challenge Mode** — after completing a lesson, a fixed 4-step check with Pip
(answer a review question → correct a mistake → explain your thinking → real-world
example). **Not** a chatbot, **not** pass/fail; lesson completion and unlocking
happen *before* it and never depend on AI.

- **Grounded in lesson state** — every call receives the lesson's concepts, steps
  worked through, the learner's real first-try mistakes, and mastery score
  (`buildGroundingContext.ts`), never raw chat text.
- **Deterministic math** — transfer answers are computed and graded in code
  (`transferQuestions.ts` + `permutationMath.ts`); the AI only explains.
- **Structured output** — OpenAI Structured Outputs constrain responses to typed
  JSON via strict `json_schema` (defined server-side in `worker/src/index.ts`).
- **XP** — scales with performance (0 for an incorrect answer), computed in code,
  and accumulates into a persistent total shown in the header. Sessions + responses
  persist under `users/{uid}/challengeSessions/{sessionId}[/responses]`.
- **Degrades gracefully** — with `VITE_AI_ENABLED=false`, or if a call fails, the
  app falls back to the normal flow and never blocks the learner.

Built on **OpenAI** (`gpt-4o`) called through a **Cloudflare Worker** (`worker/`),
so the API key stays server-side; the browser calls the Worker with its Firebase
ID token, which the Worker verifies before spending any budget. See
[`BRAINLIFT.md`](BRAINLIFT.md) for the design rationale (why Challenge Mode over a
chatbot, grounding, and math verification).

Set `VITE_AI_ENABLED=false` to run the app with AI turned off.

## Phase 3 (not implemented)

- Spaced repetition for missed concepts
- Retrieval practice scheduling
- Mastery-gated next-lesson recommendations

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (typecheck + Vite) |
| `npm test` | Run unit tests (Vitest) |
| `npm run lint` | Lint (oxlint) |
| `npm run preview` | Preview production build |

## Testing

Unit + regression tests run with Vitest (`npm test`). Coverage focuses on the
logic most likely to break silently:

- `permutationMath.test.ts` — counting/probability math, mastery tiers, streaks
- `randomize.test.ts` — seeded randomization determinism + grading-safe answers
- `progressService.test.ts` — Firestore persistence: step-pointer/answer write
  ordering (race regression), seed round-trip, first-attempt locking
- `content.test.ts` — lesson copy never promises an interaction the UI lacks
- `transferQuestions.test.ts` — deterministic transfer answers are integer,
  code-checkable, and reproducible across seeds and concepts
- `sessionPlan.test.ts` — Challenge sessions are 2-4 questions and include
  catch-the-mistake exactly when the learner made mistakes
- `challengeXp.test.ts` — XP, understanding aggregation, and next-action mapping

See `MVP_AUDIT.md` for the full QA audit and stabilization log.

## Known limitations

- Deployment requires your own Firebase project (Auth + Firestore + Hosting)
- Anonymous auth users are prompted to set a display name on first visit
- A lesson started on one device *before* seed-persistence shipped may show
  different numbers on a second device until it's restarted (legacy docs only)
- The Firebase SDK is split into long-cached vendor chunks
- AI Challenge Mode requires the Cloudflare Worker deployed (free; `OPENAI_API_KEY`
  as a Worker secret) and `VITE_AI_PROXY_URL` set; until then it degrades to the
  normal results summary

## License

MIT
