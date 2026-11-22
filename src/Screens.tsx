import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { dayName, money, rname, t, type Lang } from './lib/i18n'
import { RECIPES, REC, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { dailyKcal, fmtQty, healthLevel, kcalPerServing, parseIng, recipeCost, toBase } from './lib/engine'
import { FoodTile, Sheet, Stepper } from './ui'

const SLOTS: Meal[] = ['b', 'l', 'd']
const UNIT: Record<string, [string, string, string]> = { bunch: ['bunch', 'botte', 'botte'], glass: ['glass', 'verre', 'كأس'], pinch: ['pinch', 'pincée', 'رشة'], tbsp: ['tbsp', 'c. à s.', 'م.ك'], tsp: ['tsp', 'c. à c.', 'م.ص'], clove: ['clove', 'gousse', 'فص'], pc: ['', '', ''], g: ['g', 'g', 'غ'], ml: ['ml', 'ml', 'مل'] }
const li = (l: Lang) => (l === 'en' ? 0 : l === 'fr' ? 1 : 2)
const r1 = (n: number) => Math.round(n * 10) / 10
export const HEALTH = { fit: '🏃', balanced: '🙂', belly: '🫃' } as const
export const kcalBadge = (rid: string) => { const k = Math.round(kcalPerServing(rid)); return { k, c: k <= 450 ? 'bg-leaf/40 text-forest' : k <= 700 ? 'bg-cream text-muted' : 'bg-apricot/50 text-[#6b4510]' } }

export function RecipeSheet({ r, onClose, servings, onServings }: { r: Recipe | null; onClose: () => void; servings?: number; onServings?: (n: number) => void }) {
  const { lang, me, patchMe, award } = useApp()
  const [n, setN] = useState(servings ?? Math.max(2, me!.size))
  if (!r) return null
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
      <h3 className="mb-2 font-bold">{t('steps', lang)}</h3>
      <ol className="mb-1 list-decimal space-y-1.5 ps-5 text-sm">{r.st.split('|').map((x, i) => <li key={i}>{x}</li>)}</ol>
      <p className="text-xs text-muted">{t('stepsNote', lang)}</p>
    </Sheet>
  )
}


const FILTERS = ['all', 'moroccan', 'healthy', 'budget', 'quick', 'vegetarian']

