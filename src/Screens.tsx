import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { dayName, money, rname, t, type Lang } from './lib/i18n'
import { RECIPES, REC, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { buildList, dailyKcal, fmtQty, healthLevel, kcalPerServing, parseIng, recipeCost, toBase } from './lib/engine'
import { adaptToBudget, listCost, randomPlan } from './lib/plan'
import { FoodTile, Sheet, Stepper } from './ui'

export interface Props { go: (t: 'plan' | 'list' | 'profile') => void; celebrate: () => void }
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

export function PlannerScreen({ go, celebrate }: Props) {
  const { lang, me, house, patchMe, upHouse, award, toast } = useApp()
  const [pick, setPick] = useState<{ d: number; s: Meal } | null>(null)
  const [view, setView] = useState<string | null>(null)
  const [q, setQ] = useState(''); const [f, setF] = useState('all')
  const plan = house!.plan, pantry = house!.pantry, extras = house!.extras ?? {}
  const hh = Math.max(1, me!.size), budget = me!.budget
  const cost = useMemo(() => listCost(plan, pantry, extras), [plan, pantry, extras])
  const nItems = useMemo(() => buildList(plan, pantry, extras).filter((l) => l.buy > 0).length, [plan, pantry, extras])
  const planned = Object.keys(plan).length
  const kc = Math.round(dailyKcal(plan)); const hl = healthLevel(kc)
  const pct = Math.min(100, (cost / budget) * 100); const over = cost > budget
  const barCol = over ? 'rgb(var(--danger))' : pct > 88 ? 'rgb(var(--apricot))' : 'rgb(var(--forest))'
  const setEntry = (k: string, r: string, n: number, log: string) => upHouse((h) => { h.plan[k] = { r, n } }, log)
  const cands = useMemo(() => RECIPES.filter((r) => pick && r.m.includes(pick.s) && (f === 'all' || r.tags.includes(f)) && (rname(r.n, lang) + ' ' + r.n[0]).toLowerCase().includes(q.toLowerCase())), [pick, q, f, lang])

  const surprise = () => {
    const next = randomPlan(hh, me!.diet, budget, pantry, extras); const c = listCost(next, pantry, extras)
    upHouse((h) => { h.plan = next }, 'shuffled the week'); award(10, '✨'); celebrate()
    toast(c <= budget ? `🎉 ${money(budget - c, lang)} ${t('margin', lang)}` : t('tight', lang))
  }
  const adapt = () => {
    const next = adaptToBudget(plan, budget, pantry, extras, me!.diet); const c = listCost(next, pantry, extras)
    upHouse((h) => { h.plan = next }, 'fitted the budget'); toast(c <= budget ? `✅ ${t('fitted', lang)}` : t('tight', lang))
  }
  const cur = view ? plan[view] : null
  const FILTERS = ['all', 'moroccan', 'healthy', 'budget', 'quick', 'vegetarian', 'sweet']
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><p className="text-sm text-muted">{t('hello', lang)},</p><h1 className="text-2xl font-extrabold text-forest">{me!.name} 👋</h1></div>
        <div className="flex gap-2 text-sm font-bold"><span className="rounded-full bg-surface px-3 py-1.5 shadow-soft">🔥 {me!.streak}</span><span className="rounded-full bg-surface px-3 py-1.5 shadow-soft">⭐ {Math.floor(me!.xp / 100) + 1}</span></div></div>

      <div className="card space-y-3 p-4">
        <div className="flex items-end justify-between"><span className="font-bold">{t('budgetBar', lang)}</span><span className="text-sm tabular-nums"><b>{money(cost, lang)}</b> / {money(budget, lang)}</span></div>
        <div className="h-4 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barCol }} /></div>
        <div className="flex items-center justify-between gap-2 text-sm"><span className="font-semibold" style={{ color: over ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }}>{over ? `${money(cost - budget, lang)} ${t('over', lang)}` : `${money(budget - cost, lang)} ${t('margin', lang)}`}</span>
          {over && <button className="btn btn-warm !min-h-9 !px-4 text-sm" onClick={adapt}>{t('adapt', lang)}</button>}</div>
        <input type="range" min={200} max={3000} step={50} value={budget} onChange={(e) => patchMe({ budget: +e.target.value })} className="w-full accent-[#245B43]" aria-label={t('budgetBar', lang)} />
        {planned > 0 && <div className="flex items-center gap-3 rounded-2xl bg-cream p-3"><span className="text-3xl" aria-hidden>{HEALTH[hl]}</span><div><p className="text-sm font-bold">{t(hl, lang)}</p><p className="text-xs text-muted">≈ {kc} {t('kcal', lang)}</p></div></div>}
      </div>

      <div className="flex gap-2"><button className="btn btn-primary flex-1" onClick={surprise}>🎲 {t('surprise', lang)}</button>{planned > 0 && <button className="btn btn-soft" onClick={() => upHouse((h) => { h.plan = {} }, 'cleared the week')}>{t('clear', lang)}</button>}</div>

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

      {planned > 0 && <div className="sticky bottom-20 z-30 sm:bottom-4"><button className="btn btn-primary w-full !min-h-14 shadow-lift" onClick={() => go('list')}>🛒 {t('seeList', lang)} · {nItems} {t('items', lang)} · {money(cost, lang)}</button></div>}

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
        <div className="fixed inset-x-0 bottom-20 z-[75] flex justify-center gap-2 sm:bottom-6">
          <button className="btn btn-soft shadow-lift" onClick={() => { const [d, s] = view.split('-'); setView(null); setPick({ d: +d, s: s as Meal }); setQ(''); setF('all') }}>↻</button>
          <button className="btn shadow-lift" style={{ background: 'rgb(var(--danger))', color: '#fff' }} onClick={() => { upHouse((h) => { delete h.plan[view] }, `removed ${REC[cur.r].n[0]}`); setView(null) }}>{t('remove', lang)}</button>
        </div>
      )}
    </div>
  )
}
