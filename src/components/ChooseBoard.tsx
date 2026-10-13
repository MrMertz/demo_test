import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { sfx } from '../audio/sfx'
import { numberWord } from '../game/danish'
import type { ChooseTask } from '../game/types'
import { Bowl } from './Bowl'
import { type BoardApi, wait } from './boardTypes'
import { Food } from './Food'

/** Basses sammenligningsopgaver: tryk på skålen med flest / færrest bær. */
export function ChooseBoard({ task, api, solved }: { task: ChooseTask; api: BoardApi; solved: boolean }) {
  const [highlight, setHighlight] = useState<[number, number] | null>(null)
  const [glow, setGlow] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)
  const mistakes = useRef(0)
  const hints = useRef(0)
  const token = useRef(0)

  useEffect(() => () => void token.current++, [])

  const word = task.question === 'more' ? 'flest' : 'færrest'

  function choose(i: number) {
    if (solved) return
    api.onInteract()
    const my = ++token.current
    const alive = () => token.current === my
    setHighlight(null)
    if (i === task.correctIndex) {
      setPicked(i)
      sfx.success()
      api.onSolved({ mistakes: mistakes.current, hints: hints.current })
      return
    }
    sfx.hmm()
    mistakes.current++
    hints.current++
    setWrong(i)
    setTimeout(() => setWrong(null), 600)
    api.setMood('thinking')
    api.setBubble('Lad os tælle sammen')
    if (mistakes.current >= 2) setGlow(true)
    void (async () => {
      await api.say('Hmm, lad os tælle bærrene sammen!')
      for (let b = 0; b < task.options.length; b++) {
        for (let k = 0; k < task.options[b].count; k++) {
          if (!alive()) return
          setHighlight([b, k])
          await api.say(numberWord(k + 1))
          await wait(100)
        }
        if (!alive()) return
        setHighlight(null)
        await wait(450)
      }
      if (!alive()) return
      const [x, y] = task.options.map((o) => numberWord(o.count))
      await api.say(`${x} og ${y}. Hvor er der ${word}?`)
      if (!alive()) return
      api.setMood(null)
      api.setBubble(null)
    })()
  }

  return (
    <div className="play-grid choose">
      <div className="[grid-area:stage] min-h-0">{api.stage()}</div>
      <div className="flex min-h-0 items-center justify-center gap-[4vw] [grid-area:bowls] portrait:[--item:calc(var(--item-base)*0.78)]">
        {task.options.map((opt, b) => {
          const isPicked = picked === b
          return (
            <motion.button
              key={b}
              type="button"
              data-testid={`bowl-${b}`}
              aria-label={`Skål ${b + 1}`}
              onClick={() => choose(b)}
              disabled={solved}
              className="relative rounded-[40px] p-3"
              animate={
                wrong === b
                  ? { x: [0, -10, 10, -6, 0] }
                  : isPicked
                    ? { scale: 1.08, y: -10 }
                    : glow && b === task.correctIndex
                      ? { scale: [1, 1.05, 1] }
                      : { scale: 1, x: 0, y: 0 }
              }
              transition={glow && b === task.correctIndex && !isPicked ? { duration: 1.2, repeat: Infinity } : { duration: 0.4 }}
              whileTap={{ scale: 0.96 }}
              style={{
                background: isPicked ? 'rgba(255,211,92,.55)' : glow && b === task.correctIndex ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.3)',
              }}
            >
              <Bowl>
                {Array.from({ length: opt.count }, (_, k) => {
                  const hl = highlight?.[0] === b && highlight[1] === k
                  return (
                    <motion.div
                      key={k}
                      className="relative grid place-items-center"
                      style={{ width: 'var(--item)', height: 'var(--item)' }}
                      animate={
                        solved && isPicked
                          ? { scale: 0, opacity: 0, y: -60, transition: { delay: k * 0.08 } }
                          : { scale: hl ? 1.35 : 1, y: hl ? -6 : 0 }
                      }
                    >
                      {hl && <span className="absolute inset-[-8%] rounded-full bg-sun/70" />}
                      <Food food={opt.food} className="relative h-[90%] w-[90%] drop-shadow-[0_3px_2px_rgba(0,0,0,.18)]" />
                    </motion.div>
                  )
                })}
              </Bowl>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
