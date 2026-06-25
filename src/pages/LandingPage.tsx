import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { MasteryRing } from '../components/MasteryRing'
import { ZoneIcon } from '../components/icons/ZoneIcon'
import { CURRICULUM_UNITS } from '../content/curriculum'
import { ACCENT_THEME } from '../features/course/curriculumView'
import { useAuth } from '../features/auth/AuthProvider'
import { ArrangementBoard } from '../features/simulation/ArrangementBoard'

const previewItems = [
  { id: 'gold', label: 'Gold', color: '#fbbf24' },
  { id: 'silver', label: 'Silver', color: '#94a3b8' },
  { id: 'bronze', label: 'Bronze', color: '#d97706' },
]

const STAGES = [
  { label: 'Counting', num: 'text-lavender-600' },
  { label: 'Probability', num: 'text-accent-700' },
  { label: 'Expectation', num: 'text-lime-600' },
  { label: 'Strategy', num: 'text-blush-600' },
]

const ZONE_BARS = ['bg-lavender-400', 'bg-accent-400', 'bg-lime-400', 'bg-blush-400']

const MASTERY_PREVIEW = [
  { label: 'Counting', value: 4, total: 4, stroke: 'text-lavender-500' },
  { label: 'Probability', value: 1, total: 2, stroke: 'text-accent-500' },
  { label: 'Expectation', value: 0, total: 1, stroke: 'text-lime-500' },
]

export function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="animate-fade-up mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* ---- Workbook cover ---- */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white/85 shadow-soft backdrop-blur-sm">
        <div className="flex h-1" aria-hidden>
          {ZONE_BARS.map((c) => (
            <div key={c} className={`flex-1 ${c}`} />
          ))}
        </div>
        <div className="bg-grid">
          <div className="px-5 py-8 sm:px-10 sm:py-12">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-slate-400 sm:text-sm">
              A problem-first course · Vol. 1
            </p>
            <h1 className="text-h1 mt-4 max-w-4xl">
              Learn math by{' '}
              <span className="bg-gradient-to-r from-lavender-600 to-accent-500 bg-clip-text italic text-transparent">
                doing
              </span>
              ,<br className="hidden sm:block" /> not watching.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-600 sm:text-xl">
              Count Me In teaches counting &amp; probability through problems you solve by hand —
              arrange, roll, and reason your way to the intuition before the formulas.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              {STAGES.map((s, i) => (
                <span key={s.label} className="flex items-center gap-2">
                  <span className={`font-mono text-sm font-bold sm:text-base ${s.num}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base font-medium text-slate-700 sm:text-lg">{s.label}</span>
                  {i < STAGES.length - 1 && (
                    <span className="ml-1 text-slate-300" aria-hidden>
                      ·
                    </span>
                  )}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={user ? '/course' : '/login'}>
                <Button size="lg" className="w-full sm:w-auto">
                  {user ? 'Continue learning →' : 'Start learning →'}
                </Button>
              </Link>
              {!user && (
                <Link to="/login">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Table of contents ---- */}
      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between border-b border-slate-200 pb-2">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            The four chapters
          </h2>
          <span className="font-mono text-[11px] font-semibold text-slate-400">Counting → Strategy</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CURRICULUM_UNITS.map((unit, i) => {
            const theme = ACCENT_THEME[unit.accent]
            const realCount = unit.lessons.filter((l) => !l.comingSoon).length
            return (
              <div
                key={unit.id}
                className={`flex items-start gap-3.5 rounded-lg border ${theme.border} border-l-2 ${theme.ring} ${theme.soft} px-4 py-3.5`}
              >
                <span className="font-serif text-4xl font-semibold leading-none text-slate-900">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-h4">{unit.title}</h3>
                    <span className={theme.text}>
                      <ZoneIcon accent={unit.accent} className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{unit.description}</p>
                  <span className="mt-1.5 block font-mono text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    {realCount > 0 ? `${realCount} lesson${realCount !== 1 ? 's' : ''}` : 'Coming soon'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---- Sample problem + mastery preview ---- */}
      <section className="mt-8 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white/85 p-5 shadow-soft backdrop-blur-sm lg:col-span-2">
          <div className="mb-2 flex items-baseline justify-between border-b border-slate-200 pb-2">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-lavender-600">
              Problem 01
            </h2>
            <span className="font-mono text-[11px] font-semibold text-slate-400">Try it now</span>
          </div>
          <h3 className="text-h4">Three trophies, one shelf</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            How many distinct orderings can you find? Tap to arrange them.
          </p>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <ArrangementBoard items={previewItems} targetCount={6} goalCount={6} standalone />
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-slate-200 bg-white/85 p-5 shadow-soft backdrop-blur-sm">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Track mastery
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Earn checkpoint rings and keep a daily streak as concepts click into place.
          </p>
          <div className="mt-4 flex items-center justify-around">
            {MASTERY_PREVIEW.map((m) => (
              <div key={m.label} className="flex flex-col items-center gap-1.5">
                <MasteryRing value={m.value} total={m.total} size={50} thickness={5} strokeClass={m.stroke}>
                  <span className="font-mono text-[10px] font-bold text-slate-700">
                    {m.value}/{m.total}
                  </span>
                </MasteryRing>
                <span className="text-[10.5px] font-semibold text-slate-500">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
