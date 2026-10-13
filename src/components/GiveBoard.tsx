import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { sfx } from '../audio/sfx'
import { amount, numberWord, plural } from '../game/danish'
import { countPlate, evaluateGive } from '../game/evaluate'
import type { FoodId, GiveTask } from '../game/types'
import { Bowl } from './Bowl'
import { type BoardApi, wait } from './boardTypes'
import { Food } from './Food'
import { FoodToken, GhostSlot } from './FoodToken'
import { IconHeart } from './Icons'

interface Item {
  id: string
  food: FoodId
  place: 'basket' | 'plate'
  locked: boolean
  /** Fast plads i kurven, så rækkefølgen er rolig. */
  home: number
  /** Hvornår genstanden kom på tallerkenen (rækkefølge på tallerkenen). */
  seq: number
}

function initialItems(task: GiveTask): Item[] {
  const items: Item[] = []
  let n = 0
  for (const p of task.plateStart)
    for (let i = 0; i < p.count; i++) items.push({ id: `${task.id}-${n}`, food: p.food, place: 'plate', locked: p.locked, home: n, seq: n++ })
  for (const b of task.basket)
    for (let i = 0; i < b.count; i++) items.push({ id: `${task.id}-${n}`, food: b.food, place: 'basket', locked: false, home: n, seq: n++ })
  return items
}

const sortPlate = (a: Item, b: Item) => Number(b.locked) - Number(a.locked) || a.seq - b.seq

