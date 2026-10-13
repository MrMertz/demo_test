import type { FoodId, GiveTask } from './types'

export type PlateCounts = Partial<Record<FoodId, number>>

export type Evaluation =
  | { status: 'correct' }
  | { status: 'empty' }
  | { status: 'tooFew'; food: FoodId; have: number; want: number }
  | { status: 'tooMany'; food: FoodId; have: number; want: number }
  | { status: 'wrongFood'; food: FoodId; have: number }

export function countPlate(items: { food: FoodId }[]): PlateCounts {
  const counts: PlateCounts = {}
  for (const it of items) counts[it.food] = (counts[it.food] ?? 0) + 1
  return counts
}

/** Vurderer tallerkenen mod opgavens mål. For mange vurderes før for få, så barnet får det mest konkrete hint. */
export function evaluateGive(task: GiveTask, plate: PlateCounts): Evaluation {
  const total = Object.values(plate).reduce((s, n) => s + (n ?? 0), 0)
  if (task.mode === 'add' && total === 0) return { status: 'empty' }

  const wanted = new Map(task.targets.map((t) => [t.food, t.count]))
  for (const [food, have] of Object.entries(plate) as [FoodId, number][]) {
    if (have > 0 && !wanted.has(food)) return { status: 'wrongFood', food, have }
  }
  for (const t of task.targets) {
    const have = plate[t.food] ?? 0
    if (have > t.count) return { status: 'tooMany', food: t.food, have, want: t.count }
  }
  for (const t of task.targets) {
    const have = plate[t.food] ?? 0
    if (have < t.count) return { status: 'tooFew', food: t.food, have, want: t.count }
  }
  return { status: 'correct' }
}
