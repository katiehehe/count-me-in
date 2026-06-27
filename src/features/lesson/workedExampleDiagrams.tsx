import { Math as Tex } from '../../components/Math'
import type { ArrangementItem, WorkedExampleConfig } from '../../content/types'
import { factorial } from '../../content/randomize'
import { complement, drawSameProb, fracLatex, reduceFrac } from '../../content/probabilityMath'
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
  if (config.items) return <Slots items={config.items} {...shared} />
  return null
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
        {data.left.map((l, i) => (
          <text
            key={l.id}
            x={leftX}
            y={yOf(i, data.left.length) + 6}
            textAnchor="middle"
            fontSize={17}
            style={{ opacity: isReached('left') ? 1 : 0.12, transition: `opacity ${dur} ease` }}
          >
            {l.emoji ?? '•'}
          </text>
        ))}
        {data.right.map((r, j) => (
          <text
            key={r.id}
            x={rightX}
            y={yOf(j, data.right.length) + 6}
            textAnchor="middle"
            fontSize={17}
            style={{ opacity: isReached('right') ? 1 : 0.12, transition: `opacity ${dur} ease` }}
          >
            {r.emoji ?? '•'}
          </text>
        ))}
      </svg>
      <div className={`${RESULT_BOX} ${isActive('product') && !reduced ? 'ring-2 ring-brand-300' : ''}`}>
        <Tex display className="text-brand-800">
          {`${data.left.length} \\times ${data.right.length}${isReached('product') ? ` = ${total}` : ''}`}
        </Tex>
        {isReached('product') && data.pairingLabel ? (
          <span className="ml-1 text-sm text-brand-700">{data.pairingLabel}s</span>
        ) : null}
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
        <Tex display className="text-brand-800">
          {`${fractionLatex(`${total}!`, denomLatex)}${isReached('product') ? ` = ${result}` : ''}`}
        </Tex>
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
        <Tex display className="text-brand-800">
          {`${fractionLatex(String(data.ordered.length), String(data.divideBy))}${
            isReached('product') ? ` = ${data.grouped.length}` : ''
          }`}
        </Tex>
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
              <span className="text-[10px] font-medium text-slate-500">{b.label}</span>
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
      <p className="text-center text-xs font-medium text-slate-500">
        Each coin is an indicator Xᵢ = 1 if heads, else 0
      </p>
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
