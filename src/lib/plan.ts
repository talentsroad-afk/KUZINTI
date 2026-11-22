import { RECIPES, type Meal, type Recipe } from '../data/recipes'
import { buildList, kcalPerServing, recipeCost, type PlanEntry } from './engine'

export type Mode = 'light' | 'balanced' | 'gourmet'
type Plan = Record<string, PlanEntry>
const SLOTS: Meal[] = ['b', 'l', 'd']
export const listCost = (plan: Plan, pantry: Record<string, number>, extras: Record<string, number>, qty: Record<string, number> = {}) => buildList(plan, pantry, extras, qty).reduce((a, l) => a + l.cost, 0)
const pool = (slot: Meal, diet: string[]): Recipe[] => RECIPES.filter((r) => r.m.includes(slot) && (!diet.includes('vegetarian') || r.tags.includes('vegetarian')))
/** How much a dish fits a mode, from its calories per serving. */
export const modeWeight = (mode: Mode, k: number) => mode === 'light' ? (k <= 350 ? 3 : k <= 550 ? 1 : 0.05) : mode === 'balanced' ? (k <= 350 ? 1 : k <= 650 ? 1.6 : k <= 800 ? 0.8 : 0.3) : (k <= 350 ? 0.15 : k <= 650 ? 1 : 3)

/** A different random week on every call: variety + mode, then fitted to the budget (swaps first, then smaller portions). */
export function randomPlan(size: number, diet: string[], mode: Mode, budget: number, pantry: Record<string, number>, extras: Record<string, number>): Plan {
  const used: Record<string, number> = {}; const plan: Plan = {}
  for (let d = 0; d < 7; d++) for (const s of SLOTS) {
    const p = pool(s, diet)
    const w = p.map((r) => (1 / (1 + (used[r.id] ?? 0) * 4)) * modeWeight(mode, kcalPerServing(r.id)) * (r.tags.includes('sweet') && s !== 'b' ? 0.2 : 1))
    let x = Math.random() * w.reduce((a, b) => a + b, 0); let pick = p[0]
    for (let i = 0; i < p.length; i++) { x -= w[i]; if (x <= 0) { pick = p[i]; break } }
    used[pick.id] = (used[pick.id] ?? 0) + 1; plan[`${d}-${s}`] = { r: pick.id, n: size }
  }
  return adaptToBudget(plan, budget, pantry, extras, diet).plan
}

export interface Fit { plan: Plan; swapped: number; scaled: number; before: number; after: number }
/** Fit the shopping list to a budget: swap meals for cheaper ones in the same slot, then shrink portions. */
export function adaptToBudget(plan: Plan, budget: number, pantry: Record<string, number>, extras: Record<string, number>, diet: string[]): Fit {
  const cur: Plan = JSON.parse(JSON.stringify(plan)); const before = listCost(cur, pantry, extras); let cost = before
  for (let it = 0; it < 40 && cost > budget; it++) {
    let best: { k: string; r: string; c: number } | null = null
    for (const k of Object.keys(cur)) {
      const slot = k.split('-')[1] as Meal
      for (const r of pool(slot, diet)) {
        if (r.id === cur[k].r || recipeCost(r.id, cur[k].n) >= recipeCost(cur[k].r, cur[k].n)) continue
        const c = listCost({ ...cur, [k]: { r: r.id, n: cur[k].n } }, pantry, extras)
        if (!best || c < best.c) best = { k, r: r.id, c }
      }
    }
    if (!best || best.c >= cost) break
    cur[best.k] = { r: best.r, n: cur[best.k].n }; cost = best.c
  }
  for (let it = 0; it < 60 && cost > budget; it++) {
    let best: { k: string; c: number } | null = null
    for (const k of Object.keys(cur)) {
      if (cur[k].n <= 1) continue
      const c = listCost({ ...cur, [k]: { r: cur[k].r, n: cur[k].n - 1 } }, pantry, extras)
      if (!best || c < best.c) best = { k, c }
    }
    if (!best || best.c >= cost) break
    cur[best.k] = { r: cur[best.k].r, n: cur[best.k].n - 1 }; cost = best.c
  }
  const keys = Object.keys(plan)
  return { plan: cur, swapped: keys.filter((k) => cur[k].r !== plan[k].r).length, scaled: keys.filter((k) => cur[k].r === plan[k].r && cur[k].n < plan[k].n).length, before, after: cost }
}
