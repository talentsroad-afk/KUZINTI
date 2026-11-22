import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { dayName, money, rname, t, type Lang } from './lib/i18n'
import { RECIPES, REC, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { dailyKcal, fmtQty, healthLevel, kcalPerServing, parseIng, recipeCost, toBase } from './lib/engine'
import type { Mode } from './lib/plan'
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
const MODES: { id: Mode; e: string; k: string }[] = [{ id: 'light', e: '🥗', k: 'modeLight' }, { id: 'balanced', e: '⚖️', k: 'modeBal' }, { id: 'gourmet', e: '😋', k: 'modeGourmet' }]

export function ModePicker({ value, onPick, compact = false }: { value: Mode; onPick: (m: Mode) => void; compact?: boolean }) {
  const { lang } = useApp()
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup">
      {MODES.map((m) => (
        <button key={m.id} role="radio" aria-checked={value === m.id} onClick={() => onPick(m.id)} className={`rounded-2xl border-2 p-3 text-center transition-all active:scale-95 ${value === m.id ? 'border-forest bg-leaf/25 shadow-soft' : 'border-line bg-surface'}`}>
          <div className={`text-3xl ${value === m.id ? 'pop' : ''}`}>{m.e}</div>
          <div className="mt-1 text-sm font-bold">{t(m.k, lang)}</div>
          {!compact && <div className="mt-0.5 text-[11px] leading-tight text-muted">{t({ light: 'modeLightD', balanced: 'modeBalD', gourmet: 'modeGourmetD' }[m.id], lang)}</div>}
        </button>
      ))}
    </div>
  )
}

/** Budget, people, mode and vegetarian: the controls that drive the whole week. Used on step 1 and in the budget sheet. */
export function Controls({ setBudget, setMode }: { setBudget: (b: number) => void; setMode: (m: Mode) => void }) {
  const { lang, me, patchMe } = useApp()
  const b = me!.budget
  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-5 text-center">
        <div className="flex items-center justify-center gap-4">
          <button className="btn btn-soft !h-12 !w-12 !min-h-12 !px-0 text-xl" onClick={() => setBudget(Math.max(200, b - 50))} aria-label="−50">−</button>
          <div><div className="font-display text-5xl font-extrabold tabular-nums text-forest">{b}</div><div className="text-sm font-semibold text-muted">MAD / {t('week2', lang).toLowerCase()}</div></div>
          <button className="btn btn-soft !h-12 !w-12 !min-h-12 !px-0 text-xl" onClick={() => setBudget(Math.min(5000, b + 50))} aria-label="+50">+</button>
        </div>
        <input type="range" min={200} max={3000} step={50} value={Math.min(b, 3000)} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-[#245B43]" aria-label={t('budgetBar', lang)} />
        <p className="text-sm text-muted">≈ {money(b / 7, lang)} {t('perDay', lang)} · {money(b / 7 / Math.max(1, me!.size), lang)} / 👤</p>
      </div>
      <ModePicker value={me!.mode ?? 'balanced'} onPick={setMode} />
      <div className="card flex items-center justify-between gap-3 p-4">
        <span className="font-bold">👤 {t('people', lang)}</span><Stepper v={me!.size} set={(n) => patchMe({ size: n })} max={12} />
        <button className="chip" aria-pressed={me!.diet.includes('vegetarian')} onClick={() => patchMe({ diet: me!.diet.includes('vegetarian') ? [] : ['vegetarian'] })}>🌱 {t('veg', lang)}</button>
      </div>
    </div>
  )
}

export function BudgetStep({ setBudget, setMode, compose, hasPlan, go }: { setBudget: (b: number) => void; setMode: (m: Mode) => void; compose: () => void; hasPlan: boolean; go: (s: number) => void }) {
  const { lang } = useApp()
  return (
    <div className="space-y-5">
      <h1 className="rise text-center text-2xl font-extrabold leading-tight text-forest">{t('bTitle', lang)}</h1>
      <Controls setBudget={setBudget} setMode={setMode} />
      <button className="btn btn-primary w-full !min-h-14 text-base" onClick={compose}>✨ {t('compose', lang)}</button>
      {hasPlan && <button className="btn btn-soft w-full" onClick={() => go(2)}>{t('keepWeek', lang)} →</button>}
    </div>
  )
}

