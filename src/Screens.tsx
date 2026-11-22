import { RefreshCw, Shuffle } from 'lucide-react'
import { BookOpen, Coffee, Dices, Moon, Sun, Sunrise, type LucideIcon } from './icons'
import { E3 } from './E3'
import { StepScene, actOf, ACT_LABEL } from './StepScene'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HEALTH as HP, NUT, healthOk, nutName, nutrientsOf, type Health } from './lib/nutri'
import { useApp } from './lib/store'
import { dayName, money, money2, rname, t, type Lang } from './lib/i18n'
import { REC, stepsOf, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { SIDE } from './data/sides'
import { dailyKcal, entryCost, entryKcal, fmtQty, healthLevel, kcalPerServing, parseIng, recipeCost, toBase } from './lib/engine'
import { alternatives, FLAG, surpriseOne, composeSides, type Prefs } from './lib/plan'
import { Dish, FoodTile, Sheet, Stepper } from './ui'
const SLOT_BG: Record<string, string> = { b: '#FBEFD9', l: '#E6F0E4', d: '#E7E9F4', g: '#FCE7E1' }
import { iconOf } from './Cart'
import { FormeCard } from './Forme'

export const SLOTS: Meal[] = ['b', 'l', 'd', 'g']
export const SLOT_E: Record<Meal, string> = { b: '🌅', l: '☀️', d: '🌙', g: '🍵' }
export const SLOT_I: Record<Meal, LucideIcon> = { b: Sunrise, l: Sun, d: Moon, g: Coffee }
const UNIT: Record<string, [string, string, string]> = { bunch: ['bunch', 'botte', 'botte'], glass: ['glass', 'verre', 'كأس'], pinch: ['pinch', 'pincée', 'رشة'], tbsp: ['tbsp', 'c. à s.', 'م.ك'], tsp: ['tsp', 'c. à c.', 'م.ص'], clove: ['clove', 'gousse', 'فص'], pc: ['', '', ''], g: ['g', 'g', 'غ'], ml: ['ml', 'ml', 'مل'] }
const li = (l: Lang) => (l === 'en' ? 0 : l === 'ar' ? 2 : 1)
const r1 = (n: number) => Math.round(n * 10) / 10
export const HEALTH = { fit: '🏃', balanced: '🙂', belly: '🫃' } as const
export const kcalBadge = (rid: string) => { const k = Math.round(kcalPerServing(rid)); return { k, c: k <= 450 ? 'bg-leaf/40 text-forest' : k <= 700 ? 'bg-cream text-muted' : 'bg-apricot/50 text-[#6b4510]' } }

function NutriChips({ r }: { r: Recipe }) {
  const { lang, me } = useApp(); const ns = nutrientsOf(r).slice(0, 4); const h = (me!.health ?? 'none') as Health; const need = HP[h][4]
  if (!ns.length) return null
  return <div className="mb-4 flex flex-wrap gap-1.5">{ns.map((n) => <span key={n} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${need.includes(n) ? 'bg-forest text-white' : 'bg-leaf/25 text-forest'}`}>{NUT[n][0]} {nutName(n, lang)}</span>)}</div>
}
function NutriBox({ r }: { r: Recipe }) {
  const { lang, me } = useApp(); const h = (me!.health ?? 'none') as Health; if (h === 'none') return null
  const ok = healthOk(r, h); const hit = HP[h][4].filter((n) => nutrientsOf(r).slice(0, 5).includes(n))
  return <p className={`rounded-2xl p-3 text-sm ${ok ? 'bg-leaf/20' : 'bg-danger/10 text-danger'}`}>{HP[h][0]} <b>{HP[h][lang === 'en' ? 1 : lang === 'ar' ? 3 : 2]}</b> · {!ok ? (lang === 'en' ? 'Not advised (raw egg).' : 'Déconseillé (œuf cru).') : hit.length ? `${lang === 'en' ? 'Good source of' : 'Bonne source de'} ${hit.map((n) => nutName(n, lang).toLowerCase()).join(', ')}.` : (lang === 'en' ? 'Fine, pair it with a dish richer in what you need.' : 'Possible, à compléter avec un plat plus riche en ce dont vous avez besoin.')}</p>
}

/** The recipe told as a story: ingredients come in, then each step full screen, auto-advancing. Tap left/right to move. */
function CookStory({ r, sv, onClose }: { r: Recipe; sv: number; onClose: () => void }) {
  const { lang } = useApp()
  const steps = stepsOf(r, lang)
  // Every ingredient with its real quantity for the chosen servings (grams, ml, pieces or kitchen units).
  const ings = r.ing.map((s) => { const p = parseIng(s); const ing = ING[p.id]; if (!ing || ing.aisle === 'spices') return null; const q = (p.qty * sv) / r.s
    return { e: iconOf(p.id, ing.aisle), c: ing.aisle === 'produce' || ing.aisle === 'meat', n: ing.n[li(lang)], q: p.unit && p.unit !== ing.base && UNIT[p.unit] ? `${r1(q)} ${UNIT[p.unit][li(lang)]}` : fmtQty(toBase(ing, q, p.unit), ing.base) } }).filter(Boolean) as { e: string; c: boolean; n: string; q: string }[]
  const sceneIngs = r.ing.map((x) => { const p = parseIng(x); const ing = ING[p.id]; if (!ing) return null; return { e: iconOf(p.id, ing.aisle), id: p.id, n: ing.n[li(lang)], c: ing.aisle === 'produce' || ing.aisle === 'meat', l: ing.base === 'ml', s: ing.aisle === 'spices' } }).filter(Boolean) as { e: string; id: string; n: string; c: boolean; l: boolean; s: boolean }[]
  const N = steps.length + 2; const [i, setI] = useState(0); const [dir, setDir] = useState(1)
  const go = (k: number) => { setDir(k > i ? 1 : -1); setI(k) }
  const dur = i === 0 ? 2600 + ings.length * 260 : 8000
  // Pause: hold the screen (like a story) or tap ⏸. The timer resumes where it stopped.
  const [paused, setPaused] = useState(false); const left = useRef(dur); const t0 = useRef(Date.now())
  useEffect(() => { left.current = dur }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (i >= N - 1 || paused) return; t0.current = Date.now(); const id = setTimeout(() => go(i + 1), left.current); return () => { clearTimeout(id); left.current = Math.max(400, left.current - (Date.now() - t0.current)) } }, [i, N, paused]) // eslint-disable-line react-hooks/exhaustive-deps
  const hold = useRef(0); const held = useRef(false)
  const down = () => { held.current = false; hold.current = window.setTimeout(() => { held.current = true; setPaused(true) }, 220) }
  const up = () => { clearTimeout(hold.current); if (held.current) { setPaused(false) } }
  const hue = r.h
  return createPortal(
    <div className={`fixed inset-0 z-[80] flex select-none flex-col overflow-hidden text-white ${paused ? 'story-paused' : ''}`} style={{ background: `radial-gradient(120% 80% at 50% 0%, hsl(${hue} 50% 30%), #0a130f 72%)` }} role="dialog" aria-label={rname(r.n, lang)}
      onPointerDown={down} onPointerUp={up} onPointerCancel={up}>
      <span className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl" style={{ background: `hsl(${hue} 80% 55% / .35)` }} aria-hidden />
      <div className="relative flex gap-1 px-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>{Array.from({ length: N }, (_, k) => <span key={k} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"><span key={i} className={`block h-full rounded-full bg-white ${k < i ? 'w-full' : k === i && i < N - 1 ? 'story-bar' : k === i ? 'w-full' : 'w-0'}`} style={k === i ? { animationDuration: `${dur / 1000}s`, animationPlayState: paused ? 'paused' : 'running' } : undefined} /></span>)}</div>
      <div className="relative flex items-center gap-3 px-4 py-3"><Dish r={r} w={120} className="h-9 w-9 rounded-full" /><span className="min-w-0 flex-1"><b className="block truncate">{rname(r.n, lang)}</b><span className="text-[11px] text-white/60">{sv} {t('servings', lang)} · ⏱ {r.t} min</span></span><button className="relative z-20 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-sm" onClick={() => setPaused(!paused)} aria-label={paused ? (lang === 'en' ? 'Play' : 'Lecture') : 'Pause'}>{paused ? '▶' : '❚❚'}</button><button className="relative z-20 grid h-9 w-9 place-items-center rounded-full bg-white/15" onClick={onClose} aria-label="Close">✕</button></div>
      {paused && <div className="pointer-events-none absolute inset-x-0 top-24 z-30 flex justify-center"><span className="rounded-full bg-black/55 px-4 py-2 text-sm font-bold backdrop-blur">❚❚ {lang === 'en' ? 'Paused · tap ▶ to resume' : 'En pause · ▶ pour reprendre'}</span></div>}
      <div className="relative flex-1" style={{ perspective: 1100 }}>
        <button className="absolute inset-y-0 start-0 z-10 w-1/3" onClick={() => { if (!held.current) go(Math.max(0, i - 1)) }} aria-label="‹" />
        <button className="absolute inset-y-0 end-0 z-10 w-2/3" onClick={() => { if (held.current) return; if (i < N - 1) go(i + 1); else onClose() }} aria-label="›" />
        <div className="scene3d h-full">
        <div key={i} className={`${dir > 0 ? 'flip-in-r' : 'flip-in-l'} flex h-full flex-col justify-center px-6`}>
          {i === 0 && <><div className="story-pop mb-6 flex items-center gap-4" style={{ transform: 'translateZ(50px)' }}><Dish r={r} w={240} className="h-24 w-24 shrink-0 rounded-full shadow-[0_24px_40px_-12px_rgba(0,0,0,.8)] ring-4 ring-white/15" /><div><p className="font-display text-[26px] font-extrabold leading-tight">{rname(r.n, lang)}</p><p className="mt-1 text-sm text-white/70">👥 {sv} · ⏱ {r.t} min</p></div></div><p className="text-[12px] font-bold uppercase tracking-[.22em] text-white/60">{lang === 'en' ? 'You need' : 'Il vous faut'} · {ings.length}</p>
            <div className="mt-4 grid grid-cols-3 gap-3" style={{ transformStyle: 'preserve-3d' }}>{ings.slice(0, 12).map((x, k) => (
              <div key={k} className="ing3d relative flex flex-col items-center rounded-[20px] border border-white/15 bg-white/[.08] px-2 pb-2.5 pt-3 text-center shadow-[0_18px_40px_-12px_rgba(0,0,0,.6)] backdrop-blur-md" style={{ animationDelay: `${k * 260}ms`, ['--fz' as string]: `${(k % 3) * 8}px` }}>
                <span className="ing-emoji text-[40px] leading-none drop-shadow-[0_10px_8px_rgba(0,0,0,.45)]" style={{ animationDelay: `${k * 260 + 700}ms` }}><E3 e={x.e} /></span>
                <span className="mt-1.5 line-clamp-1 text-[11px] font-semibold text-white/85">{x.n}</span>
                <span className="qty-pop mt-1 rounded-full bg-white px-2 py-0.5 font-display text-[13px] font-extrabold text-ink tabular-nums" style={{ animationDelay: `${k * 260 + 420}ms` }}>{x.q}</span>
              </div>))}</div></>}
          {i > 0 && i <= steps.length && (() => { const si = ings.filter((x) => steps[i - 1].toLowerCase().includes(x.n.toLowerCase().split(' ')[0].slice(0, 5))); const act = actOf(steps[i - 1]); return <>
            <StepScene dish={r.n.join(' ')} text={steps[i - 1]} ings={sceneIngs.filter((x) => steps[i - 1].toLowerCase().includes(x.n.toLowerCase().split(' ')[0].slice(0, 5)))} />
            <div className="-mt-2 rounded-[28px] border border-white/15 bg-white/[.07] p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)] backdrop-blur-md" style={{ transform: 'translateZ(40px)' }}>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-apricot"><span className="grid h-6 w-6 place-items-center rounded-full bg-apricot font-display text-[12px] text-ink">{i}</span>{ACT_LABEL[act][lang === 'en' ? 0 : lang === 'ar' ? 2 : 1]}</p>
            <p className="mt-2 font-display text-[21px] font-bold leading-snug">{steps[i - 1]}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{si.slice(0, 4).map((x, k) => <span key={k} className="qty-pop inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-bold text-ink" style={{ animationDelay: `${300 + k * 120}ms` }}><E3 e={x.e} /> {x.q}</span>)}</div>
            <p className="mt-4 text-xs text-white/55">{lang === 'en' ? 'Step' : 'Étape'} {i}/{steps.length} · {lang === 'en' ? 'tap to continue' : 'touchez pour continuer'}</p></div></> })()}
          {i === N - 1 && <div className="text-center"><StepScene dish={r.n.join(' ')} text="servir serve" ings={[]} />
            <p className="story-pop mt-2 font-display text-3xl font-extrabold">{lang === 'en' ? 'Enjoy your meal!' : lang === 'ar' ? 'بالصحة والعافية' : 'Bon appétit !'}</p><p className="mt-1 text-white/70">{rname(r.n, lang)}</p></div>}
        </div></div>
      </div>
    </div>, document.body)
}

export function RecipeSheet({ r, onClose, servings, onServings }: { r: Recipe | null; onClose: () => void; servings?: number; onServings?: (n: number) => void }) {
  const { lang, me, patchMe, award, upHouse, toast } = useApp()
  const [n, setN] = useState(servings ?? Math.max(2, me!.size))
  const [day, setDay] = useState((new Date().getDay() + 6) % 7); const [story, setStory] = useState(false)
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
      <NutriChips r={r} />
      <button className="story-cta group relative mb-4 flex w-full items-center gap-3 overflow-hidden rounded-[22px] p-3 text-start text-white" style={{ background: `linear-gradient(120deg, hsl(${r.h} 45% 30%), #10221a)` }} onClick={() => setStory(true)}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15 text-xl transition group-active:scale-90">▶</span>
        <span className="min-w-0 flex-1"><b className="block">{lang === 'en' ? 'Cook it step by step' : 'Cuisiner pas à pas'}</b><span className="block text-xs text-white/75">{lang === 'en' ? 'Full-screen story, one step at a time' : 'En plein écran, une étape à la fois'}</span></span>
        <span className="flex -space-x-2">{[...new Set(r.ing.slice(0, 4).map((s) => { const p = parseIng(s); return ING[p.id] ? iconOf(p.id, ING[p.id].aisle) : '' }))].map((e, k) => <span key={k} className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-base ring-2 ring-[#10221a]">{e}</span>)}</span>
      </button>
      {story && <CookStory r={r} sv={sv} onClose={() => setStory(false)} />}
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
      <ol className="mb-4 space-y-2.5 text-sm">{stepsOf(r, lang).map((x, i) => <li key={i} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-xs font-extrabold text-white">{i + 1}</span><span className="pt-1 leading-relaxed">{x}</span></li>)}</ol>
      <NutriBox r={r} />
    </Sheet>
  )
}



export function usePrefs(): Prefs {
  const { me } = useApp(); const u = me!
  return { size: Math.max(1, u.size), diet: u.diet, cuisine: u.cuisine ?? 'ma', region: u.region ?? 'all', goals: (u.goals ?? []).filter((g) => g !== 'healthy' && g !== 'gourmand'), meals: u.meals ?? ['b', 'l', 'd'], budget: u.budget, kcal: (u.kcal ?? 2000) + (u.health === 'sport' ? 300 : u.health === 'preg' ? 300 : 0), health: u.health }
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
          <div><div className="font-display text-4xl font-extrabold tabular-nums text-forest">{money(b, lang)}</div><div className="text-xs font-semibold text-muted">/ {t('week2', lang).toLowerCase()}</div></div>
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

/** Swap one meal in one tap: Surprise me, or pick from ranked alternatives. */
export function ReplaceSheet({ k, onClose, say }: { k: string; onClose: () => void; say: (m: string) => void }) {
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
      {!q && list.length > 2 && <div className="mb-3 grid grid-cols-3 gap-2">{list.slice(0, 3).map((r) => { const e = { r: r.id, n: cur?.n ?? p.size, x: composeSides(r.id, slot) }; return <button key={r.id} className="flex flex-col items-center gap-1 rounded-2xl bg-cream/70 p-2 text-center transition active:scale-95" onClick={() => put(e)}><span className="grid h-14 w-14 place-items-center rounded-2xl text-3xl" style={{ background: `hsl(${r.h} 80% 90%)` }}><E3 e={r.e} /></span><span className="line-clamp-2 text-[12px] font-bold leading-tight">{rname(r.n, lang)}</span><span className="text-[10px] text-muted">{r.t} min</span></button> })}</div>}
      <input className="input mb-2 !min-h-10" placeholder={t('search', lang)} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="divide-y divide-line/70">
        {list.map((r) => { const e = { r: r.id, n: cur?.n ?? p.size, x: composeSides(r.id, slot) }; const c = entryCost(e) / e.n; const dc = c - curCost; return (
          <button key={r.id} className="flex w-full items-center gap-3 py-2.5 text-start active:bg-cream" onClick={() => put(e)}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: `hsl(${r.h} 80% 90%)` }}><E3 e={r.e} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{FLAG[['it', 'fr', 'es', 'tr', 'in', 'jp'].find((x) => r.tags.includes(x)) ?? 'ma']} {rname(r.n, lang)}</span><span className="block truncate text-xs text-muted">{t('with', lang)} {sideNames(e.x, lang) || '—'}</span></span>
            <span className="shrink-0 text-end text-xs"><span className="block font-semibold tabular-nums">{Math.round(entryKcal(e))} kcal</span>{cur && <span className={`tabular-nums ${dc < 0 ? 'text-forest' : 'text-muted'}`}>{dc < 0 ? '−' : '+'}{money2(Math.abs(dc), lang)}</span>}</span>
          </button>) })}
      </div>
    </Sheet>
  )
}

/** My week: compact days, expand one to act on its meals. Three one-tap actions per meal. */
const STOP = new Set(['de', 'du', 'des', 'au', 'aux', 'à', 'la', 'le', 'les', 'et', 'with', 'and', 'the', 'of', 'en'])
const short = (n: string) => n.replace(/\s*\(.*\)/, "").split(/[\s,]+/).filter((w) => w && !STOP.has(w.toLowerCase())).slice(0, 2).join(' ')

export function WeekTab({ compose, makeHealthy, say, clear, toBasket }: { compose: () => void; makeHealthy: () => void; say: (m: string) => void; clear: () => void; toBasket: () => void }) {
  const { lang, me, house, upHouse } = useApp()
  const p = usePrefs(); const plan = house!.plan
  const today = (new Date().getDay() + 6) % 7
  const [view, setView] = useState<'day' | 'week' | 'month'>('week'); const [day, setDay0] = useState(today); const [dir, setDir] = useState(1); const tx = useRef(0)
  const setDay = (d: number) => { setDir(d >= day ? 1 : -1); setDay0(d) }; const goDay = (n: number) => { setDir(n); setDay0((day + n + 7) % 7) }
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
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `hsl(${r.h} 80% 90%)` }}><E3 e={r.e} /></span>
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
      <div className="flex gap-2"><button className="btn btn-soft flex-1 !min-h-11" onClick={compose}><Shuffle size={16} className="inline -mt-0.5" aria-hidden /> {t('reshuffle', lang)}</button><button className="btn btn-soft !min-h-11 !px-4 text-danger" onClick={clear}>🗑 {lang === 'en' ? 'Clear' : lang === 'ar' ? 'إفراغ' : 'Vider'}</button></div>
      <div className="flex rounded-full bg-surface p-1 shadow-soft">{(['week', 'month'] as const).map((v) => <button key={v} className={`flex-1 rounded-full py-2 text-sm font-bold ${view === v ? 'bg-forest text-white' : 'text-muted'}`} onClick={() => setView(v)}>{t('v_' + v, lang)}</button>)}</div>
      {view === 'day' && <>
        <div className="grid grid-cols-7 gap-1">{Array.from({ length: 7 }, (_, d) => <button key={d} onClick={() => setDay(d)} className={`rounded-2xl py-2 text-center ${d === day ? 'bg-forest text-white' : 'bg-surface'}`}><span className="block text-[10px] font-bold uppercase">{dayName(d, lang).slice(0, 3)}</span><span className="block text-base">{d === today ? '•' : ' '}</span></button>)}</div>
        <div className="flex items-center justify-between text-sm font-semibold"><button className="rounded-full bg-surface px-3 py-1.5 capitalize text-muted shadow-soft active:scale-95" onClick={() => goDay(-1)}>‹ {dayName((day + 6) % 7, lang)}</button><button className="rounded-full bg-surface px-3 py-1.5 capitalize text-muted shadow-soft active:scale-95" onClick={() => goDay(1)}>{dayName((day + 1) % 7, lang)} ›</button></div>
        <div key={day} className={`card overflow-hidden touch-pan-y ${dir > 0 ? 'slide-in-r' : 'slide-in-l'}`} onTouchStart={(e) => { tx.current = e.touches[0].clientX }} onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - tx.current; if (Math.abs(dx) > 60) goDay(dx < 0 ? 1 : -1) }}>
          <div className="flex items-baseline justify-between px-4 pt-3"><span className="font-display text-lg font-extrabold capitalize">{dayName(day, lang)}</span><span className="text-xs text-muted tabular-nums">{Math.round(dayKc(day))} kcal · {money(dayCost(day), lang)}</span></div>
          <div className="divide-y divide-line/70">{slots.map((s) => mealRow(`${day}-${s}`, s))}</div>
        </div>
      </>}
      {view === 'week' && <div className="space-y-3">
        <div className="rounded-[22px] bg-surface p-2 shadow-soft">
          <div className="grid gap-1" style={{ gridTemplateColumns: `22px repeat(7, minmax(0, 1fr))` }}>
            <span />{Array.from({ length: 7 }, (_, i) => (today + i) % 7).map((d) => <button key={d} onClick={() => setDay(d)} className={`rounded-xl py-1 text-center text-[10px] font-extrabold uppercase transition ${d === day ? 'bg-forest text-white' : d === today ? 'text-forest' : 'text-muted'}`}>{dayName(d, lang).slice(0, 3)}</button>)}
            {slots.map((s) => [<span key={s} className="grid place-items-center text-[13px]" title={t(s, lang)}>{SLOT_E[s]}</span>, ...Array.from({ length: 7 }, (_, i) => (today + i) % 7).map((d) => { const e = plan[`${d}-${s}`]; const r = e ? REC[e.r] : null; return (
              <button key={s + d} onClick={() => setDay(d)} className={`cal-cell flex min-h-[64px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl px-0.5 py-1 transition active:scale-90 ${d === day ? 'ring-2 ring-forest ring-offset-1 ring-offset-surface' : ''}`} style={{ background: SLOT_BG[s] ?? '#F4F1E8' }} aria-label={r ? rname(r.n, lang) : t(s, lang)}>
                {r ? <><span className="text-[22px] leading-none drop-shadow-sm" aria-hidden><E3 e={r.e} /></span>{rname(r.n, lang).split(/[ ,(]/).filter((w) => w.length > 2).slice(0, 2).map((w, i) => <span key={i} className="block w-full truncate text-center text-[8.5px] font-bold leading-[1.15] text-ink/80">{w}</span>)}</> : <span className="text-muted">＋</span>}</button>) })])}
          </div>
        </div>
        <div key={day} className="fade-up overflow-hidden rounded-[22px] bg-surface shadow-soft">
          <div className="flex items-baseline justify-between px-4 pt-3"><span className="font-display text-lg font-extrabold capitalize">{day === today ? (lang === 'en' ? 'Today' : 'Aujourd’hui') : dayName(day, lang)}</span><span className="text-xs text-muted tabular-nums">{Math.round(dayKc(day))} kcal · {money(dayCost(day), lang)}</span></div>
          <div className="divide-y divide-line/70">{slots.map((s) => mealRow(`${day}-${s}`, s))}</div>
        </div>
      </div>}
      {view === 'month' && <div className="card p-3">
        <p className="mb-2 font-display font-extrabold capitalize">{new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA' : lang === 'zgh' ? 'fr' : lang, { month: 'long', year: 'numeric' }).format(new Date())}</p>
        <div className="grid grid-cols-7 gap-1 text-center">{Array.from({ length: 7 }, (_, d) => <span key={d} className="text-[10px] font-bold uppercase text-muted">{dayName(d, lang).slice(0, 2)}</span>)}
          {monthCells.map((c, i) => c ? <button key={i} onClick={() => { setDay(c.wd); setView('week') }} className={`rounded-xl py-1 ${c.today ? 'bg-forest text-white' : 'bg-cream'}`}><span className="block text-[10px] font-bold">{c.n}</span>{plan[`${c.wd}-l`] && <span className="block truncate px-0.5 text-[8.5px] font-semibold leading-tight">{REC[plan[`${c.wd}-l`].r].e} {short(rname(REC[plan[`${c.wd}-l`].r].n, lang)).split(' ')[0]}</span>}</button> : <span key={i} />)}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">{t('monthNote', lang)}</p>
      </div>}
      <button className="cta-glow btn btn-primary sticky bottom-28 z-20 w-full !min-h-14 text-base shadow-lift" onClick={toBasket}>🛒 {lang === 'en' ? 'Done choosing → my basket' : lang === 'ar' ? 'انتهيت → سلتي' : 'J’ai fini mes choix → mon panier'}</button>
      {rep && <ReplaceSheet k={rep} onClose={() => setRep(null)} say={say} />}
      {rv && <RecipeSheet r={rv} onClose={() => setRv(null)} />}
      <p className="px-1 text-center text-xs text-muted">{me!.size} 👤 · {t('c_' + p.cuisine, lang)}</p>
    </div>
  )
}
