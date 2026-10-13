import { ANIMALS, ANIMAL_BY_ID } from './animals'
import type { AnimalId, Skill, Task, Tier } from './types'

export type Difficulty = 'auto' | Tier

export interface Settings {
  speech: boolean
  music: boolean
  sfx: boolean
  difficulty: Difficulty
}

export interface AnimalProgress {
  solved: number
  tier: Tier
  /** Opgaver i træk løst selvstændigt (uden fejl og hints). */
  streak: number
  /** Opgaver i træk, hvor barnet havde det svært. */
  struggle: number
}

export interface Stat {
  solved: number
  firstTry: number
}

export interface Progress {
  version: 1
  totalSolved: number
  animals: Record<AnimalId, AnimalProgress>
  numbers: Record<string, Stat>
  skills: Record<Skill, Stat>
  settings: Settings
}

export const STORAGE_KEY = 'dyrenes-madmission:v1'

/** Antal selvstændige succeser i træk, før opgaverne bliver lidt sværere. */
export const STREAK_TO_LEVEL_UP = 3
/** Antal svære opgaver i træk, før der gives mere støtte. */
export const STRUGGLE_TO_LEVEL_DOWN = 2
/** Fejl i én opgave, der tæller som "svært". */
export const STRUGGLE_MISTAKES = 2

export function defaultProgress(): Progress {
  return {
    version: 1,
    totalSolved: 0,
    animals: Object.fromEntries(
      ANIMALS.map((a) => [a.id, { solved: 0, tier: 1, streak: 0, struggle: 0 }]),
    ) as Record<AnimalId, AnimalProgress>,
    numbers: {},
    skills: {
      count: { solved: 0, firstTry: 0 },
      compare: { solved: 0, firstTry: 0 },
      equal: { solved: 0, firstTry: 0 },
      add: { solved: 0, firstTry: 0 },
      sub: { solved: 0, firstTry: 0 },
    },
    settings: { speech: true, music: true, sfx: true, difficulty: 'auto' },
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
const isTier = (v: unknown): v is Tier => v === 1 || v === 2 || v === 3

function readStat(v: unknown): Stat {
  const o = (v ?? {}) as Partial<Stat>
  return { solved: isNum(o.solved) ? o.solved : 0, firstTry: isNum(o.firstTry) ? o.firstTry : 0 }
}

/** Indlæser defensivt: ødelagte eller gamle data giver aldrig en fejl, kun standardværdier. */
export function parseProgress(raw: string | null): Progress {
  const base = defaultProgress()
  if (!raw) return base
  let data: Partial<Progress>
  try {
    data = JSON.parse(raw)
  } catch {
    return base
  }
  if (!data || typeof data !== 'object' || data.version !== 1) return base

  if (isNum(data.totalSolved)) base.totalSolved = data.totalSolved
  for (const a of ANIMALS) {
    const src = (data.animals?.[a.id] ?? {}) as Partial<AnimalProgress>
    base.animals[a.id] = {
      solved: isNum(src.solved) ? src.solved : 0,
      tier: isTier(src.tier) ? src.tier : 1,
      streak: isNum(src.streak) ? src.streak : 0,
      struggle: isNum(src.struggle) ? src.struggle : 0,
    }
  }
  if (data.numbers && typeof data.numbers === 'object') {
    for (const [k, v] of Object.entries(data.numbers)) base.numbers[k] = readStat(v)
  }
  for (const k of Object.keys(base.skills) as Skill[]) base.skills[k] = readStat(data.skills?.[k])
  const s = (data.settings ?? {}) as Partial<Settings>
  base.settings = {
    speech: typeof s.speech === 'boolean' ? s.speech : true,
    music: typeof s.music === 'boolean' ? s.music : true,
    sfx: typeof s.sfx === 'boolean' ? s.sfx : true,
    difficulty: s.difficulty === 'auto' || isTier(s.difficulty) ? s.difficulty : 'auto',
  }
  return base
}

export function loadProgress(): Progress {
  try {
    return parseProgress(localStorage.getItem(STORAGE_KEY))
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // Privat browsing o.l. – spillet fungerer stadig, men gemmer ikke.
  }
}

export function effectiveTier(p: Progress, animalId: AnimalId): Tier {
  return p.settings.difficulty === 'auto' ? p.animals[animalId].tier : p.settings.difficulty
}

export function isUnlocked(p: Progress, animalId: AnimalId): boolean {
  const a = ANIMAL_BY_ID[animalId]
  if (p.totalSolved >= a.unlockAt) return true
  return p.settings.difficulty !== 'auto' && p.settings.difficulty >= a.unlockLevel
}

/** Tallene en opgave træner – til forældreoverblikket. */
export function numbersPracticed(task: Task): number[] {
  if (task.kind === 'choose') return task.options.map((o) => o.count)
  if (task.equation) return [task.equation.result]
  return task.targets.map((t) => t.count)
}

export interface Outcome {
  /** Antal forkerte forsøg i opgaven. */
  mistakes: number
  /** Antal gange, spillet gav et konkret hint (tælle sammen, stiplede pladser). */
  hints: number
}

/** Registrerer en løst opgave og justerer sværhedsgraden adaptivt. Ren funktion. */
export function recordSolved(p: Progress, task: Task, outcome: Outcome): Progress {
  const firstTry = outcome.mistakes === 0
  const independent = firstTry && outcome.hints === 0
  const prev = p.animals[task.animalId]
  const animal: AnimalProgress = { ...prev, solved: prev.solved + 1 }

  if (independent) {
    animal.streak = prev.streak + 1
    animal.struggle = 0
    if (animal.streak >= STREAK_TO_LEVEL_UP && animal.tier < 3) {
      animal.tier = (animal.tier + 1) as Tier
      animal.streak = 0
    }
  } else if (outcome.mistakes >= STRUGGLE_MISTAKES) {
    animal.streak = 0
    animal.struggle = prev.struggle + 1
    if (animal.struggle >= STRUGGLE_TO_LEVEL_DOWN && animal.tier > 1) {
      animal.tier = (animal.tier - 1) as Tier
      animal.struggle = 0
    }
  } else {
    animal.streak = 0
  }

  const numbers = { ...p.numbers }
  for (const n of numbersPracticed(task)) {
    const s = numbers[n] ?? { solved: 0, firstTry: 0 }
    numbers[n] = { solved: s.solved + 1, firstTry: s.firstTry + (firstTry ? 1 : 0) }
  }
  const skill = p.skills[task.skill]

  return {
    ...p,
    totalSolved: p.totalSolved + 1,
    animals: { ...p.animals, [task.animalId]: animal },
    numbers,
    skills: { ...p.skills, [task.skill]: { solved: skill.solved + 1, firstTry: skill.firstTry + (firstTry ? 1 : 0) } },
  }
}

export interface Rank {
  level: 1 | 2 | 3
  title: string
}

export function rank(p: Progress): Rank {
  if (p.totalSolved >= 25) return { level: 3, title: 'Skovens madmester' }
  if (p.totalSolved >= 10) return { level: 2, title: 'Den dygtige skovhjælper' }
  return { level: 1, title: 'Den lille skovhjælper' }
}
