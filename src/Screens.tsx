import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { dayName, money, rname, t, type Lang } from './lib/i18n'
import { REC, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { SIDE } from './data/sides'
import { dailyKcal, entryCost, entryKcal, fmtQty, healthLevel, kcalPerServing, parseIng, recipeCost, toBase } from './lib/engine'
import { alternatives, CUISINES, FLAG, modeOf, offMode, REGIONS, surpriseOne, composeSides, type Prefs } from './lib/plan'
import { FoodTile, Sheet, Stepper } from './ui'

export const SLOTS: Meal[] = ['b', 'l', 'd', 'g']
export const SLOT_E: Record<Meal, string> = { b: '🌅', l: '☀️', d: '🌙', g: '🍵' }
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



export function usePrefs(): Prefs {
  const { me } = useApp(); const u = me!
  return { size: Math.max(1, u.size), diet: u.diet, cuisine: u.cuisine ?? 'ma', region: u.region ?? 'all', goals: u.goals ?? [], meals: u.meals ?? ['b', 'l', 'd'], budget: u.budget }
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

/** Home: the one big action, cuisine and goals visible, everything else folded away. */
export function HomeTab({ compose, go, total, items }: { compose: () => void; go: (t: 'week' | 'list') => void; total: number; items: number }) {
  const { lang, me, house, patchMe } = useApp()
  const [more, setMore] = useState(false)
  const cuisine = me!.cuisine ?? 'ma'; const region = me!.region ?? 'all'; const goals = me!.goals ?? []
  const plan = house!.plan; const n = Object.keys(plan).length
  const tg = (g: string) => patchMe({ goals: goals.includes(g) ? goals.filter((x) => x !== g) : [...goals.filter((x) => !(g === 'healthy' && x === 'gourmand') && !(g === 'gourmand' && x === 'healthy')), g] })
  return (
    <div className="space-y-4">
      <div className="rise pt-1"><p className="text-sm text-muted">{t('hello', lang)} {me!.name} 👋</p><h1 className="text-[28px] font-extrabold leading-tight text-forest">{t('homeTitle', lang)}</h1></div>
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t('cuisine', lang)}</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" data-noswipe>{CUISINES.map((c) => <button key={c} className="chip shrink-0" aria-pressed={cuisine === c} onClick={() => patchMe({ cuisine: c })}>{FLAG[c]} {t('c_' + c, lang)}</button>)}</div>
        {cuisine === 'ma' && <div className="-mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1" data-noswipe>{REGIONS.map((r) => <button key={r} className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${region === r ? 'bg-leaf/40 text-forest' : 'text-muted'}`} onClick={() => patchMe({ region: r })}>{t('r_' + r, lang)}</button>)}</div>}
      </div>
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t('goals', lang)}</p>
        <div className="flex flex-wrap gap-2">{[['healthy', '🥗'], ['cheap', '💰'], ['quick', '⚡'], ['varied', '🔀'], ['gourmand', '😋']].map(([g, e]) => <button key={g} className="chip" aria-pressed={goals.includes(g)} onClick={() => tg(g)}>{e} {t('g_' + g, lang)}</button>)}</div>
      </div>
      <button className="btn btn-primary w-full !min-h-[4.25rem] flex-col !gap-0 text-lg" onClick={compose}><span>✨ {t('composeAuto', lang)}</span><span className="text-xs font-medium opacity-80">{t('composeSub', lang)}</span></button>
      <button className="flex w-full items-center justify-between px-1 text-sm font-semibold text-muted" onClick={() => setMore(!more)} aria-expanded={more}><span>⚙️ {t('moreOpts', lang)} · 👤 {me!.size} · {money(me!.budget, lang)}</span><span className={`transition-transform ${more ? 'rotate-90' : ''}`}>›</span></button>
      {more && <div className="rise"><Controls setBudget={(b) => patchMe({ budget: b })} /></div>}
      {n > 0 && (
        <div className="card rise space-y-3 p-4">
          <div className="flex items-center justify-between"><h2 className="font-display text-lg font-extrabold">{t('weekReady', lang)}</h2><span className="text-xs text-muted">{n} {t('meals', lang)}</span></div>
          <div className="grid grid-cols-7 gap-1 text-center">{Array.from({ length: 7 }, (_, d) => { const e = plan[`${d}-l`] ?? plan[`${d}-d`]; return <div key={d}><p className="text-[10px] font-bold uppercase text-muted">{dayName(d, lang).slice(0, 2)}</p><p className="text-2xl">{e ? REC[e.r].e : '·'}</p></div> })}</div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-cream p-3 text-center text-sm"><div><b className="block tabular-nums">{items}</b><span className="text-xs text-muted">{t('ingredientsN', lang)}</span></div><div><b className="block tabular-nums">{money(total, lang)}</b><span className="text-xs text-muted">{t('estimated', lang)}</span></div><div><b className="block tabular-nums" style={{ color: total > me!.budget ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }}>{money(Math.abs(me!.budget - total), lang)}</b><span className="text-xs text-muted">{total > me!.budget ? t('overBy', lang) : t('left', lang)}</span></div></div>
          <div className="grid grid-cols-2 gap-2"><button className="btn btn-soft" onClick={() => go('week')}>🗓️ {t('seeWeek', lang)}</button><button className="btn btn-soft" onClick={() => go('list')}>🛒 {t('myList', lang)}</button></div>
        </div>
      )}
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
      <button className="btn btn-warm mb-3 w-full !min-h-12" onClick={() => put(surpriseOne(k, plan, p))}>🎲 {t('surprise', lang)}</button>
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
export function WeekTab({ compose, makeHealthy, say }: { compose: () => void; makeHealthy: () => void; say: (m: string) => void }) {
  const { lang, me, house, upHouse } = useApp()
  const p = usePrefs(); const plan = house!.plan
  const today = (new Date().getDay() + 6) % 7
  const [open, setOpen] = useState<Record<number, boolean>>({ [today]: true })
  const [rep, setRep] = useState<string | null>(null); const [view, setView] = useState<Recipe | null>(null)
  const off = offMode(plan, modeOf(p.goals.includes('healthy') ? p.goals : ['healthy']))
  const slots = SLOTS.filter((s) => p.meals.includes(s) || Object.keys(plan).some((k) => k.endsWith('-' + s)))
  if (!Object.keys(plan).length) return <div className="card space-y-4 p-8 text-center"><p className="text-5xl">🗓️</p><p className="text-muted">{t('emptyWeek', lang)}</p><button className="btn btn-primary w-full" onClick={compose}>✨ {t('composeAuto', lang)}</button></div>
  return (
    <div className="space-y-3">
      <Mascot plan={plan} />
      <div className="flex gap-2"><button className="btn btn-soft flex-1 !min-h-11" onClick={compose}>🎲 {t('reshuffle', lang)}</button>{off > 0 && <button className="btn btn-soft flex-1 !min-h-11 !text-forest" onClick={makeHealthy}>🥗 {t('makeHealthy', lang)}</button>}</div>
      {Array.from({ length: 7 }, (_, d) => {
        const es = slots.map((s) => plan[`${d}-${s}`]).filter(Boolean); const isOpen = !!open[d]
        const kc = es.reduce((a, e) => a + entryKcal(e), 0); const cost = es.reduce((a, e) => a + entryCost(e), 0)
        return (
          <div key={d} className="card overflow-hidden">
            <button className="flex w-full items-center gap-3 px-4 py-3 text-start" onClick={() => setOpen({ ...open, [d]: !isOpen })} aria-expanded={isOpen}>
              <span className="min-w-0 flex-1"><span className={`block font-display text-[17px] font-extrabold capitalize ${d === today ? 'text-forest' : ''}`}>{dayName(d, lang)}{d === today && <span className="ms-2 rounded-full bg-leaf/40 px-2 py-0.5 align-middle text-[10px] font-bold">{t('today', lang)}</span>}</span><span className="text-xs text-muted tabular-nums">{Math.round(kc)} kcal · {money(cost, lang)}</span></span>
              {!isOpen && <span className="text-xl tracking-tight">{es.map((e) => REC[e.r].e).join('')}</span>}
              <span className={`text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
            </button>
            {isOpen && <div className="divide-y divide-line/70 border-t border-line/70">
              {slots.map((s) => {
                const k = `${d}-${s}`; const e = plan[k]
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
                      <button className="rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-white active:scale-95" onClick={() => setRep(k)}>↻ {t('change', lang)}</button>
                      <span className="inline-flex items-center rounded-full bg-cream text-xs font-bold"><button className="px-2.5 py-1.5" onClick={() => upHouse((h) => { h.plan[k] = { ...e, n: Math.max(1, e.n - 1) } })} aria-label="−">−</button><span className="tabular-nums">👤 {e.n}</span><button className="px-2.5 py-1.5" onClick={() => upHouse((h) => { h.plan[k] = { ...e, n: Math.min(12, e.n + 1) } })} aria-label="+">+</button></span>
                      <button className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold active:scale-95" onClick={() => setView(r)}>📖 {t('recipe', lang)}</button>
                    </div>
                  </div>
                )
              })}
            </div>}
          </div>
        )
      })}
      {rep && <ReplaceSheet k={rep} onClose={() => setRep(null)} say={say} />}
      {view && <RecipeSheet r={view} onClose={() => setView(null)} />}
      <p className="px-1 text-center text-xs text-muted">{me!.size} 👤 · {t('c_' + p.cuisine, lang)}</p>
    </div>
  )
}
