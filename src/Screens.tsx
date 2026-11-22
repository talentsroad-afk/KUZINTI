import { BookOpen, Coffee, Dices, Moon, RefreshCw, Shuffle, SlidersHorizontal, Sparkles, Sun, Sunrise, Wallet, Zap, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { dayName, money, rname, t, type Lang } from './lib/i18n'
import { REC, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { SIDE } from './data/sides'
import { dailyKcal, entryCost, entryKcal, fmtQty, healthLevel, kcalPerServing, parseIng, recipeCost, toBase } from './lib/engine'
import { alternatives, CUISINES, FLAG, REGIONS, surpriseOne, composeSides, type Prefs } from './lib/plan'
import { FoodTile, Sheet, Stepper } from './ui'
import { FormeCard } from './Forme'

export const SLOTS: Meal[] = ['b', 'l', 'd', 'g']
export const SLOT_E: Record<Meal, string> = { b: '🌅', l: '☀️', d: '🌙', g: '🍵' }
export const SLOT_I: Record<Meal, LucideIcon> = { b: Sunrise, l: Sun, d: Moon, g: Coffee }
const UNIT: Record<string, [string, string, string]> = { bunch: ['bunch', 'botte', 'botte'], glass: ['glass', 'verre', 'كأس'], pinch: ['pinch', 'pincée', 'رشة'], tbsp: ['tbsp', 'c. à s.', 'م.ك'], tsp: ['tsp', 'c. à c.', 'م.ص'], clove: ['clove', 'gousse', 'فص'], pc: ['', '', ''], g: ['g', 'g', 'غ'], ml: ['ml', 'ml', 'مل'] }
const li = (l: Lang) => (l === 'en' ? 0 : l === 'fr' ? 1 : 2)
const r1 = (n: number) => Math.round(n * 10) / 10
export const HEALTH = { fit: '🏃', balanced: '🙂', belly: '🫃' } as const
export const kcalBadge = (rid: string) => { const k = Math.round(kcalPerServing(rid)); return { k, c: k <= 450 ? 'bg-leaf/40 text-forest' : k <= 700 ? 'bg-cream text-muted' : 'bg-apricot/50 text-[#6b4510]' } }

export function RecipeSheet({ r, onClose, servings, onServings }: { r: Recipe | null; onClose: () => void; servings?: number; onServings?: (n: number) => void }) {
  const { lang, me, patchMe, award, upHouse, toast } = useApp()
  const [n, setN] = useState(servings ?? Math.max(2, me!.size))
  const [day, setDay] = useState((new Date().getDay() + 6) % 7)
  if (!r) return null
  const addToWeek = (slot: Meal) => { upHouse((h) => { h.plan[`${day}-${slot}`] = { r: r.id, n: sv, x: composeSides(r.id, slot) } }, `+ ${rname(r.n, lang)}`); award(5, '🛒'); toast(`✅ ${dayName(day, lang)} · ${t(slot, lang)} — ${lang === 'en' ? 'ingredients added to your list' : 'ingrédients ajoutés à tes courses'}`); onClose() }
  const sv = servings ?? n
  const setSv = (x: number) => (onServings ? onServings(x) : setN(x))
  const fav = me!.favs.includes(r.id); const kb = kcalBadge(r.id)
  return (
    <Sheet open onClose={onClose} title={rname(r.n, lang)}>
      <FoodTile r={r} className="mb-4 h-36 rounded-2xl" />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>⏱ {r.t} {t('min', lang)}</span><span>·</span><span>≈ {money(recipeCost(r.id, sv) / sv, lang)} {t('perServing', lang)}</span><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${kb.c}`}>{kb.k} kcal</span>
        <button className="ms-auto text-2xl" aria-pressed={fav} aria-label="favorite" onClick={() => { patchMe({ favs: fav ? me!.favs.filter((x) => x !== r.id) : [...me!.favs, r.id] }); if (!fav) award(2, '❤️') }}>{fav ? '❤️' : '🤍'}</button>
      </div>
      <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{t('ingredients', lang)}</h3><span className="flex items-center gap-2 text-sm"><Stepper v={sv} set={setSv} /> {t('servings', lang)}</span></div>
      <ul className="mb-5 space-y-1.5 text-sm">
        {r.ing.map((s) => {
          const p = parseIng(s); const ing = ING[p.id]; const q = (p.qty * sv) / r.s
          const txt = p.unit && p.unit !== ing.base && UNIT[p.unit] ? `${r1(q)} ${UNIT[p.unit][li(lang)]}` : fmtQty(toBase(ing, q, p.unit), ing.base)
          return <li key={s} className="flex justify-between border-b border-line/70 pb-1.5"><span>{ing.n[li(lang)]}</span><b className="tabular-nums">{txt}</b></li>
        })}
      </ul>
      {!onServings && r.m.length > 0 && <div className="mb-5 rounded-2xl bg-leaf/15 p-3">
        <p className="mb-2 text-sm font-bold">🛒 {lang === 'en' ? 'Add to my week and shopping list' : 'Ajouter à ma semaine et à mes courses'}</p>
        <div className="mb-2 grid grid-cols-7 gap-1">{Array.from({ length: 7 }, (_, d) => <button key={d} className={`rounded-lg py-1.5 text-[11px] font-bold uppercase ${d === day ? 'bg-forest text-white' : 'bg-surface'}`} onClick={() => setDay(d)}>{dayName(d, lang).slice(0, 2)}</button>)}</div>
        <div className="flex gap-2">{r.m.map((sl) => <button key={sl} className="btn btn-primary !min-h-10 flex-1 !px-2 !text-sm" onClick={() => addToWeek(sl)}>{SLOT_E[sl]} {t(sl, lang)}</button>)}</div>
        <p className="mt-1.5 text-[11px] text-muted">{lang === 'en' ? `For ${sv} people · replaces the dish already planned there.` : `Pour ${sv} personne(s) · remplace le plat déjà prévu à ce moment.`}</p>
      </div>}
      <h3 className="mb-2 font-bold">{t('steps', lang)}</h3>
      <ol className="mb-1 list-decimal space-y-1.5 ps-5 text-sm">{r.st.split('|').map((x, i) => <li key={i}>{x}</li>)}</ol>
      <p className="text-xs text-muted">{t('stepsNote', lang)}</p>
    </Sheet>
  )
}



export function usePrefs(): Prefs {
  const { me } = useApp(); const u = me!
  return { size: Math.max(1, u.size), diet: u.diet, cuisine: u.cuisine ?? 'ma', region: u.region ?? 'all', goals: (u.goals ?? []).filter((g) => g !== 'healthy' && g !== 'gourmand'), meals: u.meals ?? ['b', 'l', 'd'], budget: u.budget, kcal: u.kcal ?? 2000 }
}
const sideNames = (x: string[] | undefined, lang: Lang) => (x ?? []).filter((s) => SIDE[s]).map((s) => SIDE[s].n[li(lang)]).join(' · ')

export function Mascot({ plan }: { plan: Record<string, { r: string; n: number }> }) {
  const { lang } = useApp()
  const kc = Math.round(dailyKcal(plan)); const hl = healthLevel(kc)
  const pos = Math.min(100, Math.max(0, (kc / 3000) * 100))
  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <div key={hl} className={`mascot mascot-${hl} text-4xl`} aria-hidden>{HEALTH[hl]}</div>
        <div className="min-w-0 flex-1"><p className="text-[15px] font-bold leading-tight">{t({ fit: 'capFit', balanced: 'capBal', belly: 'capBelly' }[hl], lang)}</p><p className="text-xs text-muted tabular-nums">≈ {kc.toLocaleString(lang === 'ar' ? 'en' : lang)} {t('kcal', lang)}</p></div>
      </div>
      <div className="relative mt-2.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, rgb(var(--leaf)) 0 62%, rgb(var(--apricot)) 62% 75%, rgb(var(--danger) / .7) 75%)' }}>
        <div className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-white bg-forest shadow-soft transition-all duration-700" style={{ insetInlineStart: `calc(${pos}% - 8px)` }} />
      </div>
    </div>
  )
}

/** Budget, people, meals and diet in one block (Home options and the budget sheet). */
export function Controls({ setBudget }: { setBudget: (b: number) => void }) {
  const { lang, me, patchMe } = useApp()
  const b = me!.budget; const meals = me!.meals ?? ['b', 'l', 'd']
  return (
    <div className="space-y-3">
      <div className="card space-y-3 p-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <button className="btn btn-soft !h-11 !w-11 !min-h-11 !px-0 text-xl" onClick={() => setBudget(Math.max(200, b - 50))} aria-label="−50">−</button>
          <div><div className="font-display text-4xl font-extrabold tabular-nums text-forest">{b}</div><div className="text-xs font-semibold text-muted">MAD / {t('week2', lang).toLowerCase()}</div></div>
          <button className="btn btn-soft !h-11 !w-11 !min-h-11 !px-0 text-xl" onClick={() => setBudget(Math.min(5000, b + 50))} aria-label="+50">+</button>
        </div>
        <input type="range" min={200} max={3000} step={50} value={Math.min(b, 3000)} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-[#245B43]" aria-label={t('budgetBar', lang)} />
      </div>
      <div className="card divide-y divide-line/70">
        <div className="flex items-center justify-between p-3"><span className="font-semibold">👤 {t('people', lang)}</span><Stepper v={me!.size} set={(n) => patchMe({ size: n })} max={12} /></div>
        <div className="flex items-center justify-between gap-2 p-3"><span className="font-semibold">{t('mealsIncl', lang)}</span><span className="flex gap-1">{SLOTS.map((s) => <button key={s} className="chip !px-2.5" aria-pressed={meals.includes(s)} onClick={() => patchMe({ meals: meals.includes(s) ? meals.filter((x) => x !== s) : SLOTS.filter((x) => x === s || meals.includes(x)) })} aria-label={t(s, lang)}>{SLOT_E[s]}</button>)}</span></div>
        <div className="flex items-center justify-between p-3"><span className="font-semibold">🌱 {t('veg', lang)}</span><button className="chip" aria-pressed={me!.diet.includes('vegetarian')} onClick={() => patchMe({ diet: me!.diet.includes('vegetarian') ? [] : ['vegetarian'] })}>{me!.diet.includes('vegetarian') ? '✓' : '—'}</button></div>
      </div>
    </div>
  )
}

/** Home, Apple-simple: a calm greeting, one "Votre semaine" summary, preferences folded into one row. */
export function HomeTab({ compose, recompose, go, total, items }: { compose: () => void; recompose: (o: Partial<Prefs>) => void; go: (t: 'week' | 'list') => void; total: number; items: number }) {
  const { lang, me, house, patchMe } = useApp()
  const [prefs, setPrefs] = useState(false)
  const cuisine = me!.cuisine ?? 'ma'; const region = me!.region ?? 'all'; const goals = me!.goals ?? []
  const plan = house!.plan; const n = Object.keys(plan).length
  const today = (new Date().getDay() + 6) % 7
  const tg = (g: string) => { const ng = goals.includes(g) ? goals.filter((x) => x !== g) : [...goals.filter((x) => !(g === 'healthy' && x === 'gourmand') && !(g === 'gourmand' && x === 'healthy')), g]; patchMe({ goals: ng }); recompose({ goals: ng }) }
  const summary = [`${FLAG[cuisine]} ${t('c_' + cuisine, lang)}`, cuisine === 'ma' && region !== 'all' ? t('r_' + region, lang) : '', ...goals.filter((g) => ['cheap', 'quick', 'varied'].includes(g)).map((g) => t('g_' + g, lang)), `${me!.size} ${t('people', lang).toLowerCase()}`, money(me!.budget, lang)].filter(Boolean).join(' · ')
  const left = me!.budget - total
  return (
    <div className="space-y-5">
      <div className="rise pt-1"><p className="text-sm text-muted">{t('hello', lang)} {me!.name}</p><h1 className="font-display text-[28px] font-extrabold leading-tight">{n ? t('weekReady', lang) : t('homeTitle', lang)}</h1></div>
      {n > 0 ? (
        <div className="card rise overflow-hidden">
          <div className="grid grid-cols-7 gap-1 px-3 pt-4 text-center">{Array.from({ length: 7 }, (_, d) => { const e = plan[`${d}-l`] ?? plan[`${d}-d`]; return <button key={d} onClick={() => go('week')} className={`rounded-2xl py-1.5 ${d === today ? 'bg-cream' : ''}`}><p className={`text-[10px] font-bold uppercase ${d === today ? 'text-forest' : 'text-muted'}`}>{dayName(d, lang).slice(0, 2)}</p><p className="text-2xl">{e ? REC[e.r].e : '·'}</p></button> })}</div>
          <div className="mt-3 grid grid-cols-3 divide-x divide-line/70 border-y border-line/70 text-center rtl:divide-x-reverse">
            <div className="py-3"><b className="block text-lg tabular-nums">{n}</b><span className="text-[11px] text-muted">{t('meals', lang)}</span></div>
            <div className="py-3">{items > 0 ? <><b className="block text-lg tabular-nums">{items}</b><span className="text-[11px] text-muted">{t('toBuy', lang).toLowerCase()}</span></> : <><b className="block text-lg text-forest">✓</b><span className="text-[11px] text-muted">{t('allHome', lang)}</span></>}</div>
            <div className="py-3"><b className="block text-lg tabular-nums" style={{ color: left < 0 ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }}>{money(Math.abs(left), lang)}</b><span className="text-[11px] text-muted">{left < 0 ? t('overBy', lang) : t('left', lang)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3"><button className="btn btn-primary" onClick={() => go('week')}>{t('seeWeek', lang)}</button><button className="btn btn-soft" onClick={() => go('list')}>{t('myList', lang)}</button></div>
        </div>
      ) : (
        <div className="card rise space-y-3 p-5"><p className="text-sm text-muted">{t('composeSub', lang)}</p><button className="btn btn-primary w-full" onClick={compose}><Sparkles size={18} aria-hidden /> {t('composeAuto', lang)}</button></div>
      )}
      <div className="card divide-y divide-line/70 overflow-hidden">
        <button className="flex w-full items-center gap-3 px-4 py-3.5 text-start active:bg-cream" onClick={() => setPrefs(true)}>
          <SlidersHorizontal size={18} className="shrink-0 text-forest" aria-hidden /><span className="min-w-0 flex-1"><span className="block font-semibold">{t('prefs', lang)}</span><span className="block truncate text-xs text-muted">{summary}</span></span><span className="text-muted" aria-hidden>›</span>
        </button>
        {n > 0 && <button className="flex w-full items-center gap-3 px-4 py-3.5 text-start active:bg-cream" onClick={compose}>
          <RefreshCw size={18} className="shrink-0 text-forest" aria-hidden /><span className="min-w-0 flex-1"><span className="block font-semibold">{t('newWeek', lang)}</span><span className="block truncate text-xs text-muted">{t('newWeekD', lang)}</span></span><span className="text-muted" aria-hidden>›</span>
        </button>}
      </div>
      <Sheet open={prefs} onClose={() => setPrefs(false)} title={t('prefs', lang)}>
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t('cuisine', lang)}</p>
            <div className="flex flex-wrap gap-2">{CUISINES.map((c) => <button key={c} className="chip" aria-pressed={cuisine === c} onClick={() => { patchMe({ cuisine: c, region: 'all' }); recompose({ cuisine: c, region: 'all' }) }}>{FLAG[c]} {t('c_' + c, lang)}</button>)}</div>
            {cuisine === 'ma' && <div className="mt-2 flex flex-wrap gap-1.5">{REGIONS.map((r) => <button key={r} className={`rounded-full px-3 py-1 text-xs font-semibold ${region === r ? 'bg-leaf/40 text-forest' : 'text-muted'}`} onClick={() => { patchMe({ region: r }); recompose({ region: r }) }}>{t('r_' + r, lang)}</button>)}</div>}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t('goals', lang)}</p>
            <div className="flex flex-wrap gap-2">{([['cheap', Wallet], ['quick', Zap], ['varied', Shuffle]] as const).map(([g, E]) => <button key={g} className="chip" aria-pressed={goals.includes(g)} onClick={() => tg(g)}><E size={15} className="me-1.5" aria-hidden />{t('g_' + g, lang)}</button>)}</div>
          </div>
          <Controls setBudget={(b) => patchMe({ budget: b })} />
          <button className="btn btn-primary w-full" onClick={() => { setPrefs(false); if (!n) compose() }}>{n ? t('ok', lang) : t('composeAuto', lang)}</button>
        </div>
      </Sheet>
    </div>
  )
}

/** Swap one meal in one tap: Surprise me, or pick from ranked alternatives. */
function ReplaceSheet({ k, onClose, say }: { k: string; onClose: () => void; say: (m: string) => void }) {
  const { lang, house, upHouse, award } = useApp()
  const p = usePrefs(); const plan = house!.plan
  const [f, setF] = useState('same'); const [q, setQ] = useState('')
  const [d, s] = k.split('-'); const slot = s as Meal; const cur = plan[k]
  const list = useMemo(() => alternatives(k, plan, p, f).filter((r) => (rname(r.n, lang) + r.n[0]).toLowerCase().includes(q.toLowerCase())).slice(0, 25), [k, plan, p, f, q, lang])
  const curCost = cur ? entryCost(cur) / cur.n : 0
  const put = (e: { r: string; n: number; x?: string[] }) => { upHouse((h) => { h.plan[k] = e }, `→ ${REC[e.r].n[0]}`); award(5, rname(REC[e.r].n, lang)); say(`✅ ${rname(REC[e.r].n, lang)} · ${t('listUpdated', lang)}`); onClose() }
  return (
    <Sheet open onClose={onClose} title={`${dayName(+d, lang)} · ${SLOT_E[slot]} ${t(slot, lang)}`}>
      <button className="btn btn-warm mb-3 w-full !min-h-12" onClick={() => put(surpriseOne(k, plan, p))}><Dices size={18} className="inline -mt-0.5" aria-hidden /> {t('surprise', lang)}</button>
      <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1">{[['same', 'fSame'], ['all', 'fAll'], ['cheaper', 'fCheaper'], ['healthier', 'fHealthier'], ['quick', 'fQuick'], ['veg', 'veg']].map(([id, key]) => <button key={id} className="chip shrink-0" aria-pressed={f === id} onClick={() => setF(id)}>{t(key, lang)}</button>)}</div>
      <input className="input mb-2 !min-h-10" placeholder={t('search', lang)} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="divide-y divide-line/70">
        {list.map((r) => { const e = { r: r.id, n: cur?.n ?? p.size, x: composeSides(r.id, slot) }; const c = entryCost(e) / e.n; const dc = c - curCost; return (
          <button key={r.id} className="flex w-full items-center gap-3 py-2.5 text-start active:bg-cream" onClick={() => put(e)}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: `hsl(${r.h} 80% 90%)` }}>{r.e}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{FLAG[['it', 'fr', 'es', 'tr', 'in', 'jp'].find((x) => r.tags.includes(x)) ?? 'ma']} {rname(r.n, lang)}</span><span className="block truncate text-xs text-muted">{t('with', lang)} {sideNames(e.x, lang) || '—'}</span></span>
            <span className="shrink-0 text-end text-xs"><span className="block font-semibold tabular-nums">{Math.round(entryKcal(e))} kcal</span>{cur && <span className={`tabular-nums ${dc < 0 ? 'text-forest' : 'text-muted'}`}>{dc < 0 ? '−' : '+'}{Math.abs(dc).toFixed(1)} MAD</span>}</span>
          </button>) })}
      </div>
    </Sheet>
  )
}

/** My week: compact days, expand one to act on its meals. Three one-tap actions per meal. */
const STOP = new Set(['de', 'du', 'des', 'au', 'aux', 'à', 'la', 'le', 'les', 'et', 'with', 'and', 'the', 'of', 'en'])
const short = (n: string) => n.replace(/\s*\(.*\)/, "").split(/[\s,]+/).filter((w) => w && !STOP.has(w.toLowerCase())).slice(0, 2).join(' ')

export function WeekTab({ compose, makeHealthy, say }: { compose: () => void; makeHealthy: () => void; say: (m: string) => void }) {
  const { lang, me, house, upHouse } = useApp()
  const p = usePrefs(); const plan = house!.plan
  const today = (new Date().getDay() + 6) % 7
  const [view, setView] = useState<'day' | 'week' | 'month'>('week'); const [day, setDay] = useState(today)
  const [rep, setRep] = useState<string | null>(null); const [rv, setRv] = useState<Recipe | null>(null)
  const dayKc = (d: number) => slots.reduce((a, s) => a + (plan[`${d}-${s}`] ? entryKcal(plan[`${d}-${s}`]) : 0), 0)
  const dayCost = (d: number) => slots.reduce((a, s) => a + (plan[`${d}-${s}`] ? entryCost(plan[`${d}-${s}`]) : 0), 0)
  const now = new Date(); const first = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7; const nDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthCells = [...Array(first).fill(null), ...Array.from({ length: nDays }, (_, i) => ({ n: i + 1, wd: (first + i) % 7, today: i + 1 === now.getDate() }))] as ({ n: number; wd: number; today: boolean } | null)[]
  const mealRow = (k: string, s: Meal) => {
    const e = plan[k]
    if (!e) return <button key={s} className="flex w-full items-center gap-3 px-4 py-3 text-start text-muted" onClick={() => setRep(k)}><span className="w-6 text-center">{SLOT_E[s]}</span><span className="font-semibold">＋ {t(s, lang)}</span></button>
    const r = REC[e.r]
    return (
      <div key={s} className="px-4 py-3">
        <div className="flex gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `hsl(${r.h} 80% 90%)` }}>{r.e}</span>
          <div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-wide text-muted">{SLOT_E[s]} {t(s, lang)}</p><p className="font-semibold leading-tight">{rname(r.n, lang)}</p>{(e.x ?? []).length > 0 && <p className="mt-0.5 text-xs text-muted">+ {sideNames(e.x, lang)}</p>}</div>
          <span className="shrink-0 text-xs text-muted tabular-nums">{Math.round(entryKcal(e))} kcal</span>
        </div>
        <div className="mt-2 flex items-center gap-2 ps-[3.75rem]">
          <button className="rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-white active:scale-95" onClick={() => setRep(k)}><RefreshCw size={13} className="inline -mt-0.5" aria-hidden /> {t('change', lang)}</button>
          <span className="inline-flex items-center rounded-full bg-cream text-xs font-bold"><button className="px-2.5 py-1.5" onClick={() => upHouse((h) => { h.plan[k] = { ...e, n: Math.max(1, e.n - 1) } })} aria-label="−">−</button><span className="tabular-nums">👤 {e.n}</span><button className="px-2.5 py-1.5" onClick={() => upHouse((h) => { h.plan[k] = { ...e, n: Math.min(12, e.n + 1) } })} aria-label="+">+</button></span>
          <button className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold active:scale-95" onClick={() => setRv(r)}><BookOpen size={13} className="inline -mt-0.5" aria-hidden /> {t('recipe', lang)}</button>
        </div>
      </div>
    )
  }
  const slots = SLOTS.filter((s) => p.meals.includes(s) || Object.keys(plan).some((k) => k.endsWith('-' + s)))
  if (!Object.keys(plan).length) return <div className="card space-y-4 p-8 text-center"><p className="text-5xl">🗓️</p><p className="text-muted">{t('emptyWeek', lang)}</p><button className="btn btn-primary w-full" onClick={compose}>✨ {t('composeAuto', lang)}</button></div>
  return (
    <div className="space-y-3">
      {me!.showForme && <FormeCard plan={plan} />}
      <div className="flex gap-2"><button className="btn btn-soft flex-1 !min-h-11" onClick={compose}><Shuffle size={16} className="inline -mt-0.5" aria-hidden /> {t('reshuffle', lang)}</button></div>
      <div className="flex rounded-full bg-surface p-1 shadow-soft">{(['day', 'week', 'month'] as const).map((v) => <button key={v} className={`flex-1 rounded-full py-2 text-sm font-bold ${view === v ? 'bg-forest text-white' : 'text-muted'}`} onClick={() => setView(v)}>{t('v_' + v, lang)}</button>)}</div>
      {view === 'day' && <>
        <div className="grid grid-cols-7 gap-1">{Array.from({ length: 7 }, (_, d) => <button key={d} onClick={() => setDay(d)} className={`rounded-2xl py-2 text-center ${d === day ? 'bg-forest text-white' : 'bg-surface'}`}><span className="block text-[10px] font-bold uppercase">{dayName(d, lang).slice(0, 3)}</span><span className="block text-base">{d === today ? '•' : ' '}</span></button>)}</div>
        <div className="card overflow-hidden">
          <div className="flex items-baseline justify-between px-4 pt-3"><span className="font-display text-lg font-extrabold capitalize">{dayName(day, lang)}</span><span className="text-xs text-muted tabular-nums">{Math.round(dayKc(day))} kcal · {money(dayCost(day), lang)}</span></div>
          <div className="divide-y divide-line/70">{slots.map((s) => mealRow(`${day}-${s}`, s))}</div>
        </div>
      </>}
      {view === 'week' && <div className="card p-2">
        <div className="grid grid-cols-[1.9rem_repeat(7,minmax(0,1fr))] gap-[3px] text-center">
          <span />{Array.from({ length: 7 }, (_, d) => <button key={d} onClick={() => { setDay(d); setView('day') }} className={`rounded-lg py-1 text-[10px] font-bold uppercase ${d === today ? 'bg-leaf/40 text-forest' : 'text-muted'}`}>{dayName(d, lang).slice(0, 2)}</button>)}
          {slots.map((s) => [<span key={s} className="flex flex-col items-center justify-center leading-none text-forest">{(() => { const I = SLOT_I[s]; return <I size={16} aria-hidden /> })()}<span className="mt-0.5 text-[7.5px] font-bold uppercase text-muted">{({ b: "Matin", l: "Midi", d: "Soir", g: "Goûter" } as Record<string, string>)[s]}</span></span>, ...Array.from({ length: 7 }, (_, d) => { const e = plan[`${d}-${s}`]; return <button key={s + d + (e?.r ?? '')} onClick={() => setRep(`${d}-${s}`)} className="pop flex min-h-[4.25rem] flex-col items-center justify-start gap-0.5 rounded-xl px-0.5 pt-1 active:scale-90" style={{ animationDelay: `${(d + slots.indexOf(s) * 7) * 18}ms`, background: e ? `hsl(${REC[e.r].h} 80% 91%)` : 'rgb(var(--cream))' }} aria-label={e ? rname(REC[e.r].n, lang) : '+'}>{e ? <><span className="text-lg leading-none">{REC[e.r].e}</span><span className="line-clamp-3 break-words text-[8.5px] font-semibold leading-[1.15]">{short(rname(REC[e.r].n, lang))}</span></> : '＋'}</button> })])}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">{t('tapSwap', lang)}</p>
      </div>}
      {view === 'month' && <div className="card p-3">
        <p className="mb-2 font-display font-extrabold capitalize">{new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA' : lang, { month: 'long', year: 'numeric' }).format(new Date())}</p>
        <div className="grid grid-cols-7 gap-1 text-center">{Array.from({ length: 7 }, (_, d) => <span key={d} className="text-[10px] font-bold uppercase text-muted">{dayName(d, lang).slice(0, 2)}</span>)}
          {monthCells.map((c, i) => c ? <button key={i} onClick={() => { setDay(c.wd); setView('day') }} className={`rounded-xl py-1 ${c.today ? 'bg-forest text-white' : 'bg-cream'}`}><span className="block text-[10px] font-bold">{c.n}</span>{plan[`${c.wd}-l`] && <span className="block truncate px-0.5 text-[8.5px] font-semibold leading-tight">{REC[plan[`${c.wd}-l`].r].e} {short(rname(REC[plan[`${c.wd}-l`].r].n, lang)).split(' ')[0]}</span>}</button> : <span key={i} />)}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">{t('monthNote', lang)}</p>
      </div>}
      {rep && <ReplaceSheet k={rep} onClose={() => setRep(null)} say={say} />}
      {rv && <RecipeSheet r={rv} onClose={() => setRv(null)} />}
      <p className="px-1 text-center text-xs text-muted">{me!.size} 👤 · {t('c_' + p.cuisine, lang)}</p>
    </div>
  )
}
