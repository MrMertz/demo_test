import { ANIMAL_BY_ID } from './animals'
import { amount, amountShort, numberWord, plural } from './danish'
import { pick, randInt, type Rng } from './random'
import type { AnimalId, ChooseTask, FoodId, GiveTask, Task, Tier } from './types'

export const MAX_BASKET = 12

let counter = 0
const nextId = () => `t${Date.now().toString(36)}${(counter++).toString(36)}`

/** Vælg et tal i intervallet, men undgå (om muligt) at gentage forrige mål. */
function freshInt(rng: Rng, min: number, max: number, avoid?: number): number {
  for (let i = 0; i < 6; i++) {
    const n = randInt(rng, min, max)
    if (n !== avoid || min === max) return n
  }
  return randInt(rng, min, max)
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')
}

// ---------- Tælleopgaver (Kalle og Ella) ----------

const COUNT_PROMPTS: Record<'kalle' | 'ella', string[]> = {
  kalle: [
    'Hej! Jeg er rigtig sulten. Kan du hjælpe mig med at finde {amount}?',
    'Mmm, jeg elsker {food}! Kan du give mig {amount}?',
    'Min mave rumler! Kan du lægge {amount} på min tallerken?',
    'Hop hop! Jeg vil gerne have {amount}. Vil du hjælpe mig?',
  ],
  ella: [
    'Vinteren kommer snart! Kan du hjælpe mig med at samle {amount}?',
    'Jeg skal gemme {amount} i mit træ. Vil du hjælpe?',
    'Knas knas! Kan du give mig {amount}?',
    'Hurtigt, hurtigt! Jeg mangler {amount}. Kan du finde dem?',
  ],
}

const TWO_FOOD_PROMPTS = [
  'I dag vil jeg have to slags mad! Kan du give mig {a} og {b}?',
  'Kan du lægge {a} og {b} på min tallerken?',
]

function countTask(animalId: 'kalle' | 'ella', tier: Tier, rng: Rng, n: number, extra: number, ghosts: boolean): GiveTask {
  const animal = ANIMAL_BY_ID[animalId]
  const food = animal.food
  return {
    kind: 'give',
    id: nextId(),
    animalId,
    skill: 'count',
    tier,
    mode: 'add',
    prompt: fill(pick(rng, COUNT_PROMPTS[animalId]), { amount: amount(n, food), food: plural(food) }),
    bubble: `Giv mig ${amountShort(n, food)}`,
    targets: [{ food, count: n }],
    plateStart: [],
    basket: [{ food, count: Math.min(MAX_BASKET, n + extra) }],
    showGhosts: ghosts,
  }
}

function twoFoodTask(animalId: 'kalle' | 'ella', tier: Tier, rng: Rng, maxA: number, maxB: number): GiveTask {
  const animal = ANIMAL_BY_ID[animalId]
  const foodA = animal.food
  const foodB = animal.secondFood!
  const a = randInt(rng, 1, maxA)
  const b = randInt(rng, 1, maxB)
  return {
    kind: 'give',
    id: nextId(),
    animalId,
    skill: 'count',
    tier,
    mode: 'add',
    prompt: fill(pick(rng, TWO_FOOD_PROMPTS), { a: amount(a, foodA), b: amount(b, foodB) }),
    bubble: `Giv mig ${amountShort(a, foodA)} og ${amountShort(b, foodB)}`,
    targets: [
      { food: foodA, count: a },
      { food: foodB, count: b },
    ],
    plateStart: [],
    basket: [
      { food: foodA, count: Math.min(6, a + randInt(rng, 1, 2)) },
      { food: foodB, count: Math.min(6, b + randInt(rng, 1, 2)) },
    ],
    showGhosts: false,
  }
}

function kalleTask(tier: Tier, rng: Rng, prev?: number): Task {
  if (tier === 1) return countTask('kalle', tier, rng, freshInt(rng, 1, 3, prev), randInt(rng, 2, 3), true)
  if (tier === 2) return countTask('kalle', tier, rng, freshInt(rng, 1, 5, prev), randInt(rng, 2, 3), false)
  return rng() < 0.5
    ? countTask('kalle', tier, rng, freshInt(rng, 2, 5, prev), 3, false)
    : twoFoodTask('kalle', tier, rng, 3, 2)
}

