import { it, expect } from 'vitest'
import { COUNTRY_CITIES, CITIES } from '../Sorties'
import { COUNTRIES } from './countries'
it('c', () => { for (const c of COUNTRIES) { const l = COUNTRY_CITIES[c.id] ?? []; console.log('##', c.id, l.map((x) => x + ':' + CITIES[x]?.length).join(', ')); expect(l.length).toBeGreaterThanOrEqual(2); for (const x of l) { expect(CITIES[x]?.length).toBeGreaterThan(10) } } })
