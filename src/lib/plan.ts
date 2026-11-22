import { RECIPES, REC, type Meal, type Recipe } from '../data/recipes'
import { COMPLETE, PASTRY_BF, SIDE, SOUPS } from '../data/sides'
import { buildList, entryCost, kcalPerServing, recipeCost, type PlanEntry } from './engine'

export type Mode = 'light' | 'balanced' | 'gourmet'
type Plan = Record<string, PlanEntry>
export interface Prefs { size: number; diet: string[]; cuisine: string; region: string; goals: string[]; meals: Meal[]; budget: number; kcal?: number }
// Share of the daily calorie target per meal; sides (bread, drink, salad) add roughly 150 kcal to main meals.
const SHARE: Record<Meal, number> = { b: 0.25, l: 0.37, d: 0.28, g: 0.1 }
const kcalFit = (kc: number, slot: Meal, target: number) => { const want = Math.max(150, target * SHARE[slot] - (slot === 'g' ? 0 : 150)); const z = (kc - want) / (0.3 * want); return Math.exp(-z * z) + 0.02 }
export const CUISINES = ['ma', 'mix', 'med', 'fr', 'it', 'es', 'tr', 'in', 'jp', 'hint']
export const FLAG: Record<string, string> = { ma: '🇲🇦', mix: '🌍', med: '🫒', fr: '🇫🇷', it: '🇮🇹', es: '🇪🇸', tr: '🇹🇷', in: '🇮🇳', jp: '🇯🇵', hint: '🥗' }
export const REGIONS = ['all', 'fes', 'casa', 'rabat', 'mrk', 'souss', 'nord']
const REGION_DISHES: Record<string, string[]> = {
  fes: ['pastilla', 'seffa', 'tajine-poulet', 'harira', 'mrouzia', 'briouates', 'ghriba'], casa: ['rfissa', 'couscous-7', 'loubia', 'sardines', 'harira', 'maakouda'],
  rabat: ['rfissa', 'tajine-kefta', 'couscous-tfaya', 'chorba', 'loubia'], mrk: ['tanjia', 'mqualli', 'tajine-agneau', 'harira', 'brochettes'],
  souss: ['couscous-7', 'tajine-legumes', 'bissara', 'tajine-pois-chiches', 'baghrir'], nord: ['bissara', 'sardines', 'tajine-poisson', 'poisson-grille', 'maakouda'],
}
const WORLD = ['it', 'fr', 'es', 'tr', 'in', 'jp', 'int']
export const cuisineOf = (r: Recipe) => WORLD.find((c) => r.tags.includes(c)) ?? 'ma'
export const inCuisine = (r: Recipe, c: string): boolean => c.includes(',') ? c.split(',').some((x) => inCuisine(r, x)) : c === 'mix' ? true : c === 'int' ? cuisineOf(r) !== 'ma' : c === 'med' ? ['ma', 'fr', 'it', 'es', 'tr'].includes(cuisineOf(r)) : c === 'hint' ? cuisineOf(r) !== 'ma' && (r.tags.includes('healthy') || r.tags.includes('vegetarian')) : cuisineOf(r) === c || r.tags.includes(c)
export const modeOf = (goals: string[]): Mode => (goals.includes('healthy') ? 'light' : goals.includes('gourmand') ? 'gourmet' : 'balanced')
export const modeWeight = (mode: Mode, k: number) => mode === 'light' ? (k <= 350 ? 3 : k <= 550 ? 1 : 0.05) : mode === 'balanced' ? (k <= 350 ? 1 : k <= 650 ? 1.6 : k <= 800 ? 0.8 : 0.3) : (k <= 350 ? 0.15 : k <= 650 ? 1 : 3)
export const listCost = (plan: Plan, pantry: Record<string, number>, extras: Record<string, number>, qty: Record<string, number> = {}) => buildList(plan, pantry, extras, qty).reduce((a, l) => a + l.cost, 0)