function ellaTask(tier: Tier, rng: Rng, prev?: number): Task {
  if (tier === 1) return countTask('ella', tier, rng, freshInt(rng, 1, 5, prev), 2, true)
  if (tier === 2) return countTask('ella', tier, rng, freshInt(rng, 3, 8, prev), randInt(rng, 2, 3), false)
  return rng() < 0.5
    ? countTask('ella', tier, rng, freshInt(rng, 5, 10, prev), 2, false)
    : twoFoodTask('ella', tier, rng, 5, 4)
}

// ---------- Sammenligning (Basse) ----------

const COMPARE_PROMPTS = {
  more: ['Jeg er sulten som en bjørn! Hvilken skål har flest bær? Tryk på den!', 'Brum! Hvor er der flest bær? Vis mig det!'],
  fewer: ['Jeg er ikke så sulten. Hvilken skål har færrest bær? Tryk på den!', 'Brum. Hvor er der færrest bær? Vis mig det!'],
}

function compareTask(tier: Tier, rng: Rng, question: 'more' | 'fewer', min: number, max: number, minDiff: number): ChooseTask {
  let a = randInt(rng, min, max)
  let b = randInt(rng, min, max)
  for (let i = 0; i < 20 && Math.abs(a - b) < minDiff; i++) {
    a = randInt(rng, min, max)
    b = randInt(rng, min, max)
  }
  if (Math.abs(a - b) < minDiff) {
    a = min
    b = Math.min(max, min + minDiff)
  }
  const options = [
    { food: 'berry' as FoodId, count: a },
    { food: 'berry' as FoodId, count: b },
  ]
  const correctIndex = question === 'more' ? (a > b ? 0 : 1) : a < b ? 0 : 1
  return {
    kind: 'choose',
    id: nextId(),
    animalId: 'basse',
    skill: 'compare',
    tier,
    question,
    prompt: pick(rng, COMPARE_PROMPTS[question]),
    bubble: question === 'more' ? 'Hvor er der flest bær?' : 'Hvor er der færrest bær?',
    options,
    correctIndex,
  }
}

function equalTask(tier: Tier, rng: Rng, min: number, max: number, prev?: number): GiveTask {
  const n = freshInt(rng, min, max, prev)
  return {
    kind: 'give',
    id: nextId(),
    animalId: 'basse',
    skill: 'equal',
    tier,
    mode: 'add',
    prompt: pick(rng, [
      'Se min skål med bær! Kan du lægge lige mange bær på tallerkenen?',
      'Brum! Jeg vil have lige så mange bær, som der er i min skål. Kan du hjælpe?',
    ]),
    bubble: 'Lige mange bær som i skålen',
    targets: [{ food: 'berry', count: n }],
    reference: { food: 'berry', count: n },
    plateStart: [],
    basket: [{ food: 'berry', count: Math.min(MAX_BASKET, n + 3) }],
    showGhosts: tier === 1,
  }
}

function basseTask(tier: Tier, rng: Rng, prev?: number): Task {
  if (tier === 1) return rng() < 0.75 ? compareTask(tier, rng, 'more', 1, 5, 2) : equalTask(tier, rng, 1, 4, prev)
  if (tier === 2) {
    const r = rng()
    if (r < 0.35) return compareTask(tier, rng, 'more', 1, 8, 1)
    if (r < 0.7) return compareTask(tier, rng, 'fewer', 1, 8, 1)
    return equalTask(tier, rng, 2, 6, prev)
  }
  return rng() < 0.5 ? compareTask(tier, rng, rng() < 0.5 ? 'more' : 'fewer', 2, 10, 1) : equalTask(tier, rng, 3, 9, prev)
}

// ---------- Plus (Rasmus) ----------

