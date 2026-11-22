import type { Aisle } from '../data/catalog'
import type { Line } from './engine'
// DEMO price index per aisle relative to the average estimate. NOT live prices; shown as such in the UI.
export interface Store { id: string; name: string; m: Record<Aisle, number> }
export const STORES: Store[] = [
  { id: 'bim', name: 'BIM', m: { produce: 0.98, meat: 1.05, dairy: 0.97, grocery: 0.92, bakery: 1.0, spices: 0.95 } },
  { id: 'marjane', name: 'Marjane', m: { produce: 1.04, meat: 0.95, dairy: 1.0, grocery: 0.97, bakery: 1.05, spices: 1.0 } },
  { id: 'carrefour', name: 'Carrefour', m: { produce: 1.08, meat: 1.0, dairy: 1.03, grocery: 1.02, bakery: 1.06, spices: 1.05 } },
  { id: 'aswak', name: 'Aswak Assalam', m: { produce: 0.93, meat: 1.0, dairy: 1.05, grocery: 1.0, bakery: 0.98, spices: 1.08 } },
  { id: 'labelvie', name: "Label'Vie", m: { produce: 1.06, meat: 1.02, dairy: 1.01, grocery: 1.0, bakery: 1.04, spices: 1.03 } },
  { id: 'carrefourmkt', name: 'Carrefour Market', m: { produce: 1.05, meat: 1.03, dairy: 1.02, grocery: 1.01, bakery: 1.03, spices: 1.04 } },
  { id: 'acima', name: 'Acima', m: { produce: 1.03, meat: 1.04, dairy: 1.0, grocery: 1.03, bakery: 1.02, spices: 1.06 } },
  { id: 'supeco', name: 'Supeco', m: { produce: 0.99, meat: 0.98, dairy: 0.96, grocery: 0.91, bakery: 1.04, spices: 0.93 } },
  { id: 'hanout', name: 'Hanout', m: { produce: 1.02, meat: 1.08, dairy: 1.04, grocery: 1.06, bakery: 0.9, spices: 1.1 } },
  { id: 'souk', name: 'Souk', m: { produce: 0.82, meat: 0.92, dairy: 1.08, grocery: 1.05, bakery: 0.92, spices: 0.8 } },
  { id: 'atacadao', name: 'Atacadão', m: { produce: 1.0, meat: 0.96, dairy: 0.95, grocery: 0.9, bakery: 1.1, spices: 0.9 } },
]
export const storeTotal = (lines: Line[], s: Store) => lines.reduce((a, l) => a + l.cost * s.m[l.ing.aisle], 0)
export const splitTotal = (lines: Line[]) => lines.reduce((a, l) => a + l.cost * Math.min(...STORES.map((s) => s.m[l.ing.aisle])), 0)
export const bestStore = (lines: Line[], extra: (s: Store) => number) => STORES.map((s) => ({ s, tot: storeTotal(lines.filter((l) => l.buy > 0), s) + extra(s) })).sort((a, b) => a.tot - b.tot)[0].s
