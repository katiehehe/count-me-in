import { getLessonById, getLessonIndex } from '../../content/course'
import { CURRICULUM_UNITS, type UnitAccent } from '../../content/curriculum'
import { countGradedSteps } from '../progress/mastery'
import type { LessonProgressState, LessonStatus } from './useCourseProgress'

export type DisplayStatus = LessonStatus | 'coming-soon'

export interface LessonCardVM {
  key: string
  lessonId: string
  /** Route to open this lesson, or undefined when not navigable. */
  href?: string
  title: string
  objective: string
  tags: string[]
  status: DisplayStatus
  recommended: boolean
  masteryScore: number
  gradedCorrect?: number
  gradedTotal: number
  /** 1-based position in overall course order (real lessons only). */
  order?: number
  /** 0–100 step progress for in-progress lessons. */
  progressPct?: number
}

export type UnitStatus = 'complete' | 'active' | 'upcoming'

export interface UnitVM {
  id: string
  eyebrow: string
  title: string
  description: string
  accent: UnitAccent
  status: UnitStatus
  lessons: LessonCardVM[]
  /** Real (built) lessons completed or mastered. */
  doneLessons: number
  /** Real (built) lessons in this unit. */
  totalLessons: number
  earnedCheckpoints: number
  totalCheckpoints: number
}

export interface CurriculumVM {
  units: UnitVM[]
  earnedCheckpoints: number
  totalCheckpoints: number
  masteredLessons: number
  completedLessons: number
  totalLessons: number
}

/**
 * Assemble the curriculum view-model from the live progress states. This is a
 * pure read over `useCourseProgress` output — it never changes locking, mastery,
 * or routing, it only arranges existing data into units for display.
 */
export function buildCurriculum(
  lessonStates: LessonProgressState[],
  recommendedLessonId: string | undefined,
  devUnlock: boolean,
): CurriculumVM {
  const stateById = new Map(lessonStates.map((s) => [s.lessonId, s]))

  const units: UnitVM[] = CURRICULUM_UNITS.map((unitDef) => {
    let doneLessons = 0
    let totalLessons = 0
    let earnedCheckpoints = 0
    let totalCheckpoints = 0

    const lessons: LessonCardVM[] = unitDef.lessons.map((def) => {
      const lesson = def.comingSoon ? undefined : getLessonById(def.lessonId)

      if (!lesson) {
        return {
          key: def.lessonId,
          lessonId: def.lessonId,
          title: def.title ?? def.lessonId,
          objective: def.objective,
          tags: def.tags,
          status: 'coming-soon' as DisplayStatus,
          recommended: false,
          masteryScore: 0,
          gradedTotal: 0,
        }
      }

      const state = stateById.get(def.lessonId)
      const status: DisplayStatus = state?.status ?? 'locked'
      const gradedTotal = countGradedSteps(lesson.steps)
      const gradedCorrect = state?.progress?.gradedCorrect
      const navigable = status !== 'locked' || devUnlock

      totalLessons += 1
      totalCheckpoints += gradedTotal
      if (status === 'completed' || status === 'mastered') {
        doneLessons += 1
        earnedCheckpoints += gradedCorrect ?? gradedTotal
      } else if (typeof gradedCorrect === 'number') {
        earnedCheckpoints += gradedCorrect
      }

      // Step-level progress for the in-progress treatment (excludes the final
      // completion screen so a mid-lesson learner never shows as 100%).
      const realSteps = lesson.steps.filter((s) => s.type !== 'completion').length
      const currentStepIndex = state?.progress?.currentStepIndex ?? 0
      const progressPct =
        status === 'in-progress' && realSteps > 0
          ? Math.min(100, Math.round((currentStepIndex / realSteps) * 100))
          : undefined

      return {
        key: def.lessonId,
        lessonId: def.lessonId,
        href: navigable ? `/lesson/${def.lessonId}` : undefined,
        title: lesson.title,
        objective: def.objective,
        tags: def.tags,
        status,
        recommended: def.lessonId === recommendedLessonId,
        masteryScore: state?.masteryScore ?? 0,
        gradedCorrect,
        gradedTotal,
        order: getLessonIndex(def.lessonId) + 1,
        progressPct,
      }
    })

    const allDone = totalLessons > 0 && doneLessons === totalLessons
    const hasRecommended = lessons.some((l) => l.recommended)
    const status: UnitStatus = allDone ? 'complete' : hasRecommended ? 'active' : 'upcoming'

    return {
      id: unitDef.id,
      eyebrow: unitDef.eyebrow,
      title: unitDef.title,
      description: unitDef.description,
      accent: unitDef.accent,
      status,
      lessons,
      doneLessons,
      totalLessons,
      earnedCheckpoints,
      totalCheckpoints,
    }
  })

  // If nothing is "active" yet (e.g. the recommended lesson resolved to a
  // not-yet-mapped review target), highlight the first not-complete unit so the
  // roadmap always has a clear "you are here".
  if (!units.some((u) => u.status === 'active')) {
    const firstOpen = units.find((u) => u.status !== 'complete' && u.totalLessons > 0)
    if (firstOpen) firstOpen.status = 'active'
  }

  return {
    units,
    earnedCheckpoints: units.reduce((n, u) => n + u.earnedCheckpoints, 0),
    totalCheckpoints: units.reduce((n, u) => n + u.totalCheckpoints, 0),
    masteredLessons: lessonStates.filter((s) => s.status === 'mastered').length,
    completedLessons: lessonStates.filter(
      (s) => s.status === 'completed' || s.status === 'mastered',
    ).length,
    totalLessons: lessonStates.length,
  }
}

