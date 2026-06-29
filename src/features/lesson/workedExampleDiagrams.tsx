import { Math as Tex } from '../../components/Math'
import { DieIcon } from '../../components/icons/DieIcon'
import { EventIcon } from '../../components/icons/EventIcon'
import { hasEventIcon } from '../../components/icons/tokenIconUtils'
import type { ArrangementItem, WorkedExampleConfig } from '../../content/types'
import { factorial } from '../../content/randomize'
import {
  binomialProb,
  choose,
  complement,
  drawSameProb,
  fracLatex,
  multiplyFracs,
  reduceFrac,
} from '../../content/probabilityMath'
import { fractionLatex, rotate, timesLatex } from './workedExampleMath'

interface DiagramProps {
  config: WorkedExampleConfig
  /** True once the beat that first reveals this target has been reached/scrubbed past. */
  isReached: (target: string) => boolean
  /** True while the current beat highlights this target. */
  isActive: (target: string) => boolean
  /** True once a beat carrying this animation cue has been reached. */
  animReached: (anim: string) => boolean
  reduced: boolean
}

type KindProps = Omit<DiagramProps, 'config'>

const RESULT_BOX = 'rounded-xl bg-brand-50 px-4 py-3 text-center transition-all'

/** Picks the teaching diagram for a worked example and wires it to the narration. */
export function WorkedExampleDiagram({ config, isReached, isActive, animReached, reduced }: DiagramProps) {
  const shared = { isReached, isActive, animReached, reduced }
  const kind = config.kind ?? 'slots'
  if (kind === 'connections' && config.connections) return <Connections data={config.connections} {...shared} />
  if (kind === 'group' && config.group) return <Group data={config.group} {...shared} />
  if (kind === 'tree' && config.tree) return <Tree data={config.tree} {...shared} />
  if (kind === 'distribution' && config.distribution) return <Distribution data={config.distribution} {...shared} />
  if (kind === 'draw' && config.draw) return <Draw data={config.draw} {...shared} />
  if (kind === 'sample-space' && config.sampleSpace) return <SampleSpace data={config.sampleSpace} {...shared} />
  if (kind === 'venn' && config.venn) return <Venn data={config.venn} {...shared} />
  if (kind === 'coins-sum' && config.coinsSum) return <CoinsSum data={config.coinsSum} {...shared} />
  if (kind === 'steps' && config.steps) return <Steps data={config.steps} {...shared} />
  if (kind === 'disjoint' && config.disjoint) return <Disjoint data={config.disjoint} {...shared} />
  if (kind === 'binomial' && config.binomial) return <Binomial data={config.binomial} {...shared} />
  if (kind === 'expand' && config.expand) return <Expand data={config.expand} {...shared} />
  if (kind === 'pascal' && config.pascal) return <Pascal data={config.pascal} {...shared} />
  if (kind === 'stars-bars' && config.starsBars) return <StarsBars data={config.starsBars} {...shared} />
  if (kind === 'gridpaths' && config.gridPaths) return <GridPaths data={config.gridPaths} {...shared} />
  if (config.items) return <Slots items={config.items} {...shared} />
  return null
}

function GridPaths({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['gridPaths']> } & KindProps) {
  const { m, n, sample } = data
  const gridShown = isReached('grid')
  const pathShown = isReached('path')
  const stringShown = isReached('string')
  const countShown = isReached('count')
  const total = choose(m + n, n)
  const dur = reduced ? '0ms' : '420ms'
  const cell = 36
  const pad = 18
  const W = pad * 2 + m * cell
  const H = pad * 2 + n * cell
  const px = (i: number) => pad + i * cell
  const py = (j: number) => pad + (n - j) * cell

  let pi = 0
  let pj = 0
  const nodes: [number, number][] = [[0, 0]]
  for (const mv of sample) {
    if (mv === 'R') pi++
    else pj++
    nodes.push([pi, pj])
  }
  const points = nodes.map(([i, j]) => `${px(i)},${py(j)}`).join(' ')

  return (
    <div className="space-y-3">
      <div
        className="flex justify-center rounded-2xl border-2 border-slate-200 bg-white px-3 py-4"
        style={{ opacity: gridShown ? 1 : 0, transition: `opacity ${dur} ease` }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[15rem]" role="img" aria-label="lattice grid">
          {Array.from({ length: n + 1 }).map((_, j) => (
            <line key={`h${j}`} x1={px(0)} y1={py(j)} x2={px(m)} y2={py(j)} stroke="#e2e8f0" strokeWidth="1.5" />
          ))}
          {Array.from({ length: m + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={px(i)} y1={py(0)} x2={px(i)} y2={py(n)} stroke="#e2e8f0" strokeWidth="1.5" />
          ))}
          <polyline
            points={points}
            fill="none"
            stroke="#2d5894"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ opacity: pathShown ? 1 : 0, transition: `opacity ${dur} ease` }}
          />
          <circle cx={px(0)} cy={py(0)} r="4" fill="#15803d" style={{ opacity: gridShown ? 1 : 0 }} />
          <circle cx={px(m)} cy={py(n)} r="4" fill="#e11d54" style={{ opacity: gridShown ? 1 : 0 }} />
        </svg>
      </div>

      {stringShown && (
        <div className="flex flex-wrap justify-center gap-1">
          {sample.map((mv, i) => (
            <span
              key={i}
              className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                mv === 'R' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {mv}
            </span>
          ))}
          <span className="ml-1 self-center text-xs text-slate-500">
            {m} R’s, {n} U’s
          </span>
        </div>
      )}

      {countShown && (
        <div className="text-center">
          <Tex className="text-slate-600">{`\\text{arrange } ${m}\\text{ R's} + ${n}\\text{ U's: choose which }${n}\\text{ are U}`}</Tex>
        </div>
      )}

      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          <Tex display className="text-brand-800">
            {`\\binom{${m}+${n}}{${n}} = \\binom{${m + n}}{${n}} = ${total}`}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">paths = …</p>
        )}
      </div>
    </div>
  )
}

