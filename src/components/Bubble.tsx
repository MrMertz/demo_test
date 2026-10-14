import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Taleboble. Tryk = hør opgaven igen. */
export function Bubble({ text, children, onTap, nudge }: { text: string; children?: ReactNode; onTap: () => void; nudge?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onTap}
      aria-label={`${text}. Tryk for at høre det igen`}
      className="relative flex max-w-full min-w-0 flex-col items-center gap-1 rounded-[28px] bg-white px-4 py-2 text-center shadow-[0_6px_0_rgba(0,0,0,.08),0_10px_30px_rgba(0,0,0,.1)]"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={nudge ? { scale: [1, 1.05, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
      transition={nudge ? { duration: 1.2, repeat: Infinity } : { type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Spids mod dyret */}
      <span className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rotate-45 rounded-sm bg-white" aria-hidden="true" />
      <span className="relative text-[clamp(14px,2.1vmin,20px)] leading-tight font-medium text-ink/75">{text}</span>
      {children && <div className="relative">{children}</div>}
    </motion.button>
  )
}
