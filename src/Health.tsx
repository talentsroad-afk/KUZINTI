import { useState } from 'react'
import { Share2, RefreshCw, Play, Apple, BedDouble, ChevronDown, Coffee, Droplet, Dumbbell, Moon, Salad, Sandwich, Scale, Soup, Sun, Sunrise, type LucideIcon } from 'lucide-react'
import type { Lang } from './lib/i18n'
import { buildProgram } from './Program'
import { WorkoutStory } from './Coach'
import type { SportProfile } from './Sport'
import { NUT, nutName, type Nut } from './lib/nutri'

type Lvl = 'beg' | 'mid' | 'adv'
const L = (l: Lang, en: string, fr: string) => (l === 'en' ? en : fr)
/** Sport-nutrition meals, independent of the country: [fr, en, kcal, protein g, foods with grams for one portion]. */
type M = [string, string, number, number, [string, number, string][]]
const BRK: M[] = [
  ['Porridge avoine, banane, beurre de cacahuète', 'Oat porridge, banana, peanut butter', 520, 22, [['Flocons d’avoine', 60, 'g'], ['Lait', 250, 'ml'], ['Banane', 1, 'pc'], ['Beurre de cacahuète', 15, 'g']]],
  ['Omelette 3 œufs, pain complet, avocat', '3-egg omelette, wholegrain bread, avocado', 510, 26, [['Œufs', 3, 'pc'], ['Pain complet', 60, 'g'], ['Avocat', 0.5, 'pc']]],
  ['Yaourt grec, granola, fruits rouges, miel', 'Greek yoghurt, granola, berries, honey', 430, 28, [['Yaourt grec', 250, 'g'], ['Granola', 40, 'g'], ['Fruits rouges', 100, 'g'], ['Miel', 10, 'g']]],
  ['Pancakes avoine-banane-œufs', 'Oat-banana-egg pancakes', 450, 25, [['Flocons d’avoine', 50, 'g'], ['Œufs', 2, 'pc'], ['Banane', 1, 'pc'], ['Fromage blanc', 100, 'g']]],
  ['Œufs brouillés tomate, pain complet', 'Scrambled eggs with tomato, wholegrain bread', 440, 24, [['Œufs', 3, 'pc'], ['Tomates', 150, 'g'], ['Pain complet', 60, 'g'], ['Huile d’olive', 5, 'ml']]],
  ['Bissara, huile d’olive, pain complet', 'Split-pea soup, olive oil, wholegrain bread', 430, 22, [['Bissara', 300, 'ml'], ['Huile d’olive', 10, 'ml'], ['Pain complet', 60, 'g']]],
  ['Fromage blanc, flocons d’avoine, dattes, amandes', 'Quark, oats, dates, almonds', 470, 30, [['Fromage blanc', 200, 'g'], ['Flocons d’avoine', 40, 'g'], ['Dattes', 3, 'pc'], ['Amandes', 15, 'g']]],
  ['Smoothie banane, lait, avoine, cacahuète', 'Banana, milk, oat and peanut smoothie', 480, 22, [['Lait', 300, 'ml'], ['Banane', 1, 'pc'], ['Flocons d’avoine', 40, 'g'], ['Beurre de cacahuète', 15, 'g']]],
]
const LUN: M[] = [
  ['Poulet grillé, riz basmati, brocoli', 'Grilled chicken, basmati rice, broccoli', 620, 52, [['Blanc de poulet', 150, 'g'], ['Riz (cru)', 80, 'g'], ['Brocoli', 200, 'g'], ['Huile d’olive', 10, 'ml']]],
  ['Saumon, quinoa, légumes rôtis', 'Salmon, quinoa, roasted vegetables', 650, 40, [['Saumon', 130, 'g'], ['Quinoa (cru)', 70, 'g'], ['Courgette, poivron', 200, 'g']]],
  ['Bowl lentilles, feta, crudités', 'Lentil bowl, feta, raw veg', 560, 30, [['Lentilles cuites', 200, 'g'], ['Feta', 40, 'g'], ['Crudités', 150, 'g'], ['Huile d’olive', 10, 'ml']]],
  ['Wrap thon, houmous, crudités', 'Tuna wrap, hummus, raw veg', 540, 38, [['Tortilla complète', 1, 'pc'], ['Thon', 120, 'g'], ['Houmous', 40, 'g'], ['Crudités', 100, 'g']]],
  ['Bœuf 5 %, patate douce, haricots verts', 'Lean beef, sweet potato, green beans', 600, 45, [['Bœuf haché 5 %', 150, 'g'], ['Patate douce', 250, 'g'], ['Haricots verts', 150, 'g']]],
  ['Sardines grillées, salade marocaine, pain complet', 'Grilled sardines, Moroccan salad, wholegrain bread', 560, 38, [['Sardines', 200, 'g'], ['Salade marocaine', 250, 'g'], ['Pain complet', 60, 'g'], ['Huile d’olive', 10, 'ml']]],
  ['Harira légère, 2 œufs durs, dattes', 'Light harira, 2 boiled eggs, dates', 520, 32, [['Harira', 400, 'ml'], ['Œufs durs', 2, 'pc'], ['Dattes', 3, 'pc']]],
  ['Poulet rôti, lentilles, carottes', 'Roast chicken, lentils, carrots', 610, 55, [['Blanc de poulet', 160, 'g'], ['Lentilles cuites', 180, 'g'], ['Carottes', 150, 'g'], ['Huile d’olive', 10, 'ml']]],
  ['Kefta de bœuf maigre, riz, légumes', 'Lean beef kefta, rice, vegetables', 620, 44, [['Bœuf haché 5 %', 140, 'g'], ['Riz (cru)', 80, 'g'], ['Légumes', 200, 'g']]],
]
const DIN: M[] = [
  ['Cabillaud vapeur, légumes, pommes de terre', 'Steamed cod, vegetables, potatoes', 450, 38, [['Cabillaud', 160, 'g'], ['Pommes de terre', 200, 'g'], ['Légumes', 200, 'g']]],
  ['Omelette aux légumes, salade, pain complet', 'Veggie omelette, salad, wholegrain bread', 420, 26, [['Œufs', 3, 'pc'], ['Légumes', 150, 'g'], ['Pain complet', 40, 'g']]],
  ['Curry léger de poulet, riz complet', 'Light chicken curry, brown rice', 520, 40, [['Poulet', 140, 'g'], ['Riz complet (cru)', 60, 'g'], ['Lait de coco light', 80, 'ml']]],
  ['Soupe de légumes, œufs durs, fromage blanc', 'Vegetable soup, boiled eggs, quark', 400, 30, [['Soupe de légumes', 400, 'ml'], ['Œufs durs', 2, 'pc'], ['Fromage blanc', 150, 'g']]],
  ['Tofu sauté, nouilles soba, légumes', 'Stir-fried tofu, soba noodles, vegetables', 480, 26, [['Tofu ferme', 150, 'g'], ['Nouilles soba (crues)', 60, 'g'], ['Légumes', 200, 'g']]],
  ['Tajine de poulet aux légumes, semoule complète', 'Chicken and vegetable tagine, wholegrain semolina', 520, 42, [['Poulet', 150, 'g'], ['Légumes', 250, 'g'], ['Semoule complète (crue)', 50, 'g']]],
  ['Lentilles aux légumes, œuf poché', 'Lentils with vegetables, poached egg', 450, 28, [['Lentilles cuites', 220, 'g'], ['Légumes', 150, 'g'], ['Œufs', 1, 'pc']]],
  ['Poisson blanc au four, pommes de terre, courgettes', 'Baked white fish, potatoes, courgettes', 460, 40, [['Poisson blanc', 170, 'g'], ['Pommes de terre', 200, 'g'], ['Courgettes', 200, 'g']]],
  ['Salade de pois chiches, thon, œuf', 'Chickpea, tuna and egg salad', 480, 38, [['Pois chiches cuits', 180, 'g'], ['Thon', 100, 'g'], ['Œufs', 1, 'pc'], ['Crudités', 150, 'g']]],
]
const PRE: M[] = [['Banane et amandes', 'Banana and almonds', 250, 6, [['Banane', 1, 'pc'], ['Amandes', 20, 'g']]], ['Pain complet et miel', 'Wholegrain bread and honey', 220, 6, [['Pain complet', 50, 'g'], ['Miel', 15, 'g']]]]
const POST: M[] = [['Shaker lait et banane', 'Milk and banana shake', 300, 25, [['Lait', 300, 'ml'], ['Banane', 1, 'pc'], ['Whey (option)', 20, 'g']]], ['Skyr et fruit', 'Skyr and fruit', 200, 20, [['Skyr', 200, 'g'], ['Fruit', 1, 'pc']]], ['2 œufs durs et une pomme', '2 boiled eggs and an apple', 230, 13, [['Œufs durs', 2, 'pc'], ['Pomme', 1, 'pc']]]]
const SNK: M[] = [['Fruit et poignée de noix', 'Fruit and a handful of nuts', 220, 5, [['Fruit', 1, 'pc'], ['Noix', 20, 'g']]], ['Fromage blanc et cannelle', 'Quark and cinnamon', 160, 16, [['Fromage blanc', 200, 'g']]]]


