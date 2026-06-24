import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { useCourseProgress } from './useCourseProgress'
import { buildCurriculum } from './curriculumView'
import { CurriculumRoadmap } from './CurriculumRoadmap'
import { UnitSection } from './UnitSection'
import { useAuth } from '../auth/AuthProvider'
import { DisplayNamePrompt } from '../auth/ProtectedRoute'
import { isDevUnlock } from '../dev/devMode'

const STAGES = [
  { label: 'Counting', num: 'text-lavender-600' },
  { label: 'Probability', num: 'text-accent-700' },
  { label: 'Expectation', num: 'text-lime-600' },
  { label: 'Strategy', num: 'text-blush-600' },
]

const ZONE_BARS = ['bg-lavender-400', 'bg-accent-400', 'bg-lime-400', 'bg-blush-400']

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 first:pl-0">
      <div className="font-serif text-xl font-semibold leading-none text-slate-900">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  )
}

export function CoursePage() {
  const { profile } = useAuth()
  const { loading, lessonStates, recommendedLessonId, continueLessonId } = useCourseProgress()

  const curriculum = useMemo(
    () => buildCurriculum(lessonStates, recommendedLessonId, isDevUnlock()),
    [lessonStates, recommendedLessonId],
  )

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  const { units, earnedCheckpoints, totalCheckpoints, completedLessons, totalLessons } = curriculum
  const checkpointPct = totalCheckpoints > 0 ? Math.round((earnedCheckpoints / totalCheckpoints) * 100) : 0
  const firstName =
    profile?.displayName && profile.displayName !== 'Learner'
      ? profile.displayName.split(' ')[0]
      : null

  return (
    <div>
      <DisplayNamePrompt />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {/* ---- Workbook-cover header ---- */}
        <header className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          {/* four-zone spine */}
          <div className="flex h-1" aria-hidden>
            {ZONE_BARS.map((c) => (
              <div key={c} className={`flex-1 ${c}`} />
            ))}
          </div>

          <div className="bg-grid">
            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Course Guide · Vol. 1
                </p>
                {firstName && (
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {firstName}
                  </p>
                )}
              </div>

              <h1 className="mt-3 font-serif text-[3.6rem] font-semibold tracking-tight text-slate-900 sm:text-[4.5rem] sm:leading-[1.02]">
                Counting &amp; Probability
              </h1>
              <p className="mt-3 max-w-xl text-base text-slate-600 sm:text-lg">
                A problem-first path from counting outcomes to probability, expectation, and
                contest-style strategy.
              </p>

              {/* numbered progression */}
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {STAGES.map((s, i) => (
                  <span key={s.label} className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-bold ${s.num}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{s.label}</span>
                    {i < STAGES.length - 1 && (
                      <span className="ml-1 text-slate-300" aria-hidden>
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-5">
                <div className="flex items-stretch divide-x divide-slate-200">
                  <Stat value={`${earnedCheckpoints}/${totalCheckpoints}`} label="Checkpoints" />
                  <Stat value={`${completedLessons}/${totalLessons}`} label="Lessons" />
                  <Stat value={`${profile?.streakCount ?? 0}`} label="Day streak" />
                </div>
                {continueLessonId && (
                  <Link to={`/lesson/${continueLessonId}`}>
                    <Button size="lg">Continue →</Button>
                  </Link>
                )}
              </div>

              {/* checkpoint meter */}
              <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                    style={{ width: `${checkpointPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ---- Contents ---- */}
        <div className="mt-6">
          <div className="mb-2.5 flex items-baseline justify-between border-b border-slate-200 pb-2">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Contents
            </h2>
            <span className="font-mono text-[11px] font-semibold text-slate-400">4 chapters</span>
          </div>
          <CurriculumRoadmap units={units} />
        </div>

        {/* ---- Chapters ---- */}
        <div className="mt-6 space-y-5">
          {units.map((unit) => (
            <UnitSection key={unit.id} unit={unit} />
          ))}
        </div>
      </div>
    </div>
  )
}
