import type { FoodId } from './types'

const NUMBER_WORDS = ['nul', 'en', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti', 'elleve', 'tolv']

/** Talord til optælling ("en, to, tre …"). */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}

interface FoodWords {
  singular: string
  plural: string
  /** Fælleskøn (en) eller intetkøn (et). */
  neuter: boolean
}

export const FOOD_WORDS: Record<FoodId, FoodWords> = {
  carrot: { singular: 'gulerod', plural: 'gulerødder', neuter: false },
  lettuce: { singular: 'salatblad', plural: 'salatblade', neuter: true },
  nut: { singular: 'nød', plural: 'nødder', neuter: false },
  acorn: { singular: 'agern', plural: 'agern', neuter: true },
  berry: { singular: 'bær', plural: 'bær', neuter: true },
  apple: { singular: 'æble', plural: 'æbler', neuter: true },
  mushroom: { singular: 'svamp', plural: 'svampe', neuter: false },
}

/** "3 gulerødder", "én gulerod", "ét æble" – med talord, så talesyntesen udtaler det pænt. */
export function amount(n: number, food: FoodId): string {
  const w = FOOD_WORDS[food]
  if (n === 1) return `${w.neuter ? 'ét' : 'én'} ${w.singular}`
  return `${numberWord(n)} ${w.plural}`
}

/** Kort form med cifre til taleboblen: "3 gulerødder". */
export function amountShort(n: number, food: FoodId): string {
  const w = FOOD_WORDS[food]
  return `${n} ${n === 1 ? w.singular : w.plural}`
}

export function plural(food: FoodId): string {
  return FOOD_WORDS[food].plural
}
