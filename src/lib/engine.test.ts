import { describe, expect, it } from 'vitest'
import { buildList, recipeCost, roundBuy, scaleRecipe, toBase } from './engine'
import { ING, STAPLES } from '../data/catalog'
import { RECIPES, REC } from '../data/recipes'

describe('engine', () => {
  it('converts household units with per-ingredient factors', () => {
    expect(toBase(ING.coriander, 2, 'bunch')).toBe(100)
    expect(toBase(ING.oil, 3, 'tbsp')).toBe(45)
    expect(toBase(ING.garlic, 3, 'clove')).toBe(12)
  })
  it('scales by servings', () => {
    expect(scaleRecipe('tajine-poulet', 8).chicken).toBe(2000)
  })
  it('subtracts the pantry and rounds to purchase sizes', () => {
    const l = buildList({ a: { r: 'bissara', n: 4 } }, { fava: 100, ...STAPLES })
    expect(l.find((x) => x.id === 'fava')!.buy).toBe(200)
    expect(l.find((x) => x.id === 'cumin')!.buy).toBe(0)
  })
  it('merges the same ingredient across recipes', () => {
    const l = buildList({ a: { r: 'zaalouk', n: 4 }, b: { r: 'taktouka', n: 4 } }, {})
    expect(l.find((x) => x.id === 'tomato')!.need).toBe(1100)
  })
  it('rounds up', () => { expect(roundBuy(120, 'g')).toBe(150); expect(roundBuy(0.5, 'pc')).toBe(1) })
  it('every recipe resolves with a positive cost', () => {
    for (const r of RECIPES) expect(recipeCost(r.id)).toBeGreaterThan(0)
  })
})

import { composeWeek, adaptToBudget, listCost, composeSides, type Prefs } from './plan'
import { dailyKcal, kcalPerServing, parseIng } from './engine'
const P = (goals: string[], budget = 99999): Prefs => ({ size: 2, diet: [], cuisine: 'ma', region: 'all', goals, meals: ['b', 'l', 'd'], budget })
describe('composer', () => {
  const avg = (g: string[]) => { let s = 0; for (let i = 0; i < 12; i++) s += dailyKcal(composeWeek(P(g), STAPLES, {})); return s / 12 }
  it('healthy < balanced < hearty in calories', () => { const [a, b, c] = [avg(['healthy']), avg([]), avg(['gourmand'])]; expect(a).toBeLessThan(b); expect(b).toBeLessThan(c) })
  it('every breakfast has a drink and is never a lone item', () => {
    const w = composeWeek(P([]), STAPLES, {})
    for (let d = 0; d < 7; d++) { const x = w[`${d}-b`].x!; expect(x.some((s) => s === 'x-the' || s === 'x-cafe')).toBe(true) }
  })
  it('a tajine lunch comes with bread; couscous does not', () => {
    expect(composeSides('tajine-poulet', 'l', () => 0.1)).toContain('x-khobz')
    expect(composeSides('couscous-7', 'l', () => 0.1)).not.toContain('x-khobz')
  })
  it('fits a tight budget', () => {
    const big = composeWeek(P(['gourmand']), STAPLES, {}); const target = listCost(big, STAPLES, {}) * 0.6
    const fit = adaptToBudget(big, target, STAPLES, {}, P([]))
    expect(fit.after).toBeLessThanOrEqual(target)
  })
})

describe('recipe sanity', () => {
  it('every recipe has plausible calories, known ingredients and units', () => {
    for (const r of Object.values(REC)) {
      const k = kcalPerServing(r.id)
      expect(k, r.id).toBeGreaterThan(80)
      expect(k, r.id).toBeLessThan(1000)
      for (const s of r.ing) { const { id } = parseIng(s); expect(ING[id], `${r.id}:${id}`).toBeDefined() }
    }
  })
})
