import { Link } from 'react-router-dom'
import { course } from '../../content/course'
import { CONCEPT_LABELS } from '../../content/types'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { MasteryBadge } from '../../components/MasteryBadge'
import { useCourseProgress, type LessonStatus } from './useCourseProgress'
import { useAuth } from '../auth/AuthProvider'
import { DisplayNamePrompt } from '../auth/ProtectedRoute'
import { isDevUnlock } from '../dev/devMode'

const statusLabels: Record<LessonStatus, string> = {
  locked: 'Locked',
  available: 'Start',
  'in-progress': 'Continue',
  completed: 'Review',
  mastered: 'Mastered',
}

const statusColors: Record<LessonStatus, string> = {
  locked: 'bg-slate-100 text-slate-400',
  available: 'bg-brand-100 text-brand-700',
  'in-progress': 'bg-warm-400/20 text-warm-500',
  completed: 'bg-success-50 text-success-700',
  mastered: 'bg-brand-600 text-white',
}

function LessonCard({
  lessonIndex,
  title,
  description,
  status,
  masteryScore,
  gradedCorrect,
  gradedTotal,
  isRecommended,
  lessonId,
}: {
  lessonIndex: number
  title: string
  description: string
  status: LessonStatus
  masteryScore: number
  gradedCorrect?: number
  gradedTotal?: number
  isRecommended: boolean
  lessonId: string
}) {
  // With dev unlock active every lesson is reachable so functionality can be
  // tested without prerequisites; normal visitors keep locking intact.
  const isPlayable = status !== 'locked' || isDevUnlock()
  const isDone = status === 'completed' || status === 'mastered'

  const inner = (
    <Card
      className={`relative ${isRecommended ? 'ring-2 ring-brand-400' : ''} ${!isPlayable && !isRecommended ? 'opacity-60' : ''}`}
    >
      {isRecommended && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm shadow-brand-200">
          Recommended
        </span>
      )}
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            isDone ? 'bg-success-100 text-success-600' : statusColors[status]
          }`}
        >
          {isDone ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-label="Completed">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.79 6.8-6.79a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : status === 'locked' ? (
            '🔒'
          ) : (
            lessonIndex + 1
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {status === 'completed' || status === 'mastered' ? (
              // The mastery pill already conveys completion + score, so the
              // separate "Review"/"Mastered" status pill would be redundant here.
              <MasteryBadge
                masteryScore={masteryScore}
                correct={gradedCorrect}
                total={gradedTotal}
                showCount
              />
            ) : (
              <span className={`rounded-full px-2 py-0.5 font-medium ${statusColors[status]}`}>
                {statusLabels[status]}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )

  if (isPlayable) {
    return (
      <Link to={`/lesson/${lessonId}`} className="block">
        {inner}
      </Link>
    )
  }

  return inner
}

export function CoursePage() {
  const { profile } = useAuth()
  const { loading, lessonStates, recommendedLessonId, continueLessonId } = useCourseProgress()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <DisplayNamePrompt />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Your Course</h1>
          <p className="mt-1 text-slate-600">{course.subject}</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="text-center">
            <div className="text-2xl font-bold text-brand-600">{profile?.streakCount ?? 0}</div>
            <div className="text-xs text-slate-500">Day streak 🔥</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-brand-600">
              {lessonStates.filter((s) => s.status === 'completed' || s.status === 'mastered').length}
            </div>
            <div className="text-xs text-slate-500">Lessons done</div>
          </Card>
          <Card className="col-span-2 text-center sm:col-span-1">
            <div className="text-2xl font-bold text-brand-600">
              {lessonStates.filter((s) => s.status !== 'locked').length}
            </div>
            <div className="text-xs text-slate-500">Unlocked</div>
          </Card>
        </div>

        {continueLessonId && (
          <div className="mb-6">
            <Link to={`/lesson/${continueLessonId}`}>
              <Button size="lg" className="w-full sm:w-auto">
                Continue learning →
              </Button>
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {course.lessons.map((lesson, i) => {
            const state = lessonStates.find((s) => s.lessonId === lesson.id)!
            return (
              <LessonCard
                key={lesson.id}
                lessonIndex={i}
                lessonId={lesson.id}
                title={lesson.title}
                description={lesson.description}
                status={state.status}
                masteryScore={state.masteryScore}
                gradedCorrect={state.progress?.gradedCorrect}
                gradedTotal={state.progress?.gradedTotal}
                isRecommended={lesson.id === recommendedLessonId}
              />
            )
          })}

          <div className="relative flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-brand-200 bg-white/50 px-4 py-6 text-center">
            <span className="text-2xl" aria-hidden>
              🚧
            </span>
            <p className="font-bold text-slate-700">More lessons coming soon</p>
            <p className="max-w-sm text-sm text-slate-500">
              We&apos;re building out more contest counting &amp; probability topics —
              binomial coefficients, Pascal&apos;s triangle, conditional probability, and more.
              Check back as the course grows!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export { CONCEPT_LABELS }
