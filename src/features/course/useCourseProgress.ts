import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { course, getLessonIndex } from '../../content/course'
import { getAllLessonProgress } from '../progress/progressStore'
import type { LessonProgressDoc } from '../../firebase/firestoreTypes'
import { isLessonMastered } from '../progress/mastery'

export type LessonStatus = 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered'

export interface LessonProgressState {
  lessonId: string
  status: LessonStatus
  progress: LessonProgressDoc | null
  masteryScore: number
}

export function useCourseProgress() {
  const { user } = useAuth()
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgressDoc>>({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setProgressMap({})
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const all = await getAllLessonProgress(user.uid)
      const map: Record<string, LessonProgressDoc> = {}
      for (const p of all) map[p.lessonId] = p
      setProgressMap(map)
    } catch (err) {
      // Never strand the learner on a spinner — show the course path with
      // whatever progress we have (empty if the read failed).
      console.error('Failed to load course progress:', err)
      setProgressMap({})
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Locking is strictly sequential: a lesson is reachable only when EVERY lesson
  // before it in course order is completed. We track this cumulatively rather than
  // looking at just the immediate predecessor, so a later lesson whose own stored
  // progress says `completed` (e.g. played via dev unlock) can never appear
  // "available" while an earlier lesson is still locked.
  let allPrevComplete = true
  const lessonStates: LessonProgressState[] = course.lessons.map((lesson) => {
    const progress = progressMap[lesson.id] ?? null
    const reachable = allPrevComplete

    let status: LessonStatus
    if (lesson.steps.length === 0) {
      status = 'locked'
    } else if (!reachable) {
      status = 'locked'
    } else if (progress?.completed && isLessonMastered(progress.masteryScore)) {
      status = 'mastered'
    } else if (progress?.completed) {
      status = 'completed'
    } else if (progress && progress.currentStepIndex > 0) {
      status = 'in-progress'
    } else {
      status = 'available'
    }

    // The next lesson is only reachable if this one is reachable AND completed.
    // Reading completion off a still-locked lesson must not unlock what follows.
    allPrevComplete = allPrevComplete && (progress?.completed ?? false)

    return {
      lessonId: lesson.id,
      status,
      progress,
      masteryScore: progress?.masteryScore ?? 0,
    }
  })

  // Recommend the FIRST lesson in course order the learner can actually act on
  // (reachable + unfinished). Because locking is sequential, this is always at or
  // before any locked lesson — so the badge never lands on a lesson behind a lock.
  const recommendedLessonId = (() => {
    const firstActionable = lessonStates.find(
      (s) => s.status === 'available' || s.status === 'in-progress',
    )
    if (firstActionable) return firstActionable.lessonId
    // Everything reachable is finished — surface a weak one to review, else the last.
    const needsReview = lessonStates.find(
      (s) => s.status === 'completed' && s.masteryScore < 0.8,
    )
    if (needsReview) return needsReview.lessonId
    return lessonStates[lessonStates.length - 1]?.lessonId ?? course.lessons[0]?.id
  })()

  // The "Continue learning" button needs a lesson the learner can actually open.
  const continueLessonId = (() => {
    const inProgress = lessonStates.find((s) => s.status === 'in-progress')
    if (inProgress) return inProgress.lessonId
    const available = lessonStates.find((s) => s.status === 'available')
    if (available) return available.lessonId
    const reviewable = lessonStates.find(
      (s) => s.status === 'completed' || s.status === 'mastered',
    )
    return reviewable?.lessonId ?? null
  })()

  return {
    loading,
    lessonStates,
    progressMap,
    recommendedLessonId,
    continueLessonId,
    refresh,
  }
}

export function isLessonUnlocked(lessonId: string, progressMap: Record<string, LessonProgressDoc>) {
  const index = getLessonIndex(lessonId)
  if (index <= 0) return true
  // Sequential unlock: every lesson before this one must be completed.
  for (let i = 0; i < index; i++) {
    if (!(progressMap[course.lessons[i].id]?.completed ?? false)) return false
  }
  return true
}
