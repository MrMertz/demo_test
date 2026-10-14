import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { AnimalId } from '../game/types'

export type Mood = 'idle' | 'happy' | 'eating' | 'thinking' | 'talking' | 'sleeping'

interface Palette {
  body: string
  belly: string
  dark: string
  nose: string
  cheek: string
}

const PALETTES: Record<AnimalId, Palette> = {
  kalle: { body: '#d7c8b8', belly: '#fbf4ea', dark: '#a8927c', nose: '#f0899f', cheek: '#f7a8b8' },
  ella: { body: '#de7a3e', belly: '#fbe2c6', dark: '#b45a26', nose: '#5b3423', cheek: '#f59a7a' },
  basse: { body: '#93613d', belly: '#d5ab7c', dark: '#6d4529', nose: '#3a2418', cheek: '#e08a7a' },
  rasmus: { body: '#ec7f32', belly: '#fff7ee', dark: '#4a2d20', nose: '#2b1d17', cheek: '#f7a07a' },
  palle: { body: '#f0d4ab', belly: '#f8e6c8', dark: '#6a4e3a', nose: '#2b1d17', cheek: '#f3a08d' },
}

/** Dyrefigur som SVG. Blinker af sig selv og reagerer på `mood`. */
export function Animal({ id, mood = 'idle', className }: { id: AnimalId; mood?: Mood; className?: string }) {
  const p = PALETTES[id]
  const blink = useBlink(mood !== 'sleeping' && mood !== 'happy')

  const bodyAnim =
    mood === 'happy'
      ? { y: [0, -22, 0, -12, 0], rotate: [0, -3, 3, -2, 0], transition: { duration: 0.9, ease: 'easeOut' as const } }
      : mood === 'eating'
        ? { y: [0, -3, 0], transition: { duration: 0.35, repeat: Infinity } }
        : mood === 'thinking'
          ? { rotate: [0, -4, 0], transition: { duration: 1.2 } }
          : mood === 'sleeping'
            ? { scaleY: [1, 1.025, 1], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' as const } }
            : { scaleY: [1, 1.015, 1], transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const } }

  return (
    <svg viewBox="0 -24 200 244" className={className} aria-hidden="true" overflow="visible">
      <ellipse cx="100" cy="212" rx="62" ry="8" fill="#000" opacity=".12" />
      <motion.g animate={bodyAnim} style={{ originX: 0.5, originY: 1 }}>
        {behind(id, p)}
        {/* Krop */}
        <ellipse cx="100" cy="160" rx="54" ry="50" fill={p.body} />
        <ellipse cx="100" cy="170" rx="33" ry="34" fill={p.belly} />
        {/* Fødder */}
        <ellipse cx="72" cy="206" rx="20" ry="9" fill={id === 'palle' ? p.dark : p.body} />
        <ellipse cx="128" cy="206" rx="20" ry="9" fill={id === 'palle' ? p.dark : p.body} />
        {/* Arme */}
        <motion.ellipse
          cx="56"
          cy="160"
          rx="11"
          ry="20"
          fill={id === 'palle' ? p.belly : p.body}
          stroke={p.dark}
          strokeOpacity=".25"
          strokeWidth="2"
          animate={{ rotate: mood === 'happy' ? -60 : mood === 'talking' ? [12, 4, 12] : 12 }}
          transition={{ duration: mood === 'talking' ? 0.8 : 0.3, repeat: mood === 'talking' ? Infinity : 0 }}
          style={{ originX: 0.5, originY: 0.15 }}
        />
        <motion.ellipse
          cx="144"
          cy="160"
          rx="11"
          ry="20"
          fill={id === 'palle' ? p.belly : p.body}
          stroke={p.dark}
          strokeOpacity=".25"
          strokeWidth="2"
          animate={{ rotate: mood === 'happy' ? 60 : -12 }}
          style={{ originX: 0.5, originY: 0.15 }}
        />
        {/* Hoved */}
        <motion.g
          animate={mood === 'thinking' ? { rotate: -8 } : mood === 'sleeping' ? { rotate: 6, y: 6 } : { rotate: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          style={{ originX: 0.5, originY: 0.9 }}
        >
          {ears(id, p)}
          {head(id, p)}
          <Eyes mood={mood} blink={blink} id={id} />
          {/* Kinder */}
          <motion.g animate={{ opacity: mood === 'happy' || mood === 'eating' ? 0.85 : 0.45 }}>
            <ellipse cx="64" cy="104" rx="10" ry="6" fill={p.cheek} />
            <ellipse cx="136" cy="104" rx="10" ry="6" fill={p.cheek} />
          </motion.g>
          {nose(id, p)}
          <Mouth mood={mood} id={id} />
        </motion.g>
      </motion.g>
      {mood === 'sleeping' && <Zzz />}
    </svg>
  )
}

function useBlink(active: boolean) {
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    if (!active) return
    let t: ReturnType<typeof setTimeout>
    const loop = () => {
      t = setTimeout(
        () => {
          setClosed(true)
          t = setTimeout(() => {
            setClosed(false)
            loop()
          }, 140)
        },
        2200 + Math.random() * 2800,
      )
    }
    loop()
    return () => clearTimeout(t)
  }, [active])
  return closed
}

