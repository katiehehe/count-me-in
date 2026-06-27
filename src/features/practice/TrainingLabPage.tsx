import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { course, getLessonById } from '../../content/course'
import type { Rng } from '../../content/randomize'
import type { LessonProgressDoc } from '../../firebase/firestoreTypes'
import { useAuth } from '../auth/AuthProvider'
import { MASTERY_GREEN_THRESHOLD } from '../progress/mastery'
import {
  awardCompanionXp,
  getAllLessonProgress,
  recordConceptPractice,
} from '../progress/progressStore'
import { lessonWeakConceptIds, pickConcept, practiceableConcepts, xpForLevel } from './practiceEngine'
import { recordPracticeCorrect } from './practiceXp'
import { PracticeRunner, type PracticeSource } from './PracticeRunner'
import { learnerLevelFromMastery, selfTestXpPerCorrect } from './selfTestXp'
import { TestPlayer, type TestItem, type TestItemResult, type TestXpResult } from './TestPlayer'
import { timeBonusXp } from './timeBonus'

const PACES = [
  { id: 'none', label: 'No limit', secPerQ: null },
  { id: 'relaxed', label: 'Relaxed', secPerQ: 25 },
  { id: 'standard', label: 'Standard', secPerQ: 15 },
  { id: 'blitz', label: 'Blitz', secPerQ: 8 },
] as const

type PaceId = (typeof PACES)[number]['id']
const COUNTS = [5, 10, 20]

const chipClass = (active: boolean) =>
  `rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition ${
    active
      ? 'border-brand-500 bg-brand-50 text-brand-700'
      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
  }`

function parseLessons(raw: string | null, valid: Set<string>): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((id) => valid.has(id))
}

/** Round-robins across the chosen lessons, rotating through each one's concepts. */
function buildTestItems(lessonIds: string[], difficulty: number, count: number): TestItem[] {
  const perLesson = lessonIds
    .map((id) => ({ id, concepts: practiceableConcepts(getLessonById(id)?.concepts ?? []) }))
    .filter((l) => l.concepts.length > 0)
  if (!perLesson.length) return []
  const items: TestItem[] = []
  const counters: Record<string, number> = {}
  for (let i = 0; i < count; i++) {
    const l = perLesson[i % perLesson.length]
    const k = counters[l.id] ?? 0
    counters[l.id] = k + 1
    items.push({ conceptId: l.concepts[k % l.concepts.length], lessonId: l.id, difficulty })
  }
  return items
}

/**
 * Training Lab: pick one or many topics, then either practice freely (unlimited,
 * mastery-gated XP) or take a configurable, delayed-feedback self-test (difficulty,
 * count, pace) whose XP scales with the config and the learner's rising level.
 */