/** Mascot reacts to the real calories of the planned week. */
export function Mascot({ plan }: { plan: Record<string, { r: string; n: number }> }) {
  const { lang } = useApp()
  const kc = Math.round(dailyKcal(plan)); const hl = healthLevel(kc)
  const pos = Math.min(100, Math.max(0, (kc / 3000) * 100))
  const hue = { fit: 'linear-gradient(135deg, rgb(var(--leaf) / .55), rgb(var(--cream)))', balanced: 'linear-gradient(135deg, rgb(var(--apricot) / .35), rgb(var(--cream)))', belly: 'linear-gradient(135deg, rgb(var(--apricot) / .7), rgb(255 226 200))' }[hl]
  return (
    <div className="card overflow-hidden p-4" style={{ background: hue, transition: 'background .6s' }}>
      <div className="flex items-center gap-4">
        <div key={hl} className={`mascot mascot-${hl} text-6xl`} aria-hidden>{HEALTH[hl]}</div>
        <div className="min-w-0 flex-1"><p className="font-display text-lg font-extrabold leading-tight">{t({ fit: 'capFit', balanced: 'capBal', belly: 'capBelly' }[hl], lang)}</p><p className="text-sm text-muted tabular-nums">≈ {kc.toLocaleString(lang === 'ar' ? 'en' : lang)} {t('kcal', lang)}</p></div>
      </div>
      <div className="relative mt-4 h-3 rounded-full" style={{ background: 'linear-gradient(90deg, rgb(var(--leaf)) 0 50%, rgb(var(--apricot)) 50% 73%, rgb(var(--danger) / .75) 73%)' }}>
        <div className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-4 border-white bg-forest shadow-soft transition-all duration-700" style={{ insetInlineStart: `calc(${pos}% - 12px)` }} />
      </div>
    </div>
  )
}

