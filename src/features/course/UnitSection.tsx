import { ZoneIcon } from '../../components/icons/ZoneIcon'
import { LessonCard } from './LessonCard'
import { ACCENT_THEME, type UnitVM } from './curriculumView'

/** Chapter number derived from the unit's "Unit 0X" eyebrow. */
function chapterNum(eyebrow: string) {
  const m = eyebrow.match(/\d+/)
  return m ? m[0] : eyebrow
}

export function UnitSection({ unit }: { unit: UnitVM }) {
  const theme = ACCENT_THEME[unit.accent]

  return (
    <section id={`unit-${unit.id}`} className="scroll-mt-24">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        {/* thin accent rule ties the chapter to its zone color */}
        <div className={`h-1 ${theme.fill}`} aria-hidden />

        {/* Chapter header */}
        <div className="flex items-center gap-4 border-b border-slate-200/80 px-4 py-4 sm:px-5">
          <div className="flex shrink-0 items-baseline gap-2">
            <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${theme.text}`}>
              Ch.
            </span>
            <span className="font-serif text-4xl font-semibold leading-none text-slate-900">
              {chapterNum(unit.eyebrow)}
            </span>
          </div>

          <span className={`hidden h-10 w-px bg-slate-200 sm:block`} aria-hidden />

          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.7rem]">
              {unit.title}
            </h3>
            <p className="mt-1 max-w-xl text-sm text-slate-500">{unit.description}</p>
          </div>

          <span className={`hidden ${theme.text} sm:block`}>
            <ZoneIcon accent={unit.accent} className="h-6 w-6" />
          </span>

          <div className="shrink-0 text-right">
            {unit.totalLessons > 0 ? (
              <>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {unit.doneLessons}
                  <span className="text-slate-400">/{unit.totalLessons}</span>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {unit.status === 'complete' ? 'Complete' : unit.status === 'active' ? 'Current' : 'Lessons'}
                </div>
              </>
            ) : (
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Coming soon
              </div>
            )}
          </div>
        </div>

        {/* Lesson tiles */}
        <div className="grid gap-2.5 p-4 sm:grid-cols-2 sm:p-5">
          {unit.lessons.map((lesson) => (
            <LessonCard key={lesson.key} vm={lesson} accent={unit.accent} />
          ))}
        </div>
      </div>
    </section>
  )
}
