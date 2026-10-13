import type { AnimalId, FoodId, Skill } from './types'

export interface AnimalDef {
  id: AnimalId
  name: string
  species: string
  food: FoodId
  /** Ekstra madtype til opgaver med to slags mad. */
  secondFood?: FoodId
  skills: Skill[]
  /** Antal løste opgaver i alt, før dyret vågner (kan også låses op via sværhedsgrad). */
  unlockAt: number
  /** Sværhedsgrad, der låser dyret op med det samme, hvis en voksen vælger den. */
  unlockLevel: 1 | 2 | 3
  /** Stemmens tonehøjde – giver hvert dyr sin egen personlighed. */
  pitch: number
  rate: number
  greeting: string[]
  thanks: string[]
  sleeping: string
  color: string
}

export const ANIMALS: AnimalDef[] = [
  {
    id: 'kalle',
    name: 'Kalle',
    species: 'Kaninen',
    food: 'carrot',
    secondFood: 'lettuce',
    skills: ['count'],
    unlockAt: 0,
    unlockLevel: 1,
    pitch: 1.3,
    rate: 0.9,
    greeting: ['Hej! Jeg er Kalle.', 'Hop hop! Der er du jo!'],
    thanks: ['Mums! Tusind tak!', 'Hop hop! Du er en god skovhjælper!', 'Nam nam! Det var lige det rigtige!'],
    sleeping: 'Kalle sover.',
    color: '#f2a65a',
  },
  {
    id: 'ella',
    name: 'Ella',
    species: 'Egernet',
    food: 'nut',
    secondFood: 'acorn',
    skills: ['count'],
    unlockAt: 0,
    unlockLevel: 1,
    pitch: 1.45,
    rate: 0.95,
    greeting: ['Hej hej! Jeg er Ella.', 'Hurtigt, hurtigt! Godt du kom!'],
    thanks: ['Tak! Nu har jeg mad til vinteren!', 'Juhuu! Du er så god til at tælle!', 'Knas knas! Tusind tak!'],
    sleeping: 'Ella sover.',
    color: '#e0703a',
  },
  {
    id: 'basse',
    name: 'Basse',
    species: 'Bjørnen',
    food: 'berry',
    skills: ['compare', 'equal'],
    unlockAt: 4,
    unlockLevel: 2,
    pitch: 0.75,
    rate: 0.85,
    greeting: ['Hej. Jeg er Basse bjørn.', 'Brum brum. Godt at se dig.'],
    thanks: ['Brum! Det var godt set!', 'Mmm, søde bær! Tak!', 'Du er en klog skovhjælper!'],
    sleeping: 'Basse sover sin middagslur. Hjælp Kalle og Ella først.',
    color: '#9a6a46',
  },
  {
    id: 'rasmus',
    name: 'Rasmus',
    species: 'Ræven',
    food: 'apple',
    skills: ['add'],
    unlockAt: 8,
    unlockLevel: 3,
    pitch: 1.05,
    rate: 0.9,
    greeting: ['Hej! Jeg er Rasmus ræv.', 'Nå, der er du! Jeg har ventet på dig.'],
    thanks: ['Fantastisk! Tak skal du have!', 'Mums, sprøde æbler!', 'Sikke en regnemester!'],
    sleeping: 'Rasmus sover. Han vågner snart.',
    color: '#ec7a2c',
  },
  {
    id: 'palle',
    name: 'Palle',
    species: 'Pindsvinet',
    food: 'mushroom',
    skills: ['sub'],
    unlockAt: 12,
    unlockLevel: 3,
    pitch: 1.2,
    rate: 0.85,
    greeting: ['Hej. Jeg er Palle pindsvin.', 'Snøf snøf. Hej med dig!'],
    thanks: ['Snøf! Nu er det lige tilpas!', 'Tak! Nu kan jeg spise dem alle!', 'Hvor er du dygtig!'],
    sleeping: 'Palle sover i sin bladbunke. Hjælp de andre dyr først.',
    color: '#8b6b4f',
  },
]

export const ANIMAL_BY_ID: Record<AnimalId, AnimalDef> = Object.fromEntries(ANIMALS.map((a) => [a.id, a])) as Record<
  AnimalId,
  AnimalDef
>
