# Brainlift — Count Me In

## The problem
Counting and probability is where contest math students hit a wall. The rules
(multiply stages, n!, nCr vs nPr, independence) look simple but are wildly easy
to misapply — students "learn" them from worked examples, then overcount,
divide by the wrong thing, or add when they should multiply. Passive content
(videos, slide decks, multiple-choice drills) hides this because it never forces
the learner to *build* the count themselves.

## The insight
You don't understand a count until you've **constructed** it. So every concept
here is taught through a manipulative that makes the abstract operation physical:
you connect every outfit to *see* the product rule, reorder books to *feel* n!,
collapse duplicate teams to *discover* why you divide, and roll 1,000 dice to
*watch* probability emerge. The math formula always arrives **after** the doing,
as a name for a pattern the learner already produced.

## Who it's for
Middle/high-school students prepping for math contests (AMC/MATHCOUNTS-style),
and the contest-curious. Designed mobile-first because that's where they study.

## What it is
A Brilliant-style, learn-by-doing web app: a 7-lesson sequential course (Counting
Principle → Permutations → Identical Objects → Combinations vs Permutations →
Independent Events → Distributions → Expected Value). Each lesson mixes
direct-manipulation puzzles, live visuals, and graded questions with instant,
misconception-specific feedback. Progress, mastery, and streaks persist per user.

## Key decisions & trade-offs
- **Data-driven lessons.** Lessons are typed data; one `StepRenderer` dispatches
  to interactive components. New lessons = new data, not new player code. Trade-off:
  a richer step-type union to maintain, but enormous content velocity.
- **Seeded randomization, persisted server-side.** Each play-through gets a seed
  stored in Firestore, so questions are fresh per attempt yet **identical across
  devices and reloads**. Trade-off: one more field to manage; chosen because
  "resume shows different numbers" silently destroys trust.
- **Atomic answer writes.** Answer records use a Firestore transaction;
  navigation writes only the step pointer via field-merge. Trade-off: slightly
  more careful write code, in exchange for never losing a recorded answer to a race.
- **Mastery = first-attempt correctness.** Simple, legible red/yellow/green tiers
  that reward genuine understanding and invite replay, instead of opaque scoring.
- **No AI in the core loop.** The app teaches fully deterministically; AI is an
  optional future enhancement, never a dependency. Trade-off: no auto-generated
  hints today, but the experience is reliable and explainable.
- **Firebase end-to-end** (Auth + Firestore + Hosting) for the fastest path to a
  real, multi-user, publicly deployed MVP.

## How quality is kept
A full QA audit (`MVP_AUDIT.md`) graded all 12 MVP requirements, then a focused
stabilization round fixed the top correctness risks (write race, cross-device
seed, content/UI mismatch) — each guarded by regression tests. Tests cover the
math, the randomization determinism, the persistence ordering, and content/UI
consistency.

## What's next
1. Persist interactive (non-graded) step completion for perfect backward nav.
2. Pointer/touch drag on every manipulative (one board still relies on tap on mobile).
3. Gate the `?dev=1` unlock to dev builds only.
4. Code-split the bundle (Firebase lazy-load) for faster first paint.
5. Spaced repetition / retrieval scheduling for missed concepts.
6. Optional AI: targeted hints grounded in the learner's actual mistake.
