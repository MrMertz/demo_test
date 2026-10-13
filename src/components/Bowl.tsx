import type { ReactNode } from 'react'

/** Lerskål – bruges til Basses bær. */
export function Bowl({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div className="relative z-10 -mb-[calc(var(--item)*0.45)] flex min-h-[calc(var(--item)*0.9)] max-w-[calc(var(--item)*5.4)] flex-wrap-reverse items-end justify-center px-2">
        {children}
      </div>
      <svg viewBox="0 0 200 80" className="w-[calc(var(--item)*5)] max-w-full" aria-hidden="true">
        <path d="M6 10h188c-4 40-40 66-94 66S10 50 6 10z" fill="#e07a4f" />
        <path d="M6 10h188" stroke="#c4623a" strokeWidth="10" strokeLinecap="round" />
        <path d="M30 30c10 20 36 32 60 34" stroke="#f2a07a" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}
