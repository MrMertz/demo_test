import type { ReactNode } from 'react'
import type { Outcome } from '../game/progress'
import type { Mood } from './Animal'

/** Det, et spillebræt kan bede spilskærmen om. */
export interface BoardApi {
  say: (text: string) => Promise<void>
  /** Midlertidigt humør. `null` = standard (idle / taler). */
  setMood: (m: Mood | null) => void
  /** Midlertidig tekst i taleboblen. `null` = opgavens egen tekst. */
  setBubble: (t: string | null) => void
  onSolved: (o: Outcome) => void
  /** Kaldes ved enhver handling – nulstiller "hjælp mig"-puf. */
  onInteract: () => void
  /** Dyret + taleboble. `extra` erstatter målkortet i boblen. */
  stage: (extra?: ReactNode) => ReactNode
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
