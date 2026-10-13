import type { FoodId } from '../game/types'

/** Illustrationer af maden. Alle tegnet i samme bløde stil, viewBox 64×64. */
export function Food({ food, className }: { food: FoodId; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {SHAPES[food]}
    </svg>
  )
}

const SHAPES: Record<FoodId, JSX.Element> = {
  carrot: (
    <g>
      <path d="M30 14c-4-7-11-9-14-6 4 1 8 4 10 8z" fill="#4caf50" />
      <path d="M33 14c1-8 6-12 10-11-2 3-4 7-6 11z" fill="#3d9a45" />
      <path d="M31 14c-3-9 0-13 3-13 1 4 0 9-1 13z" fill="#5cbf5f" />
      <path d="M22 18c5-4 15-4 20 0 2 2 2 6 0 9L33 58c-1 3-3 3-4 0L21 27c-2-3-1-7 1-9z" fill="#f28a2e" />
      <path d="M24 26h7M27 36h6M29 46h4M35 30h4" stroke="#d26a17" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26 21c3-1 7-1 9 0" stroke="#ffb46b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
  ),
  lettuce: (
    <g>
      <path d="M32 58C16 56 8 42 10 28c2-12 12-20 22-20s20 8 22 20c2 14-6 28-22 30z" fill="#7ccf5b" />
      <path d="M32 58C22 54 18 42 20 30c1-8 6-14 12-16 6 2 11 8 12 16 2 12-2 24-12 28z" fill="#9be07a" />
      <path d="M32 56V18M32 30l-7-6M32 38l8-7M32 46l-8-6" stroke="#5aa83f" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </g>
  ),
  nut: (
    <g>
      <ellipse cx="32" cy="38" rx="19" ry="20" fill="#b9773d" />
      <ellipse cx="26" cy="34" rx="5" ry="8" fill="#d19356" opacity=".8" />
      <path d="M13 28c2-12 11-18 19-18s17 6 19 18c-6-3-12-4-19-4s-13 1-19 4z" fill="#8a5528" />
      <path d="M30 10c0-3 2-5 4-6" stroke="#6b3f1c" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  acorn: (
    <g>
      <path d="M17 30h30c0 15-6 27-15 28-9-1-15-13-15-28z" fill="#d8a25c" />
      <ellipse cx="26" cy="40" rx="3.5" ry="7" fill="#e9bf80" />
      <path d="M12 30c0-10 9-16 20-16s20 6 20 16c0 2-2 3-4 3H16c-2 0-4-1-4-3z" fill="#8b5a2b" />
      <path d="M18 24l4 4M26 20l3 5M35 20l-2 5M44 24l-4 4" stroke="#6e4420" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 14c0-4 2-7 5-8" stroke="#6e4420" strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </g>
  ),
  berry: (
    <g>
      <circle cx="32" cy="36" r="20" fill="#4a5fc1" />
      <circle cx="32" cy="36" r="20" fill="url(#bberry)" />
      <defs>
        <radialGradient id="bberry" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#8fa2f0" stopOpacity=".9" />
          <stop offset=".6" stopColor="#4a5fc1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M26 20l6 4 6-4-2 6h-8z" fill="#2f3d86" />
      <ellipse cx="25" cy="29" rx="4" ry="3" fill="#fff" opacity=".45" />
    </g>
  ),
  apple: (
    <g>
      <path d="M32 18c-6-5-20-4-22 10-2 14 8 30 16 30 3 0 4-2 6-2s3 2 6 2c8 0 18-16 16-30-2-14-16-15-22-10z" fill="#e5483f" />
      <path d="M20 26c-3 4-3 10-1 14" stroke="#ff8a7f" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M32 18c0-5 1-9 4-12" stroke="#7a4a22" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <path d="M35 12c4-6 12-6 15-3-3 5-10 6-15 3z" fill="#5cbf5f" />
    </g>
  ),
  mushroom: (
    <g>
      <path d="M24 34h16l2 18c0 5-4 7-10 7s-10-2-10-7z" fill="#f6ead2" />
      <path d="M26 40c0 6 0 12 2 16" stroke="#e5d2ad" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M6 34C6 18 18 8 32 8s26 10 26 26c0 3-3 4-6 4H12c-3 0-6-1-6-4z" fill="#a8642e" />
      <path d="M14 26c3-8 10-12 16-13" stroke="#c98448" strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  ),
}
