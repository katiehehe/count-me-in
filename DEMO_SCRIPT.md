# Count Me In — Demo Video Script (~2.5–3 min)

Goal: show every MVP requirement in one continuous learner flow. Record at a
**mobile-ish width** (e.g. 420px wide window, or a phone) so the responsive UI
and touch interactions are visible. Each beat below maps to the MVP requirement
number(s) it proves.

> Tip: do a dry run first. Pre-clear the demo account's progress (or use a fresh
> anonymous sign-in) so the "resume" beat is believable.

---

## 0. Cold open (10s) — Subject & persona  ·  [Req 1]
- Open the **landing page** at the deployed URL.
- Say: *"Count Me In teaches contest counting and probability the Brilliant way —
  by doing, not watching. It's built for students prepping for math contests."*
- Point to the headline/subject and the "try it" demo manipulative on the landing page.

## 1. Sign in (15s) — Auth & names  ·  [Req 7]
- Click **Sign in**. Show both options (Google + "Try as guest"/anonymous).
- Choose one; when prompted, **enter a display name**.
- Land on the **course path**; say the name now shows in the header.

## 2. Course path (15s) — Progress / mastery / next step  ·  [Req 8, 9]
- Pan the **course path**: 7 lessons, sequential unlock, mastery pills, the
  **"Recommended"/Continue** badge on the next sensible lesson.
- Point out the **streak / daily** indicator.  ·  [Req 9]

## 3. Start a lesson (10s) — Real interactive lesson  ·  [Req 2]
- Open **The Counting Principle** (or Arranging Distinct Objects).
- Show the intro step, then the segmented progress bar. Say lessons are
  hands-on problems, not text walls or pure multiple choice.

## 4. Direct manipulation + live visual (30s)  ·  [Req 3, 4]
- On a manipulative step, **interact directly**:
  - *Counting Principle*: drag/connect outfit options on the **ConnectionBoard**;
    watch the SVG lines + outcome count update live, OR
  - *Arranging Distinct Objects*: **tap/drag to reorder** on the ArrangementBoard
    and watch unique orderings tally, OR
  - *Independent Events*: drag the **ProbabilityGamble slider** and watch the
    area-model win-zone resize in real time.
- Narrate that the visual responds immediately to input.

## 5. Wrong answer → specific feedback (20s)  ·  [Req 5]
- On a graded question, **enter a wrong answer on purpose**.
- Show the **specific** feedback (not just "incorrect") — e.g. a misconception
  message and the tiered hint / computation hint.
- Reveal the second-tier hint to show escalating help.

## 6. Correct answer → instant feedback (10s)  ·  [Req 5]
- Fix the answer; show the **instant correct feedback + explanation**, then Continue.

## 7. Leave mid-lesson and return (20s) — Persistence  ·  [Req 6]
- Mid-lesson, **refresh the page** (or navigate away and back).
- Show it **resumes on the same step**, with prior answers intact and the **same
  numbers** (seeded randomization).
- (Optional power move for cross-device: open the same account in a second
  browser/incognito and show the identical play-through.)  ·  [Req 6, 11]

## 8. Finish the lesson (20s) — Completion & mastery  ·  [Req 2, 8]
- Advance to the **completion step**: mastery badge (red/yellow/green tier),
  concept breakdown, streak, and the **next-lesson recommendation**.
- Return to the course path; show the lesson now marked complete/mastered and
  the **next lesson unlocked**.  ·  [Req 8]

## 9. Mobile / touch (15s)  ·  [Req 10]
- If not already on mobile, switch to a **phone-width** view (or actual phone).
- Re-do one **touch** interaction (tap-to-swap or slider) to prove touch works;
  show layout reflows cleanly (fixed bottom action bar, no overflow).

## 10. Public + no-AI close (10s)  ·  [Req 11, 12]
- Note the URL bar: this is the **live deployed app**, not localhost.  ·  [Req 11]
- Say: *"Everything you saw is fully deterministic — no AI required to teach."*  ·  [Req 12]

---

## Requirement coverage checklist (say/show each)
1. Subject/persona — beat 0
2. Complete interactive lesson — beats 3–8
3. Direct manipulation — beat 4
4. Interactive visual — beat 4
5. Instant specific feedback (right & wrong) — beats 5–6
6. Mid-lesson persistence — beat 7
7. Auth/accounts/names — beat 1
8. Course path progress/mastery/next — beats 2, 8
9. Streaks/milestones/daily — beat 2
10. Mobile + touch — beat 9
11. Deployed/public works — beats 7(optional), 10
12. Teaches without AI — beat 10
