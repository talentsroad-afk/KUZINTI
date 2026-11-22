import { useState } from 'react'
import { useApp } from './lib/store'
import { dayName, money, rname, t, type Lang } from './lib/i18n'
import { REC, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { dailyKcal, fmtQty, healthLevel, kcalPerServing, parseIng, recipeCost, toBase } from './lib/engine'
import { offMode, type Mode } from './lib/plan'
import { FoodTile, Sheet, Stepper } from './ui'

import { SLOTS, SLOT_E } from './Catalog'
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

export function BudgetStep({ setBudget, setMode, compose, hasPlan, go, pickOwn }: { setBudget: (b: number) => void; setMode: (m: Mode) => void; compose: () => void; hasPlan: boolean; go: (s: number) => void; pickOwn: () => void }) {
  const { lang } = useApp()
  return (
    <div className="space-y-5">
      <h1 className="rise text-center text-2xl font-extrabold leading-tight text-forest">{t('bTitle', lang)}</h1>
      <Controls setBudget={setBudget} setMode={setMode} />
      <button className="btn btn-primary w-full !min-h-14 text-base" onClick={pickOwn}>📖 {t('chooseMine', lang)}</button>
      <button className="btn btn-soft w-full !min-h-12" onClick={compose}>✨ {t('compose', lang)}</button>
      {hasPlan && <button className="btn btn-soft w-full" onClick={() => go(2)}>{t('keepWeek', lang)} →</button>}
    </div>
  )
}

/** Mascot reacts to the real calories of the planned week. */
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
      <div className="relative mt-2.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, rgb(var(--leaf)) 0 50%, rgb(var(--apricot)) 50% 73%, rgb(var(--danger) / .7) 73%)' }}>
        <div className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-white bg-forest shadow-soft transition-all duration-700" style={{ insetInlineStart: `calc(${pos}% - 8px)` }} />
      </div>
    </div>
  )
}

function Segmented({ value, onPick }: { value: Mode; onPick: (m: Mode) => void }) {
  const { lang } = useApp()
  return (
    <div className="flex flex-1 rounded-xl bg-[rgb(var(--ink)/.07)] p-0.5" role="radiogroup">
      {MODES.map((m) => <button key={m.id} role="radio" aria-checked={value === m.id} onClick={() => onPick(m.id)} className={`flex-1 rounded-[10px] px-1 py-1.5 text-[13px] font-semibold transition-all ${value === m.id ? 'bg-surface text-forest shadow-soft' : 'text-muted'}`}>{m.e} {t(m.k, lang)}</button>)}
    </div>
  )
}

