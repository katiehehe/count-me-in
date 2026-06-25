import { Navigate, useParams } from 'react-router-dom'
import { getLessonById } from '../../content/course'
import { isLessonUnlocked, useCourseProgress } from '../course/useCourseProgress'
import { isDevUnlock } from '../dev/devMode'
import { LessonRenderer } from './LessonRenderer'

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const lesson = lessonId ? getLessonById(lessonId) : undefined
  const { loading, progressMap } = useCourseProgress()

  if (!lesson || lesson.steps.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-h3">Lesson not available yet</h1>
        <p className="mt-2 text-slate-600">This lesson is coming soon. Complete earlier lessons first.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  // Dev tooling: allow jumping straight into any lesson to test functionality
  // without playing through prerequisites first (dev build or ?dev=1).
  if (!isDevUnlock() && lessonId && !isLessonUnlocked(lessonId, progressMap)) {
    return <Navigate to="/course" replace />
  }

  return <LessonRenderer lesson={lesson} />
}