const ADD_PROMPTS = [
  'Jeg har allerede {a}. Kan du give mig {b} mere?',
  'Se, jeg har {a} på min tallerken. Jeg vil gerne have {b} mere!',
  'Mmm, {a}! Men jeg er stadig sulten. Kan du give mig {b} mere?',
]

function rasmusTask(tier: Tier, rng: Rng, prev?: number): GiveTask {
  const [aMin, aMax, bMin, bMax, sumMax] =
    tier === 1 ? [1, 3, 1, 2, 5] : tier === 2 ? [1, 5, 1, 3, 7] : [2, 6, 2, 4, 10]
  let a = randInt(rng, aMin, aMax)
  let b = randInt(rng, bMin, bMax)
  for (let i = 0; i < 20 && (a + b > sumMax || a + b === prev); i++) {
    a = randInt(rng, aMin, aMax)
    b = randInt(rng, bMin, bMax)
  }
  if (a + b > sumMax) b = Math.max(1, sumMax - a)
  const food: FoodId = 'apple'
  return {
    kind: 'give',
    id: nextId(),
    animalId: 'rasmus',
    skill: 'add',
    tier,
    mode: 'add',
    prompt: fill(pick(rng, ADD_PROMPTS), { a: amount(a, food), b: numberWord(b) === 'en' ? 'ét' : numberWord(b) }),
    bubble: `Jeg har ${a}. Giv mig ${b} mere`,
    targets: [{ food, count: a + b }],
    plateStart: [{ food, count: a, locked: true }],
    basket: [{ food, count: Math.min(MAX_BASKET, b + randInt(rng, 2, 3)) }],
    showGhosts: tier === 1,
    equation: { a, b, op: '+', result: a + b },
  }
}

// ---------- Minus (Palle) ----------

const SUB_PROMPTS = [
  'Uha, jeg har fået {a}! Det er for mange til mig. Kan du tage {b} væk?',
  'Snøf snøf. Der ligger {a} på min tallerken. Kan du tage {b} væk?',
  'Jeg har {a}, men min mave er lille. Vil du tage {b} væk?',
]

function palleTask(tier: Tier, rng: Rng, prev?: number): GiveTask {
  const [aMin, aMax, bMin, bMax] = tier === 1 ? [2, 5, 1, 1] : tier === 2 ? [3, 7, 1, 3] : [5, 10, 2, 5]
  let a = randInt(rng, aMin, aMax)
  let b = randInt(rng, bMin, Math.min(bMax, a - 1))
  for (let i = 0; i < 6 && a - b === prev; i++) {
    a = randInt(rng, aMin, aMax)
    b = randInt(rng, bMin, Math.min(bMax, a - 1))
  }
  const food: FoodId = 'mushroom'
  return {
    kind: 'give',
    id: nextId(),
    animalId: 'palle',
    skill: 'sub',
    tier,
    mode: 'remove',
    prompt: fill(pick(rng, SUB_PROMPTS), { a: amount(a, food), b: b === 1 ? 'én' : numberWord(b) }),
    bubble: `Tag ${b} væk`,
    targets: [{ food, count: a - b }],
    plateStart: [{ food, count: a, locked: false }],
    basket: [],
    showGhosts: false,
    equation: { a, b, op: '-', result: a - b },
  }
}

/** Det "hovedtal", opgaven drejer sig om – bruges til at undgå gentagelser. */
export function mainNumber(task: Task): number {
  if (task.kind === 'choose') return Math.max(...task.options.map((o) => o.count))
  return task.targets.reduce((s, t) => s + t.count, 0)
}

export function generateTask(animalId: AnimalId, tier: Tier, rng: Rng = Math.random, prev?: Task): Task {
  const p = prev ? mainNumber(prev) : undefined
  switch (animalId) {
    case 'kalle':
      return kalleTask(tier, rng, p)
    case 'ella':
      return ellaTask(tier, rng, p)
    case 'basse':
      return basseTask(tier, rng, p)
    case 'rasmus':
      return rasmusTask(tier, rng, p)
    case 'palle':
      return palleTask(tier, rng, p)
  }
}