export function GiveBoard({ task, api, solved }: { task: GiveTask; api: BoardApi; solved: boolean }) {
  const [items, setItems] = useState(() => initialItems(task))
  const itemsRef = useRef(items)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [refHighlight, setRefHighlight] = useState<number | null>(null)
  const [showGhosts, setShowGhosts] = useState(task.showGhosts)
  const [basketNudge, setBasketNudge] = useState(false)
  const mistakes = useRef(0)
  const hints = useRef(0)
  const overshoot = useRef(false)
  const token = useRef(0)
  const seq = useRef(items.length)
  const plateRef = useRef<HTMLDivElement>(null)
  const basketRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => void token.current++, [])

  const plateItems = useMemo(() => items.filter((i) => i.place === 'plate').sort(sortPlate), [items])
  const basketItems = useMemo(() => items.filter((i) => i.place === 'basket').sort((a, b) => a.home - b.home), [items])
  const counts = countPlate(plateItems)
  const startTotal = task.plateStart.reduce((s, p) => s + p.count, 0)
  const removed = startTotal - plateItems.length
  const single = task.targets.length === 1 ? task.targets[0] : null
  const lockedCount = task.plateStart.filter((p) => p.locked).reduce((s, p) => s + p.count, 0)
  const isRemove = task.mode === 'remove'

  /** Afbryd igangværende "tæl sammen" og start en ny sekvens. Returnerer en "lever stadig"-funktion. */
  function newSequence() {
    const my = ++token.current
    setHighlight(null)
    setRefHighlight(null)
    return () => token.current === my
  }

  /** Tæl genstande én ad gangen med stemme og fremhævning. */
  async function countAloud(list: Item[], alive: () => boolean): Promise<boolean> {
    for (let i = 0; i < list.length; i++) {
      if (!alive()) return false
      setHighlight(list[i].id)
      await api.say(numberWord(i + 1))
      await wait(120)
    }
    if (alive()) setHighlight(null)
    return alive()
  }

  async function countReference(alive: () => boolean): Promise<boolean> {
    if (!task.reference) return true
    api.setBubble('Lad os tælle bærrene i skålen')
    for (let i = 0; i < task.reference.count; i++) {
      if (!alive()) return false
      setRefHighlight(i)
      await api.say(numberWord(i + 1))
      await wait(120)
    }
    setRefHighlight(null)
    await wait(300)
    return alive()
  }

  const onPlate = (food?: FoodId) => itemsRef.current.filter((i) => i.place === 'plate' && (!food || i.food === food)).sort(sortPlate)
  const inBasket = () => itemsRef.current.filter((i) => i.place === 'basket').sort((a, b) => a.home - b.home)

  function finishHint(alive: () => boolean) {
    if (!alive()) return
    api.setMood(null)
    api.setBubble(null)
  }

  function move(id: string, to: 'plate' | 'basket') {
    if (solved) return
    const item = itemsRef.current.find((i) => i.id === id)
    if (!item) return
    if (item.locked) {
      api.onInteract()
      void api.say(`Dem har jeg allerede. Giv mig ${numberWord(task.equation?.b ?? 1)} mere.`)
      return
    }
    if (item.place === to) return
    api.onInteract()
    setBasketNudge(false)
    const alive = newSequence()
    const next = itemsRef.current.map((i) => (i.id === id ? { ...i, place: to, seq: seq.current++ } : i))
    itemsRef.current = next
    setItems(next)

    const plate = next.filter((i) => i.place === 'plate')
    const ofFood = plate.filter((i) => i.food === item.food).length
    const want = task.targets.find((t) => t.food === item.food)?.count ?? 0

    if (!isRemove) {
      if (to === 'plate') {
        sfx.plop(ofFood)
        if (ofFood > want && !overshoot.current) {
          overshoot.current = true
          mistakes.current++
          hints.current++
          api.setMood('thinking')
          api.setBubble('Ups! Lidt for mange')
          void (async () => {
            await api.say('Ups, nu har jeg fået lidt for mange. Skal vi tælle dem sammen?')
            if (!(await countAloud(onPlate(item.food), alive))) return
            await api.say(`Jeg skal have ${amount(want, item.food)}. Tryk på en for at tage den tilbage.`)
            finishHint(alive)
          })()
        } else {
          void api.say(numberWord(ofFood))
        }
      } else {
        sfx.pop()
        if (ofFood <= want) {
          overshoot.current = false
          api.setMood(null)
          api.setBubble(null)
        }
        if (ofFood > 0) void api.say(numberWord(ofFood))
      }
      return
    }

    // Minus: barnet tager væk fra tallerkenen
    const nowRemoved = startTotal - plate.length
    const target = task.targets[0].count
    if (to === 'basket') {
      sfx.pop()
      if (plate.length < target && !overshoot.current) {
        overshoot.current = true
        mistakes.current++
        api.setMood('thinking')
        api.setBubble('Ups! Lidt for mange væk')
        void api.say('Ups, nu har du taget lidt for mange væk. Du kan lægge en tilbage.')
      } else {
        void api.say(numberWord(nowRemoved))
      }
    } else {
      sfx.plop(plate.length)
      if (plate.length >= target) {
        overshoot.current = false
        api.setMood(null)
        api.setBubble(null)
      }
      if (nowRemoved > 0) void api.say(numberWord(nowRemoved))
    }
  }

  function dropAt(id: string, point: { x: number; y: number }) {
    const inside = (el: HTMLElement | null) => {
      if (!el) return false
      const r = el.getBoundingClientRect()
      const x = point.x - window.scrollX
      const y = point.y - window.scrollY
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }
    if (inside(plateRef.current)) move(id, 'plate')
    else if (inside(basketRef.current)) move(id, 'basket')
  }

  function give() {
    if (solved) return
    api.onInteract()
    const alive = newSequence()
    const ev = evaluateGive(task, countPlate(itemsRef.current.filter((i) => i.place === 'plate')))
    if (ev.status === 'correct') {
      sfx.success()
      api.onSolved({ mistakes: mistakes.current, hints: hints.current })
      return
    }
    sfx.hmm()
    if (ev.status === 'empty') {
      setBasketNudge(true)
      void api.say(`Tryk på ${plural(task.targets[0].food)} i kurven, så kommer de på min tallerken.`)
      return
    }

    mistakes.current++
    hints.current++
    api.setMood('thinking')
    if (mistakes.current >= 2 && single && !isRemove) setShowGhosts(true)

    void (async () => {
      if (isRemove) {
        const b = task.equation!.b
        api.setBubble(`Tag ${b} væk`)
        await api.say(
          ev.status === 'tooMany'
            ? 'Hmm, der er stadig lidt for mange. Lad os tælle dem, du har taget væk.'
            : 'Ups, du har taget lidt for mange væk. Lad os tælle dem.',
        )
        if (!(await countAloud(inBasket(), alive))) return
        await api.say(`Jeg vil gerne have, at du tager ${b === 1 ? 'én' : numberWord(b)} væk.`)
        return finishHint(alive)
      }

      const food = ev.food
      api.setBubble('Lad os tælle sammen')
      await api.say(
        ev.status === 'tooFew'
          ? 'Hmm, jeg tror, jeg mangler lidt. Lad os tælle sammen!'
          : ev.status === 'tooMany'
            ? 'Ups, der er lidt for mange. Lad os tælle sammen!'
            : `Hov, jeg skal ikke have ${plural(food)}.`,
      )
      if (ev.status === 'wrongFood') return finishHint(alive)
      if (!(await countReference(alive))) return
      api.setBubble('Lad os tælle sammen')
      if (!(await countAloud(onPlate(food), alive))) return
      if (task.equation) await api.say(`Jeg havde ${numberWord(task.equation.a)}. Jeg skal have ${numberWord(task.equation.b)} mere.`)
      else if (task.reference) await api.say(`Der er ${numberWord(task.reference.count)} bær i skålen.`)
      else await api.say(`Jeg skal have ${amount(ev.want, food)}.`)
      finishHint(alive)
    })()
  }

  const slots = showGhosts && single ? Math.max(single.count, plateItems.length) : plateItems.length
  const canGive = isRemove ? removed > 0 : plateItems.length > lockedCount

  const referenceBowl = task.reference ? (
    <Bowl className="[--item:calc(var(--item-base)*0.6)]">
      {Array.from({ length: task.reference.count }, (_, i) => (
        <motion.div
          key={i}
          animate={{ scale: refHighlight === i ? 1.35 : 1, y: refHighlight === i ? -6 : 0 }}
          className="relative grid place-items-center"
          style={{ width: 'var(--item)', height: 'var(--item)' }}
        >
          {refHighlight === i && <span className="absolute inset-[-8%] rounded-full bg-sun/70" />}
          <Food food={task.reference!.food} className="relative h-[90%] w-[90%]" />
        </motion.div>
      ))}
    </Bowl>
  ) : undefined

  return (
    <div className="play-grid">
      <div className="[grid-area:stage] min-h-0">{api.stage(referenceBowl)}</div>

      {/* Tallerken */}
      <div className="flex min-h-0 items-center justify-center [grid-area:plate]">
        <div
          ref={plateRef}
          data-testid="plate"
          className="relative flex w-full max-w-[calc(var(--item)*7.4)] items-center justify-center rounded-[50%] p-[calc(var(--item)*0.45)]"
          style={{
            minHeight: 'calc(var(--item) * 2.4)',
            background: 'radial-gradient(ellipse at 50% 45%, #ffffff 0 52%, #f1ece2 53% 60%, #ffffff 61% 68%, #e7dfd0 69%)',
            boxShadow: '0 10px 0 rgba(0,0,0,.08), 0 18px 30px rgba(0,0,0,.12)',
          }}
        >
          <div className="flex max-w-[calc(var(--item)*5.6)] flex-wrap content-center items-center justify-center gap-[calc(var(--item)*0.06)]">
            {Array.from({ length: slots }, (_, i) => {
              const it = plateItems[i]
              if (!it) return <GhostSlot key={`g${i}`} food={single!.food} />
              return (
                <FoodToken
                  key={it.id}
                  id={it.id}
                  food={it.food}
                  locked={it.locked}
                  highlighted={highlight === it.id}
                  leaving={solved}
                  leaveDelay={i * 0.12}
                  disabled={solved}
                  onActivate={() => move(it.id, 'basket')}
                  onDrop={(p) => dropAt(it.id, p)}
                />
              )
            })}
          </div>
          <PlateCounter task={task} counts={counts} total={plateItems.length} />
        </div>
      </div>

      {/* Kurv (eller bladbunke ved minus) */}
      <div className="flex min-h-0 flex-col items-center justify-center pt-[calc(var(--item)*0.6)] [grid-area:basket]">
        <div className="relative w-full max-w-[calc(var(--item)*6.6)]">
        {!isRemove && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[16%] top-[calc(var(--item)*-0.9)] h-[calc(var(--item)*1.8)] rounded-t-full border-[calc(var(--item)*0.17)] border-b-0 border-[#a86b33]"
          />
        )}
        <motion.div
          ref={basketRef}
          data-testid="basket"
          animate={basketNudge ? { rotate: [0, -2, 2, -2, 0] } : { rotate: 0 }}
          transition={basketNudge ? { duration: 0.6, repeat: 3 } : undefined}
          className={`relative flex w-full flex-wrap content-center items-center justify-center gap-[calc(var(--item)*0.1)] rounded-t-[30px] rounded-b-[45%] p-[calc(var(--item)*0.3)] pb-[calc(var(--item)*0.55)] ${isRemove ? 'bg-[#c98a4b]' : 'basket-weave'}`}
          style={{
            minHeight: 'calc(var(--item) * 2.2)',
            boxShadow: 'inset 0 10px 0 rgba(255,255,255,.18), inset 0 -14px 0 rgba(0,0,0,.12), 0 10px 24px rgba(0,0,0,.15)',
          }}
        >
          <AnimatePresence>
            {basketItems.map((it) => (
              <FoodToken
                key={it.id}
                id={it.id}
                food={it.food}
                highlighted={highlight === it.id}
                disabled={solved}
                onActivate={() => move(it.id, 'plate')}
                onDrop={(p) => dropAt(it.id, p)}
              />
            ))}
          </AnimatePresence>
          {isRemove && <LeafLitter />}
          {isRemove && removed > 0 && (
            <span className="absolute -top-4 -right-3 grid h-12 min-w-12 place-items-center rounded-full bg-white px-2 text-3xl font-bold text-[#c0392b] shadow-md tabular-nums">
              {removed}
            </span>
          )}
        </motion.div>
        </div>
      </div>

      {/* Giv mad */}
      <div className={`flex items-center justify-center transition-opacity [grid-area:action] ${solved ? 'pointer-events-none opacity-0' : ''}`}>
        <motion.button
          type="button"
          onClick={give}
          disabled={solved}
          data-testid="give"
          className="btn-chunky flex items-center gap-3 rounded-full px-[clamp(22px,4vmin,40px)] py-[clamp(10px,1.8vmin,18px)] font-bold text-white disabled:opacity-60"
          style={{
            background: canGive ? '#3f8f4f' : '#8fbf95',
            ['--shadow' as string]: '#2a6136',
            fontSize: 'clamp(22px, 4vmin, 38px)',
          }}
          animate={canGive && !solved ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 1.6, repeat: canGive && !solved ? Infinity : 0 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconHeart className="h-[1.2em] w-[1.2em] text-[#ffb3c1]" />
          Giv mad
        </motion.button>
      </div>
    </div>
  )
}

