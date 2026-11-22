import { describe, expect, it } from 'vitest'
import { buildList, recipeCost, roundBuy, scaleRecipe, toBase } from './engine'
import { ING, STAPLES } from '../data/catalog'
import { RECIPES } from '../data/recipes'

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

import { randomPlan, adaptToBudget, listCost } from './plan'
import { dailyKcal } from './engine'
describe('modes and budget', () => {
  const avg = (m: 'light' | 'balanced' | 'gourmet') => { let s = 0; for (let i = 0; i < 12; i++) s += dailyKcal(randomPlan(2, [], m, 99999, STAPLES, {})); return s / 12 }
  it('light < balanced < gourmet in calories', () => { const [a, b, c] = [avg('light'), avg('balanced'), avg('gourmet')]; expect(a).toBeLessThan(b); expect(b).toBeLessThan(c) })
  it('fits a tight budget by swapping then shrinking portions', () => {
    const big = randomPlan(4, [], 'gourmet', 99999, STAPLES, {})
    const target = listCost(big, STAPLES, {}) * 0.6
    const fit = adaptToBudget(big, target, STAPLES, {}, [])
    expect(fit.after).toBeLessThanOrEqual(target)
    expect(fit.swapped + fit.scaled).toBeGreaterThan(0)
  })
})
