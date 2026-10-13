import { describe, expect, it } from 'vitest'
import { ANIMALS } from './animals'
import { amount } from './danish'
import { countPlate, evaluateGive } from './evaluate'
import { MAX_BASKET, generateTask } from './generator'
import { defaultProgress, isUnlocked, parseProgress, recordSolved, effectiveTier } from './progress'
import { seededRng } from './random'
import type { GiveTask, Tier } from './types'

const tiers: Tier[] = [1, 2, 3]

describe('generator', () => {
  it('laver matematisk korrekte og løsbare opgaver for alle dyr og trin', () => {
    const rng = seededRng(42)
    for (const a of ANIMALS) {
      for (const tier of tiers) {
        for (let i = 0; i < 300; i++) {
          const t = generateTask(a.id, tier, rng)
          expect(t.animalId).toBe(a.id)
          expect(t.prompt.length).toBeGreaterThan(5)
          if (t.kind === 'choose') {
            const [x, y] = t.options.map((o) => o.count)
            expect(x).not.toBe(y)
            expect(Math.max(x, y)).toBeLessThanOrEqual(10)
            expect(Math.min(x, y)).toBeGreaterThanOrEqual(1)
            const correct = t.options[t.correctIndex].count
            const other = t.options[1 - t.correctIndex].count
            expect(t.question === 'more' ? correct > other : correct < other).toBe(true)
            continue
          }
          const basketTotal = t.basket.reduce((s, b) => s + b.count, 0)
          expect(basketTotal).toBeLessThanOrEqual(MAX_BASKET)
          for (const target of t.targets) {
            expect(target.count).toBeGreaterThanOrEqual(0)
            expect(target.count).toBeLessThanOrEqual(10)
            const inBasket = t.basket.find((b) => b.food === target.food)?.count ?? 0
            const onPlate = t.plateStart.find((p) => p.food === target.food)?.count ?? 0
            // Opgaven skal kunne løses med det, der er til rådighed
            expect(inBasket + onPlate).toBeGreaterThanOrEqual(target.count)
          }
          if (t.equation) {
            const { a: x, b: y, op, result } = t.equation
            expect(op === '+' ? x + y : x - y).toBe(result)
            expect(result).toBeLessThanOrEqual(10)
            expect(result).toBeGreaterThanOrEqual(1)
            expect(t.targets[0].count).toBe(result)
            expect(t.plateStart[0].count).toBe(x)
          }
          if (t.reference) expect(t.reference.count).toBe(t.targets[0].count)
          // Opgaven er ikke løst fra start
          const startPlate: Record<string, number> = {}
          for (const p of t.plateStart) startPlate[p.food] = p.count
          expect(evaluateGive(t, startPlate).status).not.toBe('correct')
        }
      }
    }
  })

  it('holder Kalle inden for 1–5 og trin 1 inden for 1–3', () => {
    const rng = seededRng(1)
    for (let i = 0; i < 200; i++) {
      const t1 = generateTask('kalle', 1, rng) as GiveTask
      expect(t1.targets[0].count).toBeLessThanOrEqual(3)
      const t2 = generateTask('kalle', 2, rng) as GiveTask
      expect(t2.targets[0].count).toBeLessThanOrEqual(5)
    }
  })

  it('kan lave mindst 15 forskellige opgaver', () => {
    const rng = seededRng(7)
    const seen = new Set<string>()
    for (const a of ANIMALS) for (const tier of tiers) for (let i = 0; i < 50; i++) seen.add(generateTask(a.id, tier, rng).prompt)
    expect(seen.size).toBeGreaterThanOrEqual(15)
  })

  it('gentager sjældent samme tal to gange i træk', () => {
    const rng = seededRng(3)
    let prev = generateTask('ella', 2, rng)
    let repeats = 0
    for (let i = 0; i < 100; i++) {
      const t = generateTask('ella', 2, rng, prev)
      if ((t as GiveTask).targets[0].count === (prev as GiveTask).targets[0].count) repeats++
      prev = t
    }
    expect(repeats).toBeLessThan(5)
  })
})