/** Tæller på tallerkenen – viser hvor mange der ligger der nu. */
function PlateCounter({ task, counts, total }: { task: GiveTask; counts: Partial<Record<FoodId, number>>; total: number }) {
  if (task.targets.length > 1) {
    return (
      <div className="absolute -top-3 -right-2 flex flex-col gap-1">
        {task.targets.map((t) => (
          <div key={t.food} className="flex items-center gap-1 rounded-full bg-white py-0.5 pr-3 pl-1 shadow-md">
            <Food food={t.food} className="h-8 w-8" />
            <Counter n={counts[t.food] ?? 0} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="absolute -top-3 -right-2 grid h-[clamp(48px,8vmin,72px)] min-w-[clamp(48px,8vmin,72px)] place-items-center rounded-full bg-white px-2 shadow-md">
      <Counter n={total} />
    </div>
  )
}

function Counter({ n }: { n: number }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={n}
        data-testid="counter"
        className="text-[clamp(26px,5vmin,44px)] leading-none font-bold text-forest-dark tabular-nums"
        initial={{ y: -16, opacity: 0, scale: 0.6 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 16, opacity: 0 }}
      >
        {n}
      </motion.span>
    </AnimatePresence>
  )
}

/** Efterårsblade som bund i Palles bunke. */
function LeafLitter() {
  const leaves: [string, number, number, number][] = [
    ['#e0703a', 8, 30, -20], ['#f2a65a', 22, 70, 30], ['#ffd35c', 36, 25, 80], ['#d9534f', 50, 65, -40],
    ['#f2a65a', 64, 30, 15], ['#e0703a', 78, 70, 60], ['#ffd35c', 92, 35, -70], ['#c96f2e', 15, 85, 100],
    ['#d9534f', 85, 15, 140], ['#f2a65a', 45, 90, -110], ['#e0703a', 70, 95, 40], ['#ffd35c', 30, 50, 170],
  ]
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden rounded-[inherit]" aria-hidden="true">
      {leaves.map(([c, x, y, r], i) => (
        <g key={i} style={{ transform: `translate(${x}%, ${y}%)` }}>
          <g transform={`rotate(${r}) scale(1.4)`}>
            <path d="M0-24C14-14 14 10 0 24-14 10-14-14 0-24z" fill={c} opacity=".85" />
            <path d="M0-20V20" stroke="#000" strokeOpacity=".18" strokeWidth="2" />
          </g>
        </g>
      ))}
    </svg>
  )
}