/** Main vitamins and minerals of each food of a sport meal (general nutrition tables, simplified), matched on the food name. */
const FOOD_TAGS: [RegExp, Nut[]][] = [
  [/avoine/i, ['fib', 'mg', 'fer']], [/lait|yaourt|yogourt|fromage blanc|skyr|feta|fromage|quark/i, ['ca', 'B12']], [/banane/i, ['K', 'mg']], [/cacahu|amande|noix/i, ['vE', 'mg']],
  [/œuf|oeuf/i, ['B12', 'vD', 'prot']], [/pain complet|semoule complète|riz complet|soba/i, ['fib', 'mg']], [/avocat/i, ['K', 'vE', 'B9']], [/fruits? rouges|fruit$|pomme(?! de)|orange/i, ['vC']],
  [/granola/i, ['fib']], [/poulet|dinde/i, ['prot', 'B12']], [/brocoli|haricots verts/i, ['vC', 'K', 'B9']], [/saumon/i, ['o3', 'vD', 'B12']], [/quinoa/i, ['mg', 'fer', 'fib']],
  [/courgette|poivron|tomate/i, ['vC', 'vA']], [/lentilles|pois chiches|bissara/i, ['fer', 'B9', 'fib']], [/crudités|légumes|carotte|soupe/i, ['vC', 'vA', 'K']], [/thon|sardine/i, ['o3', 'vD', 'B12']],
  [/houmous/i, ['B9', 'fer']], [/bœuf|boeuf|kefta/i, ['fer', 'B12']], [/patate douce/i, ['vA', 'K', 'vC']], [/cabillaud|poisson/i, ['B12', 'vD']], [/pommes de terre/i, ['K', 'vC']],
  [/tofu/i, ['ca', 'fer']], [/dattes/i, ['K', 'mg', 'fib']], [/harira/i, ['fer', 'B9']], [/huile d’olive/i, ['vE']],
]
export function mealTags(foods: string[]): Nut[] {
  const c: Partial<Record<Nut, number>> = {}
  for (const f of foods) for (const [re, ns] of FOOD_TAGS) if (re.test(f)) for (const n of ns) c[n] = (c[n] ?? 0) + 1
  return (Object.entries(c) as [Nut, number][]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => n)
}
const Tags = ({ ns, lang }: { ns?: Nut[]; lang: Lang }) => ns && ns.length ? <span className="mt-1 flex flex-wrap gap-1">{ns.map((n) => <span key={n} className="rounded-full bg-surface px-1.5 py-0.5 text-[12px] font-semibold text-forest shadow-soft">{NUT[n][0]} {nutName(n, lang)}</span>)}</span> : null