/** Step 1: the budget drives everything. */
export function BudgetStep({ cost, setBudget, compose, hasPlan, go }: { cost: number; setBudget: (b: number) => void; compose: () => void; hasPlan: boolean; go: (s: number) => void }) {
  const { lang, me, patchMe } = useApp()
  const b = me!.budget
  const perDay = b / 7
  return (
    <div className="space-y-5">
      <h1 className="rise text-center text-2xl font-extrabold leading-tight text-forest sm:text-3xl">{t('bTitle', lang)}</h1>
      <div className="card rise space-y-5 p-6 text-center">
        <div className="flex items-center justify-center gap-4">
          <button className="btn btn-soft !h-12 !w-12 !min-h-12 !px-0 text-xl" onClick={() => setBudget(Math.max(200, b - 50))} aria-label="−50">−</button>
          <div><div className="font-display text-5xl font-extrabold tabular-nums text-forest">{b}</div><div className="text-sm font-semibold text-muted">MAD / {t('week2', lang).toLowerCase()}</div></div>
          <button className="btn btn-soft !h-12 !w-12 !min-h-12 !px-0 text-xl" onClick={() => setBudget(Math.min(5000, b + 50))} aria-label="+50">+</button>
        </div>
        <input type="range" min={200} max={3000} step={50} value={Math.min(b, 3000)} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-[#245B43]" aria-label={t('budgetBar', lang)} />
        <p className="text-sm text-muted">≈ {money(perDay, lang)} {t('perDay', lang)} · {money(perDay / Math.max(1, me!.size), lang)} / 👤</p>
      </div>
      <div className="card rise space-y-3 p-5">
        <div className="flex items-center justify-between"><span className="font-bold">{t('people', lang)}</span><Stepper v={me!.size} set={(n) => patchMe({ size: n })} max={12} /></div>
        <div className="flex flex-wrap gap-2">{['vegetarian', 'healthy', 'budget'].map((d) => <button key={d} className="chip" aria-pressed={me!.diet.includes(d)} onClick={() => patchMe({ diet: me!.diet.includes(d) ? me!.diet.filter((x) => x !== d) : [...me!.diet, d] })}>{t(d === 'budget' ? 'budgetT' : d, lang)}</button>)}</div>
      </div>
      <button className="btn btn-primary w-full !min-h-14 text-base" onClick={compose}>✨ {t('compose', lang)}</button>
      {hasPlan && <button className="btn btn-soft w-full" onClick={() => go(2)}>{t('keepWeek', lang)} · {money(cost, lang)}</button>}
    </div>
  )
}

/** Step 2: the week. */
export function WeekStep({ cost, compose, adapt }: { cost: number; compose: () => void; adapt: () => void }) {
  const { lang, me, house, upHouse, award } = useApp()
  const [pick, setPick] = useState<{ d: number; s: Meal } | null>(null)
  const [view, setView] = useState<string | null>(null)
  const [q, setQ] = useState(''); const [f, setF] = useState('all')
  const plan = house!.plan; const hh = Math.max(1, me!.size); const budget = me!.budget
  const planned = Object.keys(plan).length; const kc = Math.round(dailyKcal(plan)); const hl = healthLevel(kc); const over = cost > budget
  const setEntry = (k: string, r: string, n: number, log: string) => upHouse((h) => { h.plan[k] = { r, n } }, log)
  const cands = useMemo(() => RECIPES.filter((r) => pick && r.m.includes(pick.s) && (f === 'all' || r.tags.includes(f)) && (rname(r.n, lang) + ' ' + r.n[0]).toLowerCase().includes(q.toLowerCase())), [pick, q, f, lang])
  const cur = view ? plan[view] : null
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2"><h1 className="text-2xl font-extrabold text-forest">{t('weekTitle', lang)}</h1><button className="btn btn-soft !min-h-11" onClick={compose}>🎲 {t('reshuffle', lang)}</button></div>
      {planned > 0 && (
        <div className="card flex items-center gap-3 p-3">
          <span className="text-3xl" aria-hidden>{HEALTH[hl]}</span>
          <div className="flex-1"><p className="text-sm font-bold">{t(hl, lang)}</p><p className="text-xs text-muted">≈ {kc} {t('kcal', lang)} · {planned}/21 {t('meals', lang)}</p></div>
          {over && <button className="btn btn-warm !min-h-9 !px-4 text-sm" onClick={adapt}>{t('adapt', lang)}</button>}
        </div>
      )}
      {Array.from({ length: 7 }, (_, d) => (
        <div key={d} className="card p-4">
          <h3 className="mb-3 font-bold capitalize">{dayName(d, lang)}</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {SLOTS.map((s) => {
              const e = plan[`${d}-${s}`]
              if (!e) return <button key={s} className="flex min-h-[4.25rem] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-sm font-semibold text-muted hover:border-leaf" onClick={() => { setPick({ d, s }); setQ(''); setF('all') }}>+ {t(s, lang)}</button>
              const kb = kcalBadge(e.r)
              return (
                <button key={s} className="pop flex items-center gap-3 rounded-2xl bg-cream p-2 text-start" onClick={() => setView(`${d}-${s}`)}>
                  <FoodTile r={REC[e.r]} className="h-12 w-12 shrink-0 rounded-xl !text-2xl" />
                  <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase text-muted">{t(s, lang)} · {e.n}</span><span className="block truncate text-sm font-semibold">{rname(REC[e.r].n, lang)}</span></span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${kb.c}`}>{kb.k}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <Sheet open={!!pick} onClose={() => setPick(null)} title={pick ? `${dayName(pick.d, lang)} · ${t(pick.s, lang)}` : ''}>
        <input className="input mb-2" placeholder={t('search', lang)} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{FILTERS.map((k) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{k === 'budget' ? t('budgetT', lang) : t(k, lang)}</button>)}</div>
        <div className="space-y-1">{cands.map((r) => { const kb = kcalBadge(r.id); return (
          <button key={r.id} className="flex w-full items-center gap-3 rounded-2xl p-2 text-start hover:bg-cream" onClick={() => { setEntry(`${pick!.d}-${pick!.s}`, r.id, hh, `added ${r.n[0]}`); award(10, rname(r.n, lang)); setPick(null) }}>
            <FoodTile r={r} className="h-14 w-14 shrink-0 rounded-xl !text-3xl" /><span className="min-w-0 flex-1"><b className="block truncate text-sm">{rname(r.n, lang)}</b><span className="text-xs text-muted">{r.t} {t('min', lang)} · {money(recipeCost(r.id) / r.s, lang)}</span></span><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${kb.c}`}>{kb.k} kcal</span>
          </button>) })}</div>
      </Sheet>
      {cur && view && <RecipeSheet r={REC[cur.r]} servings={cur.n} onServings={(n) => setEntry(view, cur.r, n, `set ${REC[cur.r].n[0]} to ${n}`)} onClose={() => setView(null)} />}
      {cur && view && (
        <div className="fixed inset-x-0 bottom-24 z-[75] flex justify-center gap-2">
          <button className="btn btn-soft shadow-lift" onClick={() => { const [d, s] = view.split('-'); setView(null); setPick({ d: +d, s: s as Meal }); setQ(''); setF('all') }}>↻</button>
          <button className="btn shadow-lift" style={{ background: 'rgb(var(--danger))', color: '#fff' }} onClick={() => { upHouse((h) => { delete h.plan[view] }, `removed ${REC[cur.r].n[0]}`); setView(null) }}>{t('remove', lang)}</button>
        </div>
      )}
    </div>
  )
}
