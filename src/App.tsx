import { zf } from './lib/zgh'
import { useEffect, useRef, useState } from 'react'
import { useApp } from './lib/store'
import { money, setCurrency, t, type Lang, setRamadan } from './lib/i18n'
import { LANG_LABEL } from './lib/i18n'
import { Brand, Confetti, Toasts } from './ui'
import { RECIPES } from './data/recipes'
import { Controls, usePrefs, WeekTab } from './Screens'
import { HomeTab } from './Home'
import { ProfileScreen } from './ListScreen'
import { CoursesTab, StoresStep, useBasket, useCart } from './Flow'
import { CartMode } from './Cart'
import { type Prefs, adaptToBudget, adaptToMode, composeWeek, listCost, setRamadanSides } from './lib/plan'
import { buildList, applyPriceOverrides } from './lib/engine'
import { RecipesTab } from './Extra'
import { CalendarDays, Home, MapPinned, ShoppingCart, UserRound, Wallet, Dumbbell, type LucideIcon } from './icons'
import { BudgetTab } from './Budget'
import { SortiesTab } from './Sorties'
import { Nav } from './Nav'
import { SportTab } from './Sport'
import { BasketStory } from './Basket'
import { setDietFilter } from './lib/plan'
import { Tour, tourDone, type Tab } from './Assist'
import { bestStore, setStoreCountry } from './lib/stores'
import { CountrySheet } from './Country'
import { cname, countryOf } from './lib/countries'
import { Logo, Sheet } from './ui'
import { FoodTile } from './ui'

