import { motion } from 'framer-motion'
import type { Task } from '../game/types'
import { Food } from './Food'

/** Store tal-"prikker" som på en terning – hjælper barnet med at se mængden. */
export function Dots({ n, color = '#3f8f4f' }: { n: number; color?: string }) {
  return (
    <div className="flex max-w-[6.5em] flex-wrap justify-center gap-[0.18em]" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="block h-[0.32em] w-[0.32em] rounded-full" style={{ background: color }} />
      ))}
    </div>
  )
}

const numStyle = 'font-bold leading-none tabular-nums text-ink'

/** Viser opgavens mål visuelt: madikon + stort tal (+ prikker på trin 1). */
export function TargetCard({ task }: { task: Task }) {
  const size = 'text-[clamp(38px,7.5vmin,76px)]'
  if (task.kind === 'choose') {
    return (
      <div className={`flex items-end gap-2 ${size}`}>
        {task.question === 'more' ? (
          <div className="flex items-end">
            {[0, 1, 2].map((i) => (
              <Food key={i} food="berry" className="-ml-[0.2em] h-[0.8em] w-[0.8em] first:ml-0" />
            ))}
            <span className="ml-1 text-[0.55em] font-bold text-forest">↑</span>
          </div>
        ) : (
          <div className="flex items-end">
            <Food food="berry" className="h-[0.6em] w-[0.6em]" />
            <span className="ml-1 text-[0.55em] font-bold text-peach">↓</span>
          </div>
        )}
      </div>
    )
  }
  if (task.reference) return null
  if (task.equation) {
    const { op, b } = task.equation
    return (
      <div className={`flex items-center gap-1 ${size}`}>
        <span className={`${numStyle} ${op === '+' ? 'text-forest' : 'text-[#c0392b]'}`}>
          {op === '+' ? '+' : '−'}
          {b}
        </span>
        <Food food={task.targets[0].food} className="h-[0.9em] w-[0.9em]" />
        {task.tier === 1 && (
          <div className="ml-1 text-[0.6em]">
            <Dots n={b} />
          </div>
        )}
      </div>
    )
  }
  return (
    <div className={`flex items-center gap-3 ${size}`}>
      {task.targets.map((t) => (
        <motion.div key={t.food} className="flex items-center gap-1" initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <div className="flex flex-col items-center">
            <span className={numStyle}>{t.count}</span>
            {task.tier === 1 && (
              <div className="mt-1 text-[0.6em]">
                <Dots n={t.count} />
              </div>
            )}
          </div>
          <Food food={t.food} className="h-[0.95em] w-[0.95em]" />
        </motion.div>
      ))}
    </div>
  )
}
