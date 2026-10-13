import { motion, type PanInfo } from 'framer-motion'
import { useRef } from 'react'
import { FOOD_WORDS } from '../game/danish'
import type { FoodId } from '../game/types'
import { Food } from './Food'

/**
 * Én madgenstand. Kan både trækkes (drag-and-drop) og trykkes på (tryk-for-at-flytte),
 * så alt kan løses uden at trække. `layoutId` får genstanden til at "flyve" mellem kurv og tallerken.
 */
export function FoodToken({
  id,
  food,
  locked = false,
  highlighted = false,
  ghostIndex,
  leaving = false,
  leaveDelay = 0,
  disabled = false,
  onActivate,
  onDrop,
}: {
  id: string
  food: FoodId
  locked?: boolean
  highlighted?: boolean
  ghostIndex?: number
  leaving?: boolean
  leaveDelay?: number
  disabled?: boolean
  onActivate: () => void
  onDrop?: (point: { x: number; y: number }) => void
}) {
  const dragged = useRef(false)

  return (
    <motion.button
      type="button"
      layoutId={id}
      aria-label={FOOD_WORDS[food].singular}
      data-food={food}
      data-ghost={ghostIndex}
      disabled={disabled}
      className="relative grid shrink-0 cursor-grab touch-none place-items-center rounded-full active:cursor-grabbing"
      style={{ width: 'var(--item)', height: 'var(--item)', zIndex: highlighted ? 5 : undefined }}
      drag={!locked && !disabled && !!onDrop}
      dragSnapToOrigin
      dragElastic={0.9}
      dragMomentum={false}
      whileDrag={{ scale: 1.25, zIndex: 50, rotate: -6 }}
      whileTap={{ scale: 1.12 }}
      onPointerDown={() => {
        dragged.current = false
      }}
      onDragStart={() => {
        dragged.current = true
      }}
      onDragEnd={(_, info: PanInfo) => onDrop?.(info.point)}
      onClick={() => {
        if (dragged.current) {
          dragged.current = false
          return
        }
        onActivate()
      }}
      initial={false}
      animate={
        leaving
          ? { scale: 0, opacity: 0, y: -80, transition: { delay: leaveDelay, duration: 0.35 } }
          : highlighted
            ? { scale: 1.3, y: -6, opacity: 1 }
            : { scale: 1, y: 0, opacity: 1 }
      }
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
    >
      {highlighted && (
        <motion.span
          className="absolute inset-[-10%] rounded-full bg-sun/70"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        />
      )}
      {locked && <span className="absolute inset-[-2%] rounded-full bg-leaf/35 ring-4 ring-leaf/70" />}
      <Food food={food} className="pointer-events-none relative h-[88%] w-[88%] drop-shadow-[0_3px_2px_rgba(0,0,0,.18)]" />
    </motion.button>
  )
}

/** Stiplet tom plads – hint om, hvor mange der skal ligge på tallerkenen. */
export function GhostSlot({ food }: { food: FoodId }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid shrink-0 place-items-center rounded-full border-[3px] border-dashed border-forest/45"
      style={{ width: 'var(--item)', height: 'var(--item)' }}
      aria-hidden="true"
    >
      <Food food={food} className="h-[70%] w-[70%] opacity-15 grayscale" />
    </motion.div>
  )
}