function LangSwitch() {
  const { lang, setLang } = useApp()
  return <div className="inline-flex rounded-full bg-surface p-1 shadow-soft" role="group" aria-label="Language">{(['fr', 'en', 'ar', 'zgh'] as Lang[]).map((l) => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)} className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${lang === l ? 'bg-forest text-white' : 'text-muted'}`}>{LANG_LABEL[l]}</button>)}</div>
}

function Landing({ go }: { go: (m: 'signup' | 'login') => void }) {
  const { lang, signup, login } = useApp()
  const demo = () => { if (!login('demo@kuzinti.app')) signup('Sara', 'demo@kuzinti.app') }
  const steps = ['s1', 's2', 's3', 's4']
  const showcase = RECIPES.filter((r) => ['tajine-poulet', 'zaalouk', 'harira', 'couscous-7'].includes(r.id))
  return (
    <div className="calm relative overflow-hidden">
      <div className="blob -left-20 top-40 h-72 w-72 bg-leaf" /><div className="blob right-0 top-10 h-60 w-60 bg-apricot" style={{ animationDelay: '-6s' }} />
      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><Brand /><div className="flex items-center gap-2"><LangSwitch /><button className="btn btn-soft hidden !min-h-10 sm:inline-flex" onClick={() => go('login')}>{t('login', lang)}</button></div></header>
      <section className="relative mx-auto max-w-5xl px-5 pb-16 pt-10 text-center sm:pt-20">
        <div className="breathe mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-surface text-4xl shadow-lift">🌿</div>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.05] text-forest sm:text-6xl">{t('tagline', lang)}</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{t('heroSub', lang)}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button className="btn btn-primary !min-h-14 !px-8 text-base" onClick={() => go('signup')}>{t('cta1', lang)}</button>
          <button className="btn btn-warm !min-h-14 !px-8 text-base" onClick={demo}>▶ {{ en: 'Try the demo', fr: 'Essayer la démo', ar: 'جرّب العرض', zgh: 'Essayer la démo' }[lang]}</button>
          <a className="btn btn-soft !min-h-14 !px-8 text-base" href="#how">{t('cta2', lang)}</a>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {showcase.map((r, i) => <div key={r.id} className="rise card overflow-hidden" style={{ animationDelay: `${i * 90}ms` }}><FoodTile r={r} className="h-28" /><p className="p-3 text-left text-xs font-semibold leading-tight">{r.n[lang === 'en' ? 0 : lang === 'ar' ? 2 : 1]}</p></div>)}
        </div>
      </section>
      <section id="how" className="relative mx-auto max-w-5xl px-5 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold text-forest">{t('how', lang)}</h2>
        <div className="grid gap-4 sm:grid-cols-4">{steps.map((s, i) => <div key={s} className="card p-5"><div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-leaf/30 text-lg">{['🗓️', '🧮', '🛒', '💚'][i]}</div><h3 className="text-lg font-bold">{t(s, lang)}</h3><p className="mt-1 text-sm text-muted">{t(s + 'd', lang)}</p></div>)}</div>
      </section>
      <section className="relative mx-auto grid max-w-3xl gap-4 px-5 py-10 sm:grid-cols-2">
        <h2 className="text-center text-3xl font-bold text-forest sm:col-span-2">{t('pricing', lang)}</h2>
        <div className="card p-6"><h3 className="text-xl font-bold">{t('free', lang)} · {money(0, lang)}</h3><p className="mt-2 text-sm text-muted">{t('freeD', lang)}</p></div>
        <div className="card p-6 opacity-80"><h3 className="text-xl font-bold">{t('plus', lang)}</h3><p className="mt-2 text-sm text-muted">{t('plusD', lang)}</p></div>
      </section>
      <section className="relative mx-auto max-w-2xl px-5 py-10">
        <h2 className="mb-5 text-center text-3xl font-bold text-forest">{t('faq', lang)}</h2>
        {['1', '2', '3'].map((n) => <details key={n} className="card mb-3 p-4"><summary className="cursor-pointer font-semibold">{t('q' + n, lang)}</summary><p className="mt-2 text-sm text-muted">{t('a' + n, lang)}</p></details>)}
      </section>
      <footer className="relative px-5 pb-10 pt-6 text-center text-sm text-muted"><Brand /><p className="mt-2">{t('tagline', lang)}</p></footer>
    </div>
  )
}

function Auth({ mode, setMode, close }: { mode: 'signup' | 'login'; setMode: (m: 'signup' | 'login') => void; close: () => void }) {
  const { lang, signup, login, toast } = useApp()
  const [name, setName] = useState(''); const [email, setEmail] = useState('')
  const ok = /.+@.+\..+/.test(email) && (mode === 'login' || name.trim().length > 0)
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (!ok) return
    if (mode === 'signup') signup(name.trim(), email.trim())
    else if (!login(email.trim())) { signup(email.split('@')[0], email.trim()); toast(t('welcome', lang) + ' 🌿') }
  }
  return (
    <div className="calm grid min-h-screen place-items-center px-5 py-10">
      <form onSubmit={submit} className="rise card w-full max-w-md space-y-4 p-7">
        <div className="flex items-center justify-between"><Brand /><LangSwitch /></div>
        <h1 className="text-2xl font-bold">{t(mode === 'signup' ? 'signup' : 'login', lang)}</h1>
        {mode === 'signup' && <div><label htmlFor="nm" className="mb-1 block text-sm font-semibold">{t('name', lang)}</label><input id="nm" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" autoFocus /></div>}
        <div><label htmlFor="em" className="mb-1 block text-sm font-semibold">{t('email', lang)}</label><input id="em" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
        <button className="btn btn-primary w-full" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }}>{t('go', lang)}</button>
        <p className="text-xs text-muted">{t('demoNote', lang)}</p>
        <div className="flex justify-between text-sm font-semibold text-forest"><button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>{t(mode === 'signup' ? 'haveAcc' : 'noAcc', lang)}</button><button type="button" onClick={close}>{t('back', lang)}</button></div>
      </form>
    </div>
  )
}

function Onboarding() {
  const { lang, me, createHouse, joinHouse, toast, award } = useApp()
    const [hh, setHh] = useState(`${L3(lang, 'Home', 'Maison', 'بيت')} ${me!.name || ''}`.trim()); const [code, setCode] = useState('')
  const finish = () => { if (!hh.trim()) return; createHouse(hh.trim()); toast(t('welcome', lang) + ' 🌿') }
  return (
    <div className="calm grid min-h-screen place-items-center px-5 py-10">
      <div className="rise card w-full max-w-md space-y-5 p-7">
        <div className="flex items-center justify-between"><Brand /></div>
        {(<>
          <div><label htmlFor="hn" className="mb-1 block text-sm font-semibold">{t('hhName', lang)}</label><input id="hn" className="input" value={hh} onChange={(e) => setHh(e.target.value)} placeholder={`${me!.name} & co`} autoFocus /></div>
          <button className="btn btn-primary w-full" onClick={finish} disabled={!hh.trim()} style={{ opacity: hh.trim() ? 1 : 0.5 }}>{t('create', lang)}</button>
          <div className="border-t border-line pt-4"><label htmlFor="cd" className="mb-1 block text-sm font-semibold">{t('hhJoin', lang)}</label><div className="flex gap-2"><input id="cd" className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="KZ-XXXX" /><button className="btn btn-soft" onClick={async () => { if (await joinHouse(code)) award(20, t('welcome', lang)); else toast(t('badCode', lang)) }}>{t('join', lang)}</button></div></div>
        </>)}
      </div>
    </div>
  )
}

const TABS: [Tab, LucideIcon, string][] = [['home', Home, 'tHome'], ['week', CalendarDays, 'tWeek'], ['list', ShoppingCart, 'list'], ['sorties', MapPinned, 'tSorties'], ['budget', Wallet, 'tBudget'], ['sport', Dumbbell, 'tSport'], ['profile', UserRound, 'profile']]

type World = 'food' | 'sorties' | 'budget'
const SPACES: World[] = ['food', 'sorties', 'budget']
const FOOD_TABS: Tab[] = ['week', 'recipes', 'list', 'stores', 'sport']
const SUB: [Tab, LucideIcon, string, string, string][] = [['week', CalendarDays, 'Week', 'Semaine', 'الأسبوع'], ['list', ShoppingCart, 'Shopping', 'Courses', 'التسوق'], ['sport', Dumbbell, 'Fitness', 'Forme', 'لياقة']]
const L3 = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : l === 'zgh' ? zf(fr) : fr)

function Shell() {
  const { lang, me, house, patchMe, upHouse, award } = useApp()
  setCurrency(me!.country); setStoreCountry(me!.country); setDietFilter(me!.diet); setRamadan(!!me!.ramadan); setRamadanSides(!!me!.ramadan)
  useEffect(() => { document.documentElement.dataset.country = me!.country }, [me!.country]) // eslint-disable-line react-hooks/exhaustive-deps
  applyPriceOverrides(house!.ingP)
  const h = house!; const hasPlan = Object.keys(h.plan).length > 0
  const [tab, setTab] = useState<Tab>(hasPlan ? 'week' : 'home')
  const [sheet, setSheet] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [boom, setBoom] = useState(0)
  const p = usePrefs()
  const { extraCost, total, lines, homeCost, customCost, store } = useBasket()
  const budget = me!.budget; const over = total > budget
  const celebrate = () => setBoom((b) => b + 1)
  const [undo, setUndo] = useState<[string, () => void] | null>(null)
  const [tour, setTour] = useState(() => !tourDone())
  const say = (m: string, u?: [string, () => void]) => { setNote(m); if (u) setUndo(u); setTimeout(() => setNote((x) => (x === m ? null : x)), u ? 8000 : 5000) }
  const snap = (label: string): [string, () => void] => { const prev = JSON.parse(JSON.stringify(h.plan)); const store = h.store; return [label, () => { upHouse((x) => { x.plan = prev; x.store = store }, '↩ ' + label); setUndo(null); setNote(null) }] }

  const compose = () => composeWith()
  const composeWith = (o: Partial<Prefs> = {}, stay = false) => {
    const u = snap(t('composeAuto', lang))
    // A brand-new week means last week was eaten: use up its ingredients from the pantry,
    // otherwise the same dishes would show an empty list (pantry still holding last trip).
    const pantry = { ...h.pantry }
    if (!stay && hasPlan) for (const l of buildList(h.plan, {}, {}, {})) if (pantry[l.id]) pantry[l.id] = Math.max(0, pantry[l.id] - l.need)
    setDietFilter(o.diet ?? p.diet ?? [])
    const next = composeWeek({ ...p, ...o, budget: Math.max(0, (o.budget ?? budget) - extraCost) }, pantry, h.extras ?? {})
    upHouse((x) => { x.plan = next; x.qty = {}; if (!stay) { x.pantry = Object.fromEntries(Object.entries(pantry).filter(([, v]) => v > 0)); x.checked = {} } }, 'composed the week'); award(15, '✨'); celebrate()
    const c = listCost(next, pantry, h.extras ?? {}) + extraCost; const B = o.budget ?? budget
    say(`🎉 ${Object.keys(next).length} ${t('meals', lang)} · ${t('estTotal', lang)} ${money(c, lang)}`, hasPlan ? u : undefined); void B; if (!stay) go('week')
  }
  const adapt = (b = budget) => {
    const u = snap(t('h_budget', lang))
    const fit = adaptToBudget(h.plan, Math.max(0, b - extraCost), h.pantry, h.extras ?? {}, p)
    upHouse((x) => { x.plan = fit.plan; x.qty = {} }, 'fitted the budget')
    const bits = [fit.swapped && `${fit.swapped} ${t('swapped', lang)}`, fit.scaled && `${fit.scaled} ${t('scaled', lang)}`].filter(Boolean).join(' · ')
    say(fit.after + extraCost <= b ? `✅ ${bits || t('fitted', lang)} · −${money(fit.before - fit.after, lang)}` : `${t('tight', lang)} ${bits}`, u)
  }
  // Budget change re-builds the week to fit the new cap (up or down), debounced for the slider, with undo.
  const bt = useRef<number | undefined>(undefined)
  const setBudget = (b: number) => { patchMe({ budget: b }); if (!hasPlan) return; clearTimeout(bt.current); bt.current = window.setTimeout(() => refit(b), 450) }
  const refit = (b: number) => {
    const u = snap(t('adjustB', lang)); const mul = store ? Math.max(...Object.values(store.m)) : 1
    const target = Math.max(0, (b - extraCost) / mul)
    const next = composeWeek({ ...p, budget: target }, h.pantry, h.extras ?? {})
    const c = listCost(next, h.pantry, h.extras ?? {}) * mul + extraCost
    upHouse((x) => { x.plan = next; x.qty = {} }, `budget ${b}`)
    say(c <= b ? `✅ ${t('fitB', lang)} ${money(b, lang)} · ${money(b - c, lang)} ${t('margin', lang)}` : `⚠️ ${t('minB', lang)} ${money(c, lang)} (+${money(c - b, lang)}). ${t('minHint', lang)}`, u)
  }
  const clearWeek = () => { const u = snap(lang === 'en' ? 'Clear' : 'Vider'); upHouse((x) => { x.plan = {}; x.qty = {}; x.checked = {}; x.store = undefined }, '🗑 semaine vidée'); say(lang === 'en' ? '🗑 Week cleared. Compose a new one when you like.' : '🗑 Semaine vidée. Composez-en une nouvelle quand vous voulez.', u); go('home') }
  const makeHealthy = () => { const u = snap(t('makeHealthy', lang)); const r = adaptToMode(h.plan, 'light', p); upHouse((x) => { x.plan = r.plan }, 'made the week healthy'); say(`🥗 ${r.changed} ${t('adapted', lang)} · ${t('listUpdated', lang)}`, u); award(10, '🥗'); celebrate() }
  const [ctry, setCtry] = useState(false)
  // Three worlds side by side: swipe left/right (or tap the pill) to move between Meals, Outings and Budget.
  const world: World = tab === 'sorties' ? 'sorties' : tab === 'budget' ? 'budget' : 'food'
  const lastFood = useRef<Tab>('home'); if (world === 'food') lastFood.current = tab
  const [wdir, setWdir] = useState(0); useEffect(() => { if (!wdir) return; const id = setTimeout(() => setWdir(0), 450); return () => clearTimeout(id) }, [wdir])
  const goWorld = (w: World) => { if (w === world) return; setWdir(SPACES.indexOf(w) - SPACES.indexOf(world)); go(w === 'food' ? lastFood.current : w) }
  // First-time hint that the three volets can be swiped, then a permanent position indicator in the header.
  const [hint, setHint] = useState(false)
  useEffect(() => { if (tab === 'home' || tab === 'profile') return; let seen = false; try { seen = !!localStorage.getItem('kz-swipe') } catch { /* private mode */ } if (seen) return; setHint(true); try { localStorage.setItem('kz-swipe', '1') } catch { /* private mode */ } const id = setTimeout(() => setHint(false), 5500); return () => clearTimeout(id) }, [tab === 'home' || tab === 'profile']) // eslint-disable-line react-hooks/exhaustive-deps
  const sw = useRef<[number, number] | null>(null)
  const swStart = (e: React.TouchEvent) => { const el = e.target as HTMLElement; sw.current = el.closest('[data-noswipe], .overflow-x-auto, input, .touch-pan-y, [role=dialog]') ? null : [e.touches[0].clientX, e.touches[0].clientY] }
  const swEnd = (e: React.TouchEvent) => { if (!sw.current) return; const dx = e.changedTouches[0].clientX - sw.current[0], dy = e.changedTouches[0].clientY - sw.current[1]; sw.current = null
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return; const rtl = lang === 'ar'; const i = SPACES.indexOf(world) + ((dx < 0) !== rtl ? 1 : -1); if (i >= 0 && i < 3) goWorld(SPACES[i]) }
  const { cart, finish: endTrip, left: cartLeft } = useCart(); const [caddie, setCaddie] = useState(false)
  const setCountry = (c: string) => {
    if (c === me!.country) return; const k = countryOf(c)
    patchMe({ country: c, cuisine: k.cuisine, region: 'all', city: k.cities?.[0] ?? me!.city }); upHouse((x) => { x.store = undefined }, `${k.f} ${k.cur}`)
    setCurrency(c); setStoreCountry(c)
    if (hasPlan) composeWith({ cuisine: k.cuisine, region: 'all' }, true); else say(`${k.f} ${cname(k, lang)} · ${k.sym}`)
  }
  const [bask, setBask] = useState(false)
  useEffect(() => { const f = (e: Event) => go((e as CustomEvent).detail as Tab); addEventListener('kz-go', f); return () => removeEventListener('kz-go', f) })
  const [up, setUp] = useState(false); const space: 'food' | 'out' = tab === 'sorties' || tab === 'budget' ? 'out' : 'food'
  useEffect(() => { const f = () => setUp(scrollY > 500); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  const go = (k: Tab) => { if (k === tab) scrollTo({ top: 0, behavior: 'smooth' }); else { const O: Partial<Record<Tab, number>> = { home: 0, week: 1, recipes: 1.5, stores: 2, list: 3, sorties: 4, budget: 5, profile: 6 }; const d = (O[k] ?? 0) - (O[tab] ?? 0); if (d) setWdir(Math.sign(d)); try { history.pushState({ kz: k }, '') } catch { /* sandboxed */ } setTab(k); scrollTo(0, 0) } }
  // Browser / phone back button moves between screens and ends on Home instead of leaving the app.
  useEffect(() => {
    try { history.replaceState({ kz: tab }, '') } catch { /* sandboxed */ }
    const on = (e: PopStateEvent) => { const k = (e.state?.kz as Tab | undefined) ?? 'home'; setTab(k); scrollTo(0, 0) }
    addEventListener('popstate', on); return () => removeEventListener('popstate', on)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const nextStep: [string, string, () => void] | null = !hasPlan || tab === 'home' ? null
    : tab === 'week' || tab === 'recipes' ? (h.store ? [t('ns_list', lang), t('ns_listD', lang), () => go('list')] : [t('ns_store', lang), t('ns_storeD', lang), () => go('stores')])
    : tab === 'list' ? (h.store ? [t('ns_done', lang), t('ns_doneD', lang), () => scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })] : [t('ns_store', lang), t('ns_storeD', lang), () => go('stores')])
    : tab === 'stores' ? [t('ns_shop', lang), t('ns_shopD', lang), () => go('list')]
    : null

  const pickBest = () => { const u = snap(t('h_store', lang)); const b = bestStore(lines, (s) => homeCost * s.m.grocery + customCost); upHouse((x) => { x.store = b.id }, `🏬 ${b.name}`); say(`👑 ${b.name} · ${t('bestPicked', lang)}`, u); go('list') }
  const help: [string, () => void] = !hasPlan || tab === 'home' || tab === 'recipes' ? [t('composeAuto', lang), compose]
    : over ? [t('h_budget', lang), () => adapt()]
    : tab === 'week' ? (h.store ? [t('h_shop', lang), () => go('list')] : [t('h_store', lang), pickBest])
    : tab === 'list' && !h.store ? [t('h_store', lang), pickBest]
    : tab === 'stores' ? [t('h_store', lang), pickBest]
    : [t('h_shop', lang), () => go('list')]
  const more: [string, () => void][] = [ // kept for the tour
    ...(hasPlan && tab !== 'week' ? [[`🗓️ ${t('tWeek', lang)}`, () => go('week')] as [string, () => void]] : []),
    ...(hasPlan && tab !== 'list' ? [[`🛒 ${t('list', lang)}`, () => go('list')] as [string, () => void]] : []),
    ...(hasPlan && tab !== 'stores' ? [[`🏬 ${t('compareStores', lang)}`, () => go('stores')] as [string, () => void]] : []),
    ...(over ? [[`💰 ${t('h_budget', lang)}`, () => adapt()] as [string, () => void]] : []),
    [`⚙️ ${t('adjustB', lang)}`, () => setSheet(true)],
  ].filter((x) => x[0] !== help[0]) as [string, () => void][]
  void more
  const title = t(tab === 'stores' ? 'tStores' : tab === 'recipes' ? 'tRecipes' : TABS.find((x) => x[0] === tab)![2], lang)

  return (
    <div className="calm shell min-h-screen">
      <Confetti run={boom} />
      <header className="sticky top-0 z-40 bg-[rgb(var(--bg)/.88)] backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className={`mx-auto flex max-w-2xl items-center gap-2 px-4 py-2.5 ${tab === 'home' ? 'lg:max-w-5xl' : ''}`}>
          <button className="flex items-center gap-2" onClick={() => go('home')} aria-label={t('tHome', lang)}><Logo size={32} /></button>
          <span className="min-w-0 flex-1 truncate font-display text-lg font-extrabold">{tab === 'home' ? 'KUZINTI' : FOOD_TABS.includes(tab) ? L3(lang, 'Meals', 'Repas', 'الوجبات') : title}</span>
          <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-lg shadow-soft active:scale-90" onClick={() => setCtry(true)} aria-label={cname(countryOf(me!.country), lang)}>{countryOf(me!.country).f}</button>
          <button className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold shadow-soft active:scale-90 ${tab === 'profile' ? 'bg-forest text-white' : 'bg-surface text-forest'}`} onClick={() => go('profile')} aria-label={t('profile', lang)}>{(me!.name || '?').slice(0, 1).toUpperCase()}</button>
        </div>
        {tab !== 'home' && tab !== 'profile' && <div className="flex items-center justify-center gap-2 pb-1.5 lg:hidden" role="tablist" aria-label="Volets">{SPACES.map((w) => <button key={w} role="tab" aria-selected={w === world} onClick={() => goWorld(w)} className={`h-2 rounded-full transition-all duration-300 ${w === world ? 'w-7 bg-forest' : 'w-2 bg-ink/20'}`} aria-label={w} />)}</div>}
        {FOOD_TABS.includes(tab) && <div data-tour="subtabs" className="mx-auto max-w-2xl px-4 pb-2"><div className="relative grid grid-cols-3 rounded-full bg-surface p-1 shadow-soft" role="tablist">
          <span className="absolute inset-y-1 rounded-full bg-forest shadow-soft transition-all duration-500 ease-[cubic-bezier(.2,.9,.25,1)]" style={{ width: 'calc((100% - .5rem) / 3)', insetInlineStart: `calc(.25rem + ${Math.max(0, SUB.findIndex((x) => x[0] === (tab === 'stores' ? 'list' : tab === 'recipes' ? 'week' : tab)))} * (100% - .5rem) / 3)` }} aria-hidden />
          {SUB.map(([k, I, en, fr, ar]) => { const on = (tab === 'stores' ? 'list' : tab === 'recipes' ? 'week' : tab) === k; return <button key={k} role="tab" aria-selected={on} onClick={() => go(k)} className={`relative z-10 flex items-center justify-center gap-1 rounded-full py-1.5 text-[12.5px] font-bold transition-colors duration-300 ${on ? 'text-white' : 'text-muted'}`}><I size={15} strokeWidth={2.3} className="hidden sm:inline-grid" aria-hidden />{L3(lang, en, fr, ar)}{k === 'list' && cartLeft > 0 && <span className={`rounded-full px-1.5 text-[12px] tabular-nums ${on ? 'bg-white/25' : 'bg-apricot/40 text-ink'}`}>{cartLeft}</span>}</button> })}
        </div></div>}
        {note && <div className="toast mx-auto max-w-2xl px-4 pb-2"><div className="flex items-center gap-2 rounded-2xl bg-forest px-4 py-2 text-sm font-semibold text-white" role="status"><button className="flex-1 text-start" onClick={() => setNote(null)}>{note}</button>{undo && <button className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold" onClick={undo[1]}>↩ {t('undo', lang)}</button>}</div></div>}
      </header>
      {hint && <div className="pointer-events-none fixed inset-x-0 bottom-[172px] z-50 flex justify-center lg:hidden"><div className="fade-up flex items-center gap-3 rounded-full bg-ink/90 px-4 py-2 text-sm font-bold text-white shadow-lift"><span className="swipe-nudge-l" aria-hidden>‹</span>{L3(lang, 'Swipe to switch: Meals, Outings, Budget', 'Glissez pour changer : Repas, Sorties, Budget', 'اسحب للتنقل')}<span className="swipe-nudge-r" aria-hidden>›</span></div></div>}
      <main className={`mx-auto w-full max-w-2xl px-4 pb-40 pt-2 ${tab === 'home' ? 'lg:max-w-5xl' : ''}`} onTouchStart={swStart} onTouchEnd={swEnd}>

        {space === 'out' ? <div key={tab} className={wdir > 0 ? 'slide-in-r' : wdir < 0 ? 'slide-in-l' : 'fade-up'}>{tab === 'budget' ? <BudgetTab /> : <SortiesTab />}</div> : <div key={tab + lang} className={wdir > 0 ? 'slide-in-r' : wdir < 0 ? 'slide-in-l' : 'fade-up'}>
          {tab === 'home' && <HomeTab composeFor={(o) => composeWith(o)} clear={clearWeek} openCountry={() => setCtry(true)} compose={compose} recompose={(o) => hasPlan && composeWith(o, true)} go={go} makeHealthy={makeHealthy} />}
          {tab === 'week' && <button className="mb-2 flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-2.5 text-sm font-bold text-forest shadow-soft active:scale-[.99]" onClick={() => go('recipes')}><span>📖 {L3(lang, 'Browse all recipes', 'Parcourir toutes les recettes', 'تصفح الوصفات')}</span><span aria-hidden>›</span></button>}
          {tab === 'week' && <WeekTab toBasket={() => setBask(true)} clear={clearWeek} compose={compose} makeHealthy={makeHealthy} say={say} />}
          {tab === 'list' && <CoursesTab celebrate={celebrate} goStores={() => go('stores')} compose={compose} />}
          {tab === 'stores' && <><button className="mb-2 text-sm font-bold text-forest" onClick={() => setTab('list')}>‹ {t('list', lang)}</button><StoresStep onShop={() => go('list')} /></>}
          {tab === 'recipes' && <><button className="mb-2 text-sm font-bold text-forest" onClick={() => go('week')}>‹ {L3(lang, 'My week', 'Ma semaine', 'أسبوعي')}</button><RecipesTab say={say} /></>}
          {tab === 'sport' && <SportTab apply={(k) => { patchMe({ kcal: k, health: 'sport' }); if (hasPlan) composeWith({ kcal: k, health: 'sport' }, true); else composeWith({ kcal: k, health: 'sport' }); go('week') }} />}
          {tab === 'profile' && <ProfileScreen celebrate={celebrate} openCountry={() => setCtry(true)} />}
          {nextStep && <button className="card fade-up mt-4 flex w-full items-center gap-3 p-4 text-start active:scale-[.98]" onClick={nextStep[2]}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-xl text-white">→</span><span className="min-w-0 flex-1"><span className="block text-[12px] font-bold uppercase tracking-wide text-muted">{t('nextStep', lang)}</span><span className="block font-display font-extrabold">{nextStep[0]}</span><span className="block text-xs text-muted">{nextStep[1]}</span></span></button>}
        </div>}
      </main>
      <>
      <Tour run={tour && !!me!.known} onEnd={() => setTour(false)} />
      <CartMode open={caddie} onClose={() => setCaddie(false)} items={cart} onFinish={() => endTrip(celebrate)} />
      {up && <button className="fixed bottom-[6.5rem] end-4 lg:bottom-6 z-40 grid h-11 w-11 place-items-center rounded-full bg-forest text-lg text-white shadow-lg" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} aria-label="top">↑</button>}
      {/* Pinned shopping: once a trip has started, a slim bar keeps it one tap away from every other screen. */}
      
      <BasketStory open={bask} lines={lines} onClose={() => setBask(false)} go={go} />
      <Nav tab={tab} go={go} left={cartLeft} hasCart={cart.length > 0} onCaddie={() => setCaddie(true)} openCountry={() => setCtry(true)} /></>
      <CountrySheet open={ctry} onClose={() => setCtry(false)} onPick={setCountry} />
      <Sheet open={sheet} onClose={() => setSheet(false)} title={t('adjustB', lang)}>
        <Controls setBudget={setBudget} />
        <p className="mt-3 text-center text-sm text-muted tabular-nums">{money(total, lang)} / {money(budget, lang)} · {over ? t('overBy', lang) : t('left', lang)} {money(Math.abs(budget - total), lang)}</p>
        {hasPlan && over && <button className="btn btn-warm mt-3 w-full" onClick={() => { adapt(); setSheet(false) }}>{t('adaptBtn', lang)}</button>}
        <button className="btn btn-primary mt-3 w-full" onClick={() => setSheet(false)}>OK</button>
      </Sheet>
    </div>
  )
}

export default function App() {
  const { me, house } = useApp()
  const [mode, setMode] = useState<'landing' | 'signup' | 'login'>('landing')
  let body
  if (!me) body = mode === 'landing' ? <Landing go={setMode} /> : <Auth mode={mode} setMode={setMode} close={() => setMode('landing')} />
  else if (!house) body = <Onboarding />
  else body = <Shell />
  return <><Toasts />{body}</>
}
