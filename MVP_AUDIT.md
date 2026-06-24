# Count Me In — MVP Audit Report

> Source of truth for the MVP QA audit. Generated 2026-06-24. Subsequent stabilization
> work is tracked against the issues enumerated here.

**Verification legend:** ✅ verified by execution · 🔎 verified by code reading

**Execution results (audit environment):**
- ✅ `npm run test` → **18 passed / 1 file** (`permutationMath.test.ts`). Pure-math, mastery, streak units only — no flow/persistence/component tests.
- ✅ `npm run build` (`tsc -b && vite build`) → **clean**, but emits one **1,040 KB** JS chunk (304 KB gzip) with a chunk-size warning.
- ✅ `npm run lint` (`oxlint`) → **3 warnings** (`only-export-components` in `StepRenderer.tsx:320`, `AuthProvider.tsx:141`, `ProtectedRoute.tsx:5`).
- ✅ TypeScript check (`tsc -b`) → **clean**.
- ✅ Deployed site `https://count-me-in-2cdc6.web.app` → **HTTP 200**, serves SPA, correct cache headers; `.env` present so Firebase config is embedded. (Could not drive a real browser, so client-side auth/Firestore runtime not browser-verified.)

---

## 1. MVP Requirement Checklist

| # | Requirement | Verdict | One-line justification |
|---|---|---|---|
| 1 | Subject clearly stated & app designed around it | ✅ **PASS** | `course.subject` + landing/course headers consistently state "Contest counting & probability" (`course.ts:11-15`, `LandingPage.tsx:20-32`). |
| 2 | ≥1 complete interactive lesson (hands-on, not just text/MC) | ✅ **PASS** | All 7 lessons complete; e.g. `countingPrincipleLesson` mixes connection + tree manipulatives with graded steps and a completion screen. |
| 3 | ≥1 problem requires direct manipulation | ✅ **PASS** | Drag/tap reorder (`ArrangementBoard`), connect lines (`ConnectionBoard`), slider (`ProbabilityGamble`), tap-pair (`DependencePairing`). |
| 4 | Interactive visual responds to input | ✅ **PASS** | SVG connection lines, area-model win-zone + scatter dots, live bar chart all redraw on input. |
| 5 | Instant, specific feedback incl. wrong answers | ✅ **PASS** | Per-wrong-choice `choiceFeedback`, two-tier hints, explanations (`MultipleChoiceStep.tsx:50-56`, content). Excellent. |
| 6 | Progress persists mid-lesson | ⚠️ **PASS (caveat)** | Firestore stores `currentStepIndex`+answers; same-browser resume works. Cross-device/cleared-storage breaks (seed is localStorage-only — see Bug #2). |
| 7 | Auth/accounts/names | ✅ **PASS** | Google (popup→redirect fallback) + anonymous; `DisplayNamePrompt` collects name; profile persisted. |
| 8 | Course path shows progress/mastery + recommends/unlocks next | ⚠️ **PASS (caveat)** | Sequential unlock, "Recommended" badge, "Continue", mastery pills (`useCourseProgress.ts`). Bypassable via `?dev=1` in prod (Bug #6). |
| 9 | Streaks/milestones/daily | ✅ **PASS** | `streaks.ts` + `dailyActivity` docs + streak pill. (Inflatable — Bug #9.) |
| 10 | Works on mobile / touch | ⚠️ **PASS (caveat)** | Viewport meta, `sm:` responsive, `touch-none` pointer events, range slider, fixed bottom bars. `ArrangementBoard` drag is desktop-only but has tap fallback (Bug #5). |
| 11 | Deployed/public experience works | ✅ **PASS** | curl → HTTP 200, SPA rewrites + immutable asset caching configured (`firebase.json`). HTTP-level only. |
| 12 | Teaches without AI features | ✅ **PASS** | 100% deterministic content + seeded PRNG sims; no LLM/AI dependency anywhere. |

**Bottom line:** No requirement fails. This is a polished, genuinely "learn-by-doing" MVP. The issues below are correctness/robustness/UX refinements.

---

## 2. Top 10 Bugs / UX Issues (prioritized)

> **No true P0 blockers found.** The app builds, deploys, and all core flows function. The most severe items are P1 correctness/robustness risks.

### P1 — Correctness & data integrity

**1. `advanceStep` can clobber just-recorded answers (write race)**
- **Symptom:** Occasionally a learner's last answer is missing/overwritten on the review screen ("Wrong on first try" wrong, or answer shows "—"); intermittent, timing-dependent.
- **Root cause:** `recordStepAnswer` is correctly atomic (`runTransaction`), but `advanceStep` does a **non-atomic** read-then-write and re-writes the entire `stepAnswers` map it read (`progressService.ts:176-186` → `saveLessonProgress` `updateDoc(ref, {...progress})` at `progressService.ts:96-98`). Both writes are pushed to `pendingWrites` and fire concurrently from `handleNext` (`LessonRenderer.tsx:251`). If `advanceStep` reads before the answer transaction commits and writes after, it overwrites `stepAnswers` with stale data.
- **Impact:** Lost/incorrect per-step answer records → wrong review screen and wrong restored state on resume. Final `masteryScore` is still correct (computed in-memory), so it's subtle.

**2. Randomization seed is localStorage-only → cross-device resume corrupts a play-through**
- **Symptom:** Resume on a different device/browser (or after clearing storage / private mode) shows a graded question already marked solved (green, advanceable) but with **different numbers** than what was answered; review screen's "Correct:" value doesn't match the stored answer.
- **Root cause:** `loadOrCreateSeed` persists the seed only in `localStorage` (`randomize.ts:39-53`); Firestore stores answers but not the seed. A new device → new seed → `resolveLesson` regenerates different numbers, while restore still sets `correct/everCorrect` from the old record (`LessonRenderer.tsx:88-123`).
- **Impact:** Breaks the "leave and return" guarantee across devices; mismatched/misleading content.

**3. Dice simulation ignores `editable`; lesson instructs an impossible action**
- **Symptom:** Lesson body says "*Then change the face values and roll again to see how the distribution shifts*," but there is no control to edit faces.
- **Root cause:** `DiceSimulation` dropped face editing — prop is "accepted for config compatibility but no longer used" (`DiceSimulation.tsx:6-7,43`), yet `sim-dice` sets `editable: true` and the copy promises it (`probabilityDistributionsLesson.ts:29-34`).
- **Impact:** Confusing/broken instruction; learner looks for a missing feature.

### P2 — Robustness, security, perf, polish

**4. Interactive (non-graded) step completion is never persisted**
- **Symptom:** After completing a lesson (or resuming), tapping back to an arrangement/connection/tree step via the progress bar shows it as incomplete and forces a redo; widget internal state is gone.
- **Root cause:** Answers persist only for graded steps (`handleStepUpdate` gates `persistAnswer` to `isGradedAnswer`, `LessonRenderer.tsx:186-216`). The resume restore reconstructs `explorationDone`/`treeDone`/etc. from `stepAnswers` keys — which **never exist** for interactive steps — using a fragile `stepId.includes(...)` heuristic (`LessonRenderer.tsx:110-121`).
- **Impact:** Backward navigation re-locks completed interactives; the restore heuristic is effectively dead code for them.

**5. `ArrangementBoard` primary interaction is HTML5 drag (no touch firing)**
- **Symptom:** On phones/tablets, dragging a block does nothing; `cursor-grab` affordance misleads.
- **Root cause:** Uses `draggable` + `onDragStart/onDragOver/onDrop` (`ArrangementBoard.tsx:137-168`) which don't fire for touch. A tap-to-swap fallback exists (`onClick → handleSlotActivate`), so it's usable, but the headline interaction silently fails on the most common mobile gesture. (Contrast `ConnectionBoard`, which uses pointer events + `touch-none` correctly.)
- **Impact:** Degraded mobile UX for the flagship manipulative; the landing-page demo (`LandingPage.tsx:52`) is the first thing mobile visitors try.

**6. Dev backdoor shipped to production (`?dev=1`)**
- **Symptom:** Any visitor appending `?dev=1` unlocks all lessons and can skip any step, bypassing sequential unlock + mastery gating (req 8).
- **Root cause:** `isDevUnlock()` honors `?dev=1` and persists it in `localStorage` regardless of build (`devMode.ts:14-33`); consumed in `LessonPage.tsx:31`, `LessonRenderer.tsx:262-264,425,454-463`, `CoursePage.tsx:51`.
- **Impact:** Gating is trivially bypassable in prod (only affects the user's own experience; not a data-security hole since Firestore rules are per-user).

**7. Fragile substring-based state restoration**
- **Symptom:** Latent — restored flags depend on step-id spelling (`includes('explore'|'sim'|'pick'|'condense'|…)`, `LessonRenderer.tsx:110-121`).
- **Root cause:** State derived from id naming conventions rather than step type/data.
- **Impact:** Renaming a step id silently breaks resume; currently mostly inert.

**8. Single 1.04 MB JS bundle, no code splitting**
- **Symptom:** Slow first paint on mobile networks; Vite warns.
- **Root cause:** Firebase (+ app) bundled eagerly into one chunk (`firebaseClient.ts` imported through the auth provider at app root).
- **Impact:** First-load cost on the deployed/public experience.

**9. Streak inflates by merely opening a lesson**
- **Symptom:** Streak/daily activity increments without answering anything.
- **Root cause:** `touchActivity(uid)` runs in the lesson load effect (`LessonRenderer.tsx:135` → `progressService.ts:286-289`), bumping streak + `activeMinutesEstimate` on open.
- **Impact:** Streak isn't a true "did real work today" signal.

**10. No offline persistence + no `getRedirectResult` handling**
- **Symptom:** Writes during a network blip are silently lost; Google redirect sign-in relies entirely on `onAuthStateChanged`.
- **Root cause:** `memoryLocalCache()` (no IndexedDB offline queue, `firebaseClient.ts:50-53`); failed writes are swallowed (`pendingWrites` `Promise.allSettled`, `useCourseProgress.ts:34-38` empty-on-error). No explicit `getRedirectResult` after `signInWithRedirect` (`AuthProvider.tsx:90`).
- **Impact:** Edge-case progress loss; generally works because `onAuthStateChanged` fires post-redirect.

**Honorable mentions (P3):** `choiceFeedback` keyed by literal choice text (brittle if choices ever randomized — `MultipleChoiceStep.tsx:54`); drag region not keyboard-accessible (a11y); `ArrangementBoard` recreates `itemMap`/derived callbacks every render (`ArrangementBoard.tsx:28-48`); 3 lint `only-export-components` warnings.

---

## 3. Missing Features / Weak Spots vs. Spec

- **Persistence completeness:** seed + interactive-widget state aren't durably/portably saved (Bugs #2, #4); no offline buffering (#10). Same-device works; cross-device/offline doesn't.
- **Milestones:** req 9 is satisfied by streaks/daily counts, but there are no milestone/badge rewards (optional per spec).
- **Test coverage is thin:** only pure functions are tested. Nothing covers the lesson engine, persistence/races, randomization integer-safety, resume, or components — exactly where the P1 bugs live.
- **No user-facing error states** for failed saves/loads (silent `catch`/console only).
- **Answer-checking is actually solid:** every randomized numeric step yields integer answers; tolerances appropriate. No floating-point / off-by-one / seed-mismatch grading bug found within a single play-through. Shared distinctness pools are sized larger than their draw counts, so no exhaustion.

---

## 4. Recommended Fixes (description only)

1. **Bug #1:** Make `advanceStep` update *only* `currentStepIndex` (a single-field `updateDoc`, or fold into the same transaction as the answer write). Never re-write `stepAnswers` from a non-atomic read. Audit `saveLessonProgress` callers so none echo back fields they didn't change.
2. **Bug #2:** Persist the per-lesson seed in the Firestore `LessonProgressDoc` (write on first resolve), and read it back in the load effect; fall back to localStorage only when absent. This makes a play-through reproducible on any device.
3. **Bug #3:** Either restore an editable-faces control in `DiceSimulation` (honor `editable`) or remove the "change the face values" copy and the `editable: true` config from `sim-dice`.
4. **Bug #4:** Persist interactive-step completion (e.g., a lightweight `completedSteps: string[]` or a non-graded `stepAnswers` entry), and restore widget "done" flags from that explicit data instead of id substrings.
5. **Bug #5:** Add Pointer Events + `touch-action: none` to `ArrangementBoard` (mirror `ConnectionBoard`), or make the tap-swap the documented primary interaction and de-emphasize drag on touch. Keep the tap fallback.
6. **Bug #6:** Gate `?dev=1` behind `import.meta.env.DEV` only (ignore the query param in production builds).
7. **Bug #7:** Replace `stepId.includes(...)` with a switch on `step.type` (or store the exact flag), eliminating naming dependence.
8. **Bug #8:** Lazy-load Firebase / route-split with dynamic `import()`; or raise the warning limit deliberately after splitting auth/Firestore out of the initial chunk.
9. **Bug #9:** Only call `touchActivity`/streak update on a real learning event (first answer or lesson completion), not on lesson open.
10. **Bug #10:** Add `getRedirectResult` handling on load and surface a toast on save failure; consider `persistentLocalCache` for offline write buffering.

---

## 5. Files / Components Responsible

- **Write race / persistence API:** `src/features/progress/progressService.ts:76-99,176-186,286-289`; invoked from `src/features/lesson/LessonRenderer.tsx:218-254`.
- **Seed / randomization:** `src/content/randomize.ts:39-64,242-250`; `src/features/lesson/LessonRenderer.tsx:45-46,86-137`.
- **Dice editable mismatch:** `src/features/simulation/DiceSimulation.tsx:6-7,43`; `src/content/probabilityDistributionsLesson.ts:29-34`.
- **Interactive persistence + restore heuristic:** `src/features/lesson/LessonRenderer.tsx:110-121,186-216`; `src/features/lesson/StepRenderer.tsx:320-352`.
- **Mobile drag:** `src/features/simulation/ArrangementBoard.tsx:137-168`; demo at `src/pages/LandingPage.tsx:52`.
- **Dev backdoor:** `src/features/dev/devMode.ts:14-33`; `LessonPage.tsx:31`, `CoursePage.tsx:51`.
- **Bundle / Firebase init:** `vite build` output; `src/firebase/firebaseClient.ts:31-56`.
- **Streak inflation:** `src/features/lesson/LessonRenderer.tsx:135`; `src/features/progress/streaks.ts`.
- **Auth/cache:** `src/features/auth/AuthProvider.tsx:75-100`; `src/firebase/firebaseClient.ts:44-56`.

---

## 6. Suggested Minimal Regression Tests

**`randomize.test.ts`**
- `resolveLesson yields integer correctAnswers for every randomized numeric step across 200 seeds`.
- `shared randomizer pools never produce duplicate values within a lesson`.

**`progressService.test.ts`** (Firestore mocked)
- `advanceStep preserves concurrently recorded stepAnswers` — *Fails today → guards Bug #1.*
- `completeLesson never lowers a previously earned masteryScore`.
- `recordStepAnswer locks firstAttemptCorrect/firstAttemptAnswer on the first commit`.

**`LessonRenderer.test.tsx`** (React Testing Library)
- `resuming restores currentStepIndex and graded answer state`.
- `a wrong multiple-choice answer renders its specific choiceFeedback`.
- `interactive step completion survives remount` — *Fails today → documents Bug #4.*

**`content.test.ts`**
- `no lesson body promises an interaction its component doesn't support` — *Guards Bug #3.*

**`devMode.test.ts`**
- `?dev=1 is ignored in production builds` — *Guards Bug #6.*

---

## Stabilization Log

### Round 1 — top 3 risks (in progress)
- [ ] #1 Non-atomic `advanceStep` write race
- [ ] #2 Randomization seed only in localStorage (cross-device/session resume)
- [ ] #3 Dice lesson text/UI mismatch (editable faces)
