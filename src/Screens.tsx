import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { dayName, money, rname, t, type Lang } from './lib/i18n'
import { RECIPES, REC, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { fmtQty, parseIng, recipeCost, toBase } from './lib/engine'
import { FoodTile, Ring, Sheet, Stepper } from './ui'

export interface Props { go: (t: 'home' | 'plan' | 'recipes' | 'list' | 'profile') => void; celebrate: () => void }
const SLOTS: Meal[] = ['b', 'l', 'd']
const UNIT: Record<string, [string, string, string]> = { bunch: ['bunch', 'botte', 'botte'], glass: ['glass', 'verre', 'كأس'], pinch: ['pinch', 'pincée', 'رشة'], tbsp: ['tbsp', 'c. à s.', 'م.ك'], tsp: ['tsp', 'c. à c.', 'م.ص'], clove: ['clove', 'gousse', 'فص'], pc: ['', '', ''], g: ['g', 'g', 'غ'], ml: ['ml', 'ml', 'مل'] }
const li = (l: Lang) => (l === 'en' ? 0 : l === 'fr' ? 1 : 2)
const r1 = (n: number) => Math.round(n * 10) / 10

export function RecipeSheet({ r, onClose, servings, onServings, onAdd }: { r: Recipe | null; onClose: () => void; servings?: number; onServings?: (n: number) => void; onAdd?: (day: number, slot: Meal, n: number) => void }) {
  const { lang, me, patchMe, house, award } = useApp()
  const [n, setN] = useState(servings ?? house ? Math.max(2, me!.size) : 4)
  const [day, setDay] = useState((new Date().getDay() + 6) % 7)
  const [slot, setSlot] = useState<Meal>('d')
  if (!r) return null
  const sv = servings ?? n
  const setSv = (x: number) => (onServings ? onServings(x) : setN(x))
  const fav = me!.favs.includes(r.id)
  return (
    <Sheet open onClose={onClose} title={rname(r.n, lang)}>
      <FoodTile r={r} className="mb-4 h-40 rounded-2xl" />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>⏱ {r.t} {t('min', lang)}</span><span>·</span><span>{'●'.repeat(r.d)}{'○'.repeat(3 - r.d)}</span><span>·</span><span>≈ {money(recipeCost(r.id, sv) / sv, lang)} {t('perServing', lang)}</span>
        <button className="ms-auto text-2xl" aria-pressed={fav} aria-label="favorite" onClick={() => { patchMe({ favs: fav ? me!.favs.filter((x) => x !== r.id) : [...me!.favs, r.id] }); if (!fav) award(2, '❤️') }}>{fav ? '❤️' : '🤍'}</button>
      </div>
      <div className="mb-4 flex items-center justify-between"><h3 className="font-bold">{t('ingredients', lang)}</h3><span className="flex items-center gap-2 text-sm"><Stepper v={sv} set={setSv} /> {t('servings', lang)}</span></div>
      <ul className="mb-5 space-y-1.5 text-sm">
        {r.ing.map((s) => {
          const p = parseIng(s); const ing = ING[p.id]; const q = (p.qty * sv) / r.s
          const txt = p.unit && p.unit !== ing.base && UNIT[p.unit] ? `${r1(q)} ${UNIT[p.unit][li(lang)]}` : fmtQty(toBase(ing, q, p.unit), ing.base)
          return <li key={s} className="flex justify-between border-b border-line/70 pb-1.5"><span>{ing.n[li(lang)]}</span><b className="tabular-nums">{txt}</b></li>
        })}
      </ul>
      <h3 className="mb-2 font-bold">{t('steps', lang)}</h3>
      <ol className="mb-1 list-decimal space-y-1.5 ps-5 text-sm">{r.st.split('|').map((x, i) => <li key={i}>{x}</li>)}</ol>
      <p className="mb-5 text-xs text-muted">{t('stepsNote', lang)}</p>
      {onAdd && (
        <div className="space-y-3 border-t border-line pt-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1">{Array.from({ length: 7 }, (_, i) => <button key={i} className="chip" aria-pressed={day === i} onClick={() => setDay(i)}>{dayName(i, lang).slice(0, 3)}</button>)}</div>
          <div className="flex gap-1.5">{SLOTS.map((s) => <button key={s} className="chip" aria-pressed={slot === s} onClick={() => setSlot(s)}>{t(s, lang)}</button>)}</div>
          <button className="btn btn-primary w-full" onClick={() => { onAdd(day, slot, sv); onClose() }}>{t('add', lang)} · {dayName(day, lang)} · {t(slot, lang)}</button>
        </div>
      )}
    </Sheet>
  )
}

export function HomeScreen({ go }: Props) {
  const { lang, me, house } = useApp()
  const plan = house!.plan
  const planned = Object.keys(plan).length
  const dIdx = (new Date().getDay() + 6) % 7
  const tonight = plan[`${dIdx}-d`]
  const cost = Object.values(plan).reduce((a, e) => a + recipeCost(e.r, e.n), 0)
  return (
    <div className="space-y-5">
      <div className="rise"><p className="text-muted">{t('hello', lang)},</p><h1 className="text-3xl font-extrabold text-forest">{me!.name} 👋</h1></div>
      <div className="card rise flex items-center gap-5 p-5">
        <Ring value={planned / 21}><div className="text-xl">{planned}</div><div className="text-[10px] font-medium text-muted">/21</div></Ring>
        <div className="flex-1"><h2 className="text-lg font-bold">{t('week', lang)}</h2><p className="text-sm text-muted">{planned} {t('meals', lang)}</p><p className="mt-1 text-sm">{money(cost, lang)} <span className="text-muted">/ {money(me!.budget, lang)}</span></p></div>
        <button className="btn btn-primary" onClick={() => go('plan')}>{t('planCta', lang)}</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4"><div className="text-3xl">🔥</div><p className="mt-1 text-2xl font-extrabold tabular-nums">{me!.streak}</p><p className="text-sm text-muted">{t('streak', lang)}</p></div>
        <div className="card p-4"><div className="text-3xl">⭐</div><p className="mt-1 text-2xl font-extrabold tabular-nums">{t('level', lang)} {Math.floor(me!.xp / 100) + 1}</p><div className="mt-2 h-2 rounded-full bg-cream"><div className="h-full rounded-full bg-apricot transition-all" style={{ width: `${me!.xp % 100}%` }} /></div></div>
      </div>
      <div className="card overflow-hidden">
        <p className="px-5 pt-4 text-xs font-bold uppercase tracking-wider text-muted">{t('nextMeal', lang)}</p>
        {tonight ? <button className="flex w-full items-center gap-4 p-4 text-start" onClick={() => go('plan')}><FoodTile r={REC[tonight.r]} className="h-20 w-20 rounded-2xl" /><div><h3 className="text-lg font-bold">{rname(REC[tonight.r].n, lang)}</h3><p className="text-sm text-muted">{tonight.n} {t('servings', lang)} · {REC[tonight.r].t} {t('min', lang)}</p></div></button>
          : <p className="p-5 pt-2 text-muted">{t('nothing', lang)}</p>}
      </div>
      <div className="flex gap-3"><button className="btn btn-soft flex-1" onClick={() => go('recipes')}>🍋 {t('recipes', lang)}</button><button className="btn btn-soft flex-1" onClick={() => go('list')}>🛒 {t('list', lang)}</button></div>
    </div>
  )
}

export function PlannerScreen({ celebrate }: Props) {
  const { lang, me, house, upHouse, award, toast } = useApp()
  const [pick, setPick] = useState<{ d: number; s: Meal } | null>(null)
  const [view, setView] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const plan = house!.plan
  const setEntry = (k: string, r: string, n: number, log: string) => upHouse((h) => { h.plan[k] = { r, n } }, log)
  const hh = Math.max(1, me!.size)
  const cands = useMemo(() => RECIPES.filter((r) => pick && r.m.includes(pick.s) && (rname(r.n, lang) + r.tags.join(' ')).toLowerCase().includes(q.toLowerCase())), [pick, q, lang])

  const suggest = () => {
    const used: Record<string, number> = {}
    const next: typeof plan = {}
    const veg = me!.diet.includes('vegetarian'), cheap = me!.diet.includes('budget'), healthy = me!.diet.includes('healthy')
    for (let d = 0; d < 7; d++) for (const s of SLOTS) {
      const pool = RECIPES.filter((r) => r.m.includes(s) && (!veg || r.tags.includes('vegetarian')))
      const best = [...pool].sort((a, b) => score(a) - score(b))[(d * 3 + SLOTS.indexOf(s)) % Math.min(3, pool.length) ]
      function score(r: Recipe) { return (used[r.id] ?? 0) * 100 + (cheap ? recipeCost(r.id) / r.s : 0) - (healthy && r.tags.includes('healthy') ? 40 : 0) - (r.tags.includes('moroccan') ? 15 : 0) + (r.id.charCodeAt(0) % 7) }
      used[best.id] = (used[best.id] ?? 0) + 1; next[`${d}-${s}`] = { r: best.id, n: hh }
    }
    upHouse((h) => { h.plan = next }, 'planned the week')
    const cost = Object.values(next).reduce((a, e) => a + recipeCost(e.r, e.n), 0)
    award(30, t('week', lang)); celebrate(); toast(`${money(cost, lang)} / ${money(me!.budget, lang)}`)
  }
  const cur = view ? plan[view] : null
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-3xl font-extrabold text-forest">{t('plan', lang)}</h1>
        <div className="flex gap-2"><button className="btn btn-warm !min-h-11" onClick={suggest}>✨ {t("suggest", lang)}</button>{Object.keys(plan).length > 0 && <button className="btn btn-soft !min-h-11" onClick={() => upHouse((h) => { h.plan = {} }, 'cleared the week')}>{t('clear', lang)}</button>}</div></div>
      <p className="text-xs text-muted">{t('suggestNote', lang)}</p>
      {Array.from({ length: 7 }, (_, d) => (
        <div key={d} className="card p-4">
          <h3 className="mb-3 font-bold capitalize">{dayName(d, lang)}</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {SLOTS.map((s) => {
              const e = plan[`${d}-${s}`]
              return e ? (
                <button key={s} className="pop flex items-center gap-3 rounded-2xl bg-cream p-2 text-start" onClick={() => setView(`${d}-${s}`)}>
                  <FoodTile r={REC[e.r]} className="h-12 w-12 shrink-0 rounded-xl !text-2xl" />
                  <span className="min-w-0"><span className="block text-[10px] font-bold uppercase text-muted">{t(s, lang)} · {e.n}</span><span className="block truncate text-sm font-semibold">{rname(REC[e.r].n, lang)}</span></span>
                </button>
              ) : (
                <button key={s} className="flex min-h-[4.25rem] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-sm font-semibold text-muted hover:border-leaf" onClick={() => { setPick({ d, s }); setQ('') }}>+ {t(s, lang)}</button>
              )
            })}
          </div>
        </div>
      ))}
      <Sheet open={!!pick} onClose={() => setPick(null)} title={pick ? `${dayName(pick.d, lang)} · ${t(pick.s, lang)}` : ''}>
        <input className="input mb-3" placeholder={t('search', lang)} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="space-y-2">{cands.map((r) => (
          <button key={r.id} className="flex w-full items-center gap-3 rounded-2xl p-2 text-start hover:bg-cream" onClick={() => { setEntry(`${pick!.d}-${pick!.s}`, r.id, hh, `added ${r.n[0]}`); award(10, rname(r.n, lang)); setPick(null) }}>
            <FoodTile r={r} className="h-14 w-14 rounded-xl !text-3xl" /><span><b className="block text-sm">{rname(r.n, lang)}</b><span className="text-xs text-muted">{r.t} {t('min', lang)} · {money(recipeCost(r.id) / r.s, lang)}</span></span>
          </button>))}</div>
      </Sheet>
      {cur && view && <RecipeSheet r={REC[cur.r]} servings={cur.n} onServings={(n) => setEntry(view, cur.r, n, `set ${REC[cur.r].n[0]} to ${n}`)} onClose={() => setView(null)} />}
      {cur && view && (
        <div className="fixed inset-x-0 bottom-20 z-[75] flex justify-center gap-2 sm:bottom-6">
          <button className="btn btn-soft shadow-lift" onClick={() => { const [d, s] = view.split('-'); setView(null); setPick({ d: +d, s: s as Meal }); setQ('') }}>↻</button>
          <button className="btn shadow-lift" style={{ background: 'rgb(var(--danger))', color: '#fff' }} onClick={() => { upHouse((h) => { delete h.plan[view] }, `removed ${REC[cur.r].n[0]}`); setView(null) }}>{t('remove', lang)}</button>
        </div>
      )}
    </div>
  )
}