function Eyes({ mood, blink, id }: { mood: Mood; blink: boolean; id: AnimalId }) {
  const y = id === 'basse' ? 84 : 82
  const xs = [80, 120]
  if (mood === 'happy' || mood === 'eating') {
    return (
      <g stroke="#2b1d17" strokeWidth="4.5" strokeLinecap="round" fill="none">
        {xs.map((x) => (
          <path key={x} d={`M${x - 8} ${y + 2} q8 -10 16 0`} />
        ))}
      </g>
    )
  }
  if (mood === 'sleeping' || blink) {
    return (
      <g stroke="#2b1d17" strokeWidth="4" strokeLinecap="round" fill="none">
        {xs.map((x) => (
          <path key={x} d={`M${x - 7} ${y} q7 6 14 0`} />
        ))}
      </g>
    )
  }
  const look = mood === 'thinking' ? { dx: -2, dy: -3 } : { dx: 0, dy: 0 }
  return (
    <g>
      {xs.map((x) => (
        <g key={x}>
          <ellipse cx={x + look.dx} cy={y + look.dy} rx="7.5" ry="9" fill="#2b1d17" />
          <circle cx={x + look.dx + 2.5} cy={y + look.dy - 3.5} r="2.8" fill="#fff" />
          <circle cx={x + look.dx - 2.5} cy={y + look.dy + 3} r="1.2" fill="#fff" opacity=".7" />
        </g>
      ))}
    </g>
  )
}

