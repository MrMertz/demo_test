import { useEffect, useState } from 'react'
import { hasDanishVoice } from './audio/speech'

/** true når skærmen er i portrætformat. */
export function usePortrait(): boolean {
  const query = '(orientation: portrait)'
  const [portrait, setPortrait] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setPortrait(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return portrait
}

/** Om browseren har en dansk stemme. Opdateres, når stemmerne er indlæst (asynkront i de fleste browsere). */
export function useDanishVoice(): boolean | null {
  const [v, setV] = useState(hasDanishVoice)
  useEffect(() => {
    const check = () => setV(hasDanishVoice())
    const t = setTimeout(check, 1200)
    window.speechSynthesis?.addEventListener?.('voiceschanged', check)
    return () => {
      clearTimeout(t)
      window.speechSynthesis?.removeEventListener?.('voiceschanged', check)
    }
  }, [])
  return v
}