type Item = { at: string; icon: LucideIcon; tone: string; title: string; sub?: string; kcal?: number; prot?: number; list?: [string, string][]; slot?: string; tags?: Nut[] }
const fmtQ = (q: number, u: string) => u === 'pc' ? (q < 1 ? '½' : `${Math.round(q * 2) / 2}`) : `${Math.round(q / 5) * 5} ${u}`
export type Swaps = Record<string, number>

/** One day of the plan: meals sized to the calorie target, the session from the programme, water and sleep, in time order.
 *  `sw` holds the person's own changes: how many options a given meal slot was moved forward. */
export function dayPlan(p: SportProfile & { lvl?: Lvl }, week: number, d: number, kcal: number, lang: Lang, am: boolean, sw: Swaps = {}) {
  const { days } = buildProgram(p, week); const s = days[d]; const k = d + week * 7
  const pick = <T,>(a: T[], o = 0, key = '') => a[(k + o + (sw[`${week}-${d}-${key}`] ?? 0)) % a.length]
  const meals: [string, M, LucideIcon, string][] = [['b', pick(BRK, 0, 'b'), Sunrise, '#e8892b'], ['l', pick(LUN, 1, 'l'), Salad, '#25a35a'], ['d', pick(DIN, 2, 'd'), Soup, '#5b6bd6']]
  const snacks: [string, M][] = s ? [['pre', pick(PRE, 0, 'pre')], ['post', pick(POST, 1, 'post')]] : [['snk', pick(SNK, 0, 'snk')]]
  const base = meals.reduce((a, m) => a + m[1][2], 0) + snacks.reduce((a, m) => a + m[1][2], 0)
  const f = Math.max(0.7, Math.min(1.6, kcal / base))
  const meal = (m: M): Pick<Item, 'title' | 'kcal' | 'prot' | 'list' | 'tags'> => ({ tags: mealTags(m[4].map((f) => f[0])), title: lang === 'en' ? m[1] : m[0], kcal: Math.round(m[2] * f / 10) * 10, prot: Math.round(m[3] * f), list: m[4].map(([n, q, u]) => [n, fmtQ(q * f, u)]) })
  const sn = (i: number) => ({ ...meal(snacks[i][1]), slot: snacks[i][0] })
  const items: Item[] = [
    { at: '07:00', icon: Droplet, tone: '#2f9be6', title: L(lang, 'Wake up · big glass of water', 'Réveil · un grand verre d’eau'), sub: '500 ml' },
    { at: '07:30', icon: meals[0][2], tone: meals[0][3], slot: 'b', ...meal(meals[0][1]) },
  ]
  const sess: Item | null = s ? { at: am ? '09:30' : '18:00', icon: Dumbbell, tone: ['#25a35a', '#e0a526', '#e5484d'][s.hard - 1], title: s.t, sub: `${s.min} min`, list: s.ex.map(([a, b]) => [a, b]) } : null
  if (s && am) items.push({ at: '09:00', icon: Apple, tone: '#e0a526', ...sn(0) }, sess!, { at: '10:45', icon: Coffee, tone: '#9a6a3a', ...sn(1) })
  else if (!s) items.push({ at: '10:30', icon: Apple, tone: '#e0a526', ...sn(0) })
  items.push({ at: '12:30', icon: meals[1][2], tone: meals[1][3], slot: 'l', ...meal(meals[1][1]) })
  if (s && !am) items.push({ at: '16:30', icon: Apple, tone: '#e0a526', ...sn(0) }, sess!, { at: '19:15', icon: Sandwich, tone: '#9a6a3a', ...sn(1) })
  if (!s) items.push({ at: '18:00', icon: Sun, tone: '#25a35a', title: L(lang, 'Active rest · 30 min walk', 'Repos actif · 30 min de marche'), sub: L(lang, 'or 15 min of stretching', 'ou 15 min d’étirements') })
  items.push({ at: '20:00', icon: meals[2][2], tone: meals[2][3], slot: 'd', ...meal(meals[2][1]) }, { at: '22:30', icon: BedDouble, tone: '#5b6bd6', title: L(lang, 'Sleep 7–9 h', 'Dodo 7 à 9 h'), sub: L(lang, 'Muscles grow while you sleep', 'Les muscles se construisent en dormant') })
  const tk = items.reduce((a, x) => a + (x.kcal ?? 0), 0); const tp = items.reduce((a, x) => a + (x.prot ?? 0), 0)
  return { items, tk, tp, s }
}

