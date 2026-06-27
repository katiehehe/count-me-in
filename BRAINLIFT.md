# Brainlift — Phase 2 AI Challenge Mode

This document records the key decisions behind Count Me In's Phase 2 AI feature:
why we built **Challenge Mode**, why we deliberately did **not** build a general
chatbot, how every AI call is **grounded in structured lesson state**, and how
**math correctness is verified deterministically in code** rather than trusted to
the model.

## What we shipped

After a learner completes any lesson, they are routed into Challenge Mode: a short
(2–4 question) structured conversation with a cat companion ("Pip") that checks
whether the idea actually stuck. It asks them to explain ideas back, catch a
planted misconception, solve one slightly harder transfer problem, and connect the
concept to real life. It gives brief, encouraging feedback, awards companion XP,
and recommends a next step — without ever blocking progression.

Code lives in `src/features/challenge/` (domain + UI), `src/firebase/aiClient.ts`
(a thin client that calls our proxy), and `worker/` (a Cloudflare Worker that holds
the OpenAI key server-side). The course, lesson engine, mastery, and unlocking from
Phase 1 are unchanged.

## Why Challenge Mode was chosen

The MVP already teaches well without AI (see `MVP_AUDIT.md`). The bar for adding AI
was therefore: *it must directly improve learning*, not just add a novelty surface.
Challenge Mode was chosen because it maps onto well-established learning science and
onto the structured state our app already has:

