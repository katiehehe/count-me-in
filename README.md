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
| `VITE_AI_ENABLED` | Always `false` for Phase 1 |

### Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google** and **Anonymous** sign-in under Authentication
3. Create a Firestore database (production mode is fine; add rules below)
4. Register a web app and copy config into `.env`

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
│   ├── course/       # Course path, lesson locking
│   ├── lesson/       # Lesson engine + step renderers
│   ├── progress/     # Firestore persistence, streaks, mastery
│   └── simulation/   # Interactive manipulatives + permutation math
├── firebase/         # Client init + types
└── pages/            # Landing page
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

## Phase 2 (not implemented)

- AI targeted hints grounded in lesson state
- Generated practice problems (AI proposes, app verifies)

Set `VITE_AI_ENABLED=false` to keep AI off.

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

See `MVP_AUDIT.md` for the full QA audit and stabilization log.

## Known limitations

- Deployment requires your own Firebase project (Auth + Firestore + Hosting)
- Anonymous auth users are prompted to set a display name on first visit
- A lesson started on one device *before* seed-persistence shipped may show
  different numbers on a second device until it's restarted (legacy docs only)
- Single JS bundle (~1 MB) — code-splitting is a known future optimization

## License

MIT
