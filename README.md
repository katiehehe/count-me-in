# Count Me In

**Subject:** Contest counting and probability — permutations, combinations, and probability intuition for competitions.

**Who it's for:** middle/high-school students prepping for math contests (and the contest-curious) who learn best by *doing*, not by watching.

Count Me In is a Brilliant-style learn-by-doing app. Learners discover math through narrated worked examples, interactive manipulatives, predict-then-reveal questions, instant feedback, spaced review, and adaptive practice — not passive videos or multiple-choice drills.

## Deployed link

**Live:** [https://count-me-in-2cdc6.web.app](https://count-me-in-2cdc6.web.app) (Firebase Hosting)

Deploy a fresh build with `npm run build && npx firebase-tools@latest deploy --only hosting`.

## Quick start

```bash
npm install
cp .env.example .env   # add Firebase credentials
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app runs fully without any AI configured.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_AI_ENABLED` | `true` to enable AI Challenge Mode, in-lesson hints, and narrated worked examples (requires the Cloudflare Worker deployed); `false` runs the app with no AI |
| `VITE_AI_PROXY_URL` | URL of the deployed Cloudflare Worker that proxies OpenAI. The same base URL serves Challenge Mode, in-lesson hints, TTS narration (`/tts`), and the AI custom-Pip image generator (`/pip-image`). The OpenAI key lives in the Worker as a secret, never in the client. |
| `VITE_AI_PIP_ENABLED` | `true` to enable the premium "Design your own Pip with AI" shop feature (requires Cloudflare R2 enabled + the `count-me-in-pips` bucket + the Worker deployed). While `false`, the shop shows it as "coming soon" and no XP can be spent on it. |

### Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google** and **Anonymous** sign-in under Authentication
3. Create a Firestore database (production mode is fine; add the rules below)
4. Register a web app and copy config into `.env`
5. **(AI features)** Deploy the OpenAI proxy — a Cloudflare Worker (free, no Firebase billing):
   - `cd worker && npm install`
   - Log in to Cloudflare (free, no card): `npx wrangler login`
   - Store your OpenAI key as a Worker secret: `npx wrangler secret put OPENAI_API_KEY`
   - Deploy: `npx wrangler deploy` — copy the printed `*.workers.dev` URL.
   - Put that URL in `VITE_AI_PROXY_URL`, set `VITE_AI_ENABLED=true`, and redeploy hosting.
6. **(Optional: AI custom Pip)** In the Cloudflare dashboard, enable **R2**, then:
   - `cd worker && npx wrangler r2 bucket create count-me-in-pips`
   - `npx wrangler deploy` (the Worker's R2 binding serves the generated images)
   - Set `VITE_AI_PIP_ENABLED=true` and redeploy hosting.

**Firestore rules:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{subcollection=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    // Public leaderboard: anyone signed in may READ; each entry is writable only
    // by its owner and must stay PII-free (uid + first name + xp + level only).
    match /leaderboard/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.uid == userId
        && request.resource.data.keys().hasOnly(['uid', 'displayName', 'companionXp', 'level', 'updatedAt']);
    }
  }
}
```

## Architecture

```
src/
├── app/              # Router + App shell
├── components/       # Shared UI (Button, Card, ProgressBar, MasteryRing, Math/RichText, …)
├── content/          # Course + lesson data (typed, data-driven) + math checkers
├── features/
│   ├── auth/         # Firebase Auth provider + login
│   ├── challenge/    # AI Challenge Mode + Pip companion (grounding, prompts, deterministic transfer)
│   ├── course/       # Course path, units, lesson locking, "recommended next"
│   ├── lesson/       # Lesson engine, step renderers, narrated worked-example teacher, TTS client
│   ├── practice/     # Adaptive practice, per-concept SRS, weak spots, weekly review, self-test
│   ├── progress/     # Firestore persistence, streaks, mastery, XP economy (levels/wallet)
│   ├── leaderboard/  # Public XP leaderboard
│   ├── shop/         # XP shop: streak freezes, Pip cosmetics, AI custom Pip
│   └── simulation/   # Interactive manipulatives + counting/probability math
├── firebase/         # Client init + types + OpenAI proxy / TTS / Pip-image clients
└── pages/            # Landing page

worker/               # Cloudflare Worker: OpenAI proxy — Challenge Mode + in-lesson hints
                      # + TTS narration + AI custom-Pip image generation (R2-backed)