/** Dishes allowed for a slot. Falls back to every cuisine when the chosen one has too few (e.g. Japanese breakfast). */
export function pool(slot: Meal, p: Pick<Prefs, 'cuisine' | 'diet'>): Recipe[] {
  const base = RECIPES.filter((r) => r.m.includes(slot) && (!p.diet.includes('vegetarian') || r.tags.includes('vegetarian')))
  const c = base.filter((r) => inCuisine(r, p.cuisine))
  if (c.length >= 4 || p.cuisine === 'ma' || p.cuisine.split(',').includes('ma')) return c.length ? c : base
  // Small foreign catalogs: complete with other world dishes first, Moroccan only as a last resort.
  const world = base.filter((r) => !c.includes(r) && cuisineOf(r) !== 'ma')
  const mix = [...c, ...world]
  return mix.length >= 3 ? mix : [...mix, ...base.filter((r) => cuisineOf(r) === 'ma')]
}
function weight(r: Recipe, slot: Meal, p: Prefs, used: Record<string, number>) {
  const g = p.goals
  return (1 / (1 + (used[r.id] ?? 0) * (g.includes('varied') ? 10 : 4))) * (p.kcal ? kcalFit(kcalPerServing(r.id), slot, p.kcal) : modeWeight(modeOf(g), kcalPerServing(r.id)))
    * (g.includes('cheap') ? 8 / (2 + recipeCost(r.id) / r.s) : 1) * (g.includes('quick') ? (r.t <= 35 ? 3 : 0.4) : 1)
    * (p.region !== 'all' && REGION_DISHES[p.region]?.includes(r.id) ? 2.5 : 1) * (r.tags.includes('sweet') && slot !== 'g' && slot !== 'b' ? 0.1 : 1)
}
const pickW = <T,>(items: T[], w: number[], rnd = Math.random) => { let x = rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i] } return items[0] }

/** Turn a dish into a complete, culturally coherent meal (bread, salad, drink, fruit…), without padding full meals. */
export function composeSides(rid: string, slot: Meal, rnd = Math.random): string[] {
  const r = REC[rid]; const c = cuisineOf(r)
  if (slot === 'g') return rid === 'the-dattes' ? [] : c === 'ma' ? ['x-the'] : ['x-cafe']
  if (slot === 'b') {
    const drink = c === 'ma' ? (rnd() < 0.75 ? 'x-the' : 'x-cafe') : 'x-cafe'
    const x: string[] = []
    if (PASTRY_BF.has(rid)) x.push(rnd() < 0.6 ? 'x-huilemiel' : 'x-amlou', rnd() < 0.5 ? 'x-fromage' : 'x-oeuf')
    else if (['omelette', 'shakshuka', 'bissara', 'menemen', 'tortilla', 'khlii-oeufs'].includes(rid)) { if (rid !== 'khlii-oeufs') x.push('x-khobz'); if (rnd() < 0.4) x.push('x-fromage') }
    else x.push('x-fruit')
    if (rnd() < 0.3) x.push('x-jus')
    return [...x, drink]
  }
  if (SOUPS.has(rid)) return rid === 'harira' ? ['x-khobz', 'x-dattes'] : ['x-khobz']
  if (COMPLETE.has(rid)) return slot === 'l' && rnd() < 0.7 ? [rnd() < 0.5 ? 'x-orange' : 'x-fruit'] : []
  const x = [c === 'in' || c === 'jp' ? 'x-riz' : 'x-khobz']
  if (c === 'ma' && (slot === 'l' || rnd() < 0.4)) x.push(['x-salade', 'x-carottes', 'x-zaalouk'][Math.floor(rnd() * 3)])
  if (slot === 'l' && rnd() < 0.6) x.push(rnd() < 0.5 ? 'x-orange' : 'x-fruit')
  return x
}
export const entry = (rid: string, n: number, slot: Meal): PlanEntry => ({ r: rid, n, x: composeSides(rid, slot) })

/** Moroccan household rhythm: simple weekday ftour, msemen/baghrir at the weekend, tajine lunches,
 *  couscous on Friday, a festive Sunday lunch, soups and light plates at dinner. Days are 0 = Monday. */
