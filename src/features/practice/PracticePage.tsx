import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getLessonById } from '../../content/course'
import type { LessonProgressDoc } from '../../firebase/firestoreTypes'
import { useAuth } from '../auth/AuthProvider'
import { isLessonMastered } from '../progress/mastery'
import { getLessonProgress, recordConceptPractice } from '../progress/progressStore'
import { lessonWeakConceptIds, pickConcept, practiceableConcepts, xpForLevel } from './practiceEngine'
import { recordPracticeCorrect } from './practiceXp'
import { PracticeRunner } from './PracticeRunner'

/**
 * Per-lesson Practice: unlimited questions tuned to the concepts the learner got
 * wrong in THIS lesson. Correct answers earn XP and lift mastery — but only while
 * the lesson isn't mastered yet (see recordPracticeCorrect).
 */
export function PracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromReview = searchParams.get('from') === 'weekly-review'
  const { user, refreshProfile } = useAuth()
  const lesson = lessonId ? getLessonById(lessonId) : undefined

  const [progress, setProgress] = useState<LessonProgressDoc | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user || !lessonId) {
      setLoaded(true)
      return
    }
    getLessonProgress(user.uid, lessonId).then((p) => {
      setProgress(p)
      setLoaded(true)
    })
  }, [user, lessonId])

  if (!lessonId || !lesson) return <Navigate to="/course" replace />
  if (!loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  const weak = lessonWeakConceptIds(progress, lesson)
  const all = practiceableConcepts(lesson.concepts)
  const pool = all.length ? all : weak.length ? weak : ['factorial']

  return (
    <PracticeRunner
      title={`Practice · ${lesson.title}`}
      subtitle="Questions tuned to what tripped you up here. Correct answers earn XP and lift your mastery — until you've mastered it. Leave anytime."
      pickSource={(rng) => ({ lessonId, conceptId: pickConcept(weak, pool, rng) })}
      startMastered={isLessonMastered(progress?.masteryScore ?? 0)}
      onCorrect={async (level, _lessonId, awardXp, bonusXp) => {
        if (!user) return 0
        const xp = await recordPracticeCorrect(user.uid, lessonId, level, awardXp, true, bonusXp)
        await refreshProfile()
        return xp
      }}
      xpForQuestion={(level) => (isLessonMastered(progress?.masteryScore ?? 0) ? 0 : xpForLevel(level))}
      onFirstAttempt={(correct, _lessonId, conceptId) => {
        if (user) recordConceptPractice(user.uid, conceptId, correct).then(refreshProfile)
      }}
      onExit={() => navigate(fromReview ? '/weekly-review' : `/lesson/${lessonId}`)}
    />
  )
}