1. **Retrieval practice.** During a lesson the learner mostly *recognizes* answers.
   Explaining an idea back in their own words forces *recall*, which is far more
   durable. ("In your own words, why does arranging 4 distinct objects give
   4 × 3 × 2 × 1 instead of 4⁴?")
2. **Misconception repair.** Because we record each learner's first-try mistakes
   and misconception tags, the AI can target *their* specific confusion with a
   "catch the mistake" prompt instead of generic review.
3. **Transfer.** A slightly harder, same-concept problem checks whether they can
   *apply* the idea, not just restate the exact lesson example.
4. **Motivation.** A small, friendly companion makes reflection feel low-stakes.
   It is intentionally minimal (one cat, simple XP, a few lines) so it never
   competes with the hand-built interactive lessons.

Crucially, Challenge Mode runs **after** completion: the lesson is saved and the
next lesson unlocked *before* the conversation begins. A weak challenge result can
recommend review and award less XP, but it can never re-lock a lesson or gate
progress. This keeps the feature a supportive learning companion, not an exam.

## Why a general chatbot was skipped

We explicitly did **not** build an open-ended "ask the tutor anything" chatbot, for
several reasons:

- **It doesn't use what we know.** A blank chat box throws away the rich, structured
  signal we already have — which lesson was completed, which concepts it taught, and
  exactly which questions the learner got wrong. Challenge Mode is built *on top of*
  that state.
- **Correctness risk.** For a counting/probability app, a chatbot that free-form
  asserts numeric answers will eventually be confidently wrong. We instead let code
  own correctness (see below) and use the model only for language.
- **Scope and safety.** Open chat invites off-topic use, prompt injection, and
  unbounded token spend. A structured, schema-constrained, lesson-scoped flow is
  cheaper, safer, and easier to keep on-task.
- **Pedagogy.** A chatbot that hands out answers undercuts the "learn by doing"
  philosophy. Retrieval practice and misconception repair are deliberate teaching
  moves; an answer-dispensing bot is not.

The model's job is therefore narrow: phrase a grounded question, and give short
feedback on a free-response answer. Everything structural — what to ask, whether a
number is right, how much XP to award — is decided by our code.

## How AI was grounded in lesson state

Every AI call is grounded in a structured snapshot of the just-completed lesson,
never raw chat text alone. `buildGroundingContext.ts` assembles, from the persisted
progress doc and the lesson content (re-resolved with the **same randomization seed**
the learner actually played, so prompts and answers match what they saw):

```ts
{
  userId, lessonId, lessonTitle,
  concepts,            // concept ids taught in the lesson
  completedSteps,      // titles of the steps the learner worked through
  mistakes: [          // first-try-incorrect graded steps
    { stepId, prompt, userAnswer, correctAnswer, misconceptionTag? }
  ],
  masteryScoreBeforeChallenge,
}
```

This context is injected into every prompt (`challenge/ai/prompts.ts`) alongside a
fixed persona that forbids off-topic/chatbot behavior. The model's outputs are
constrained to typed JSON via OpenAI Structured Outputs (strict `json_schema`,
defined server-side in `worker/src/index.ts`):

- **Question:** `{ question, expectedConcepts[], feedbackStyle, companionMessage }`
- **Evaluation:** `{ understanding, feedback, followUpQuestion?, misconceptionDetected?, recommendedNextAction, xpAwarded }`

Because the questions are chosen from the learner's real mistakes and the lesson's
real concepts, the conversation is specific to them — e.g. a "catch the mistake"
prompt is seeded from a misconception they actually displayed.

## How math correctness was verified

The PRD's hard rule: **for any numeric question, the app computes the answer in
code; the AI may explain but is never the source of truth.** We honor this:

- **Deterministic checkers** live in `src/features/simulation/permutationMath.ts`:
  `factorial`, `permutations` (nPr), `combinations` (nCr), `countingPrinciple`,
  `repeatedArrangements` (nᵏ), and `multisetPermutationCount`.
- **Transfer questions** (`transferQuestions.ts`) are generated from a seeded RNG
  into a `{ prompt, answer, formula }` where `answer` is computed by those
  functions. The learner's typed number is graded by `checkTransferAnswer` — pure
  code, no model involvement.
- **The AI explains the verdict, it doesn't make it.** For a transfer question we
  pass the code-decided verdict (correct / incorrect + the verified answer) into the
  evaluation prompt and instruct the model to explain *that* result and never
  recompute or contradict it. The final `understanding` and XP for transfer
  questions are overridden from the code verdict.
- **XP is code-controlled.** Even though the model returns an `xpAwarded` field, we
  ignore it and compute XP deterministically from the understanding label
  (`challengeXp.ts`), so rewards can't be gamed by prompt manipulation.

These guarantees are covered by unit tests: `transferQuestions.test.ts` checks that
generated answers are integer, positive, reproducible, and self-consistent across
all concepts and many seeds; `sessionPlan.test.ts` and `challengeXp.test.ts` cover
the (AI-independent) session structure and scoring.

## Expansion: in-lesson AI help, a sharper challenge, and XP

After the first cut taught well, we deepened the AI's role inside the lessons
themselves (not just the post-lesson challenge) and tightened the reward loop.

**What we considered (from the Phase 2 menu).** Generating brand-new practice
problems; targeted hints when stuck; an adaptive path that reorders lessons;
plain-language explanations of wrong answers. We shipped the two that most
directly help a struggling learner *in the moment* — **adaptive hints** and
**wrong-answer feedback** — plus a lightweight version of "adapt the path":
instead of silently reordering lessons, the AI **points back to the specific
earlier step** that would help, and lets the learner choose to revisit it.

**In-lesson AI (`lessonAi.ts`, `StepHelp.tsx`).** On any graded question:
- **Ask Pip for a hint** — an adaptive nudge grounded in the question + concept,
  never revealing the answer.
- **"Why was that wrong?"** — appears after a wrong answer; feedback is tuned to
  the learner's *actual* answer vs. the verified correct one.
- **Relearn pointers** — both calls may return a `reviewStepId` chosen from the
  earlier steps we pass in (validated in code, never a forward/unknown step). When
  set, that progress-bar segment **glows** and a "Revisit" button appears; the hint
  is stored on the step's state so it's still there when the learner comes back.

**A sharper challenge.** The three near-identical "explain simpler / contest-style
/ another example" buttons were cut (they repeated one idea). Challenge Mode is now
a fixed 4-step arc — answer a review question, correct a mistake, explain your
thinking, give a real-world example — so each turn exercises a distinct skill.

**XP that means something.** XP scales with how well the learner does and is **0
for an incorrect/needs-review answer**, so it reflects real understanding. It
accumulates into a persistent total shown in the app header, giving a sense of
progress over time. XP is always computed in code, never taken from the model.

**Pip.** The companion is now a hand-drawn SVG cat (not an emoji) with happy /
thinking / celebrate expressions, used both in the challenge and beside in-lesson
hints — cute, but deliberately minimal (no shop, inventory, or customization).

**Deliberately left out.** A free-form chatbot; AI *inventing* numeric problems or
answers (we generate and check those in code); fully automatic lesson reordering
(we surface a revisit suggestion and let the learner decide); heavy companion
customization. All in-lesson AI is additive — with AI off, the hand-written
two-tier hints render instead and nothing else changes.

## Safety and "works with AI off"

- **Server-side key.** The OpenAI key never reaches the browser — it lives as a
  Cloudflare Worker secret (`OPENAI_API_KEY`). The browser calls the Worker with its
  Firebase ID token, which the Worker cryptographically verifies (RS256 against
  Google's public keys) before calling OpenAI, so unauthenticated clients can't
  spend the budget.
- **Graceful degradation.** With `VITE_AI_ENABLED=false` — or if an AI call fails,
  or the project isn't provisioned yet — the lesson flow is exactly as in Phase 1
  (results summary, next lesson), and the Challenge screen shows a friendly disabled
  state. Lesson completion, mastery, and unlocking never depend on AI.
- **Demo guests.** Anonymous demo sessions never write to Firestore; challenge
  session/response persistence is skipped for them, mirroring the Phase 1 demo store.
