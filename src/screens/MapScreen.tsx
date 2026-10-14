import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { sfx } from '../audio/sfx'
import { speak, stopSpeech } from '../audio/speech'
import { Animal } from '../components/Animal'
import { RoundButton } from '../components/Buttons'
import { IconHome, IconLock, IconStar } from '../components/Icons'
import { AnimalHome, ForestBackground } from '../components/Scenery'
import { ANIMALS, ANIMAL_BY_ID } from '../game/animals'
import { isUnlocked, rank } from '../game/progress'
import type { AnimalId } from '../game/types'
import { usePortrait } from '../hooks'
import { useStore } from '../state'

/** Placering (i % af kortet) for hvert dyrs hjem – én for landskab og én for portræt. */
const SPOTS: Record<'landscape' | 'portrait', Record<AnimalId, [number, number]>> = {
  landscape: { kalle: [14, 78], ella: [33, 46], basse: [52, 80], rasmus: [70, 46], palle: [87, 80] },
  portrait: { kalle: [28, 27], ella: [72, 38], basse: [30, 57], rasmus: [72, 70], palle: [32, 91] },
}

export function MapScreen({ onHome, onPick, onParents }: { onHome: () => void; onPick: (id: AnimalId) => void; onParents: () => void }) {
  const { progress } = useStore()
  const portrait = usePortrait()
  const spots = SPOTS[portrait ? 'portrait' : 'landscape']
  const r = rank(progress)
  const [wiggle, setWiggle] = useState<AnimalId | null>(null)

  useEffect(() => {
    const t = setTimeout(() => void speak('Hvem vil du hjælpe? Tryk på et dyr.', { pitch: 1.1 }), 350)
    return () => {
      clearTimeout(t)
      stopSpeech()
    }
  }, [])

  const order = ANIMALS.map((a) => spots[a.id])
  const pathD = order.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y - 4}`).join(' ')

  return (
    <div className="screen flex flex-col">
      <ForestBackground variant="clearing" />

      <header className="relative z-20 flex items-center justify-between gap-3">
        <RoundButton label="Til forsiden" onClick={onHome}>
          <IconHome className="h-8 w-8 text-forest-dark" />
        </RoundButton>
        <div className="flex items-center gap-2 rounded-full bg-white/85 py-1.5 pr-4 pl-2 shadow-md" aria-label={`${progress.totalSolved} stjerner. ${r.title}`}>
          <IconStar className="h-9 w-9" />
          <span className="text-2xl font-bold tabular-nums">{progress.totalSolved}</span>
          <span className="hidden text-sm font-medium text-ink/70 sm:inline">· {r.title}</span>
        </div>
        <RoundButton label="Til voksne" size="sm" onClick={onParents} color="rgba(255,255,255,.75)">
          <IconLock className="h-6 w-6 text-ink/70" />
        </RoundButton>
      </header>

      <main className="relative z-10 mt-2 flex-1">
        {/* Stien mellem dyrenes hjem */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d={pathD} fill="none" stroke="#f4e3bf" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity=".85" />
          <path d={pathD} fill="none" stroke="#e2c995" strokeWidth="4" strokeDasharray="2 16" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>

        <Butterfly />

        {ANIMALS.map((a, i) => {
          const [x, y] = spots[a.id]
          const open = isUnlocked(progress, a.id)
          const stars = progress.animals[a.id].solved
          return (
            <motion.button
              key={a.id}
              type="button"
              aria-label={open ? `${a.species} ${a.name}` : `${a.species} ${a.name} sover`}
              className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
              style={{ left: `${x}%`, top: `${y}%`, width: portrait ? 'min(34vw, 19vh)' : 'min(19vw, 30vh)' }}
              initial={{ opacity: 0, y: 30 }}
              animate={wiggle === a.id ? { opacity: 1, y: 0, rotate: [0, -4, 4, -3, 0] } : { opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: wiggle === a.id ? 0 : 0.08 * i, duration: wiggle === a.id ? 0.5 : 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (open) {
                  sfx.tap()
                  onPick(a.id)
                } else {
                  sfx.hmm()
                  setWiggle(a.id)
                  setTimeout(() => setWiggle(null), 600)
                  void speak(ANIMAL_BY_ID[a.id].sleeping, { pitch: 1.1 })
                }
              }}
            >
              <div className="relative w-full">
                <AnimalHome id={a.id} className="w-full" />
                <div className={`absolute bottom-[2%] left-1/2 w-[62%] -translate-x-1/2 ${open ? '' : 'saturate-[.6]'}`}>
                  <Animal id={a.id} mood={open ? 'idle' : 'sleeping'} />
                </div>
              </div>
              <div className="-mt-1 flex items-center gap-1 rounded-full bg-white/90 px-3 py-0.5 shadow">
                <span className="text-sm font-semibold sm:text-base">{a.name}</span>
                {open && stars > 0 && (
                  <>
                    <IconStar className="h-5 w-5" />
                    <span className="text-sm font-bold tabular-nums">{stars}</span>
                  </>
                )}
              </div>
            </motion.button>
          )
        })}
      </main>
    </div>
  )
}

function Butterfly() {
  return (
    <motion.svg
      viewBox="0 0 40 30"
      className="pointer-events-none absolute w-10"
      aria-hidden="true"
      initial={{ left: '5%', top: '30%' }}
      animate={{ left: ['5%', '40%', '75%', '50%', '5%'], top: ['30%', '15%', '35%', '55%', '30%'] }}
      transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.g animate={{ scaleX: [1, 0.3, 1] }} transition={{ duration: 0.35, repeat: Infinity }} style={{ originX: 0.5 }}>
        <ellipse cx="12" cy="11" rx="9" ry="8" fill="#f7a8b8" />
        <ellipse cx="28" cy="11" rx="9" ry="8" fill="#f7a8b8" />
        <ellipse cx="13" cy="22" rx="6" ry="5" fill="#ffd35c" />
        <ellipse cx="27" cy="22" rx="6" ry="5" fill="#ffd35c" />
      </motion.g>
      <rect x="18.5" y="6" width="3" height="20" rx="1.5" fill="#3b2f2a" />
    </motion.svg>
  )
}
