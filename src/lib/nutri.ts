import type { Recipe } from '../data/recipes'
import { parseIng } from './engine'
import type { Lang } from './i18n'
/** Main nutrients each ingredient is a good source of (general nutrition tables, simplified). */
export type Nut = 'prot' | 'fib' | 'vC' | 'vA' | 'B9' | 'B12' | 'fer' | 'ca' | 'mg' | 'o3' | 'vD' | 'vE' | 'K'
const S: Record<string, Nut[]> = {
  chicken: ['prot', 'B12'], beef: ['prot', 'fer', 'B12'], lamb: ['prot', 'fer', 'B12'], sardine: ['prot', 'o3', 'vD', 'ca', 'B12'], tuna: ['prot', 'o3', 'vD', 'B12'], fish: ['prot', 'o3', 'vD', 'B12'],
  egg: ['prot', 'B12', 'vD'], tomato: ['vC', 'vA', 'K'], potato: ['K', 'vC'], carrot: ['vA', 'fib'], zucchini: ['vC', 'K'], eggplant: ['fib', 'K'], pumpkin: ['vA', 'fib'], pepper: ['vC', 'vA'],
  lemon: ['vC'], plemon: ['vC'], olives: ['vE'], banana: ['K', 'mg'], coriander: ['vA', 'vC'], parsley: ['vC', 'vA', 'B9', 'fer'], mint: ['vA'], oil: ['vE'], flour: [], semolina: ['fib'], couscous: ['fib'],
  rice: [], pasta: [], lentils: ['prot', 'fib', 'fer', 'B9', 'mg'], chickpeas: ['prot', 'fib', 'fer', 'B9', 'mg'], fava: ['prot', 'fib', 'B9', 'fer'], whitebeans: ['prot', 'fib', 'fer', 'B9'], oats: ['fib', 'mg', 'fer'],
  milk: ['ca', 'vD', 'B12'], yogurt: ['ca', 'prot', 'B12'], cheese: ['ca', 'prot'], butter: ['vA'], almonds: ['vE', 'mg', 'ca', 'fib'], dates: ['fib', 'K', 'mg'], orange: ['vC', 'B9'], apple: ['fib', 'vC'],
  sesame: ['ca', 'mg', 'fer'], raisins: ['K', 'fer'], prunes: ['fib', 'K'], honey: [], onion: ['vC'], garlic: [], bread: ['fib'], vermicelli: [], warqa: [],
}
export const NUT: Record<Nut, [string, string, string, string]> = {
  prot: ['💪', 'Protein', 'Protéines', 'بروتين'], fib: ['🌾', 'Fibre', 'Fibres', 'ألياف'], vC: ['🍊', 'Vitamin C', 'Vitamine C', 'فيتامين C'], vA: ['🥕', 'Vitamin A', 'Vitamine A', 'فيتامين A'],
  B9: ['🌱', 'Folate (B9)', 'Folates (B9)', 'حمض الفوليك'], B12: ['🧠', 'Vitamin B12', 'Vitamine B12', 'فيتامين B12'], fer: ['🩸', 'Iron', 'Fer', 'حديد'], ca: ['🦴', 'Calcium', 'Calcium', 'كالسيوم'],
  mg: ['⚡', 'Magnesium', 'Magnésium', 'مغنيزيوم'], o3: ['🐟', 'Omega-3', 'Oméga-3', 'أوميغا 3'], vD: ['☀️', 'Vitamin D', 'Vitamine D', 'فيتامين D'], vE: ['🫒', 'Vitamin E', 'Vitamine E', 'فيتامين E'], K: ['🍌', 'Potassium', 'Potassium', 'بوتاسيوم'],
}
export const nutName = (n: Nut, l: Lang) => NUT[n][l === 'en' ? 1 : l === 'ar' ? 3 : 2]
/** Nutrients a dish is rich in, strongest first (counted over its ingredients). */
export function nutrientsOf(r: Recipe): Nut[] {
  const c: Partial<Record<Nut, number>> = {}
  for (const x of r.ing) for (const n of S[parseIng(x).id] ?? []) c[n] = (c[n] ?? 0) + 1
  return (Object.entries(c) as [Nut, number][]).sort((a, b) => b[1] - a[1]).map(([n]) => n)
}
export type Health = 'none' | 'preg' | 'sport' | 'senior'
export const HEALTH: Record<Health, [string, string, string, string, Nut[]]> = {
  none: ['🙂', 'Standard', 'Standard', 'عادي', []],
  preg: ['🤰', 'Pregnancy', 'Enceinte', 'حامل', ['B9', 'fer', 'ca', 'o3']],
  sport: ['🏋️', 'Sporty', 'Sportif', 'رياضي', ['prot', 'mg', 'K']],
  senior: ['👵', 'Senior', 'Senior', 'كبار السن', ['ca', 'vD', 'fib', 'prot']],
}
// Dishes to avoid during pregnancy (raw egg).
const NO_PREG = new Set(['tamago-gohan'])
export const healthOk = (r: Recipe, h?: string) => !(h === 'preg' && NO_PREG.has(r.id))
/** Composer weight: dishes rich in the nutrients a profile needs come up more often. */
export const healthWeight = (r: Recipe, h?: string) => { if (!h || h === 'none') return 1; const need = HEALTH[h as Health]?.[4] ?? []; const have = nutrientsOf(r).slice(0, 5); return 1 + 0.5 * need.filter((n) => have.includes(n)).length }