/** Step 2: a day at a time, so it fits a phone screen. */
export function WeekStep({ compose, setMode }: { compose: () => void; setMode: (m: Mode) => void }) {
  const { lang, me, house, upHouse, award } = useApp()
  const [day, setDay] = useState((new Date().getDay() + 6) % 7)
  const [pick, setPick] = useState<{ d: number; s: Meal } | null>(null)
  const [view, setView] = useState<string | null>(null)
  const [q, setQ] = useState(''); const [f, setF] = useState('all')
  const plan = house!.plan; const hh = Math.max(1, me!.size)
  const setEntry = (k: string, r: string, n: number, log: string) => upHouse((h) => { h.plan[k] = { r, n } }, log)
  const cands = useMemo(() => RECIPES.filter((r) => pick && r.m.includes(pick.s) && (f === 'all' || r.tags.includes(f)) && (rname(r.n, lang) + ' ' + r.n[0]).toLowerCase().includes(q.toLowerCase())), [pick, q, f, lang])
  const dayEntries = SLOTS.map((s) => plan[`${day}-${s}`]).filter(Boolean)
  const dayK = Math.round(dayEntries.reduce((a, e) => a + kcalPerServing(e.r), 0)); const dayC = dayEntries.reduce((a, e) => a + recipeCost(e.r, e.n), 0)
  const cur = view ? plan[view] : null
  const open = (s: Meal) => { setPick({ d: day, s }); setQ(''); setF('all') }
  return (
    <div className="space-y-4">
      <Mascot plan={plan} />
      <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><ModePicker compact value={me!.mode ?? 'balanced'} onPick={setMode} /></div><button className="btn btn-soft !h-full !min-h-[4.25rem] flex-col !px-4 text-xs" onClick={compose}><span className="text-2xl">🎲</span>{t('reshuffle', lang)}</button></div>
      <div data-noswipe className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {Array.from({ length: 7 }, (_, d) => (
          <button key={d} aria-pressed={day === d} onClick={() => setDay(d)} className={`flex min-w-[3.6rem] flex-1 flex-col items-center rounded-2xl py-2 transition-all active:scale-95 ${day === d ? 'bg-forest text-white shadow-lift' : 'bg-surface text-ink shadow-soft'}`}>
            <span className="text-xs font-bold uppercase">{dayName(d, lang).slice(0, 3)}</span>
            <span className="mt-1 flex gap-0.5">{SLOTS.map((s) => <i key={s} className={`h-1.5 w-1.5 rounded-full ${plan[`${d}-${s}`] ? (day === d ? 'bg-apricot' : 'bg-forest') : day === d ? 'bg-white/30' : 'bg-line'}`} />)}</span>
          </button>
        ))}
      </div>
      <div key={day} className="rise space-y-3">
        <div className="flex items-end justify-between"><h2 className="text-xl font-extrabold capitalize">{dayName(day, lang)}</h2><span className="text-xs text-muted tabular-nums">≈ {dayK} kcal · {money(dayC, lang)}</span></div>
        {SLOTS.map((s) => {
          const e = plan[`${day}-${s}`]
          if (!e) return <button key={s} className="flex min-h-[5.5rem] w-full items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line bg-surface/50 font-semibold text-muted active:scale-[.98]" onClick={() => open(s)}><span className="text-3xl">{{ b: '🌅', l: '☀️', d: '🌙' }[s]}</span>+ {t(s, lang)}</button>
          const r = REC[e.r]; const kb = kcalBadge(e.r)
          return (
            <div key={s} className="card pop p-3">
              <div className="flex gap-3">
                <button onClick={() => setView(`${day}-${s}`)} aria-label={rname(r.n, lang)}><FoodTile r={r} className="h-20 w-20 shrink-0 rounded-2xl" /></button>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{{ b: '🌅', l: '☀️', d: '🌙' }[s]} {t(s, lang)}</p>
                  <button className="block text-start font-display text-base font-extrabold leading-tight" onClick={() => setView(`${day}-${s}`)}>{rname(r.n, lang)}</button>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted"><span className={`rounded-full px-2 py-0.5 font-bold ${kb.c}`}>{kb.k} kcal</span><span>≈ {money(recipeCost(e.r) / r.s, lang)} / 👤</span></p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between"><Stepper v={e.n} set={(n) => setEntry(`${day}-${s}`, e.r, n, `set ${r.n[0]} to ${n}`)} max={12} />
                <span className="flex gap-2"><button className="btn btn-soft !min-h-10 !px-4" onClick={() => open(s)} aria-label="swap">↻</button><button className="btn btn-soft !min-h-10 !px-4 !text-danger" onClick={() => upHouse((h) => { delete h.plan[`${day}-${s}`] }, `removed ${r.n[0]}`)} aria-label={t('remove', lang)}>✕</button></span></div>
            </div>
          )
        })}
      </div>
      <Sheet open={!!pick} onClose={() => setPick(null)} title={pick ? `${dayName(pick.d, lang)} · ${t(pick.s, lang)}` : ''}>
        <input className="input mb-2" placeholder={t('search', lang)} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{FILTERS.map((k) => <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{k === 'budget' ? t('budgetT', lang) : t(k, lang)}</button>)}</div>
        <div className="space-y-1">{cands.map((r) => { const kb = kcalBadge(r.id); return (
          <button key={r.id} className="flex w-full items-center gap-3 rounded-2xl p-2 text-start hover:bg-cream" onClick={() => { setEntry(`${pick!.d}-${pick!.s}`, r.id, hh, `added ${r.n[0]}`); award(10, rname(r.n, lang)); setPick(null) }}>
            <FoodTile r={r} className="h-14 w-14 shrink-0 rounded-xl !text-3xl" /><span className="min-w-0 flex-1"><b className="block truncate text-sm">{rname(r.n, lang)}</b><span className="text-xs text-muted">{r.t} {t('min', lang)} · {money(recipeCost(r.id) / r.s, lang)}</span></span><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${kb.c}`}>{kb.k} kcal</span>
          </button>) })}</div>
      </Sheet>
      {cur && view && <RecipeSheet r={REC[cur.r]} servings={cur.n} onServings={(n) => setEntry(view, cur.r, n, `set ${REC[cur.r].n[0]} to ${n}`)} onClose={() => setView(null)} />}
    </div>
  )
}