export interface AccentTheme {
  /** Accent text color for labels/headings. */
  text: string
  /** Solid accent fill — progress bars, dots, ring arcs. */
  fill: string
  /** Lightest tint — section/panel background. */
  soft: string
  /** Stronger pastel block — icon badges, accent tiles. */
  block: string
  /** Soft accent border. */
  border: string
  /** Stronger border for active/recommended emphasis. */
  ring: string
  /** Chip background + text pair. */
  chip: string
  /** text-* used as the progress-ring arc color (via currentColor). */
  stroke: string
}

/**
 * Per-unit pastel treatments for the soft "bento" dashboard. Each zone owns a
 * playful accent: lavender (counting), pale blue (probability), lime
 * (expectation), blush (challenge). Only palette shades defined in index.css.
 */
export const ACCENT_THEME: Record<UnitAccent, AccentTheme> = {
  counting: {
    text: 'text-lavender-600',
    fill: 'bg-lavender-500',
    soft: 'bg-lavender-50',
    block: 'bg-lavender-100',
    border: 'border-lavender-200',
    ring: 'border-lavender-300',
    chip: 'bg-lavender-100 text-lavender-600',
    stroke: 'text-lavender-500',
  },
  probability: {
    text: 'text-accent-700',
    fill: 'bg-accent-500',
    soft: 'bg-accent-50',
    block: 'bg-accent-100',
    border: 'border-accent-200',
    ring: 'border-accent-300',
    chip: 'bg-accent-100 text-accent-700',
    stroke: 'text-accent-500',
  },
  expectation: {
    text: 'text-lime-600',
    fill: 'bg-lime-500',
    soft: 'bg-lime-50',
    block: 'bg-lime-100',
    border: 'border-lime-200',
    ring: 'border-lime-300',
    chip: 'bg-lime-100 text-lime-600',
    stroke: 'text-lime-500',
  },
  challenge: {
    text: 'text-blush-600',
    fill: 'bg-blush-500',
    soft: 'bg-blush-50',
    block: 'bg-blush-100',
    border: 'border-blush-200',
    ring: 'border-blush-300',
    chip: 'bg-blush-100 text-blush-600',
    stroke: 'text-blush-500',
  },
}
