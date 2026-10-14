import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setMusicEnabled, setSfxEnabled } from './audio/sfx'
import { setSpeechEnabled } from './audio/speech'
import { defaultProgress, loadProgress, recordSolved, saveProgress, type Outcome, type Progress, type Settings } from './game/progress'
import type { Task } from './game/types'

interface Store {
  progress: Progress
  solved: (task: Task, outcome: Outcome) => void
  updateSettings: (patch: Partial<Settings>) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(loadProgress)

  useEffect(() => saveProgress(progress), [progress])

  const { speech, music, sfx } = progress.settings
  useEffect(() => setSpeechEnabled(speech), [speech])
  useEffect(() => setSfxEnabled(sfx), [sfx])
  useEffect(() => setMusicEnabled(music), [music])

  const solved = useCallback((task: Task, outcome: Outcome) => setProgress((p) => recordSolved(p, task, outcome)), [])
  const updateSettings = useCallback(
    (patch: Partial<Settings>) => setProgress((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    [],
  )
  const reset = useCallback(() => setProgress((p) => ({ ...defaultProgress(), settings: p.settings })), [])

  const value = useMemo(() => ({ progress, solved, updateSettings, reset }), [progress, solved, updateSettings, reset])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore skal bruges inden i ProgressProvider')
  return s
}
