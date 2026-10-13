import { motion } from 'framer-motion'
import type { AnimalId } from '../game/types'

/** Fuldskærms skovbaggrund. Dækker altid hele skærmen (slice). */
export function ForestBackground({ variant = 'day' }: { variant?: 'day' | 'clearing' }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fd3f4" />
            <stop offset=".6" stopColor="#d4f0fb" />
            <stop offset="1" stopColor="#fff6dc" />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9bd77c" />
            <stop offset="1" stopColor="#6fbf5e" />
          </linearGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#sky)" />
        <circle cx="1350" cy="150" r="70" fill="#ffe27a" opacity=".9" />
        <circle cx="1350" cy="150" r="100" fill="#ffe27a" opacity=".25" />
        <Cloud x={200} y={130} s={1} d={70} />
        <Cloud x={900} y={90} s={0.75} d={90} />
        <Cloud x={1250} y={300} s={0.6} d={110} />
        {/* Fjerne bakker */}
        <path d="M0 560C200 470 380 500 560 540s420-90 640-60 300 60 400 40V1000H0z" fill="#b9e3a0" />
        <g fill="#8cc97a">
          {[60, 180, 330, 520, 700, 880, 1080, 1260, 1450, 1560].map((x, i) => (
            <Spruce key={x} x={x} y={560 - (i % 3) * 15} s={0.55 + (i % 2) * 0.12} color="#7dbb6d" />
          ))}
        </g>
        <path d="M0 660C260 600 520 640 800 650s560-70 800-30V1000H0z" fill="#a5d98a" />
        {variant === 'day' &&
          [40, 260, 1340, 1540].map((x, i) => <RoundTree key={x} x={x} y={690 + (i % 2) * 20} s={1 + (i % 2) * 0.15} />)}
        <path d="M0 760C300 720 600 740 900 760s500-20 700-10V1000H0z" fill="url(#ground)" />
        {/* Blomster og græs */}
        {[...Array(26)].map((_, i) => {
          const x = (i * 137) % 1600
          const y = 800 + ((i * 71) % 180)
          return i % 3 === 0 ? (
            <g key={i}>
              <circle cx={x} cy={y} r="7" fill={['#ffd35c', '#fff', '#f7a8b8'][i % 3]} />
              <circle cx={x} cy={y} r="3" fill="#f59e4b" />
            </g>
          ) : (
            <path key={i} d={`M${x} ${y}q-4-14 0-24M${x} ${y}q6-12 12-16`} stroke="#5aa64a" strokeWidth="4" fill="none" strokeLinecap="round" />
          )
        })}
      </svg>
    </div>
  )
}

function Cloud({ x, y, s, d }: { x: number; y: number; s: number; d: number }) {
  return (
    <motion.g
      initial={{ x: 0 }}
      animate={{ x: [0, 60, 0] }}
      transition={{ duration: d, repeat: Infinity, ease: 'easeInOut' }}
      opacity=".9"
    >
      <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff">
        <ellipse cx="0" cy="0" rx="80" ry="32" />
        <ellipse cx="-40" cy="-14" rx="40" ry="30" />
        <ellipse cx="30" cy="-24" rx="50" ry="40" />
      </g>
    </motion.g>
  )
}

export function Spruce({ x, y, s = 1, color = '#3f8f4f' }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-8" y="-20" width="16" height="30" fill="#8b5e3c" />
      <path d="M0-220-70-60h140z" fill={color} />
      <path d="M0-170-80-10H80z" fill={color} />
      <path d="M0-260-50-130h100z" fill={color} />
    </g>
  )
}

export function RoundTree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-12 0c2-50 0-90 4-120h16c4 30 2 70 4 120z" fill="#8b5e3c" />
      <circle cx="0" cy="-170" r="90" fill="#4f9e55" />
      <circle cx="-60" cy="-120" r="60" fill="#5aab5c" />
      <circle cx="60" cy="-125" r="62" fill="#5aab5c" />
      <circle cx="-25" cy="-200" r="40" fill="#6dbb66" opacity=".7" />
      <circle cx="30" cy="-150" r="8" fill="#e5483f" />
      <circle cx="-40" cy="-110" r="8" fill="#e5483f" />
    </g>
  )
}