```

### Content model

Lessons are typed data in `src/content/`. Each lesson has steps with a `type` field — including `intro`, `prequestion` (predict-then-reveal), `worked-example` (narrated teacher), `multiple-choice`, `numeric-question`, `fraction-question`, `arrangement`, `connection`, `tree`, `product-grid`, `probability`/`simulation`, `outcome-select`, `combination-condense`, `combined-experiment`, `dependence-pairing`, `conditional-select`, `complement-select`, `coin-flip-sim`, `sequence-build`, `venn-regions`, `stars-bars-drag`, `lattice-path`, `hyper-build`, and `completion`. The `StepRenderer` dispatches to the correct interactive component — **add new lessons by adding data, not by rewriting the player.**

Randomized steps use a per-play-through seed (persisted in Firestore) so a learner sees the same numbers on every device, and every numeric answer is computed/graded in code (`probabilityMath.ts`, `permutationMath.ts`). Prose renders through a `RichText` component that groups paragraphs and renders inline/block math with KaTeX. Mastery is scored across the whole lesson: the fraction of graded questions answered correctly on the first attempt maps to a red / yellow / green tier.

### Lesson engine

- **LessonRenderer** — progress bar, step navigation, seeded randomization, Firestore autosave + resume
- **StepRenderer** — type-based dispatch to step components
- **WorkedExampleStep** — a narrated "watch me solve one" whiteboard: numbers/formulas appear gradually beat-by-beat (KaTeX), with spoken narration (AI voice → browser speech → silent stepping), a speed slider, and a scrubber. Next-line audio is prefetched so beats flow without gaps.
- **PrequestionStep** — a quick guess before the reveal (pretesting)
- **ArrangementBoard / ConnectionBoard / CombinationTree** — drag/tap to reorder, match outcomes, or branch a multi-stage choice
- **DiceSimulation / CombinedExperiment / CoinFlipSim** — run thousands of trials and watch the distribution form
- **ProbabilityGamble / ExpectedValueRoller** — tune odds / roll against live visuals
- **SequenceBuilder, VennCounter, StarsBarsBoard, LatticePathBoard, HyperBuilder** — manipulatives for binomial counts, inclusion–exclusion, stars & bars, lattice paths, and hypergeometric draws

## The course (20 lessons across 4 units)

A sequential path; each lesson unlocks the next once it's mastered.

**Unit 01 — Counting Foundations**
1. The Counting Principle — multiply choices across stages
2. Arranging Distinct Objects — permutations and factorials
3. Arranging Identical Objects — dividing out repeats
4. Combinations vs Permutations — when order does (and doesn't) matter
5. Stars and Bars — distributing identical items (combinations with repetition)

**Unit 02 — Probability Core**
6. Independent Events — the multiply rule
7. Dependent Events — updating after each draw
8. Conditional Probability — reasoning with partial information
9. The Complement Rule — count the opposite
10. Adding Probabilities — mutually-exclusive "or" → the weighted-coin binomial
11. The Binomial Theorem — why combinations are the coefficients of (a+b)ⁿ (Pascal's triangle)
12. Inclusion–Exclusion — add the parts, subtract the double-counted overlaps
13. Probability & Distributions — simulate trials, watch patterns emerge

**Unit 03 — Expectation & Random Variables**
14. Expected Value — the weighted average / long-run payoff
15. Linearity of Expectation — add per-part expectations, even when parts overlap
16. Indicator Variables — count by summing 0/1 random variables

**Unit 04 — Challenge Arena**
17. Putting It Together — combine tools on multi-step problems
18. Contest-Style Problems — choose & combine tools on olympiad-flavored puzzles
19. Counting + Probability Applications — favorable ÷ total on realistic scenarios
20. Expected Value Applications — expectation for strategic decisions

## What's shipped

- Firebase Auth (Google + anonymous demo) with display-name capture
- Course path grouped into units, sequential unlocking, mastery tiers, "recommended next"
- 20 interactive lessons (drag, tap, connect, slider, simulate, reorder) each opening with a narrated worked example + a prequestion
- KaTeX math + readable, grouped prose throughout
- Instant, misconception-specific feedback (including per-wrong-choice messages)
- Progress persistence that survives reload **and device switches** (step index, answers, attempts, randomization seed)
- Streaks, daily activity, and milestone tracking
- Mobile-responsive UI with touch support
- Works fully without any AI features

## Adaptivity & spaced practice (shipped)

Motivation is tied to genuine progress, and review is scheduled by what the learner actually misses.

- **Per-concept spaced repetition (SM-2-lite).** Every learned concept carries its own schedule (`reps`, `intervalDays`, `ease`, `due`, `lapses`) in `conceptSrs.ts`. A correct answer grows the interval (1 → 3 → ease-scaled) and gently raises ease; a **miss resets reps, lowers ease, counts a lapse, and re-schedules the concept for *today*** so it comes back in the same session and sooner overall. Review sessions pull only the concepts that are actually due.
- **Weak-spot practice.** Per-concept correct/wrong stats (`conceptStats`) blend with lesson misses so the cross-lesson "weak spots" workout targets your real trouble areas, with severity shown as colored dots.
- **Weekly review.** A spaced, interleaved review surfaces once ≥7 days have passed *and* concepts are due; misses lower mastery and reschedule sooner, and a persisted summary lets you work flagged weak spots.
- **Training Lab + self-test.** Pick any topics for unlimited adaptive practice, or a configurable, delayed-feedback self-test (difficulty, time, count); XP scales with the configuration and a rising mastery bar.
- **XP that reflects understanding, not clicks.** XP is awarded only on **first-try** correct answers and is **mastery-gated** (no XP once a lesson is green), plus a small exponential time bonus — so rewards track real learning rather than empty praise.

## XP economy

Lifetime XP drives progression; a separate spendable balance funds the sinks.

- **Levels & ranks** from lifetime `companionXp` (`xpLevels.ts`), shown as a level ring in the header.
- **Daily XP goal ring** (default 40 XP) for a light habit loop.
- **Spendable wallet** = lifetime XP − spent; the header shows the spendable balance so purchases visibly deduct.
- **Streak-freeze tokens** (50 XP) auto-consume on a missed day to save your streak.
- **Pip cosmetics shop** (`/shop`) — recolor themes and hats (120–300 XP).
- **AI custom Pip** (1000 XP, 3 generations) — describe a cat, the Worker moderates the prompt + generates an image (stored in Cloudflare R2), and it becomes your Pip everywhere.
- **Leaderboard** (`/leaderboard`) — ranked by lifetime XP, first-names only, anonymous users hidden.

## AI (shipped, fully optional)

Every AI surface is grounded in structured lesson state and degrades gracefully (the app works unchanged with AI off). Pip, the companion, is a hand-drawn SVG cat.

**Narrated worked examples** — each lesson's "watch me solve one" is voiced via OpenAI TTS through the Worker (`/tts`, cached), falling back to browser speech, then silent stepping.

**In-lesson AI help** (`lessonAi.ts`, `StepHelp.tsx`) — on any graded question: *Ask Pip for a hint* (a nudge that never reveals the answer), *"Why was that wrong?"* (feedback tuned to the learner's actual vs. verified answer), and **relearn pointers** that glow the relevant earlier step. With AI off, hand-written tiered hints render.

**Challenge Mode** — after completing a lesson, a fixed 4-step check with Pip (answer a review question → correct a mistake → explain your thinking → real-world example). **Not** a chatbot, **not** pass/fail; completion and unlocking happen *before* it and never depend on AI.

- **Grounded in lesson state** — every call receives the lesson's concepts, steps worked through, the learner's real first-try mistakes, and mastery score, never raw chat text.
- **Deterministic math** — transfer answers are computed and graded in code; the AI only explains.
- **Structured output** — OpenAI Structured Outputs constrain responses to typed JSON (schemas defined server-side in `worker/src/index.ts`).
- **Degrades gracefully** — with AI off or on failure, the app falls back to the normal flow and never blocks the learner.

Built on **OpenAI** (`gpt-4o` for text, TTS for narration, `gpt-image-1` for custom Pip) called through a **Cloudflare Worker** (`worker/`), so the API key stays server-side; the browser calls the Worker with its Firebase ID token, which the Worker verifies (RS256) before spending any budget. See [`BRAINLIFT.md`](BRAINLIFT.md) for the design rationale (why Challenge Mode over a chatbot, grounding, math verification, and the learning-science systems — including how missed concepts reschedule practice).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (typecheck + Vite) |
| `npm test` | Run unit tests (Vitest) |
| `npm run lint` | Lint (oxlint) |
| `npm run preview` | Preview production build |

## Testing

Unit + regression tests run with Vitest (`npm test`) — ~23 test files covering the logic most likely to break silently:

- `permutationMath.test.ts`, `probabilityMath.test.ts` — counting/probability checkers, mastery tiers
- `randomize.test.ts` — seeded randomization determinism + grading-safe answers
- `content.test.ts` — every lesson concept has a label + transfer generator; no lesson copy promises an interaction the UI lacks; no `comingSoon` placeholders remain; graded answers are typeable
- `conceptSrs.test.ts` — SM-2-lite scheduling (interval growth, miss → due today, ease clamping, due selection)
- `xpLevels.test.ts`, `xpWallet.test.ts`, `selfTestXp.test.ts`, `timeBonus.test.ts` — XP curve, spendable wallet/purchases, self-test scaling, time bonus
- `weeklyReview.test.ts` — review throttle + due selection
- `transferQuestions.test.ts`, `sessionPlan.test.ts`, `challengeXp.test.ts` — deterministic transfer answers, Challenge session structure, XP/understanding scoring
- `progressService.test.ts`, `demoStore.test.ts` — Firestore + in-memory persistence (write ordering, seed round-trip, first-attempt locking, streak/concept updates)
- `RichText.test.ts`, `enterAdvance.test.ts`, `hintTiers.test.ts`, `stepCompletion.test.ts`, `workedExampleMath.test.ts`, `streaks.test.ts`, `devMode.test.ts` — prose/KaTeX parsing, Enter-to-advance, hint tiers, step completion, worked-example math, streak dates, dev unlock

See `MVP_AUDIT.md` for the original QA audit and stabilization log.

## Known limitations

- Deployment requires your own Firebase project (Auth + Firestore + Hosting)
- Anonymous auth users are prompted to set a display name on first visit and don't persist progress or write to the leaderboard
- The Firebase SDK is split into long-cached vendor chunks
- AI features require the Cloudflare Worker deployed (free; `OPENAI_API_KEY` as a Worker secret) and `VITE_AI_PROXY_URL` set; until then they degrade to the non-AI flow
- AI custom Pip additionally requires Cloudflare R2 enabled + the `count-me-in-pips` bucket; until then the shop shows it as "coming soon"

## License

MIT
