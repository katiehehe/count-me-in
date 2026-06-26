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
| `VITE_AI_ENABLED` | `true` to enable the Phase 2 AI Challenge Mode (requires the `challengeAi` Cloud Function deployed); `false` runs the app with no AI |

### Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google** and **Anonymous** sign-in under Authentication
3. Create a Firestore database (production mode is fine; add rules below)
4. Register a web app and copy config into `.env`
5. **(Phase 2 AI Challenge Mode)** Deploy the OpenAI proxy function:
   - Upgrade the project to the **Blaze** plan (Cloud Functions require it).
   - Store your OpenAI key as a server secret: `firebase functions:secrets:set OPENAI_API_KEY`
   - Install + deploy the function: `npm --prefix functions install && firebase deploy --only functions`
   - Set `VITE_AI_ENABLED=true` and redeploy hosting. The OpenAI key stays server-side; it is never shipped to the browser.

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
├── firebase/         # Client init + types + OpenAI callable client
└── pages/            # Landing page

functions/            # Firebase Cloud Function: OpenAI (gpt-4o) Challenge Mode proxy
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

## Phase 2 — AI Challenge Mode (shipped)

After completing any lesson, learners are routed into **Challenge Mode**: a short,
structured conversation with a cat companion ("Pip") that checks whether the idea
stuck. It is **not** a chatbot and **not** pass/fail — lesson completion and
unlocking happen *before* it and never depend on AI.

- **Grounded in lesson state** — every AI call receives the completed lesson's
  concepts, the steps worked through, the learner's actual first-try mistakes, and
  the mastery score (`buildGroundingContext.ts`), never just raw chat text.
- **Question mix** — explain-it-back, catch-the-mistake (driven by real mistakes),
  a transfer problem, and real-life examples, with a small "explain simpler /
  contest-style / another example" option.
- **Deterministic math** — transfer answers are computed and graded in code
  (`transferQuestions.ts` + `permutationMath.ts`); the AI only explains, never
  decides correctness.
- **Structured output** — OpenAI Structured Outputs constrain responses to typed
  JSON via strict `json_schema` (defined server-side in `functions/src/index.ts`).
- **Companion XP** — thoughtful answers earn fish/XP (computed in code, stored on
  the profile); sessions + responses persist under
  `users/{uid}/challengeSessions/{sessionId}[/responses]`.
- **Degrades gracefully** — with `VITE_AI_ENABLED=false`, or if AI calls fail,
  the app falls back to the normal results summary and never blocks the learner.

Built on **OpenAI** (`gpt-4o`) called through a **Firebase Cloud Function**
(`functions/`), so the API key stays server-side and the browser only calls an
auth-gated callable. See [`BRAINLIFT.md`](BRAINLIFT.md) for the design rationale
(why Challenge Mode over a chatbot, grounding, and math verification).

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
- AI Challenge Mode requires the `challengeAi` Cloud Function deployed (Blaze plan
  + `OPENAI_API_KEY` secret); until then it degrades to the normal results summary

## License

MIT
