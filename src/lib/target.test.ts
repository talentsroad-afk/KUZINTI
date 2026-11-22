import { describe, it, expect } from 'vitest'
import { composeWeek, listCost } from './plan'
describe('budget target', () => {
  for (const b of [400, 900, 1500]) it(`lands near ${b}`, () => {
    const p = { size: 4, diet: [], cuisine: 'ma', region: 'all', goals: [], meals: ['b', 'l', 'd'] as never, budget: b }
    const t0 = Date.now(); const plan = composeWeek(p as never, {}, {}); const c = listCost(plan, {}, {})
    console.log(b, Math.round(c), Date.now() - t0, 'ms')
    expect(c).toBeLessThanOrEqual(b * 1.01)
    expect(c).toBeGreaterThanOrEqual(b * 0.85)
  })
})
