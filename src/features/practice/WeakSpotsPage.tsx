import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { course } from '../../content/course'
import { CONCEPT_LABELS } from '../../content/types'
import type { Rng } from '../../content/randomize'
import type { LessonProgressDoc } from '../../firebase/firestoreTypes'
import { useAuth } from '../auth/AuthProvider'
import { MASTERY_GREEN_THRESHOLD, isGradedStepType } from '../progress/mastery'
import { getAllLessonProgress, recordConceptPractice } from '../progress/progressStore'
import {
  crossLessonWeakConcepts,
  lessonWeakConceptIds,
  pickConcept,
  practiceableConcepts,
  xpForLevel,
} from './practiceEngine'
import { recordPracticeCorrect } from './practiceXp'
import { PracticeRunner, type PracticeSource } from './PracticeRunner'

interface SourceLesson {
  lessonId: string
  weak: string[]
  all: string[]
  misses: number
}

function weightedPick<T>(items: T[], weight: (t: T) => number, rng: Rng): T {
  const total = items.reduce((s, t) => s + Math.max(1, weight(t)), 0)
  let r = rng() * total
  for (const t of items) {
    r -= Math.max(1, weight(t))
    if (r <= 0) return t
  }
  return items[items.length - 1]
}

/**
 * Cross-lesson "weak spots" practice: targets the lessons/concepts the learner
 * most often gets wrong, favoring not-yet-mastered lessons. Correct answers earn
 * XP (only while that lesson isn't mastered) and a coach panel summarizes gaps.
 */
export function WeakSpotsPage() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [allProgress, setAllProgress] = useState<LessonProgressDoc[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoaded(true)
      return
    }
    getAllLessonProgress(user.uid).then((p) => {
      setAllProgress(p)
      setLoaded(true)
    })
  }, [user])

  if (!loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  const progressById = new Map(allProgress.map((p) => [p.lessonId, p]))
  // Blend in live practice tallies, so acing/missing concepts in this workout shifts
  // the coach panel and targeting on the very next render.
  const weakList = crossLessonWeakConcepts(allProgress, profile?.conceptStats ?? {})

  // Source lessons: attempted lessons, preferring those not yet mastered.
  const attempted = course.lessons
    .map((lesson) => ({ lesson, prog: progressById.get(lesson.id) }))
    .filter((x): x is { lesson: (typeof course.lessons)[number]; prog: LessonProgressDoc } =>
      Boolean(x.prog),
    )
  const buildSource = (lesson: (typeof course.lessons)[number], prog: LessonProgressDoc): SourceLesson => ({
    lessonId: lesson.id,
    weak: lessonWeakConceptIds(prog, lesson),
    all: practiceableConcepts(lesson.concepts),
    misses: lesson.steps.filter(
      (s) => isGradedStepType(s.type) && prog.stepAnswers?.[s.id]?.firstAttemptCorrect === false,
    ).length,
  })

  let sources: SourceLesson[] = attempted
    .filter(({ prog }) => (prog.masteryScore ?? 0) < MASTERY_GREEN_THRESHOLD)
    .map(({ lesson, prog }) => buildSource(lesson, prog))
  if (!sources.length) sources = attempted.map(({ lesson, prog }) => buildSource(lesson, prog))
  // Last resort (nothing attempted): practice across all lessons so the page works.
  if (!sources.length) {
    sources = course.lessons.map((lesson) => ({
      lessonId: lesson.id,
      weak: [],
      all: practiceableConcepts(lesson.concepts),
      misses: 0,
    }))
  }
  sources = sources.filter((s) => s.all.length || s.weak.length)

  // Each practiceable concept → the attempted lesson teaching it with the LOWEST
  // mastery, so XP/mastery from a weak-concept question lands where it helps most.
  const conceptToLesson: Record<string, { lessonId: string; mastery: number }> = {}
  for (const { lesson, prog } of attempted) {
    const mastery = prog.masteryScore ?? 0
    for (const c of practiceableConcepts(lesson.concepts)) {
      const cur = conceptToLesson[c]
      if (!cur || mastery < cur.mastery) conceptToLesson[c] = { lessonId: lesson.id, mastery }
    }
  }
  const weakConcepts = weakList.filter((w) => conceptToLesson[w.conceptId])

  const pickSource = (rng: Rng): PracticeSource => {
    // Target the blended weak concepts directly (weighted by weakness). Fall back to
    // the lesson-based picker when nothing is weak, so the workout always has questions.
    if (weakConcepts.length) {
      const w = weightedPick(weakConcepts, (x) => x.misses, rng)
      return { lessonId: conceptToLesson[w.conceptId].lessonId, conceptId: w.conceptId }
    }
    const s = weightedPick(sources, (x) => x.misses + 1, rng)
    const pool = s.all.length ? s.all : s.weak
    return { lessonId: s.lessonId, conceptId: pickConcept(s.weak, pool, rng) }
  }

  const severity = (weakness: number) =>
    weakness >= 3
      ? { dot: 'bg-error-500', label: 'High priority' }
      : weakness === 2
        ? { dot: 'bg-amber-500', label: 'Medium priority' }
        : { dot: 'bg-amber-300', label: 'Low priority' }

  const coach = (
    <div className="mb-5 rounded-2xl border border-blush-200 bg-blush-50 px-4 py-4">
      <h1 className="text-h3">Weak-spot workout</h1>
      {weakList.length ? (
        <>
          <p className="mt-1 text-sm text-slate-600">Pip noticed you slip most often on:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {weakList.slice(0, 4).map((w) => {
              const sev = severity(w.misses)
              return (
                <li
                  key={w.conceptId}
                  title={`${sev.label} — weakness ${w.misses}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blush-200 bg-white px-3 py-1 text-xs font-semibold text-blush-700"
                >
                  <span className={`h-2 w-2 rounded-full ${sev.dot}`} aria-hidden />
                  {CONCEPT_LABELS[w.conceptId] ?? w.conceptId}
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-600">
          No weak spots yet — nice work! Practice anything to stay sharp and earn XP.
        </p>
      )}
    </div>
  )

  return (
    <PracticeRunner
      title="Weak-spot practice"
      subtitle="Targets your most-missed concepts across the course. Every clean first try earns XP, and a concept drops off once you've shored it up."
      pickSource={pickSource}
      onCorrect={async (level, lessonId, awardXp, bonusXp) => {
        if (!user || !lessonId) return 0
        // gateByMastery=false: weak spots are concept-level, so they still pay out
        // even when their parent lesson is otherwise mastered.
        const xp = await recordPracticeCorrect(user.uid, lessonId, level, awardXp, false, bonusXp)
        await refreshProfile()
        return xp
      }}
      xpForQuestion={(level) => xpForLevel(level)}
      onFirstAttempt={(correct, _lessonId, conceptId) => {
        if (user) recordConceptPractice(user.uid, conceptId, correct).then(refreshProfile)
      }}
      onExit={() => navigate('/course')}
      intro={coach}
    />
  )
}