export function TrainingLabPage() {
  const [searchParams] = useSearchParams()
  const { user, refreshProfile } = useAuth()

  const topics = useMemo(() => course.lessons.filter((l) => practiceableConcepts(l.concepts).length > 0), [])
  const topicIds = useMemo(() => new Set(topics.map((t) => t.id)), [topics])

  const [allProgress, setAllProgress] = useState<LessonProgressDoc[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(parseLessons(searchParams.get('lessons'), topicIds)),
  )
  const [mode, setMode] = useState<'config' | 'practice' | 'test'>('config')
  const [showTestConfig, setShowTestConfig] = useState(false)
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [count, setCount] = useState(10)
  const [paceId, setPaceId] = useState<PaceId>('none')
  const [test, setTest] = useState<{ items: TestItem[]; timeLimitSec?: number; perCorrectBase: number } | null>(null)

  useEffect(() => {
    if (!user) {
      setLoaded(true)
      return
    }
    getAllLessonProgress(user.uid).then((p) => {
      setAllProgress(p)
      setLoaded(true)
    })
  }, [user])

  const progressById = useMemo(() => new Map(allProgress.map((p) => [p.lessonId, p])), [allProgress])
  const masteredSet = useMemo(
    () =>
      new Set(
        allProgress.filter((p) => (p.masteryScore ?? 0) >= MASTERY_GREEN_THRESHOLD).map((p) => p.lessonId),
      ),
    [allProgress],
  )
  const avgMastery = allProgress.length
    ? allProgress.reduce((s, p) => s + (p.masteryScore ?? 0), 0) / allProgress.length
    : 0
  const learnerLevel = learnerLevelFromMastery(avgMastery)
  const diff = difficulty ?? learnerLevel
  const pace = PACES.find((p) => p.id === paceId) ?? PACES[0]
  const selectedIds = [...selected]

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pickSource = (rng: Rng): PracticeSource => {
    const lessonId = selectedIds[Math.floor(rng() * selectedIds.length)] ?? selectedIds[0]
    const lesson = getLessonById(lessonId)
    const all = lesson ? practiceableConcepts(lesson.concepts) : []
    const weak = lesson ? lessonWeakConceptIds(progressById.get(lessonId) ?? null, lesson) : []
    const pool = all.length ? all : weak.length ? weak : ['factorial']
    return { lessonId, conceptId: pickConcept(weak, pool, rng) }
  }

  function startTest() {
    const items = buildTestItems(selectedIds, diff, count)
    if (!items.length) return
    const perCorrectBase = selfTestXpPerCorrect(diff, pace.secPerQ, learnerLevel)
    const timeLimitSec = pace.secPerQ != null ? pace.secPerQ * count : undefined
    setTest({ items, timeLimitSec, perCorrectBase })
    setMode('test')
  }

  async function gradeTest(results: TestItemResult[]): Promise<TestXpResult> {
    let baseXp = 0
    let bonusXp = 0
    if (!user || !test) return { baseXp, bonusXp }
    for (const r of results) {
      if (!r.correct) continue
      baseXp += test.perCorrectBase
      bonusXp += timeBonusXp(r.activeMs)
    }
    const total = baseXp + bonusXp
    if (total > 0) {
      try {
        await awardCompanionXp(user.uid, total)
        await refreshProfile()
      } catch {
        /* best-effort */
      }
    }
    return { baseXp, bonusXp }
  }

  if (mode === 'practice') {
    return (
      <PracticeRunner
        title="Training practice"
        subtitle={`Mixed questions across ${selectedIds.length} topic${selectedIds.length === 1 ? '' : 's'} — clean first tries earn XP (and lift mastery until mastered).`}
        pickSource={pickSource}
        onCorrect={async (level, lessonId, awardXp, bonusXp) => {
          if (!user || !lessonId) return 0
          const xp = await recordPracticeCorrect(user.uid, lessonId, level, awardXp, true, bonusXp)
          await refreshProfile()
          return xp
        }}
        xpForQuestion={(level, lessonId) => (masteredSet.has(lessonId) ? 0 : xpForLevel(level))}
        onFirstAttempt={(correct, _lessonId, conceptId) => {
          if (user) recordConceptPractice(user.uid, conceptId, correct).then(refreshProfile)
        }}
        onExit={() => setMode('config')}
      />
    )
  }

  if (mode === 'test' && test) {
    return (
      <TestPlayer
        items={test.items}
        title="Self-test"
        subtitle={`Difficulty ${diff} · ${test.items.length} questions${
          test.timeLimitSec ? ` · ${pace.label.toLowerCase()} pace` : ''
        }`}
        timeLimitSec={test.timeLimitSec}
        onGrade={gradeTest}
        onExit={() => {
          setTest(null)
          setMode('config')
        }}
      />
    )
  }

  if (!loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  const totalLimit = pace.secPerQ != null ? pace.secPerQ * count : 0

  return (
    <div className="animate-fade-up mx-auto max-w-2xl px-4 py-8">
      <Link to="/course" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back to course
      </Link>
      <h1 className="text-h1 mt-2">Training Lab</h1>
      <p className="mt-2 text-slate-600">
        Pick one or more topics, then practice freely or take a quick self-test.
      </p>

      <Card className="mt-6">
        <h2 className="text-h4">Topics</h2>
        <p className="mt-1 text-sm text-slate-500">Choose what you want to work on.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map((t) => {
            const on = selected.has(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={`rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition ${
                  on
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                {on ? '✓ ' : ''}
                {t.title}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex gap-3 text-xs">
          <button
            type="button"
            onClick={() => setSelected(new Set(topics.map((t) => t.id)))}
            className="font-semibold text-brand-600 hover:underline"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="font-semibold text-slate-400 hover:underline"
          >
            Clear
          </button>
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button size="lg" disabled={!selectedIds.length} onClick={() => setMode('practice')}>
          ▶ Practice
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={!selectedIds.length}
          onClick={() => setShowTestConfig((s) => !s)}
        >
          📝 Test yourself
        </Button>
      </div>
      {!selectedIds.length && (
        <p className="mt-2 text-sm text-slate-400">Pick at least one topic to begin.</p>
      )}

      {showTestConfig && selectedIds.length > 0 && (
        <Card className="mt-4">
          <h2 className="text-h4">Self-test setup</h2>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-700">Difficulty</p>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`h-10 w-10 rounded-lg border-2 text-sm font-bold transition ${
                    d === diff ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Default {learnerLevel} matches your level — it rises as you master more.
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-700">Questions</p>
            <div className="mt-2 flex gap-2">
              {COUNTS.map((c) => (
                <button key={c} type="button" onClick={() => setCount(c)} className={chipClass(c === count)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-700">Pace</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PACES.map((p) => (
                <button key={p.id} type="button" onClick={() => setPaceId(p.id)} className={chipClass(p.id === paceId)}>
                  {p.label}
                  {p.secPerQ ? ` · ${p.secPerQ}s/q` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-500">
              ≈ <strong className="text-blush-600">{selfTestXpPerCorrect(diff, pace.secPerQ, learnerLevel)} XP</strong> per
              correct
              {totalLimit > 0
                ? ` · ${Math.floor(totalLimit / 60)}:${String(totalLimit % 60).padStart(2, '0')} limit`
                : ''}
            </p>
            <Button onClick={startTest}>Start test →</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
