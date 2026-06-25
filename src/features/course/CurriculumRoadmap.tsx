import { ACCENT_THEME, type UnitVM } from './curriculumView'

function chapterNum(eyebrow: string) {
  const m = eyebrow.match(/\d+/)
  return m ? m[0] : eyebrow
}

function ZoneTile({ unit }: { unit: UnitVM }) {
  const theme = ACCENT_THEME[unit.accent]
  const isActive = unit.status === 'active'
  const isComplete = unit.status === 'complete'
  const pct = unit.totalLessons > 0 ? Math.round((unit.doneLessons / unit.totalLessons) * 100) : 0

  return (
    <a
      href={`#unit-${unit.id}`}
      className={`group flex min-w-[8.5rem] flex-1 flex-col gap-2 rounded-lg border bg-white px-3 py-2.5 transition-colors hover:border-slate-300 sm:min-w-0 ${
        isActive ? `${theme.ring} border-l-2` : 'border-slate-200'
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className={`font-serif text-2xl font-semibold leading-none ${isComplete || isActive ? theme.text : 'text-slate-300'}`}>
          {chapterNum(unit.eyebrow)}
        </span>
        <span className="font-mono text-[10px] font-bold text-slate-400">
          {unit.totalLessons > 0 ? `${unit.doneLessons}/${unit.totalLessons}` : 'soon'}
        </span>
      </div>

      <h3 className="text-sm font-semibold leading-tight tracking-tight text-slate-700">
        {unit.title}
      </h3>

      <div className="mt-auto h-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${theme.fill}`} style={{ width: `${pct}%` }} />
      </div>
    </a>
  )
}

/**
 * The course "contents" strip: Counting → Probability → Expectation → Challenge
 * as four numbered chapter tiles. Scrollable on small screens.
 */
export function CurriculumRoadmap({ units }: { units: UnitVM[] }) {
  return (
    <nav aria-label="Course contents" className="-mx-1 overflow-x-auto px-1 pb-1">
      <ol className="flex items-stretch gap-2">
        {units.map((unit, i) => (
          <li key={unit.id} className="flex flex-1 items-stretch gap-2">
            <ZoneTile unit={unit} />
            {i < units.length - 1 && (
              <span className="flex shrink-0 items-center self-center text-sm text-slate-300" aria-hidden>
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