export function RecipesScreen({ celebrate }: Props) {
  const { lang, me, house, upHouse, award } = useApp()
  const [q, setQ] = useState(''); const [f, setF] = useState('all'); const [open, setOpen] = useState<Recipe | null>(null)
  const filters = ['all', 'favs', 'moroccan', 'vegetarian', 'quick', 'budget', 'healthy', 'protein', 'family']
  const list = RECIPES.filter((r) => (f === 'all' || (f === 'favs' ? me!.favs.includes(r.id) : r.tags.includes(f))) && (rname(r.n, lang) + ' ' + r.n[0]).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold text-forest">{t('recipes', lang)}</h1>
      <input className="input" placeholder={t('search', lang)} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-2 overflow-x-auto pb-1">{filters.map((k) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{k === 'budget' ? t('budgetT', lang) : t(k, lang)}</button>)}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((r) => (
          <button key={r.id} className="card rise overflow-hidden text-start transition-transform hover:-translate-y-0.5" onClick={() => setOpen(r)}>
            <FoodTile r={r} className="h-28" />
            <div className="p-3"><h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-tight">{rname(r.n, lang)}</h3><p className="mt-1 text-xs text-muted">{r.t} {t('min', lang)} · {money(recipeCost(r.id) / r.s, lang)}</p></div>
          </button>
        ))}
      </div>
      <RecipeSheet key={open?.id} r={open} onClose={() => setOpen(null)} onAdd={(d, s, n) => { upHouse((h) => { h.plan[`${d}-${s}`] = { r: open!.id, n } }, `added ${open!.n[0]}`); award(10, rname(open!.n, lang)); if (Object.keys(house!.plan).length + 1 === 21) celebrate() }} />
    </div>
  )
}