export function HealthPlan({ p, set, lang, kcal, prot, wk0 = 0, blk = 0 }: { blk?: number; wk0?: number; p: SportProfile & { lvl?: Lvl }; set: (o: Partial<SportProfile & { lvl?: Lvl }>) => void; lang: Lang; kcal: number; prot: number }) {
  const today = (new Date().getDay() + 6) % 7
  const [view, setView] = useState<'day' | 'week' | 'month'>('day'); const [w, setW] = useState(wk0); const [d, setD] = useState(today); const [open, setOpen] = useState<number | null>(null); const [am, setAm] = useState(false); const [story, setStory] = useState<{ t: string; ex: [string, string][] } | null>(null)
  const DN = lang === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const sw = p.sw ?? {}; const wa = w + blk * 4
  const swap = (wk: number, dd: number, slot: string) => { const key = `${wk}-${dd}-${slot}`; set({ sw: { ...sw, [key]: (sw[key] ?? 0) + 1 } }) }
  const [wOpen, setWOpen] = useState<number | null>(null); const [mOpen, setMOpen] = useState<number | null>(null)
  const planText = (wk: number) => DN.map((n, i) => { const x = dayPlan(p, wk, i, kcal, lang, am, sw); return `${n} · ${x.tk} kcal\n` + x.items.filter((y) => y.slot).map((y) => `  ${y.at} ${y.title}${y.tags?.length ? ' [' + y.tags.map((t) => nutName(t, lang)).join(', ') + ']' : ''}`).join('\n') }).join('\n\n')
  const sharePlan = async (wk: number) => { const txt = `${L(lang, 'My meal plan', 'Mon plan d’alimentation')} · ${L(lang, 'week', 'semaine')} ${wk + 1}\n\n${planText(wk)}`; try { if (navigator.share) await navigator.share({ text: txt }); else await navigator.clipboard.writeText(txt) } catch { /* cancelled */ } }
  const day = dayPlan(p, wa, d, kcal, lang, am, sw)
  const perWeek = p.goal === 'cut' ? -0.5 : p.goal === 'bulk' ? 0.25 : 0
  return (
    <section className="rounded-[24px] bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2"><h2 className="whitespace-nowrap font-display text-[17px] font-extrabold">{L(lang, 'My plan', 'Mon programme')}</h2>
        <div className="flex rounded-full bg-cream p-0.5 text-xs font-bold">{(['day', 'week', 'month'] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`rounded-full px-3 py-1.5 transition ${view === v ? 'bg-forest text-white' : 'text-muted'}`}>{{ day: L(lang, 'Day', 'Jour'), week: L(lang, 'Week', 'Semaine'), month: L(lang, 'Month', 'Mois') }[v]}</button>)}</div></div>
      <div className="mt-3 flex rounded-full bg-cream p-1">{(['beg', 'mid', 'adv'] as Lvl[]).map((l) => <button key={l} onClick={() => set({ lvl: l })} className={`flex-1 rounded-full py-1.5 text-[13px] font-bold transition ${(p.lvl ?? 'beg') === l ? 'bg-surface text-forest shadow-soft' : 'text-muted'}`}>{{ beg: L(lang, 'Beginner', 'Débutant'), mid: L(lang, 'Intermediate', 'Intermédiaire'), adv: L(lang, 'Advanced', 'Confirmé') }[l]}</button>)}</div>
      {view !== 'month' && <div className="mt-2 flex gap-1.5">{[0, 1, 2, 3].map((i) => <button key={i} onClick={() => setW(i)} className={`flex-1 rounded-xl py-1.5 text-xs font-bold ${w === i ? 'bg-ink text-white' : 'bg-cream text-muted'}`}>{L(lang, 'Wk', 'S')}{i + 1}{i === 3 ? ' · ' + L(lang, 'rec.', 'récup') : ''}</button>)}</div>}

      {view === 'day' && <>
        <div className="mt-3 grid grid-cols-7 gap-1">{DN.map((n, i) => { const has = !!buildProgram(p, w + blk * 4).days[i]; return <button key={i} onClick={() => { setD(i); setOpen(null) }} className={`rounded-xl py-1.5 text-center transition ${d === i ? 'bg-forest text-white' : 'bg-cream'}`}><span className="block text-[12px] font-extrabold uppercase">{n}</span><span className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${has ? (d === i ? 'bg-apricot' : 'bg-forest') : 'bg-transparent'}`} /></button> })}</div>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-cream/70 px-3 py-2 text-xs"><span><b className="font-display text-base tabular-nums">{day.tk}</b> kcal · <b className="tabular-nums">{day.tp} g</b> {L(lang, 'protein', 'protéines')}</span>
          {day.s && <span className="flex rounded-full bg-surface p-0.5 font-bold">{[[true, L(lang, 'Morning', 'Matin')], [false, L(lang, 'Evening', 'Soir')]].map(([v, l]) => <button key={String(v)} onClick={() => setAm(v as boolean)} className={`rounded-full px-2.5 py-1 ${am === v ? 'bg-forest text-white' : 'text-muted'}`}>{l as string}</button>)}</span>}</div>
        <ol key={`${w}-${d}-${am}`} className="stagger relative mt-3 space-y-2 before:absolute before:bottom-3 before:start-[52px] before:top-3 before:w-0.5 before:bg-line">{day.items.map((x, i) => (
          <li key={i} className="relative flex gap-2.5">
            <span className="w-10 shrink-0 pt-2.5 text-end text-[12px] font-bold tabular-nums text-muted">{x.at}</span>
            <span className="relative z-10 mt-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ring-4 ring-surface" style={{ background: x.tone }}><x.icon size={14} strokeWidth={2.4} aria-hidden /></span>
            <button className={`min-w-0 flex-1 rounded-2xl px-3 py-2 text-start transition ${x.list ? 'active:scale-[.99]' : ''} ${x.icon === Dumbbell ? 'bg-forest text-white' : 'bg-cream/70'}`} onClick={() => x.list && setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span className="flex items-start gap-2"><b className="flex-1 text-[14px] leading-snug">{x.title}</b>{x.slot && <span role="button" tabIndex={0} aria-label={L(lang, 'Another meal', 'Autre repas')} onClick={(ev) => { ev.stopPropagation(); swap(wa, d, x.slot!) }} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-forest shadow-soft active:scale-90"><RefreshCw size={14} aria-hidden /></span>}{x.list && <ChevronDown size={16} className={`mt-0.5 shrink-0 opacity-60 transition-transform ${open === i ? 'rotate-180' : ''}`} aria-hidden />}</span>
              <span className={`block text-xs ${x.icon === Dumbbell ? 'text-white/75' : 'text-muted'}`}>{x.kcal ? `${x.kcal} kcal · ${x.prot} g ${L(lang, 'protein', 'prot.')}` : x.sub}</span>
              {x.kcal ? <Tags ns={x.tags} lang={lang} /> : null}
              {open === i && x.list && <ul className="fade-up mt-2 space-y-0.5 border-t border-current/10 pt-2">{x.list.map(([n, q], j) => <li key={j} className="flex justify-between gap-2 text-[13px]"><span>{n}</span><b className="tabular-nums">{q}</b></li>)}</ul>}
              {x.icon === Dumbbell && x.list && <span role="button" tabIndex={0} onClick={(ev) => { ev.stopPropagation(); setStory({ t: x.title, ex: x.list! }) }} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-apricot py-2 text-sm font-extrabold text-ink active:scale-95"><Play size={15} aria-hidden /> {L(lang, 'Start with the coach', 'Démarrer avec le coach')}</span>}
            </button></li>))}</ol>
      </>}

      {view !== 'day' && <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-cream py-2 text-sm font-bold text-forest active:scale-95" onClick={() => sharePlan(view === 'week' ? wa : wa)}><Share2 size={15} aria-hidden /> {L(lang, 'Share my meal plan (list)', 'Partager mon plan d’alimentation (liste)')}</button>}
      {view === 'week' && <div key={w} className="stagger mt-3 space-y-1.5">{DN.map((n, i) => { const x = dayPlan(p, wa, i, kcal, lang, am, sw); const op = wOpen === i; return (
        <div key={i} className="overflow-hidden rounded-2xl bg-cream/70">
          <button onClick={() => setWOpen(op ? null : i)} aria-expanded={op} className="flex w-full items-center gap-3 px-3 py-2.5 text-start active:scale-[.99]">
            <span className="w-9 text-[12px] font-extrabold uppercase text-muted">{n}</span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white" style={{ background: x.s ? ['#25a35a', '#e0a526', '#e5484d'][x.s.hard - 1] : '#9aa3ab' }}>{x.s ? <Dumbbell size={16} aria-hidden /> : <Moon size={16} aria-hidden />}</span>
            <span className="min-w-0 flex-1"><b className="block truncate text-sm">{x.s ? `${x.s.t} · ${x.s.min} min` : L(lang, 'Rest + walk', 'Repos + marche')}</b><span className="block truncate text-xs text-muted">{x.items.filter((y) => y.kcal).length} {L(lang, 'meals', 'repas')} · {x.tk} kcal · {x.tp} g</span></span>
            <ChevronDown size={16} className={`text-muted transition-transform ${op ? 'rotate-180' : ''}`} aria-hidden /></button>
          {op && <ul className="fade-up space-y-1 border-t border-line/60 px-3 py-2">{x.items.filter((y) => y.kcal).map((y, j) => <li key={j} className="flex items-center gap-2 text-[13px]"><span className="w-10 shrink-0 tabular-nums text-muted">{y.at}</span><span className="min-w-0 flex-1 leading-snug">{y.title}<span className="block text-xs text-muted">{y.kcal} kcal · {y.prot} g</span><Tags ns={y.tags} lang={lang} /></span>{y.slot && <button className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-forest shadow-soft active:scale-90" onClick={() => swap(wa, i, y.slot!)} aria-label={L(lang, 'Another meal', 'Autre repas')}><RefreshCw size={13} aria-hidden /></button>}</li>)}
            <li><button className="mt-1 w-full text-center text-xs font-bold text-forest" onClick={() => { setD(i); setView('day') }}>{L(lang, 'Open the day ›', 'Ouvrir la journée ›')}</button></li></ul>}
        </div>) })}</div>}

      {view === 'month' && <div className="mt-3 space-y-2">{[0, 1, 2, 3].map((i) => { const pr = buildProgram(p, i + blk * 4); const n = pr.days.filter(Boolean).length; const min = pr.days.reduce((a, x) => a + (x?.min ?? 0), 0); const op = mOpen === i; return (
        <div key={i} className={`rounded-2xl p-3 ${i === 3 ? 'bg-leaf/20' : 'bg-cream/70'}`}>
          <button className="w-full text-start active:scale-[.99]" onClick={() => { setW(i); setView('week') }}>
            <div className="flex items-center justify-between"><b className="font-display">{L(lang, 'Week', 'Semaine')} {i + 1}</b><span className="rounded-full bg-surface px-2 py-0.5 text-[12px] font-bold text-forest">{['Base', '+15 %', '+30 %', L(lang, 'Recovery', 'Récupération')][i]}</span></div>
            <p className="mt-1 text-xs text-muted">{n} {L(lang, 'sessions', 'séances')} · {min} min · {kcal} kcal/{L(lang, 'day', 'jour')} · {prot} g {L(lang, 'protein', 'protéines')}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface"><div className="grow-x h-full rounded-full bg-forest" style={{ width: `${[60, 75, 90, 45][i]}%` }} /></div>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold"><Scale size={13} aria-hidden /> {L(lang, 'Sunday weigh-in', 'Pesée le dimanche')}{perWeek ? ` · ${L(lang, 'target', 'objectif')} ${perWeek > 0 ? '+' : ''}${(perWeek * (i + 1)).toFixed(perWeek % 0.5 ? 2 : 1)} kg` : ` · ${L(lang, 'keep your weight', 'garder ton poids')}`}</p></button>
          <button className="mt-2 flex w-full items-center justify-between rounded-xl bg-surface px-3 py-2 text-xs font-bold text-forest" onClick={() => setMOpen(op ? null : i)} aria-expanded={op}>{L(lang, 'Meals of the week', 'Repas de la semaine')}<ChevronDown size={15} className={`transition-transform ${op ? 'rotate-180' : ''}`} aria-hidden /></button>
          {op && <div className="fade-up mt-2 space-y-1.5">{DN.map((dn, di) => { const x = dayPlan(p, i + blk * 4, di, kcal, lang, am, sw); return <div key={di} className="rounded-xl bg-surface px-3 py-2 text-[12.5px]"><b className="text-forest">{dn}</b> · {x.tk} kcal{x.items.filter((y) => y.slot === 'b' || y.slot === 'l' || y.slot === 'd').map((y, j) => <div key={j} className="mt-1 leading-snug text-ink/80"><span className="inline-block w-12 text-muted">{y.at}</span>{y.title}<div className="ms-12"><Tags ns={y.tags} lang={lang} /></div></div>)}<button className="mt-1 text-xs font-bold text-forest" onClick={() => { setW(i); setD(di); setView('day') }}>{L(lang, 'Change ›', 'Modifier ›')}</button></div> })}</div>}
        </div>) })}</div>}
      {story && <WorkoutStory title={story.t} ex={story.ex} lang={lang} onClose={() => setStory(null)} />}
    </section>)
}
