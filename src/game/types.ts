export type FoodId = 'carrot' | 'lettuce' | 'nut' | 'acorn' | 'berry' | 'apple' | 'mushroom'

export type AnimalId = 'kalle' | 'ella' | 'basse' | 'rasmus' | 'palle'

/** Pædagogisk færdighed – bruges til statistik i forældreområdet. */
export type Skill = 'count' | 'compare' | 'equal' | 'add' | 'sub'

export type Tier = 1 | 2 | 3

export interface FoodAmount {
  food: FoodId
  count: number
}

interface TaskBase {
  id: string
  animalId: AnimalId
  skill: Skill
  tier: Tier
  /** Den fulde talte instruktion. */
  prompt: string
  /** Kort tekst til taleboblen (for voksne / når tale mangler). */
  bubble: string
}

/** Barnet flytter mad mellem kurv og tallerken. */
export interface GiveTask extends TaskBase {
  kind: 'give'
  /** 'add' = barnet giver mad, 'remove' = barnet tager mad væk fra tallerkenen. */
  mode: 'add' | 'remove'
  /** Det antal, der skal ligge på tallerkenen, når opgaven er løst. */
  targets: FoodAmount[]
  /** Mad, der ligger på tallerkenen fra start. Låste genstande kan ikke flyttes. */
  plateStart: (FoodAmount & { locked: boolean })[]
  /** Mad i kurven fra start. */
  basket: FoodAmount[]
  /** Vis stiplede pladser på tallerkenen som hjælp. */
  showGhosts: boolean
  /** Regnestykke til plus/minus-opgaver. */
  equation?: { a: number; b: number; op: '+' | '-'; result: number }
  /** Til "lige mange": dyrets egen skål, som barnet skal matche. */
  reference?: FoodAmount
}

/** Barnet vælger én af flere skåle (flest / færrest). */
export interface ChooseTask extends TaskBase {
  kind: 'choose'
  question: 'more' | 'fewer'
  options: FoodAmount[]
  correctIndex: number
}

export type Task = GiveTask | ChooseTask