function Mouth({ mood, id }: { mood: Mood; id: AnimalId }) {
  const y = id === 'basse' ? 114 : 112
  const teeth = id === 'kalle'
  if (mood === 'happy') {
    return (
      <g>
        <path d={`M86 ${y - 2} q14 22 28 0 z`} fill="#7a2f2a" />
        <path d={`M93 ${y + 8} q7 -5 14 0 q-7 5 -14 0z`} fill="#f0899f" />
        {teeth && <rect x="94" y={y - 2} width="12" height="6" rx="1.5" fill="#fff" />}
      </g>
    )
  }
  if (mood === 'eating') {
    return (
      <motion.ellipse
        cx="100"
        cy={y + 2}
        rx="8"
        ry="2"
        fill="#7a2f2a"
        initial={{ ry: 2 }}
        animate={{ ry: [2, 7, 2] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      />
    )
  }
  if (mood === 'talking') {
    return (
      <motion.ellipse
        cx="100"
        cy={y + 2}
        rx="7"
        ry="2"
        fill="#7a2f2a"
        initial={{ ry: 2 }}
        animate={{ ry: [2, 6, 3, 5, 2] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />
    )
  }
  if (mood === 'thinking') return <circle cx="104" cy={y + 3} r="4" fill="#7a2f2a" />
  return (
    <g>
      <path d={`M90 ${y} q5 6 10 0 q5 6 10 0`} stroke="#2b1d17" strokeWidth="3" strokeLinecap="round" fill="none" />
      {teeth && mood !== 'sleeping' && <rect x="95" y={y + 2} width="10" height="7" rx="1.5" fill="#fff" stroke="#c9b9a6" />}
    </g>
  )
}

function Zzz() {
  return (
    <g fill="#5b6bb5" fontFamily="inherit" fontWeight="700">
      {[0, 1, 2].map((i) => (
        <motion.text
          key={i}
          x={150 + i * 12}
          y={50 - i * 14}
          fontSize={14 + i * 5}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: -16 }}
          transition={{ duration: 2.4, delay: i * 0.6, repeat: Infinity }}
        >
          z
        </motion.text>
      ))}
    </g>
  )
}

// ---------- Artsspecifikke dele ----------

function behind(id: AnimalId, p: Palette) {
  switch (id) {
    case 'ella':
      return (
        <g>
          <path d="M138 196c40 6 62-30 52-70-8-32-40-46-58-30-14 12-2 34 14 30 10-2 12-14 6-18" fill={p.body} />
          <path d="M150 182c26 0 40-24 34-52" stroke={p.belly} strokeWidth="7" strokeLinecap="round" fill="none" opacity=".6" />
        </g>
      )
    case 'rasmus':
      return (
        <g>
          <path d="M140 190c34 8 56-8 56-34-12 10-30 14-52 10z" fill={p.body} />
          <path d="M196 156c-4 12-14 20-26 22 10-8 14-12 20-26z" fill={p.belly} />
        </g>
      )
    case 'palle': {
      // Pigge rundt om krop og hoved
      const spikes: string[] = []
      const cx = 100
      const cy = 125
      for (let i = 0; i <= 26; i++) {
        const a = Math.PI * (0.95 + (i / 26) * 1.1) - Math.PI * 0.05
        const r = i % 2 === 0 ? 92 : 72
        spikes.push(`${cx + Math.cos(a) * r * 1.0},${cy + Math.sin(a) * r * 1.05}`)
      }
      return (
        <g>
          <polygon points={spikes.join(' ')} fill="#6a4e3a" stroke="#4e3727" strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="100" cy="140" rx="74" ry="72" fill="#7d5c44" />
          {[...Array(14)].map((_, i) => {
            const a = Math.PI * (1.05 + (i / 13) * 0.9)
            const x = 100 + Math.cos(a) * 60
            const y = 135 + Math.sin(a) * 58
            return <path key={i} d={`M${x} ${y} l${Math.cos(a) * 12} ${Math.sin(a) * 12}`} stroke="#a07d5f" strokeWidth="3" strokeLinecap="round" />
          })}
        </g>
      )
    }
    default:
      return null
  }
}

function ears(id: AnimalId, p: Palette) {
  switch (id) {
    case 'kalle':
      return (
        <g>
          <g transform="rotate(-12 78 50)">
            <ellipse cx="78" cy="22" rx="15" ry="42" fill={p.body} />
            <ellipse cx="78" cy="24" rx="7.5" ry="31" fill="#f4b6c2" />
          </g>
          <g transform="rotate(14 122 50)">
            <ellipse cx="122" cy="22" rx="15" ry="42" fill={p.body} />
            <ellipse cx="122" cy="24" rx="7.5" ry="31" fill="#f4b6c2" />
          </g>
        </g>
      )
    case 'ella':
      return (
        <g>
          <path d="M60 62 66 22 90 48z" fill={p.body} />
          <path d="M66 22c-4-6-2-12 2-14 0 6 2 10-2 14z" fill={p.dark} />
          <path d="M140 62 134 22 110 48z" fill={p.body} />
          <path d="M134 22c4-6 2-12-2-14 0 6-2 10 2 14z" fill={p.dark} />
          <path d="M66 54 68 34 82 50z" fill="#f4b6a2" />
          <path d="M134 54 132 34 118 50z" fill="#f4b6a2" />
        </g>
      )
    case 'basse':
      return (
        <g>
          <circle cx="58" cy="50" r="19" fill={p.body} />
          <circle cx="58" cy="50" r="10" fill={p.belly} />
          <circle cx="142" cy="50" r="19" fill={p.body} />
          <circle cx="142" cy="50" r="10" fill={p.belly} />
        </g>
      )
    case 'rasmus':
      return (
        <g>
          <path d="M56 70 58 14 96 50z" fill={p.body} />
          <path d="M58 14 52 34 66 30z" fill={p.dark} />
          <path d="M64 58 64 30 86 50z" fill="#fde2cf" />
          <path d="M144 70 142 14 104 50z" fill={p.body} />
          <path d="M142 14 148 34 134 30z" fill={p.dark} />
          <path d="M136 58 136 30 114 50z" fill="#fde2cf" />
        </g>
      )
    case 'palle':
      return (
        <g>
          <circle cx="66" cy="56" r="10" fill={p.body} stroke="#d9b98d" strokeWidth="2" />
          <circle cx="134" cy="56" r="10" fill={p.body} stroke="#d9b98d" strokeWidth="2" />
        </g>
      )
  }
}

function head(id: AnimalId, p: Palette) {
  switch (id) {
    case 'rasmus':
      return (
        <g>
          <path d="M100 38c30 0 50 20 50 46 0 20-20 40-50 42-30-2-50-22-50-42 0-26 20-46 50-46z" fill={p.body} />
          <path d="M52 92c10 4 26 4 38 14 4 4 6 10 10 12 4-2 6-8 10-12 12-10 28-10 38-14-4 20-22 34-48 34s-44-14-48-34z" fill={p.belly} />
        </g>
      )
    case 'basse':
      return (
        <g>
          <circle cx="100" cy="86" r="50" fill={p.body} />
          <ellipse cx="100" cy="108" rx="25" ry="19" fill={p.belly} />
        </g>
      )
    case 'palle':
      return (
        <g>
          <ellipse cx="100" cy="90" rx="44" ry="42" fill={p.body} />
          <ellipse cx="100" cy="104" rx="20" ry="16" fill={p.belly} />
        </g>
      )
    case 'ella':
      return (
        <g>
          <circle cx="100" cy="86" r="46" fill={p.body} />
          <ellipse cx="100" cy="106" rx="24" ry="17" fill={p.belly} />
        </g>
      )
    default:
      return (
        <g>
          <circle cx="100" cy="86" r="46" fill={p.body} />
          <ellipse cx="100" cy="106" rx="22" ry="16" fill={p.belly} />
        </g>
      )
  }
}

function nose(id: AnimalId, p: Palette) {
  if (id === 'kalle') return <path d="M93 97h14l-7 7z" fill={p.nose} stroke={p.nose} strokeWidth="3" strokeLinejoin="round" />
  if (id === 'basse' || id === 'palle' || id === 'rasmus')
    return (
      <g>
        <ellipse cx="100" cy="99" rx={id === 'basse' ? 11 : 8} ry={id === 'basse' ? 7.5 : 6} fill={p.nose} />
        <ellipse cx="97" cy="97" rx="3" ry="1.8" fill="#fff" opacity=".5" />
      </g>
    )
  return (
    <g>
      <ellipse cx="100" cy="98" rx="6.5" ry="5" fill={p.nose} />
      <ellipse cx="98" cy="96.5" rx="2.2" ry="1.4" fill="#fff" opacity=".5" />
    </g>
  )
}
