import type { ReactNode } from 'react'
import { sfx } from '../audio/sfx'

/** Rund ikonknap. `label` bruges som tilgængeligt navn (skærmlæser / voksne). */
export function RoundButton({
  label,
  onClick,
  children,
  color = '#ffffff',
  shadow = 'rgba(0,0,0,.18)',
  size = 'md',
  className = '',
  pressed,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  color?: string
  shadow?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  pressed?: boolean
}) {
  const dim = size === 'lg' ? 'h-20 w-20 sm:h-24 sm:w-24' : size === 'sm' ? 'h-12 w-12' : 'h-14 w-14 sm:h-16 sm:w-16'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={() => {
        sfx.tap()
        onClick()
      }}
      className={`btn-chunky grid shrink-0 place-items-center rounded-full ${dim} ${className}`}
      style={{ background: color, ['--shadow' as string]: shadow }}
    >
      {children}
    </button>
  )
}
