import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { sfx } from '../audio/sfx'
import { onSpeakingChange, speak, stopSpeech } from '../audio/speech'
import { Animal, type Mood } from '../components/Animal'
import { Bubble } from '../components/Bubble'
import { RoundButton } from '../components/Buttons'
import { ChooseBoard } from '../components/ChooseBoard'
import { GiveBoard } from '../components/GiveBoard'
import { IconArrow, IconHome, IconSpeaker, IconStar } from '../components/Icons'
import { ForestBackground } from '../components/Scenery'
import { TargetCard } from '../components/TargetCard'
import type { BoardApi } from '../components/boardTypes'
import { ANIMAL_BY_ID } from '../game/animals'
import { generateTask } from '../game/generator'
import { effectiveTier, type Outcome } from '../game/progress'
import { pick } from '../game/random'
import type { AnimalId, Task } from '../game/types'
import { useStore } from '../state'

/** Sekunder uden handling, før spillet forsigtigt peger på "hør igen". */
const NUDGE_AFTER_MS = 14000

export function PlayScreen({ animalId, onMap }: { animalId: AnimalId; onMap: () => void }) {
  const animal = ANIMAL_BY_ID[animalId]
  const { progress, solved: recordSolved } = useStore()
  const [task, setTask] = useState<Task>(() => generateTask(animalId, effectiveTier(progress, animalId)))
  const [phase, setPhase] = useState<'play' | 'eating' | 'done'>('play')
  const [moodOverride, setMoodOverride] = useState<Mood | null>(null)
  const [talking, setTalking] = useState(false)
  const [bubbleOverride, setBubbleOverride] = useState<string | null>(null)
  const [nudge, setNudge] = useState(false)
  const [sessionStars, setSessionStars] = useState(0)
  const nudgeTimer = useRef<ReturnType<typeof setTimeout>>()
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const say = useCallback((text: string) => speak(text, { pitch: animal.pitch, rate: animal.rate }), [animal])

  useEffect(() => onSpeakingChange(setTalking), [])

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms))

  const armNudge = useCallback(() => {
    setNudge(false)
    clearTimeout(nudgeTimer.current)
    nudgeTimer.current = setTimeout(() => setNudge(true), NUDGE_AFTER_MS)
  }, [])

  // Ny opgave: læs den op.
  useEffect(() => {
    setBubbleOverride(null)
    setMoodOverride(null)
    armNudge()
    const t = setTimeout(() => void say(task.prompt), 450)
    return () => clearTimeout(t)
  }, [task, say, armNudge])

  useEffect(
    () => () => {
      stopSpeech()
      clearTimeout(nudgeTimer.current)
      timers.current.forEach(clearTimeout)
    },
    [],
  )

  const onSolved = useCallback(
    (outcome: Outcome) => {
      recordSolved(task, outcome)
      setSessionStars((s) => s + 1)
      setPhase('eating')
      setBubbleOverride(null)
      setMoodOverride('eating')
      clearTimeout(nudgeTimer.current)
      setNudge(false)
      stopSpeech()
      later(() => sfx.munch(), 350)
      later(() => sfx.munch(), 900)
      later(() => {
        setMoodOverride('happy')
        setPhase('done')
        sfx.star()
        let line = pick(Math.random, animal.thanks)
        if (task.kind === 'give' && task.equation) {
          const { a, b, op, result } = task.equation
          line = `${line} ${a} ${op === '+' ? 'plus' : 'minus'} ${b} er ${result}.`
        }
        void say(line)
      }, 1500)
    },
    [task, animal, say, recordSolved],
  )

  function next() {
    stopSpeech()
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase('play')
    setTask((prev) => generateTask(animalId, effectiveTier(progress, animalId), Math.random, prev))
  }

  const repeat = () => {
    armNudge()
    if (phase === 'play') {
      setBubbleOverride(null)
      void say(task.prompt)
    }
  }

  const mood: Mood = moodOverride ?? (talking ? 'talking' : 'idle')
  const solved = phase !== 'play'

  const bubbleText = phase === 'done' ? 'Tak!' : (bubbleOverride ?? task.bubble)

  const stage = (extra?: ReactNode) => (
    <div className="flex h-full items-end justify-center gap-[2vmin]">
      <div className="w-[clamp(110px,min(31vh,24vw),300px)] shrink-0 portrait:w-[clamp(110px,min(21vh,34vw),250px)]" data-testid="animal">
        <Animal id={animalId} mood={mood} />
      </div>
      <div className="mb-[4vmin] min-w-0">
        <Bubble text={bubbleText} onTap={repeat} nudge={nudge && phase === 'play'}>
          {phase === 'done' && task.kind === 'give' && task.equation ? <Equation task={task} /> : phase === 'play' ? (extra ?? <TargetCard task={task} />) : null}
        </Bubble>
      </div>
    </div>
  )

  const api: BoardApi = useMemo(
    () => ({
      say,
      setMood: setMoodOverride,
      setBubble: setBubbleOverride,
      onSolved,
      onInteract: armNudge,
      stage,
    }),
    // stage ændrer sig ved hver render – det er med vilje (den viser aktuel tilstand)
    [say, onSolved, armNudge, mood, bubbleText, nudge, phase, task],
  )

  return (
    <div className="screen flex flex-col">
      <ForestBackground variant="clearing" />

      <header className="relative z-20 flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RoundButton
            label="Til skovkortet"
            onClick={() => {
              stopSpeech()
              onMap()
            }}
          >
            <IconHome className="h-8 w-8 text-forest-dark" />
          </RoundButton>
          <motion.div animate={nudge && phase === 'play' ? { scale: [1, 1.15, 1] } : { scale: 1 }} transition={{ duration: 1.2, repeat: nudge ? Infinity : 0 }}>
            <RoundButton label="Hør opgaven igen" onClick={repeat} color="#ffd35c" shadow="#d48c0d">
              <IconSpeaker className="h-8 w-8 text-ink" />
            </RoundButton>
          </motion.div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 shadow-md" aria-label={`${sessionStars} stjerner i dag`}>
          {Array.from({ length: Math.min(5, sessionStars) }, (_, i) => (
            <motion.span key={i} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}>
              <IconStar className="h-7 w-7 sm:h-8 sm:w-8" />
            </motion.span>
          ))}
          {sessionStars > 5 && <span className="ml-1 text-xl font-bold tabular-nums">+{sessionStars - 5}</span>}
          {sessionStars === 0 && <IconStar className="h-7 w-7 opacity-25 grayscale sm:h-8 sm:w-8" />}
        </div>
      </header>

      <main className="relative z-10 mt-2 min-h-0 flex-1" key={task.id}>
        {task.kind === 'give' ? <GiveBoard task={task} api={api} solved={solved} /> : <ChooseBoard task={task} api={api} solved={solved} />}
      </main>

      <AnimatePresence>
        {phase === 'done' && (
          <motion.div
            className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-4 bg-gradient-to-t from-white/80 to-transparent pt-16 pb-[max(16px,env(safe-area-inset-bottom))]"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            <Sparkles />
            <RoundButton
              label="Til skovkortet"
              onClick={() => {
                stopSpeech()
                onMap()
              }}
            >
              <IconHome className="h-8 w-8 text-forest-dark" />
            </RoundButton>
            <motion.button
              type="button"
              autoFocus
              data-testid="next"
              onClick={() => {
                sfx.tap()
                next()
              }}
              className="btn-chunky flex items-center gap-3 rounded-full bg-sun px-[clamp(24px,5vmin,48px)] py-[clamp(10px,2vmin,18px)] font-bold"
              style={{ fontSize: 'clamp(24px, 4.4vmin, 40px)', ['--shadow' as string]: '#d48c0d' }}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              whileTap={{ scale: 0.95 }}
            >
              Næste
              <IconArrow className="h-[1.1em] w-[1.1em] text-forest-dark" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Equation({ task }: { task: Task & { kind: 'give' } }) {
  const { a, b, op, result } = task.equation!
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-[clamp(32px,6.5vmin,64px)] leading-none font-bold text-ink tabular-nums"
    >
      {a} {op === '+' ? '+' : '−'} {b} = <span className="text-forest">{result}</span>
    </motion.div>
  )
}

/** Få, rolige stjerner – ikke overdreven konfetti. */
function Sparkles() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-full h-40" aria-hidden="true">
      {[12, 30, 50, 70, 88].map((x, i) => (
        <motion.div
          key={x}
          className="absolute bottom-0"
          style={{ left: `${x}%` }}
          initial={{ y: 40, opacity: 0, scale: 0.4 }}
          animate={{ y: -60 - (i % 2) * 40, opacity: [0, 1, 0], scale: 1, rotate: 120 }}
          transition={{ duration: 1.6, delay: i * 0.08 }}
        >
          <IconStar className="h-9 w-9" />
        </motion.div>
      ))}
    </div>
  )
}
