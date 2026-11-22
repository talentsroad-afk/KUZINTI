import { ING, type Base, type Ing, type Unit } from '../data/catalog'
import { REC } from '../data/recipes'
import { SIDE } from '../data/sides'

const P0: Record<string, number> = {}
/** The household's own reference prices (per base unit, MAD) replace the built-in averages everywhere (list, recipes, store comparison). */
export function applyPriceOverrides(o: Record<string, number> = {}) {
  for (const id of Object.keys(ING)) { P0[id] ??= ING[id].p; ING[id].p = o[id] !== undefined && o[id] >= 0 ? o[id] : P0[id] }
}
export const basePrice = (id: string) => P0[id] ?? ING[id].p
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

/** Frying oil is mostly left in the pan: only ~12 % ends up in the food. Applies when a recipe uses 40 ml or more of oil per serving. */
const FRY_ABSORBED = 0.12
export function kcalOfScaled(q: Record<string, number>, servings: number): number {
  return Object.entries(q).reduce((a, [id, v]) => a + v * ING[id].k * (id === 'oil' && v / servings >= 40 ? FRY_ABSORBED : 1), 0)
}
export function recipeKcal(rid: string, servings = REC[rid].s): number {
  return kcalOfScaled(scaleRecipe(rid, servings), servings)
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
export const entryKcal = (e: PlanEntry) => (kcalOfScaled(scaleRecipe(e.r, e.n), e.n) + sideParts(e).reduce((a, [, part]) => a + Object.entries(part).reduce((b, [id, q]) => b + q * ING[id].k, 0), 0)) / e.n
/** Daily kcal per person: average complete meal for each meal type planned, plus tea-time spread over the week. */
export function dailyKcal(plan: Record<string, PlanEntry>): number {
  const by: Record<string, number[]> = {}
  for (const [k, e] of Object.entries(plan)) (by[k.split('-')[1]] ??= []).push(entryKcal(e))
  const avg = (a?: number[]) => (a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
  return avg(by.b) + avg(by.l) + avg(by.d) + (by.g ? by.g.reduce((x, y) => x + y, 0) / 7 : 0)
}
export const healthLevel = (kcal: number): 'fit' | 'balanced' | 'belly' => (kcal <= 1850 ? 'fit' : kcal <= 2250 ? 'balanced' : 'belly')

/** Approximate protein (g) per base unit of each ingredient, for the sport space. Unlisted items count as ~1 %. */
const PROT: Record<string, number> = { chicken: 0.25, beef: 0.2, lamb: 0.2, sardine: 0.2, fish: 0.2, tuna: 25, egg: 6, flour: 0.1, semolina: 0.12, couscous: 0.12, rice: 0.07, pasta: 0.12, vermicelli: 0.12, lentils: 0.24, chickpeas: 0.19, fava: 0.26, whitebeans: 0.21, oats: 0.13, bread: 9, milk: 0.033, yogurt: 4, cheese: 0.22, almonds: 0.21, sesame: 0.17, warqa: 2, potato: 0.02, butter: 0.01 }
const protOf = (id: string) => PROT[id] ?? (ING[id]?.base === 'pc' ? 0.5 : 0.01)
export const entryProt = (e: PlanEntry) => Object.entries(scaleEntry(e)).reduce((a, [id, q]) => a + q * protOf(id), 0) / e.n
export const protPerServing = (rid: string) => Object.entries(scaleRecipe(rid, REC[rid].s)).reduce((a, [id, q]) => a + q * protOf(id), 0) / REC[rid].s