/** Dyrenes hjem på skovkortet (viewBox 0 0 200 160). */
export function AnimalHome({ id, className }: { id: AnimalId; className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <ellipse cx="100" cy="150" rx="95" ry="12" fill="#5aa64a" opacity=".5" />
      {HOMES[id]}
    </svg>
  )
}

const HOMES: Record<AnimalId, JSX.Element> = {
  kalle: (
    <g>
      <path d="M10 150C10 70 60 40 100 40s90 30 90 110z" fill="#7cc46a" />
      <path d="M30 150C34 90 64 64 100 64" stroke="#94d67f" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M70 150v-40a30 30 0 0 1 60 0v40z" fill="#8b5e3c" />
      <path d="M78 150v-38a22 22 0 0 1 44 0v38z" fill="#5c3b22" />
      <circle cx="114" cy="128" r="3.5" fill="#ffd35c" />
      <circle cx="40" cy="120" r="6" fill="#f08a2c" />
      <circle cx="160" cy="112" r="6" fill="#fff" />
    </g>
  ),
  ella: (
    <g>
      <path d="M72 150c6-36 6-70 10-104h36c4 34 4 68 10 104z" fill="#9a6a46" />
      <path d="M90 150c2-34 2-66 4-104" stroke="#7d5235" strokeWidth="4" fill="none" />
      <path d="M72 150c-14 0-30 4-42 0 12-5 28-9 42-8zM128 150c14 0 30 4 42 0-12-5-28-9-42-8z" fill="#9a6a46" />
      <circle cx="100" cy="40" r="40" fill="#4f9e55" />
      <circle cx="58" cy="58" r="28" fill="#5aab5c" />
      <circle cx="142" cy="58" r="28" fill="#5aab5c" />
      <circle cx="84" cy="26" r="16" fill="#6dbb66" opacity=".8" />
      <ellipse cx="128" cy="86" rx="9" ry="11" fill="#3a2418" />
    </g>
  ),
  basse: (
    <g>
      <path d="M8 150C8 80 50 30 104 30s88 50 88 120z" fill="#a8a29a" />
      <path d="M30 70c20-26 50-34 80-30" stroke="#c9c3ba" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M52 150c0-50 22-76 50-76s50 26 50 76z" fill="#3b3430" />
      <circle cx="40" cy="110" r="10" fill="#8f8981" />
      <circle cx="166" cy="96" r="12" fill="#8f8981" />
      <path d="M150 40c10-10 24-10 30 0" stroke="#5aab5c" strokeWidth="10" strokeLinecap="round" />
    </g>
  ),
  rasmus: (
    <g>
      <path d="M14 150C24 96 60 70 100 70s76 26 86 80z" fill="#b98a5e" />
      <path d="M60 150c0-30 18-50 40-50s40 20 40 50z" fill="#4a2f1e" />
      <path d="M30 120c10-20 30-34 52-38" stroke="#d2a679" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M150 90l8-26 8 26z" fill="#4f9e55" />
      <path d="M170 100l6-20 6 20z" fill="#4f9e55" />
    </g>
  ),
  palle: (
    <g>
      {[
        ['#e0703a', 40, 130, -20],
        ['#f2a65a', 70, 112, 15],
        ['#d9534f', 100, 104, -5],
        ['#ffd35c', 130, 114, 25],
        ['#e0703a', 160, 130, -30],
        ['#c96f2e', 60, 138, 40],
        ['#f2a65a', 100, 132, 0],
        ['#d9534f', 140, 138, -40],
        ['#ffd35c', 85, 90, 60],
        ['#e0703a', 118, 88, -60],
      ].map(([c, x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M0-24C14-14 14 10 0 24-14 10-14-14 0-24z" fill={c as string} />
          <path d="M0-20V20" stroke="#000" strokeOpacity=".2" strokeWidth="2" />
        </g>
      ))}
    </g>
  ),
}
