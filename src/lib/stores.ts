import type { Aisle } from '../data/catalog'
import type { Line } from './engine'
// DEMO price index per aisle relative to the average estimate. NOT live prices; shown as such in the UI.
export interface Store { id: string; name: string; m: Record<Aisle, number> }
export const STORES: Store[] = [
  { id: 'bim', name: 'BIM', m: { produce: 0.98, meat: 1.05, dairy: 0.97, grocery: 0.92, bakery: 1.0, spices: 0.95 } },
  { id: 'marjane', name: 'Marjane', m: { produce: 1.04, meat: 0.95, dairy: 1.0, grocery: 0.97, bakery: 1.05, spices: 1.0 } },
  { id: 'carrefour', name: 'Carrefour', m: { produce: 1.08, meat: 1.0, dairy: 1.03, grocery: 1.02, bakery: 1.06, spices: 1.05 } },
  { id: 'aswak', name: 'Aswak Assalam', m: { produce: 0.93, meat: 1.0, dairy: 1.05, grocery: 1.0, bakery: 0.98, spices: 1.08 } },
  { id: 'atacadao', name: 'Atacadão', m: { produce: 1.0, meat: 0.96, dairy: 0.95, grocery: 0.9, bakery: 1.1, spices: 0.9 } },
]
export const storeTotal = (lines: Line[], s: Store) => lines.reduce((a, l) => a + l.cost * s.m[l.ing.aisle], 0)
export const splitTotal = (lines: Line[]) => lines.reduce((a, l) => a + l.cost * Math.min(...STORES.map((s) => s.m[l.ing.aisle])), 0)