const WEEKDAY_BF = ['khlii-oeufs', 'omelette', 'amlou', 'harcha', 'bissara', 'msemen']
const WEEKEND_BF = ['msemen', 'baghrir', 'rghaif', 'sfenj', 'harcha', 'shakshuka']
const LIGHT_DIN = ['harira', 'chorba', 'soupe-legumes', 'soupe-lentilles', 'bissara', 'maakouda', 'salade-thon', 'poisson-grille', 'loubia', 'omelette', 'shakshuka', 'zaalouk', 'veloute-potiron', 'brochettes', 'sandwich-kefta', 'sardines']
const FEAST = ['pastilla', 'rfissa', 'tajine-agneau', 'tajine-pruneaux', 'mrouzia', 'tanjia', 'seffa']
function rhythm(r: Recipe, s: Meal, d: number) {
  const id = r.id
  if (s === 'b') return (d >= 5 ? WEEKEND_BF : WEEKDAY_BF).includes(id) ? (id === 'khlii-oeufs' && d < 5 ? 4 : 2) : 0.05
  if (s === 'l') { if (id.startsWith('couscous')) return 0.02; if (FEAST.includes(id)) return d === 6 ? 6 : 0.15; return id.startsWith('tajine') || ['mqualli', 'poulet-citron', 'loubia', 'riz-poulet'].includes(id) ? 2 : 1 }
  if (s === 'd') return LIGHT_DIN.includes(id) ? (['harira', 'chorba', 'soupe-legumes'].includes(id) ? 2.5 : 1.5) : 0.03
  return 1
}

/** One tap: a complete, varied week built from the user's preferences, then fitted to the budget. */
export function composeWeek(p: Prefs, pantry: Record<string, number>, extras: Record<string, number>): Plan {
  const used: Record<string, number> = {}; const plan: Plan = {}
  for (let d = 0; d < 7; d++) for (const s of p.meals) {
    const pl = pool(s, p); if (!pl.length) continue
    const ma = p.cuisine === 'ma'
    const fri = ma && s === 'l' && d === 4 ? pl.filter((x) => x.id.startsWith('couscous')) : []
    const r = fri.length ? fri[Math.floor(Math.random() * fri.length)] : pickW(pl, pl.map((x) => weight(x, s, p, used) * (ma ? rhythm(x, s, d) : 1)))
    used[r.id] = (used[r.id] ?? 0) + 1; plan[`${d}-${s}`] = entry(r.id, p.size, s)
  }
  return adaptToBudget(plan, p.budget, pantry, extras, p).plan
}
/** Replace one meal with a relevant random dish (Surprise me). */
export function surpriseOne(key: string, plan: Plan, p: Prefs): PlanEntry {
  const slot = key.split('-')[1] as Meal; const used: Record<string, number> = {}
  Object.values(plan).forEach((e) => { used[e.r] = (used[e.r] ?? 0) + 1 })
  const pl = pool(slot, p).filter((r) => r.id !== plan[key]?.r)
  const r = pickW(pl, pl.map((x) => weight(x, slot, p, used)))
  return entry(r.id, plan[key]?.n ?? p.size, slot)
}
/** Alternatives for one meal, ranked by the chosen filter. */
export function alternatives(key: string, plan: Plan, p: Prefs, f: string): Recipe[] {
  const slot = key.split('-')[1] as Meal; const cur = plan[key]; const curR = cur ? REC[cur.r] : null
  let list = RECIPES.filter((r) => r.m.includes(slot) && r.id !== cur?.r && (!p.diet.includes('vegetarian') || r.tags.includes('vegetarian')))
  if (f !== 'all') list = list.filter((r) => inCuisine(r, p.cuisine === 'mix' && curR ? cuisineOf(curR) : p.cuisine))
  if (f === 'veg') list = list.filter((r) => r.tags.includes('vegetarian'))
  if (f === 'cheaper' && curR) list = list.filter((r) => recipeCost(r.id) / r.s < recipeCost(curR.id) / curR.s)
  if (f === 'healthier' && curR) list = list.filter((r) => kcalPerServing(r.id) < kcalPerServing(curR.id))
  const key2 = (r: Recipe) => f === 'cheaper' ? recipeCost(r.id) / r.s : f === 'healthier' ? kcalPerServing(r.id) : f === 'quick' ? r.t : -weight(r, slot, p, {}) - (curR ? r.tags.filter((x) => curR.tags.includes(x)).length * 0.3 : 0)
  return list.sort((a, b) => key2(a) - key2(b))
}

