import { RECIPES, type Meal, type Recipe } from '../data/recipes'
import { buildList, kcalPerServing, recipeCost, type PlanEntry } from './engine'

type Plan = Record<string, PlanEntry>
const SLOTS: Meal[] = ['b', 'l', 'd']
export const listCost = (plan: Plan, pantry: Record<string, number>, extras: Record<string, number>) => buildList(plan, pantry, extras).reduce((a, l) => a + l.cost, 0)
const pool = (slot: Meal, diet: string[]): Recipe[] => RECIPES.filter((r) => r.m.includes(slot) && (!diet.includes('vegetarian') || r.tags.includes('vegetarian')))

/** A different random week on every call: weighted random with variety, nudged by diet, then fitted to the budget. */
export function randomPlan(size: number, diet: string[], budget: number, pantry: Record<string, number>, extras: Record<string, number>): Plan {
  const used: Record<string, number> = {}; const plan: Plan = {}
  for (let d = 0; d < 7; d++) for (const s of SLOTS) {
    const p = pool(s, diet)
    const w = p.map((r) => (1 / (1 + (used[r.id] ?? 0) * 4)) * (diet.includes('healthy') ? (kcalPerServing(r.id) < 520 ? 2.5 : 0.5) : 1) * (r.tags.includes('sweet') && s !== 'b' ? 0.2 : 1))
    let x = Math.random() * w.reduce((a, b) => a + b, 0); let pick = p[0]
    for (let i = 0; i < p.length; i++) { x -= w[i]; if (x <= 0) { pick = p[i]; break } }
    used[pick.id] = (used[pick.id] ?? 0) + 1; plan[`${d}-${s}`] = { r: pick.id, n: size }
  }
  return adaptToBudget(plan, budget, pantry, extras, diet)
}

/** Swap meals for cheaper ones (same slot) until the shopping list fits the budget, or nothing cheaper helps. */
export function adaptToBudget(plan: Plan, budget: number, pantry: Record<string, number>, extras: Record<string, number>, diet: string[]): Plan {
  const cur: Plan = JSON.parse(JSON.stringify(plan)); let cost = listCost(cur, pantry, extras)
  for (let it = 0; it < 40 && cost > budget; it++) {
    let best: { k: string; r: string; c: number } | null = null
    for (const k of Object.keys(cur)) {
      const slot = k.split('-')[1] as Meal; const now = recipeCost(cur[k].r) / 1
      for (const r of pool(slot, diet)) {
        if (r.id === cur[k].r || recipeCost(r.id, cur[k].n) >= recipeCost(cur[k].r, cur[k].n) || (recipeCost(r.id) > now)) continue
        const c = listCost({ ...cur, [k]: { r: r.id, n: cur[k].n } }, pantry, extras)
        if (!best || c < best.c) best = { k, r: r.id, c }
      }
    }
    if (!best || best.c >= cost) break
    cur[best.k] = { r: best.r, n: cur[best.k].n }; cost = best.c
  }
  return cur
}