/** Step 2: the whole week at a glance (days x slots). Tap a cell for details. */
export function WeekStep({ compose, setMode, adaptMode, openCatalog }: { compose: () => void; setMode: (m: Mode) => void; adaptMode: () => void; openCatalog: (d: number, s: Meal) => void }) {
  const { lang, me, house, upHouse } = useApp()
  const [sel, setSel] = useState<{ d: number; s: Meal } | null>(null)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const plan = house!.plan; const mode = me!.mode ?? 'balanced'; const off = offMode(plan, mode)
  const today = (new Date().getDay() + 6) % 7
  const setEntry = (k: string, r: string, n: number, log: string) => upHouse((h) => { h.plan[k] = { r, n } }, log)
  const e = sel ? plan[`${sel.d}-${sel.s}`] : undefined; const r = e ? REC[e.r] : null; const kb = e ? kcalBadge(e.r) : null
  return (
    <div className="space-y-3">
      <Mascot plan={plan} />
      <div className="flex items-center gap-2"><Segmented value={mode} onPick={setMode} /><button className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-xl shadow-soft active:scale-90" onClick={compose} aria-label={t('reshuffle', lang)}>🎲</button></div>
      {off > 0 && <div className="flex items-center gap-3 rounded-xl bg-apricot/25 px-3 py-2"><p className="min-w-0 flex-1 text-[13px]"><b>{off}</b> {t('offMode', lang)}</p><button className="shrink-0 rounded-full bg-apricot px-3 py-1.5 text-xs font-bold text-[#3c280a] active:scale-95" onClick={adaptMode}>{t('adaptMode', lang)}</button></div>}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[3.1rem_repeat(4,1fr)] bg-[rgb(var(--ink)/.03)] py-1.5 text-center text-base">
          <span />{SLOTS.map((s) => <span key={s} title={t(s, lang)}>{SLOT_E[s]}</span>)}
        </div>
        {Array.from({ length: 7 }, (_, d) => {
          const k = Math.round(SLOTS.reduce((a, s) => a + (plan[`${d}-${s}`] ? kcalPerServing(plan[`${d}-${s}`].r) : 0), 0))
          return (
            <div key={d} className="grid grid-cols-[3.1rem_repeat(4,1fr)] border-t border-line/70">
              <div className={`flex flex-col items-center justify-center py-1 ${d === today ? 'text-forest' : ''}`}><span className="text-[11px] font-extrabold uppercase">{dayName(d, lang).slice(0, 3)}</span><span className="text-[9px] tabular-nums text-muted">{k ? `${(k / 1000).toFixed(1)}k` : ''}</span></div>
              {SLOTS.map((s) => {
                const en = plan[`${d}-${s}`]
                return (
                  <button key={s} className="flex min-h-[3.9rem] flex-col items-center justify-center gap-0.5 border-s border-line/50 px-1 py-1 text-center active:bg-leaf/20" onClick={() => (en ? setSel({ d, s }) : openCatalog(d, s))} aria-label={`${dayName(d, lang)} ${t(s, lang)}`}>
                    {en ? <><span className="text-xl leading-none">{REC[en.r].e}</span><span className="line-clamp-2 text-[10px] font-medium leading-[1.15]">{rname(REC[en.r].n, lang)}</span></> : <span className="grid h-6 w-6 place-items-center rounded-full text-sm text-[rgb(var(--ink)/.25)]">＋</span>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
      <button className="btn btn-soft w-full !min-h-12" onClick={() => openCatalog(today, 'l')}>📖 {t('browse', lang)}</button>

      <Sheet open={!!sel && !!e && !!r} onClose={() => setSel(null)} title={r ? rname(r.n, lang) : ''}>
        {sel && e && r && kb && <div className="space-y-4">
          <div className="flex items-center gap-3"><FoodTile r={r} className="h-20 w-20 shrink-0 rounded-2xl" /><div className="text-sm text-muted"><p className="font-semibold text-ink">{dayName(sel.d, lang)} · {SLOT_E[sel.s]} {t(sel.s, lang)}</p><p className="mt-1 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${kb.c}`}>{kb.k} kcal</span><span>⏱ {r.t} {t('min', lang)}</span><span>≈ {money(recipeCost(e.r, e.n), lang)}</span></p></div></div>
          <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-2"><span className="font-semibold">{t('servings', lang)}</span><Stepper v={e.n} set={(n) => setEntry(`${sel.d}-${sel.s}`, e.r, n, `set ${r.n[0]} to ${n}`)} max={12} /></div>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-start font-medium active:bg-cream" onClick={() => { setRecipe(r); setSel(null) }}>📖 {t('steps', lang)} · {t('ingredients', lang)}<span className="ms-auto text-muted">›</span></button>
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-start font-medium active:bg-cream" onClick={() => { const c = sel; setSel(null); openCatalog(c.d, c.s) }}>↻ {t('pick', lang)}<span className="ms-auto text-muted">›</span></button>
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-start font-medium text-danger active:bg-cream" onClick={() => { upHouse((h) => { delete h.plan[`${sel.d}-${sel.s}`] }, `removed ${r.n[0]}`); setSel(null) }}>🗑 {t('remove', lang)}</button>
          </div>
        </div>}
      </Sheet>
      {recipe && <RecipeSheet r={recipe} onClose={() => setRecipe(null)} />}
    </div>
  )
}