describe('evaluateGive', () => {
  const rng = seededRng(9)
  const task = generateTask('kalle', 2, rng) as GiveTask
  const n = task.targets[0].count
  const food = task.targets[0].food
  const plate = (k: number) => countPlate(Array.from({ length: k }, () => ({ food })))

  it('godkender præcis det rigtige antal', () => expect(evaluateGive(task, plate(n)).status).toBe('correct'))
  it('siger for få', () => expect(evaluateGive(task, plate(n - 1)).status).toBe(n === 1 ? 'empty' : 'tooFew'))
  it('siger for mange', () => expect(evaluateGive(task, plate(n + 1)).status).toBe('tooMany'))
  it('fanger forkert madtype', () => {
    expect(evaluateGive(task, { ...plate(n), apple: 1 }).status).toBe('wrongFood')
  })
  it('vurderer to slags mad hver for sig', () => {
    const two: GiveTask = { ...task, targets: [{ food: 'carrot', count: 2 }, { food: 'lettuce', count: 1 }] }
    expect(evaluateGive(two, { carrot: 2, lettuce: 1 }).status).toBe('correct')
    expect(evaluateGive(two, { carrot: 2 }).status).toBe('tooFew')
    expect(evaluateGive(two, { carrot: 3, lettuce: 1 }).status).toBe('tooMany')
  })
  it('minus-opgaver: tom tallerken er ikke "empty" men for få', () => {
    const sub = generateTask('palle', 1, rng) as GiveTask
    expect(evaluateGive(sub, {}).status).toBe('tooFew')
  })
})

describe('progress', () => {
  it('overlever ødelagte data', () => {
    expect(parseProgress('{not json')).toEqual(defaultProgress())
    expect(parseProgress('null')).toEqual(defaultProgress())
    expect(parseProgress(JSON.stringify({ version: 1, totalSolved: 'x', animals: { kalle: { tier: 9 } } })).animals.kalle.tier).toBe(1)
  })

  it('gemmer og genindlæser', () => {
    let p = defaultProgress()
    const t = generateTask('kalle', 1, seededRng(2))
    p = recordSolved(p, t, { mistakes: 0, hints: 0 })
    const again = parseProgress(JSON.stringify(p))
    expect(again).toEqual(p)
    expect(again.totalSolved).toBe(1)
  })

  it('gør opgaverne sværere efter selvstændige succeser og lettere ved vanskeligheder', () => {
    let p = defaultProgress()
    const t = generateTask('ella', 1, seededRng(2))
    for (let i = 0; i < 3; i++) p = recordSolved(p, t, { mistakes: 0, hints: 0 })
    expect(p.animals.ella.tier).toBe(2)
    p = recordSolved(p, t, { mistakes: 2, hints: 1 })
    expect(p.animals.ella.tier).toBe(2)
    p = recordSolved(p, t, { mistakes: 3, hints: 1 })
    expect(p.animals.ella.tier).toBe(1)
    // Fejl koster aldrig løste opgaver
    expect(p.animals.ella.solved).toBe(5)
  })

  it('låser dyr op ved fremdrift eller valgt sværhedsgrad', () => {
    const p = defaultProgress()
    expect(isUnlocked(p, 'kalle')).toBe(true)
    expect(isUnlocked(p, 'basse')).toBe(false)
    p.settings.difficulty = 3
    expect(isUnlocked(p, 'palle')).toBe(true)
    expect(effectiveTier(p, 'kalle')).toBe(3)
  })
})

describe('dansk', () => {
  it('bøjer korrekt', () => {
    expect(amount(1, 'carrot')).toBe('én gulerod')
    expect(amount(1, 'apple')).toBe('ét æble')
    expect(amount(4, 'carrot')).toBe('fire gulerødder')
    expect(amount(3, 'berry')).toBe('tre bær')
  })
})