export interface Fit { plan: Plan; swapped: number; scaled: number; trimmed: number; before: number; after: number }
/** Fit the list to a budget: cheaper dishes in the same slot, then drop optional sides, then smaller portions. */
export function adaptToBudget(plan: Plan, budget: number, pantry: Record<string, number>, extras: Record<string, number>, p: Pick<Prefs, 'cuisine' | 'diet'>): Fit {
  const cur: Plan = JSON.parse(JSON.stringify(plan)); const before = listCost(cur, pantry, extras); let cost = before; let trimmed = 0
  for (let it = 0; it < 40 && cost > budget; it++) {
    let best: { k: string; e: PlanEntry; c: number } | null = null
    for (const k of Object.keys(cur)) {
      const slot = k.split('-')[1] as Meal
      for (const r of pool(slot, p)) {
        if (r.id === cur[k].r || recipeCost(r.id, cur[k].n) >= recipeCost(cur[k].r, cur[k].n)) continue
        const e = { r: r.id, n: cur[k].n, x: composeSides(r.id, slot, () => 0.99) }
        const c = listCost({ ...cur, [k]: e }, pantry, extras)
        if (!best || c < best.c) best = { k, e, c }
      }
    }
    if (!best || best.c >= cost) break
    cur[best.k] = best.e; cost = best.c
  }
  for (const k of Object.keys(cur)) { if (cost <= budget) break; const x = cur[k].x ?? []; const keep = x.filter((s) => !SIDE[s]?.opt); if (keep.length < x.length) { cur[k] = { ...cur[k], x: keep }; trimmed++; cost = listCost(cur, pantry, extras) } }
  for (let it = 0; it < 60 && cost > budget; it++) {
    let best: { k: string; c: number } | null = null
    for (const k of Object.keys(cur)) { if (cur[k].n <= 1) continue; const c = listCost({ ...cur, [k]: { ...cur[k], n: cur[k].n - 1 } }, pantry, extras); if (!best || c < best.c) best = { k, c } }
    if (!best || best.c >= cost) break
    cur[best.k] = { ...cur[best.k], n: cur[best.k].n - 1 }; cost = best.c
  }
  const keys = Object.keys(plan)
  return { plan: cur, swapped: keys.filter((k) => cur[k].r !== plan[k].r).length, scaled: keys.filter((k) => cur[k].r === plan[k].r && cur[k].n < plan[k].n).length, trimmed, before, after: cost }
}

/** Re-shape the user's own week for a goal: keep dishes that fit, swap the others for the closest one that does. */
export function adaptToMode(plan: Plan, mode: Mode, p: Pick<Prefs, 'cuisine' | 'diet'>): { plan: Plan; changed: number } {
  const cur: Plan = JSON.parse(JSON.stringify(plan)); const used: Record<string, number> = {}
  Object.values(cur).forEach((e) => { used[e.r] = (used[e.r] ?? 0) + 1 })
  let changed = 0
  for (const k of Object.keys(cur)) {
    const slot = k.split('-')[1] as Meal; const now = REC[cur[k].r]
    if (modeWeight(mode, kcalPerServing(now.id)) >= 1) continue
    const best = pool(slot, p).filter((r) => r.id !== now.id && modeWeight(mode, kcalPerServing(r.id)) >= 1)
      .map((r) => ({ r, s: r.tags.filter((x) => now.tags.includes(x)).length * 2 - (used[r.id] ?? 0) * 3 + modeWeight(mode, kcalPerServing(r.id)) }))
      .sort((a, b) => b.s - a.s)[0]
    if (!best) continue
    used[now.id]--; used[best.r.id] = (used[best.r.id] ?? 0) + 1; cur[k] = { r: best.r.id, n: cur[k].n, x: composeSides(best.r.id, slot) }; changed++
  }
  return { plan: cur, changed }
}
export const offMode = (plan: Plan, mode: Mode) => Object.values(plan).filter((e) => modeWeight(mode, kcalPerServing(e.r)) < 1).length
export const weekCost = (plan: Plan) => Object.values(plan).reduce((a, e) => a + entryCost(e), 0)