function StarsBars({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['starsBars']> } & KindProps) {
  const { n, k, groups } = data
  const starsShown = isReached('stars')
  const barsShown = isReached('bars')
  const solutionShown = isReached('solution')
  const countShown = isReached('count')
  const total = choose(n + k - 1, k - 1)
  const dur = reduced ? '0ms' : '300ms'

  const seq: ('star' | 'bar')[] = []
  groups.forEach((g, gi) => {
    for (let s = 0; s < g; s++) seq.push('star')
    if (gi < groups.length - 1) seq.push('bar')
  })

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white px-3 py-5"
        style={{ opacity: starsShown ? 1 : 0, transition: `opacity ${dur} ease` }}
      >
        {seq.map((sym, i) =>
          sym === 'star' ? (
            <span key={i} className="text-2xl text-amber-500">
              ★
            </span>
          ) : (
            <span
              key={i}
              className="px-0.5 text-2xl font-bold text-brand-600"
              style={{ opacity: barsShown ? 1 : 0, transition: `opacity ${dur} ease` }}
            >
              |
            </span>
          ),
        )}
      </div>
      {solutionShown && (
        <div className="text-center">
          <Tex className="text-slate-700">{`(${groups.join(',\\,')}) \\;\\Rightarrow\\; ${groups.join(' + ')} = ${n}`}</Tex>
        </div>
      )}
      {countShown && (
        <div className="text-center">
          <Tex className="text-slate-600">{`${n}\\text{ stars} + ${k - 1}\\text{ bars} = ${n + k - 1}\\text{ positions; pick }${k - 1}\\text{ for bars}`}</Tex>
        </div>
      )}
      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          <Tex display className="text-brand-800">
            {`\\binom{${n}+${k}-1}{${k}-1} = \\binom{${n + k - 1}}{${k - 1}} = ${total}`}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">C(n+k−1, k−1) = …</p>
        )}
      </div>
    </div>
  )
}

