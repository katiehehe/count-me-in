import { Link } from 'react-router-dom'
import { Chip } from '../../components/Chip'
import { MasteryRing } from '../../components/MasteryRing'
import { getMasteryTier } from '../progress/mastery'
import { ACCENT_THEME, type LessonCardVM } from './curriculumView'
import type { UnitAccent } from '../../content/curriculum'

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.79 6.8-6.79a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 1.5a4 4 0 00-4 4V8H5.5A1.5 1.5 0 004 9.5v7A1.5 1.5 0 005.5 18h9a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0014.5 8H14V5.5a4 4 0 00-4-4zm2 6.5V5.5a2 2 0 10-4 0V8h4z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const tierStroke = { green: 'text-success-500', yellow: 'text-warm-500', red: 'text-error-500' }

/** The leading identity badge: a serif lesson numeral, a check, a lock, or "—". */
function LeadBadge({ vm, accent }: { vm: LessonCardVM; accent: UnitAccent }) {
  const theme = ACCENT_THEME[accent]
  const base = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-base font-semibold'

  if (vm.status === 'mastered' || vm.status === 'completed') {
    return (
      <span className={`${base} ${theme.block} ${theme.text}`}>
        <CheckIcon className="h-4 w-4" />
      </span>
    )
  }
  if (vm.status === 'locked') {
    return (
      <span className={`${base} bg-slate-100 text-slate-300`}>
        <LockIcon className="h-3.5 w-3.5" />
      </span>
    )
  }
  if (vm.status === 'coming-soon') {
    return <span className={`${base} border border-dashed border-slate-200 text-slate-300`}>—</span>
  }
  return (
    <span className={`${base} border ${theme.border} ${theme.soft} font-serif ${theme.text}`}>
      {vm.order ?? '•'}
    </span>
  )
}

function Trailing({ vm, accent }: { vm: LessonCardVM; accent: UnitAccent }) {
  const theme = ACCENT_THEME[accent]

  if (vm.status === 'mastered' || vm.status === 'completed') {
    const tier = getMasteryTier(vm.masteryScore).tier
    return (
      <MasteryRing
        value={vm.gradedCorrect ?? vm.gradedTotal}
        total={vm.gradedTotal || 1}
        size={40}
        thickness={4}
        strokeClass={tierStroke[tier]}
      >
        <span className="font-mono text-[10px] font-bold text-slate-700">
          {vm.gradedCorrect ?? vm.gradedTotal}/{vm.gradedTotal}
        </span>
      </MasteryRing>
    )
  }

  if (vm.status === 'in-progress') {
    return (
      <MasteryRing value={vm.progressPct ?? 0} total={100} size={40} thickness={4} strokeClass="text-warm-500">
        <span className="font-mono text-[10px] font-bold text-warm-600">{vm.progressPct ?? 0}%</span>
      </MasteryRing>
    )
  }

  if (vm.status === 'available') {
    return (
      <span className={`inline-flex items-center gap-1 text-sm font-semibold ${theme.text}`}>
        {vm.recommended ? 'Start' : 'Open'} <span aria-hidden>→</span>
      </span>
    )
  }

  if (vm.status === 'locked') {
    return <Chip className="bg-slate-100 text-slate-400">Locked</Chip>
  }
  return <Chip className="border border-dashed border-slate-200 text-slate-400">Soon</Chip>
}

export function LessonCard({ vm, accent }: { vm: LessonCardVM; accent: UnitAccent }) {
  const theme = ACCENT_THEME[accent]
  const muted = vm.status === 'locked' || vm.status === 'coming-soon'

  const surface = vm.recommended
    ? `border-l-2 ${theme.ring} border-y border-r border-slate-200 bg-white`
    : muted
      ? 'border border-slate-200 bg-slate-50/40'
      : 'border border-slate-200 bg-white'

  const inner = (
    <div
      className={`group relative flex h-full items-center gap-3 rounded-lg px-3 py-3 transition-colors ${surface} ${
        vm.href ? 'hover:border-slate-300 hover:bg-slate-50/50' : ''
      } ${muted ? 'opacity-70' : ''}`}
    >
      <LeadBadge vm={vm} accent={accent} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-base font-semibold tracking-tight text-slate-900">
            {vm.title}
          </h4>
          {vm.recommended && (
            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${theme.text}`}>
              Next
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">{vm.objective}</p>
        {vm.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {vm.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center self-center">
        <Trailing vm={vm} accent={accent} />
      </div>
    </div>
  )

  if (vm.href) {
    return (
      <Link to={vm.href} className="block h-full">
        {inner}
      </Link>
    )
  }
  return inner
}
