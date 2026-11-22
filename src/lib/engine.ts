import { ING, type Base, type Ing, type Unit } from '../data/catalog'
import { REC } from '../data/recipes'
import { SIDE } from '../data/sides'

export interface PlanEntry { r: string; n: number; x?: string[] } // x = accompaniments (sides, drink)
export interface Line { id: string; ing: Ing; need: number; have: number; buy: number; cost: number; uses: string[]; auto: number }

/** Convert "qty unit" to the ingredient's base unit. Throws if the conversion is not defined (no guessing). */
export function toBase(ing: Ing, qty: number, unit?: Unit): number {
  if (!unit || unit === ing.base) return qty
  const f = ing.conv[unit]
  if (f === undefined) throw new Error(`No conversion ${unit} -> ${ing.base} for ${ing.id}`)
  return qty * f
}
export function parseIng(s: string): { id: string; qty: number; unit?: Unit } {
  const [id, q, u] = s.split(':')
  return { id, qty: parseFloat(q), unit: u as Unit | undefined }
}
/** Round a quantity up to a realistic purchase size. */
export function roundBuy(q: number, base: Base): number {
  if (q <= 0) return 0
  if (base === 'pc') return Math.ceil(q - 1e-9)
  if (base === 'ml') return Math.ceil(q / 50) * 50
  return q < 100 ? Math.ceil(q / 10) * 10 : Math.ceil(q / 50) * 50
}
/** Ingredients of one recipe scaled to `servings`, in base units. */
export function scaleRecipe(rid: string, servings: number): Record<string, number> {
  const r = REC[rid]
  const out: Record<string, number> = {}
  for (const s of r.ing) {
    const { id, qty, unit } = parseIng(s)
    out[id] = (out[id] ?? 0) + toBase(ING[id], qty, unit) * (servings / r.s)
  }
  return out
}
export function recipeCost(rid: string, servings = REC[rid].s): number {
  return Object.entries(scaleRecipe(rid, servings)).reduce((a, [id, q]) => a + q * ING[id].p, 0)
}
/** Deterministic shopping list: sum the week, subtract the pantry, round to purchase sizes. */
export function buildList(plan: Record<string, PlanEntry>, pantry: Record<string, number>, extras: Record<string, number> = {}, qty: Record<string, number> = {}): Line[] {
  const need: Record<string, number> = {}
  const uses: Record<string, Set<string>> = {}
  for (const e of Object.values(plan)) {
    for (const [id, q] of Object.entries(scaleRecipe(e.r, e.n))) { need[id] = (need[id] ?? 0) + q; (uses[id] ??= new Set()).add(e.r) }
    for (const [sid, part] of sideParts(e)) for (const [id, q] of Object.entries(part)) { need[id] = (need[id] ?? 0) + q; (uses[id] ??= new Set()).add(sid) }
  }
  for (const [id, q] of Object.entries(extras)) { need[id] = (need[id] ?? 0) + q; (uses[id] ??= new Set()).add('basics') }
  return Object.entries(need)
    .map(([id, n]) => {
      const ing = ING[id]
      const have = pantry[id] ?? 0
      const auto = roundBuy(Math.max(0, n - have), ing.base)
      const buy = id in qty ? Math.max(0, qty[id]) : auto
      return { id, ing, need: n, have: Math.min(have, n), buy, auto, cost: Math.round(buy * ing.p * 100) / 100, uses: [...uses[id]] }
    })
    .sort((a, b) => a.ing.aisle.localeCompare(b.ing.aisle) || a.id.localeCompare(b.id))
}
export function fmtQty(q: number, base: Base): string {
  if (base === 'pc') return `${Math.round(q * 10) / 10}`
  if (q >= 1000) return `${Math.round(q / 100) / 10} ${base === 'g' ? 'kg' : 'L'}`
  return `${Math.round(q)} ${base}`
}

export function recipeKcal(rid: string, servings = REC[rid].s): number {
  return Object.entries(scaleRecipe(rid, servings)).reduce((a, [id, q]) => a + q * ING[id].k, 0)
}
/** kcal for one person for one serving of the recipe. */
export const kcalPerServing = (rid: string) => recipeKcal(rid, REC[rid].s) / REC[rid].s
/** Rough daily kcal per person = average planned meal x 3 meals. */
/** Ingredients of each accompaniment of a meal, scaled to its servings. */
export function sideParts(e: PlanEntry): [string, Record<string, number>][] {
  return (e.x ?? []).filter((sid) => SIDE[sid]).map((sid) => [sid, Object.fromEntries(SIDE[sid].ing.map((s) => { const p = parseIng(s); return [p.id, p.qty * e.n] }))])
}
export function scaleEntry(e: PlanEntry): Record<string, number> {
  const out = scaleRecipe(e.r, e.n)
  for (const [, part] of sideParts(e)) for (const [id, q] of Object.entries(part)) out[id] = (out[id] ?? 0) + q
  return out
}
export const entryCost = (e: PlanEntry) => Object.entries(scaleEntry(e)).reduce((a, [id, q]) => a + q * ING[id].p, 0)
export const entryKcal = (e: PlanEntry) => Object.entries(scaleEntry(e)).reduce((a, [id, q]) => a + q * ING[id].k, 0) / e.n
/** Daily kcal per person: average complete meal for each meal type planned, plus tea-time spread over the week. */
export function dailyKcal(plan: Record<string, PlanEntry>): number {
  const by: Record<string, number[]> = {}
  for (const [k, e] of Object.entries(plan)) (by[k.split('-')[1]] ??= []).push(entryKcal(e))
  const avg = (a?: number[]) => (a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
  return avg(by.b) + avg(by.l) + avg(by.d) + (by.g ? by.g.reduce((x, y) => x + y, 0) / 7 : 0)
}
export const healthLevel = (kcal: number): 'fit' | 'balanced' | 'belly' => (kcal <= 1850 ? 'fit' : kcal <= 2250 ? 'balanced' : 'belly')
