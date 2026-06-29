import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import type { WorkedExampleConfig } from '../../content/types'
import { useReducedMotion } from '../simulation/useReducedMotion'
import { cancelSpeech, prefetchLine, speakLine } from './ttsClient'
import { WorkedExampleDiagram } from './workedExampleDiagrams'

interface WorkedExampleStepProps {
  config: WorkedExampleConfig
  /** Marks the step complete so the lesson's Continue unlocks. */
  onDone: () => void
}

const SPEED_KEY = 'cmi-tts-speed'
const RANGE = 'h-1.5 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500'

function loadSpeed(): number {
  try {
    const n = Number(window.localStorage.getItem(SPEED_KEY))
    return Number.isFinite(n) && n >= 0.5 && n <= 2.5 ? n : 1.25
  } catch {
    return 1.25
  }
}

function saveSpeed(speed: number): void {
  try {
    window.localStorage.setItem(SPEED_KEY, String(speed))
  } catch {
    /* ignore */
  }
}

/**
 * A narrated "watch me solve one" whiteboard. Play auto-advances beat by beat with
 * synced narration; the scrubber lets the learner slide through at their own pace
 * (skipping the spoken pauses) — the diagram renders each beat's cumulative state and
 * animates the choreography. Degrades to browser speech / silent stepping when AI is off.
 */
export function WorkedExampleStep({ config, onDone }: WorkedExampleStepProps) {
  const { script, voice } = config
  const reduced = useReducedMotion()
  const n = script.length

  const [beat, setBeat] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [speed, setSpeed] = useState(loadSpeed)

  const mounted = useRef(true)
  const reqRef = useRef(0)
  const markedRef = useRef(false)
  // Read by the narration effect so a mid-line speed change applies to the NEXT line.
  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(
    () => () => {
      mounted.current = false
      cancelSpeech()
    },
    [],
  )

  // Warm the opening line(s) up front so the first Play starts promptly.
  useEffect(() => {
    prefetchLine(script[0]?.say ?? '', voice, speedRef.current)
    if (n > 1) prefetchLine(script[1].say, voice, speedRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function markDone() {
    if (markedRef.current) return
    markedRef.current = true
    onDone()
  }

  // Reaching the final beat (by playing or scrubbing) unlocks Continue.
  useEffect(() => {
    if (started && beat >= n - 1) markDone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, beat])

  // Auto-advance loop: narrate the current beat, then move to the next when it finishes.
  useEffect(() => {
    if (!playing) return
    const reqId = ++reqRef.current
    // Warm the next line's audio while this one plays, so beats flow with no gap.
    if (beat + 1 < n) prefetchLine(script[beat + 1].say, voice, speedRef.current)
    speakLine(script[beat].say, voice, speedRef.current).then(() => {
      if (!mounted.current || reqId !== reqRef.current) return
      if (beat < n - 1) setBeat((b) => b + 1)
      else setPlaying(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, beat])

  function pause() {
    reqRef.current++
    cancelSpeech()
    setPlaying(false)
  }

  function replay() {
    reqRef.current++
    cancelSpeech()
    setStarted(true)
    setBeat(0)
    setPlaying(true)
  }

  function scrubTo(i: number) {
    reqRef.current++
    cancelSpeech()
    setPlaying(false)
    setStarted(true)
    setBeat(Math.max(0, Math.min(n - 1, i)))
  }

  function changeSpeed(v: number) {
    setSpeed(v)
    saveSpeed(v)
  }

  const atEnd = started && beat >= n - 1
  const togglePlay = () => {
    if (playing) return pause()
    if (atEnd) return replay()
    setStarted(true)
    setPlaying(true)
  }

  const reached = started ? beat : -1
  const cur = started ? script[Math.min(beat, n - 1)] : undefined
  const isReached = (target: string) => {
    const i = script.findIndex((b) => b.highlight === target)
    return i >= 0 && i <= reached
  }
  const isActive = (target: string) => cur?.highlight === target
  const animReached = (anim: string) => {
    const i = script.findIndex((b) => b.anim === anim)
    return i >= 0 && i <= reached
  }
  const caption = started
    ? (script[Math.min(beat, n - 1)]?.say ?? '')
    : 'Press play, or drag the slider, and I’ll walk through one example.'

  return (
    <div className="space-y-4">
      <WorkedExampleDiagram
        config={config}
        isReached={isReached}
        isActive={isActive}
        animReached={animReached}
        reduced={reduced}
      />

      <div className="flex items-start gap-2 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-soft">
        <span aria-hidden>{playing ? '🔊' : '🗣️'}</span>
        <p>{caption}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={togglePlay} className="shrink-0">
          {playing ? '⏸ Pause' : !started ? '▶ Play' : atEnd ? '↻ Replay' : '▶ Resume'}
        </Button>
        <input
          type="range"
          min={0}
          max={Math.max(0, n - 1)}
          step={1}
          value={started ? beat : 0}
          onChange={(e) => scrubTo(Number(e.target.value))}
          aria-label="Scrub through the walkthrough"
          className={`flex-1 ${RANGE}`}
        />
        <span className="shrink-0 text-xs font-medium tabular-nums text-slate-400">
          {Math.min(beat + 1, n)} / {n}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="shrink-0">⚡ Speed</span>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.05}
            value={speed}
            onChange={(e) => changeSpeed(Number(e.target.value))}
            aria-label="Narration speed"
            className={`w-28 ${RANGE}`}
          />
          <span className="w-12 shrink-0 tabular-nums">{speed.toFixed(2)}×</span>
        </label>
      </div>
    </div>
  )
}