function Steps({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['steps']> } & KindProps) {
  const dur = reduced ? '0ms' : '320ms'
  return (
    <div className="space-y-2">
      {data.lines.map((line, i) => {
        const shown = isReached(`step-${i}`)
        const active = isActive(`step-${i}`)
        return (
          <div
            key={i}
            className={`rounded-xl border-2 px-4 py-3 transition-all ${
              shown
                ? active && !reduced
                  ? 'border-brand-300 bg-brand-50 ring-2 ring-brand-200'
                  : 'border-slate-200 bg-white'
                : 'border-dashed border-slate-200 bg-slate-50'
            }`}
            style={{ opacity: shown ? 1 : 0.5, transition: `all ${dur} ease` }}
          >
            {shown ? (
              <>
                <Tex display className="text-brand-800">
                  {line.latex}
                </Tex>
                {line.caption && (
                  <p className="mt-1 text-center text-xs font-semibold text-slate-500">{line.caption}</p>
                )}
              </>
            ) : (
              <p className="text-center font-mono text-sm text-slate-300">· · ·</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Slots({ items, isReached, isActive, animReached, reduced }: { items: ArrangementItem[] } & KindProps) {
  const factors = items.map((_, k) => items.length - k)
  const product = factors.reduce((a, b) => a * b, 1)
  const revealed = factors.filter((_, k) => isReached(`slot-${k}`))
  const showProduct = isReached('product')
  const shown = isReached('pool')
  const order = animReached('shuffle') ? rotate(items) : items
  const step = 64
  const dur = reduced ? '0ms' : '420ms'
  const latex = revealed.length
    ? `${timesLatex(revealed)}${showProduct ? ` = ${product}` : revealed.length < factors.length ? ' \\times \\dots' : ''}`
    : ''

  return (
    <div className="space-y-5">
      <div className="relative mx-auto h-20" style={{ width: `${items.length * step}px` }}>
        {items.map((it) => {
          const vis = order.indexOf(it)
          return (
            <div
              key={it.id}
              className="absolute top-0 flex h-16 w-14 items-center justify-center rounded-2xl border-2 border-brand-200 bg-white shadow-soft"
              style={{
                transform: `translateX(${vis * step}px) scale(${shown ? 1 : 0.5})`,
                opacity: shown ? 1 : 0,
                transition: `transform ${dur} cubic-bezier(0.22,1,0.36,1), opacity ${dur} ease`,
                transitionDelay: shown && !reduced ? `${vis * 70}ms` : '0ms',
              }}
            >
              <span className="text-2xl sm:text-3xl">{it.emoji}</span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-nowrap items-end justify-center gap-2 overflow-x-auto px-1 pb-1">
        {factors.map((n, k) => {
          const rev = isReached(`slot-${k}`)
          const active = isActive(`slot-${k}`)
          return (
            <div key={k} className="flex shrink-0 items-end gap-2">
              {k > 0 && <span className="pb-6 text-xl font-bold text-slate-300">×</span>}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Slot {k + 1}</span>
                <div
                  className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 text-lg font-bold transition-all sm:h-20 sm:w-20 ${
                    rev ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-slate-50 text-slate-300'
                  } ${active && !reduced ? 'scale-105 ring-4 ring-brand-200' : ''}`}
                >
                  <span key={rev ? 'n' : 'q'} className={rev && !reduced ? 'cmi-pop' : ''}>
                    {rev ? n : '?'}
                  </span>
                  {rev && (
                    <span className="mt-0.5 text-[10px] font-normal text-slate-500">choice{n !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {latex && (
        <div className={`${RESULT_BOX} ${isActive('product') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
          <Tex display className="text-brand-800">{latex}</Tex>
        </div>
      )}
    </div>
  )
}

/**
 * One shirt/sock/etc. node in the connections diagram. Uses the colored SVG icon
 * (so each item reads as its own distinct color) and falls back to the plain emoji
 * glyph for anything without a custom icon.
 */
function connectionNode(
  item: { id: string; label?: string; emoji?: string; color?: string },
  x: number,
  y: number,
  shown: boolean,
  dur: string,
) {
  const opacityStyle = { opacity: shown ? 1 : 0.12, transition: `opacity ${dur} ease` }
  if (hasEventIcon(item.emoji)) {
    const size = 24
    return (
      <foreignObject
        key={item.id}
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        style={{ ...opacityStyle, overflow: 'visible' }}
      >
        <EventIcon
          emoji={item.emoji}
          label={item.label}
          color={item.color}
          className="h-6 w-6 drop-shadow-sm"
        />
      </foreignObject>
    )
  }
  return (
    <text key={item.id} x={x} y={y + 6} textAnchor="middle" fontSize={17} style={opacityStyle}>
      {item.emoji ?? '•'}
    </text>
  )
}

function Connections({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['connections']> } & KindProps) {
  const total = data.left.length * data.right.length
  const rows = Math.max(data.left.length, data.right.length)
  const rowH = 30
  const top = 18
  const height = top + rows * rowH
  const width = 240
  const leftX = 36
  const rightX = width - 36
  const yOf = (i: number, count: number) => top + ((i + 0.5) / count) * (rows * rowH)
  const linesShown = isReached('product') || isReached('lines')
  const dur = reduced ? '0ms' : '520ms'

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto w-full max-w-xs" role="img" aria-label="connections">
        <text x={leftX} y={10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#94a3b8">
          {data.leftLabel.toUpperCase()}
        </text>
        <text x={rightX} y={10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#94a3b8">
          {data.rightLabel.toUpperCase()}
        </text>
        {data.left.map((l, i) =>
          data.right.map((r, j) => {
            const idx = i * data.right.length + j
            return (
              <line
                key={`${l.id}-${r.id}`}
                x1={leftX}
                y1={yOf(i, data.left.length)}
                x2={rightX}
                y2={yOf(j, data.right.length)}
                stroke="#84a3cb"
                strokeWidth={1.5}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={linesShown ? 0 : 1}
                style={{ transition: `stroke-dashoffset ${dur} ease`, transitionDelay: linesShown && !reduced ? `${idx * 35}ms` : '0ms' }}
              />
            )
          }),
        )}
        {data.left.map((l, i) =>
          connectionNode(l, leftX, yOf(i, data.left.length), isReached('left'), dur),
        )}
        {data.right.map((r, j) =>
          connectionNode(r, rightX, yOf(j, data.right.length), isReached('right'), dur),
        )}
      </svg>
      <div className={`${RESULT_BOX} ${isActive('product') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('product') ? (
          <>
            <Tex display className="text-brand-800">
              {`${data.left.length} \\times ${data.right.length} = ${total}`}
            </Tex>
            {data.pairingLabel ? (
              <span className="ml-1 text-sm text-brand-700">{data.pairingLabel}s</span>
            ) : null}
          </>
        ) : (
          <p className="font-mono text-sm text-slate-300">…</p>
        )}
      </div>
    </div>
  )
}

function Group({
  data,
  isReached,
  isActive,
  animReached,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['group']> } & KindProps) {
  const chips = data.chips
  const total = chips.length
  const counts = new Map<string, number>()
  for (const c of chips) counts.set(c.kind, (counts.get(c.kind) ?? 0) + 1)
  const sizes = [...counts.values()]
  const denom = sizes.reduce((a, b) => a * factorial(b), 1)
  const result = factorial(total) / denom
  const denomLatex = sizes.map((k) => `${k}!`).join(' \\cdot ')
  const condensed = animReached('condense')
  const shown = isReached('items')
  const dur = reduced ? '0ms' : '360ms'
  const seen = new Map<string, number>()

  return (
    <div className="space-y-3">
      <div
        className={`flex flex-wrap items-center justify-center gap-2 rounded-2xl border-2 px-3 py-4 transition-all ${
          (isActive('items') || isActive('repeats')) && !reduced
            ? 'border-brand-300 ring-2 ring-brand-200'
            : 'border-slate-200'
        } bg-white`}
      >
        {chips.map((c) => {
          const within = seen.get(c.kind) ?? 0
          seen.set(c.kind, within + 1)
          const overlap = condensed && within > 0
          return (
            <span
              key={c.id}
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-soft"
              style={{
                backgroundColor: c.color,
                opacity: shown ? 1 : 0,
                marginLeft: overlap ? '-1.4rem' : undefined,
                transform: `scale(${shown ? 1 : 0.5})`,
                transition: `opacity ${dur} ease, transform ${dur} ease, margin ${dur} ease`,
              }}
            >
              {c.label.charAt(0)}
            </span>
          )
        })}
      </div>
      <div className={`${RESULT_BOX} ${isActive('product') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('product') ? (
          <Tex display className="text-brand-800">
            {`${fractionLatex(`${total}!`, denomLatex)} = ${result}`}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">…</p>
        )}
      </div>
    </div>
  )
}

function TreePanel({
  label,
  list,
  shown,
  dim,
  reduced,
}: {
  label: string
  list: string[]
  shown: boolean
  dim: boolean
  reduced: boolean
}) {
  const dur = reduced ? '0ms' : '360ms'
  return (
    <div
      className={`flex-1 rounded-2xl border-2 px-3 py-3 transition-all ${
        shown ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white'
      }`}
      style={{ opacity: dim ? 0.4 : 1, transition: `opacity ${dur} ease` }}
    >
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label} ({list.length})
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {list.map((s, i) => (
          <span
            key={i}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-bold text-slate-600"
            style={{
              opacity: shown ? 1 : 0,
              transform: shown ? 'scale(1)' : 'scale(0.7)',
              transition: `opacity ${dur} ease, transform ${dur} ease`,
              transitionDelay: shown && !reduced ? `${i * 40}ms` : '0ms',
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

function Tree({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['tree']> } & KindProps) {
  const orderedShown = isReached('ordered')
  const groupedShown = isReached('grouped')
  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-2">
        <TreePanel
          label={data.orderedLabel ?? 'Order matters'}
          list={data.ordered}
          shown={orderedShown}
          dim={groupedShown}
          reduced={reduced}
        />
        <TreePanel
          label={data.groupedLabel ?? 'Just a group'}
          list={data.grouped}
          shown={groupedShown}
          dim={false}
          reduced={reduced}
        />
      </div>
      <div className={`${RESULT_BOX} ${isActive('product') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('product') ? (
          <Tex display className="text-brand-800">
            {`${fractionLatex(String(data.ordered.length), String(data.divideBy))} = ${data.grouped.length}`}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">…</p>
        )}
      </div>
    </div>
  )
}

function Distribution({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['distribution']> } & KindProps) {
  const max = Math.max(...data.bars.map((b) => b.value), 1)
  const barsShown = isReached('bars')
  const dur = reduced ? '0ms' : '520ms'
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 pb-2 pt-3" style={{ height: '7rem' }}>
        {data.bars.map((b, i) => {
          const lit = isActive(`bar-${i}`) || isActive('bars')
          const h = barsShown ? Math.max(8, (b.value / max) * 80) : 0
          return (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className={`w-full rounded-t-md ${lit ? 'bg-brand-500' : 'bg-brand-300'}`}
                style={{ height: `${h}px`, transition: `height ${dur} cubic-bezier(0.22,1,0.36,1) ${i * 60}ms, background-color 0.2s` }}
              />
              <span
                className="text-[10px] font-medium text-slate-500"
                style={{ opacity: barsShown ? 1 : 0, transition: `opacity ${dur} ease` }}
              >
                {b.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          data.latex ? (
            <Tex display className="text-brand-800">{data.latex}</Tex>
          ) : (
            <p className="font-mono text-sm font-bold text-brand-800">{data.caption}</p>
          )
        ) : (
          <p className="font-mono text-sm text-slate-300">…</p>
        )}
      </div>
    </div>
  )
}

function DrawCard({
  label,
  latex,
  shown,
  active,
  reduced,
}: {
  label: string
  latex: string
  shown: boolean
  active: boolean
  reduced: boolean
}) {
  return (
    <div
      className={`rounded-2xl border-2 px-3 py-3 text-center transition-all ${
        active && !reduced
          ? 'border-brand-300 ring-2 ring-brand-200'
          : shown
            ? 'border-brand-200 bg-brand-50'
            : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-brand-800">{shown ? <Tex>{latex}</Tex> : <span className="text-slate-300">?</span>}</div>
    </div>
  )
}

function Draw({ data, isReached, isActive, reduced }: { data: NonNullable<WorkedExampleConfig['draw']> } & KindProps) {
  const { red, blue } = data
  const total = red + blue
  const f1 = { n: red, d: total }
  const f2 = { n: red - 1, d: total - 1 }
  const p = drawSameProb(red, total, 2)
  const drawn = (isReached('draw1') ? 1 : 0) + (isReached('draw2') ? 1 : 0)
  const shown = isReached('jar')
  const dur = reduced ? '0ms' : '380ms'
  const marbles = [
    ...Array.from({ length: red }, (_, i) => ({ id: `r${i}`, color: '#ef4444', drawIdx: i })),
    ...Array.from({ length: blue }, (_, i) => ({ id: `b${i}`, color: '#3b82f6', drawIdx: -1 })),
  ]

  return (
    <div className="space-y-3">
      <div className="mx-auto flex max-w-xs flex-wrap items-center justify-center gap-2 rounded-3xl border-2 border-slate-200 bg-white px-4 py-5">
        {marbles.map((m, i) => {
          const isDrawn = m.drawIdx >= 0 && m.drawIdx < drawn
          return (
            <span
              key={m.id}
              className="h-7 w-7 rounded-full shadow-soft"
              style={{
                backgroundColor: m.color,
                opacity: shown ? (isDrawn ? 0.25 : 1) : 0,
                transform: `scale(${shown ? 1 : 0.5})`,
                boxShadow: isDrawn ? '0 0 0 2px var(--color-brand-400)' : undefined,
                transition: `all ${dur} ease`,
                transitionDelay: shown && !reduced ? `${i * 45}ms` : '0ms',
              }}
            />
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <DrawCard label="Draw 1" latex={fracLatex(f1)} shown={isReached('draw1')} active={isActive('draw1')} reduced={reduced} />
        <DrawCard label="Draw 2" latex={fracLatex(f2)} shown={isReached('draw2')} active={isActive('draw2')} reduced={reduced} />
      </div>
      <div className={`${RESULT_BOX} ${isActive('product') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('product') ? (
          <Tex display className="text-brand-800">{`P(\\text{both red}) = ${fracLatex(f1)} \\times ${fracLatex(f2)} = ${fracLatex(p)}`}</Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">P(both red) = …</p>
        )}
      </div>
    </div>
  )
}

function SampleSpace({
  data,
  isReached,
  isActive,
  animReached,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['sampleSpace']> } & KindProps) {
  if (data.mode === 'complement') {
    return (
      <SampleSpaceComplement
        data={data}
        isReached={isReached}
        isActive={isActive}
        animReached={animReached}
        reduced={reduced}
      />
    )
  }
  const given = new Set(data.givenIds ?? [])
  const fav = new Set(data.favorableIds ?? [])
  const shown = isReached('space')
  const restricted = isReached('given')
  const favShown = isReached('favorable')
  const nFav = (data.favorableIds ?? []).length
  const nGiven = (data.givenIds ?? []).length
  const p = reduceFrac(nFav, Math.max(1, nGiven))
  const alreadyReduced = p.n === nFav && p.d === nGiven
  const dur = reduced ? '0ms' : '340ms'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-4">
        {data.outcomes.map((o, i) => {
          const inGiven = given.has(o.id)
          const highlight = favShown && fav.has(o.id)
          const dim = restricted && !inGiven
          return (
            <span
              key={o.id}
              className={`flex h-12 min-w-12 flex-col items-center justify-center rounded-xl border-2 px-2 text-sm font-bold ${
                highlight
                  ? 'border-success-500 bg-success-50 text-success-700'
                  : restricted && inGiven
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-600'
              }`}
              style={{
                opacity: shown ? (dim ? 0.18 : 1) : 0,
                transform: `scale(${shown ? 1 : 0.6})`,
                transition: `all ${dur} ease`,
                transitionDelay: shown && !reduced ? `${i * 45}ms` : '0ms',
              }}
            >
              {o.emoji && <span className="text-lg leading-none">{o.emoji}</span>}
              <span className={o.emoji ? 'text-[11px]' : ''}>{o.label}</span>
            </span>
          )
        })}
      </div>
      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          <Tex display className="text-brand-800">
            {`P(A \\mid B) = ${fractionLatex(String(nFav), String(nGiven))}${alreadyReduced ? '' : ` = ${fracLatex(p)}`}`}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">P(A | B) = …</p>
        )}
      </div>
    </div>
  )
}

function SampleSpaceComplement({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['sampleSpace']> } & KindProps) {
  const comp = new Set(data.complementIds ?? [])
  const shown = isReached('space')
  const targetShown = isReached('target')
  const compShown = isReached('complement')
  const total = data.outcomes.length
  const nComp = (data.complementIds ?? []).length
  const p = complement({ n: nComp, d: Math.max(1, total) })
  const event = data.eventLabel ?? 'A'
  const big = data.outcomes.length > 16
  const dur = reduced ? '0ms' : '300ms'
  const gridStyle = data.columns
    ? { display: 'grid', gridTemplateColumns: `repeat(${data.columns}, minmax(0, 1fr))` }
    : undefined

  return (
    <div className="space-y-3">
      <div
        className={`rounded-2xl border-2 border-slate-200 bg-white px-3 py-4 ${
          gridStyle ? 'gap-1.5' : 'flex flex-wrap items-center justify-center gap-1.5'
        }`}
        style={gridStyle}
      >
        {data.outcomes.map((o, i) => {
          const isComp = comp.has(o.id)
          const shadeComp = compShown && isComp
          const outlineTarget = targetShown && !isComp
          return (
            <span
              key={o.id}
              className={`flex flex-col items-center justify-center rounded-lg border-2 font-bold ${
                big ? 'h-9 min-w-9 px-1 text-[11px]' : 'h-12 min-w-12 px-2 text-sm'
              } ${
                shadeComp
                  ? 'border-amber-400 bg-amber-100 text-amber-800'
                  : outlineTarget
                    ? 'border-success-500 bg-success-50 text-success-700'
                    : 'border-slate-200 bg-white text-slate-500'
              }`}
              style={{
                opacity: shown ? 1 : 0,
                transform: `scale(${shown ? 1 : 0.6})`,
                transition: `all ${dur} ease`,
                transitionDelay: shown && !reduced ? `${i * 18}ms` : '0ms',
              }}
            >
              {o.emoji && <span className="leading-none">{o.emoji}</span>}
              <span>{o.label}</span>
            </span>
          )
        })}
      </div>
      {(targetShown || compShown) && (
        <div className="flex justify-center gap-4 text-xs font-semibold">
          <span className="text-success-700">
            {event}: {total - nComp} outcomes
          </span>
          <span className={compShown ? 'text-amber-700' : 'text-slate-300'}>
            not {event}: {nComp} {nComp === 1 ? 'outcome' : 'outcomes'}
          </span>
        </div>
      )}
      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          <Tex display className="text-brand-800">
            {`P(\\text{${event}}) = 1 - ${fractionLatex(String(nComp), String(total))} = ${fracLatex(p)}`}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">P = 1 − …</p>
        )}
      </div>
    </div>
  )
}

function Venn({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['venn']> } & KindProps) {
  const dur = reduced ? '0ms' : '420ms'
  const fade = (visible: boolean) => ({ opacity: visible ? 1 : 0, transition: `opacity ${dur} ease` })

  if (data.mode === 'complement') {
    const showA = isReached('a')
    const showComplement = isReached('complement')
    return (
      <div className="space-y-3">
        <svg viewBox="0 0 240 150" className="mx-auto w-full max-w-xs" role="img" aria-label="complement Venn diagram">
          <defs>
            <mask id="venn-comp-mask">
              <rect x="2" y="2" width="236" height="146" rx="14" fill="white" />
              <circle cx="120" cy="78" r="54" fill="black" />
            </mask>
          </defs>
          <rect x="2" y="2" width="236" height="146" rx="14" fill="#f8fafc" stroke="#e2e8f0" />
          <rect
            x="2"
            y="2"
            width="236"
            height="146"
            rx="14"
            fill="#f59e0b"
            fillOpacity="0.35"
            mask="url(#venn-comp-mask)"
            style={fade(showComplement)}
          />
          <circle cx="120" cy="78" r="54" fill="#15803d" fillOpacity="0.18" stroke="#15803d" strokeWidth="2" style={fade(showA)} />
          <text x="120" y="83" textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534" style={fade(showA)}>
            {data.aLabel}
          </text>
          <text x="44" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#b45309" style={fade(showComplement)}>
            not {data.aLabel}
          </text>
        </svg>
        <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
          {isReached('result') ? (
            <Tex display className="text-brand-800">
              {data.resultLatex ?? 'P(A) = 1 - P(\\text{not } A)'}
            </Tex>
          ) : (
            <p className="font-mono text-sm text-slate-300">P(A) = 1 − …</p>
          )}
        </div>
      </div>
    )
  }

  if (data.mode === 'pie') {
    const a = data.a ?? 0
    const b = data.b ?? 0
    const both = data.both ?? 0
    const sum = a + b
    const union = a + b - both
    const showA = isReached('a')
    const showB = isReached('b')
    const doubled = isReached('double')
    const subtracted = isReached('subtract')
    const showResult = isReached('result')
    const lensAmber = doubled && !subtracted
    const lensGreen = subtracted || showResult
    const counter = lensGreen ? union : doubled ? sum : null
    return (
      <div className="space-y-3">
        <svg viewBox="0 0 240 150" className="mx-auto w-full max-w-xs" role="img" aria-label="inclusion-exclusion Venn diagram">
          <defs>
            <clipPath id="venn-pie-clip">
              <circle cx="150" cy="80" r="56" />
            </clipPath>
          </defs>
          <rect x="2" y="2" width="236" height="146" rx="14" fill="#f8fafc" stroke="#e2e8f0" />
          <circle cx="90" cy="80" r="56" fill="#e11d5422" stroke="#e11d54" strokeWidth="2" style={fade(showA)} />
          <circle cx="150" cy="80" r="56" fill="#2d589422" stroke="#2d5894" strokeWidth="2" style={fade(showB)} />
          <circle
            cx="90"
            cy="80"
            r="56"
            clipPath="url(#venn-pie-clip)"
            fill={lensGreen ? '#15803d' : '#f59e0b'}
            fillOpacity={lensAmber || lensGreen ? 0.55 : 0}
            style={{ transition: `fill ${dur} ease, fill-opacity ${dur} ease` }}
          />
          <text x="56" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill="#be123c" style={fade(showA)}>
            {data.aLabel}
          </text>
          <text x="184" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e3f6f" style={fade(showB)}>
            {data.bLabel}
          </text>
          <text x="62" y="90" textAnchor="middle" fontSize="16" fontWeight="700" fill="#be123c" style={fade(showA)}>
            {a - both}
          </text>
          <text x="178" y="90" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e3f6f" style={fade(showB)}>
            {b - both}
          </text>
          <text x="120" y="90" textAnchor="middle" fontSize="16" fontWeight="700" fill="#78350f" style={fade(doubled)}>
            {both}
          </text>
        </svg>

        <div className="flex items-center justify-center gap-3 rounded-2xl border-2 border-brand-100 bg-white/70 px-4 py-2">
          <span
            className={`text-3xl font-bold ${lensGreen ? 'text-success-700' : lensAmber ? 'text-amber-600' : 'text-slate-300'}`}
          >
            {counter ?? '—'}
          </span>
          <span className="text-[11px] text-slate-500">
            {lensGreen ? 'union (each region once)' : lensAmber ? 'overlap counted twice!' : 'running total'}
          </span>
        </div>

        <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
          {showResult ? (
            <Tex display className="text-brand-800">
              {`|A \\cup B| = ${a} + ${b} - ${both} = ${union}`}
            </Tex>
          ) : subtracted ? (
            <Tex className="text-slate-700">{`${a} + ${b} - ${both} = ${union}`}</Tex>
          ) : doubled ? (
            <Tex className="text-slate-700">{`|A| + |B| = ${a} + ${b} = ${sum}`}</Tex>
          ) : (
            <p className="font-mono text-sm text-slate-300">|A ∪ B| = …</p>
          )}
        </div>
      </div>
    )
  }

  const showA = isReached('a')
  const showB = isReached('b')
  const showOverlap = isReached('overlap') || isReached('given')

  return (
    <div className="space-y-3">
      <svg viewBox="0 0 240 150" className="mx-auto w-full max-w-xs" role="img" aria-label="conditioning Venn diagram">
        <defs>
          <clipPath id="venn-given-clip">
            <circle cx="150" cy="78" r="56" />
          </clipPath>
        </defs>
        <rect x="2" y="2" width="236" height="146" rx="14" fill="#f8fafc" stroke="#e2e8f0" />
        <circle cx="90" cy="78" r="56" fill="#e11d5422" stroke="#e11d54" strokeWidth="2" style={fade(showA)} />
        <circle cx="150" cy="78" r="56" fill="#2d589422" stroke="#2d5894" strokeWidth="2" style={fade(showB)} />
        <circle cx="90" cy="78" r="56" fill="#15803d55" clipPath="url(#venn-given-clip)" style={fade(showOverlap)} />
        <text x="60" y="82" textAnchor="middle" fontSize="14" fontWeight="700" fill="#be123c" style={fade(showA)}>
          {data.aLabel}
        </text>
        <text x="182" y="82" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e3f6f" style={fade(showB)}>
          {data.bLabel}
        </text>
      </svg>
      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          <Tex display className="text-brand-800">
            {data.resultLatex ?? 'P(A \\mid B) = \\dfrac{\\text{area}(A \\cap B)}{\\text{area}(B)}'}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">P(A | B) = …</p>
        )}
      </div>
    </div>
  )
}

function CoinsSum({
  data,
  isReached,
  isActive,
  animReached,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['coinsSum']> } & KindProps) {
  if (data.mode === 'indicator') {
    return (
      <CoinsSumIndicator
        data={data}
        isReached={isReached}
        isActive={isActive}
        animReached={animReached}
        reduced={reduced}
      />
    )
  }
  const coins = data.coins
  const shown = isReached('coins')
  const contribShown = isReached('contributions')
  const expected = coins / 2
  const expectedLatex = Number.isInteger(expected) ? String(expected) : fracLatex(reduceFrac(coins, 2))
  const dur = reduced ? '0ms' : '280ms'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-4">
        {Array.from({ length: coins }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1"
            style={{
              opacity: shown ? 1 : 0,
              transform: `scale(${shown ? 1 : 0.6})`,
              transition: `all ${dur} ease`,
              transitionDelay: shown && !reduced ? `${i * 40}ms` : '0ms',
            }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-100 text-base font-bold text-amber-700 shadow-inner">
              🪙
            </span>
            <span
              className="text-xs font-bold text-brand-600"
              style={{
                opacity: contribShown ? 1 : 0,
                transition: `opacity ${dur} ease`,
                transitionDelay: contribShown && !reduced ? `${i * 40}ms` : '0ms',
              }}
            >
              +½
            </span>
          </div>
        ))}
      </div>
      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          <Tex display className="text-brand-800">
            {`E[\\text{heads}] = ${coins} \\times \\tfrac12 = ${expectedLatex}`}
          </Tex>
        ) : contribShown ? (
          <p className="font-mono text-sm text-slate-400">½ + ½ + … = ?</p>
        ) : (
          <p className="font-mono text-sm text-slate-300">E[heads] = …</p>
        )}
      </div>
    </div>
  )
}

function CoinsSumIndicator({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['coinsSum']> } & KindProps) {
  const coins = data.coins
  const values = data.values ?? Array.from({ length: coins }, () => 0)
  const shown = isReached('coins')
  const marksShown = isReached('marks')
  const total = values.reduce((a, b) => a + b, 0)
  const expected = coins / 2
  const expectedLatex = Number.isInteger(expected) ? String(expected) : fracLatex(reduceFrac(coins, 2))
  const dur = reduced ? '0ms' : '260ms'

  return (
    <div className="space-y-3">
      {shown && (
        <p className="text-center text-xs font-medium text-slate-500">
          Each coin is an indicator Xᵢ = 1 if heads, else 0
        </p>
      )}
      <div className="flex flex-wrap items-end justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-4">
        {values.map((v, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1"
            style={{
              opacity: shown ? 1 : 0,
              transform: `scale(${shown ? 1 : 0.6})`,
              transition: `all ${dur} ease`,
              transitionDelay: shown && !reduced ? `${i * 35}ms` : '0ms',
            }}
          >
            <span className="text-[10px] font-bold text-slate-400">
              X<sub>{i + 1}</sub>
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-100 text-sm shadow-inner">
              🪙
            </span>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-xs font-bold ${
                v === 1
                  ? 'border-success-500 bg-success-50 text-success-700'
                  : 'border-slate-300 bg-slate-50 text-slate-400'
              }`}
              style={{
                opacity: marksShown ? 1 : 0,
                transform: `scale(${marksShown ? 1 : 0.4})`,
                transition: `all ${dur} ease`,
                transitionDelay: marksShown && !reduced ? `${i * 35}ms` : '0ms',
              }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-slate-50 px-4 py-2 text-center">
        {marksShown ? (
          <Tex className="text-slate-700">{`\\sum X_i = ${values.join(' + ')} = ${total}`}</Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">ΣXᵢ = …</p>
        )}
      </div>
      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          <Tex display className="text-brand-800">
            {`E[X_i] = \\tfrac12 \\;\\Rightarrow\\; E\\!\\left[\\sum X_i\\right] = ${coins} \\times \\tfrac12 = ${expectedLatex}`}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">E[ΣXᵢ] = …</p>
        )}
      </div>
    </div>
  )
}

function Disjoint({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['disjoint']> } & KindProps) {
  const fav = new Set(data.faces)
  const shown = isReached('faces')
  const lit = isReached('highlight')
  const m = data.faces.length
  const p = reduceFrac(m, data.sides)
  const reducedDiffers = !(p.n === m && p.d === data.sides)
  const sumLatex = data.faces.map(() => `\\tfrac{1}{${data.sides}}`).join(' + ')
  const dur = reduced ? '0ms' : '300ms'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-4">
        {Array.from({ length: data.sides }).map((_, i) => {
          const face = i + 1
          const highlight = lit && fav.has(face)
          return (
            <span
              key={face}
              className={`rounded-xl border-2 p-1 transition-all ${
                highlight ? 'border-success-500 bg-success-50' : 'border-slate-200 bg-white'
              }`}
              style={{
                opacity: shown ? 1 : 0,
                transform: `scale(${shown ? 1 : 0.6})`,
                transition: `all ${dur} ease`,
                transitionDelay: shown && !reduced ? `${i * 55}ms` : '0ms',
              }}
            >
              <DieIcon value={face} className="h-10 w-10" />
            </span>
          )
        })}
      </div>
      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          <Tex display className="text-brand-800">
            {`P = ${sumLatex} = ${fractionLatex(String(m), String(data.sides))}${reducedDiffers ? ` = ${fracLatex(p)}` : ''}`}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">P = …</p>
        )}
      </div>
    </div>
  )
}

function kSubsetRows(n: number, k: number): number[][] {
  const rows: number[][] = []
  for (let mask = 0; mask < 1 << n; mask++) {
    let bits = 0
    for (let i = 0; i < n; i++) if (mask & (1 << i)) bits++
    if (bits !== k) continue
    rows.push(Array.from({ length: n }, (_, i) => ((mask >> i) & 1 ? 1 : 0)))
  }
  return rows
}

function CoinTile({ head }: { head: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
        head ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white text-slate-400'
      }`}
    >
      {head ? 'H' : 'T'}
    </span>
  )
}

function MiniCoin({ head }: { head: boolean }) {
  return (
    <span
      className={`h-3.5 w-3.5 rounded-full border ${
        head ? 'border-brand-500 bg-brand-500' : 'border-slate-300 bg-white'
      }`}
      aria-hidden
    />
  )
}

function Binomial({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['binomial']> } & KindProps) {
  const { n, k, p, sequence } = data
  const q = { n: p.d - p.n, d: p.d }
  const perSeq = multiplyFracs([...Array(k).fill(p), ...Array(n - k).fill(q)])
  const ways = choose(n, k)
  const total = binomialProb(n, k, p)
  const seqShown = isReached('sequence')
  const waysShown = isReached('ways')
  const addShown = isReached('add')
  const arrangements = kSubsetRows(n, k)
  const dur = reduced ? '0ms' : '300ms'
  const pq = `\\left(${fracLatex(p)}\\right)^{${k}}\\left(${fracLatex(q)}\\right)^{${n - k}}`

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border-2 border-slate-200 bg-white px-3 py-3"
        style={{ opacity: seqShown ? 1 : 0, transition: `opacity ${dur} ease` }}
      >
        <p className="mb-2 text-center text-[11px] font-medium text-slate-400">one specific sequence</p>
        <div className="flex justify-center gap-1.5">
          {sequence.map((h, i) => (
            <CoinTile key={i} head={h === 1} />
          ))}
        </div>
        {seqShown && (
          <div className="mt-2 text-center">
            <Tex className="text-slate-700">{`P = ${pq} = ${fracLatex(perSeq)}`}</Tex>
          </div>
        )}
      </div>

      {waysShown && (
        <div className="rounded-2xl border-2 border-brand-100 bg-white px-3 py-3">
          <p className="mb-2 text-center text-[11px] font-medium text-slate-400">
            ways to place {k} heads in {n} slots
          </p>
          <div className="mx-auto grid max-w-md grid-cols-2 gap-1.5 sm:grid-cols-5">
            {arrangements.map((row, ri) => (
              <div
                key={ri}
                className="flex justify-center gap-0.5 rounded-lg border border-slate-100 bg-slate-50/60 p-1.5"
                style={{
                  opacity: 1,
                  transition: `all ${dur} ease`,
                  transitionDelay: !reduced ? `${ri * 45}ms` : '0ms',
                }}
              >
                {row.map((h, ci) => (
                  <MiniCoin key={ci} head={h === 1} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Tex className="text-brand-700">{`\\binom{${n}}{${k}} = ${ways}`}</Tex>
            {addShown && (
              <span className="text-xs text-slate-500">
                each worth <Tex className="text-slate-600">{fracLatex(perSeq)}</Tex>
              </span>
            )}
          </div>
        </div>
      )}

      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          <Tex display className="text-brand-800">
            {`P(\\text{${k} heads}) = \\binom{${n}}{${k}}${pq} = ${ways}\\cdot ${fracLatex(perSeq)} = ${fracLatex(total)}`}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">P(exactly {k} heads) = …</p>
        )}
      </div>
    </div>
  )
}

function termLatex(aExp: number, bExp: number): string {
  const a = aExp === 0 ? '' : aExp === 1 ? 'a' : `a^{${aExp}}`
  const b = bExp === 0 ? '' : bExp === 1 ? 'b' : `b^{${bExp}}`
  return `${a}${b}` || '1'
}

function Expand({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['expand']> } & KindProps) {
  const n = data.n
  const factorsShown = isReached('factors')
  const productsShown = isReached('products')
  const groupShown = isReached('group')
  const dur = reduced ? '0ms' : '300ms'

  const groups: { aCount: number; products: string[][] }[] = []
  for (let aCount = n; aCount >= 0; aCount--) groups.push({ aCount, products: [] })
  for (let mask = 0; mask < 1 << n; mask++) {
    const letters = Array.from({ length: n }, (_, i) => ((mask >> i) & 1 ? 'b' : 'a'))
    const aCount = letters.filter((c) => c === 'a').length
    groups[n - aCount].products.push(letters)
  }

  const resultLatex =
    `(a+b)^{${n}} = ` +
    groups
      .map((g) => {
        const c = choose(n, g.aCount)
        const coeff = c === 1 ? '' : `${c}`
        return `${coeff}${termLatex(g.aCount, n - g.aCount)}`
      })
      .join(' + ')

  return (
    <div className="space-y-3">
      <div
        className="text-center"
        style={{ opacity: factorsShown ? 1 : 0, transition: `opacity ${dur} ease` }}
      >
        <Tex className="text-slate-700">{`(a+b)^{${n}} = \\underbrace{${'(a+b)'.repeat(n)}}_{${n}\\text{ factors}}`}</Tex>
      </div>

      {productsShown && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n + 1}, minmax(0, 1fr))` }}>
          {groups.map((g, gi) => (
            <div key={gi} className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/60 p-1.5">
              {g.products.map((letters, pi) => (
                <div key={pi} className="flex justify-center gap-0.5">
                  {letters.map((c, ci) => (
                    <span
                      key={ci}
                      className={`flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold ${
                        c === 'a' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ))}
              {groupShown && (
                <div className="border-t border-slate-200 pt-1 text-center">
                  <Tex className="text-slate-700">{termLatex(g.aCount, n - g.aCount)}</Tex>
                  <div className="text-[11px] font-bold text-brand-600">
                    {choose(n, g.aCount)} {choose(n, g.aCount) === 1 ? 'way' : 'ways'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {isReached('result') ? (
          <Tex display className="text-brand-800">
            {resultLatex}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">(a + b)^{n} = …</p>
        )}
      </div>
    </div>
  )
}

function Pascal({
  data,
  isReached,
  isActive,
  reduced,
}: { data: NonNullable<WorkedExampleConfig['pascal']> } & KindProps) {
  const R = data.rows
  const ruleRow = R
  const ruleCol = Math.max(1, Math.floor(R / 2))
  const ruleActive = isReached('rule')
  const resultActive = isReached('result')
  const dur = reduced ? '0ms' : '300ms'

  return (
    <div className="space-y-3">
      <div className="space-y-1 rounded-2xl border-2 border-slate-200 bg-white px-2 py-4">
        {Array.from({ length: R + 1 }).map((_, r) => {
          const shown = isReached(`row-${r}`)
          return (
            <div
              key={r}
              className="flex justify-center gap-1"
              style={{ opacity: shown ? 1 : 0, transition: `opacity ${dur} ease` }}
            >
              {Array.from({ length: r + 1 }).map((_, c) => {
                const isResult = resultActive && r === R
                const isSum = ruleActive && r === ruleRow && c === ruleCol
                const isParent = ruleActive && r === ruleRow - 1 && (c === ruleCol - 1 || c === ruleCol)
                const cls = isResult
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : isSum
                    ? 'border-success-500 bg-success-50 text-success-700'
                    : isParent
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-500'
                return (
                  <span
                    key={c}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg border-2 px-1 text-sm font-bold ${cls}`}
                  >
                    {choose(r, c)}
                  </span>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className={`${RESULT_BOX} ${isActive('result') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        {resultActive ? (
          <Tex display className="text-brand-800">
            {`\\text{row } ${R}: \\ \\binom{${R}}{0}, \\binom{${R}}{1}, \\dots, \\binom{${R}}{${R}}`}
          </Tex>
        ) : ruleActive ? (
          <Tex display className="text-brand-800">
            {`\\binom{${ruleRow - 1}}{${ruleCol - 1}} + \\binom{${ruleRow - 1}}{${ruleCol}} = ${choose(ruleRow - 1, ruleCol - 1)} + ${choose(ruleRow - 1, ruleCol)} = ${choose(ruleRow, ruleCol)}`}
          </Tex>
        ) : (
          <p className="font-mono text-sm text-slate-300">Pascal’s triangle …</p>
        )}
      </div>
    </div>
  )
}
