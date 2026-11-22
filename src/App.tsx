import { useEffect, useRef, useState } from 'react'
import { useApp } from './lib/store'
import { money, setCurrency, t, type Lang } from './lib/i18n'
import { Brand, Confetti, Toasts } from './ui'
import { RECIPES } from './data/recipes'
import { Controls, usePrefs, WeekTab } from './Screens'
import { HomeTab } from './Home'
import { ProfileScreen } from './ListScreen'
import { CoursesTab, StoresStep, useBasket } from './Flow'
import { type Prefs, adaptToBudget, adaptToMode, composeWeek, listCost } from './lib/plan'
import { buildList } from './lib/engine'
import { RecipesTab } from './Extra'
import { CalendarDays, Home, MapPinned, ShoppingCart, UserRound, BookOpen, Sparkles, type LucideIcon } from 'lucide-react'
import { SortiesTab } from './Sorties'
import { Assistant, Hint, Tour, tourDone, type Tab } from './Assist'
import { bestStore, setStoreCountry } from './lib/stores'
import { Logo, Sheet } from './ui'
import { FoodTile } from './ui'

function LangSwitch() {
  const { lang, setLang } = useApp()
  return <div className="inline-flex rounded-full bg-surface p-1 shadow-soft" role="group" aria-label="Language">{(['fr', 'en', 'ar'] as Lang[]).map((l) => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)} className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${lang === l ? 'bg-forest text-white' : 'text-muted'}`}>{l}</button>)}</div>
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
          <button className="btn btn-warm !min-h-14 !px-8 text-base" onClick={demo}>▶ {{ en: 'Try the demo', fr: 'Essayer la démo', ar: 'جرّب العرض' }[lang]}</button>
          <a className="btn btn-soft !min-h-14 !px-8 text-base" href="#how">{t('cta2', lang)}</a>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {showcase.map((r, i) => <div key={r.id} className="rise card overflow-hidden" style={{ animationDelay: `${i * 90}ms` }}><FoodTile r={r} className="h-28" /><p className="p-3 text-left text-xs font-semibold leading-tight">{r.n[lang === 'en' ? 0 : lang === 'fr' ? 1 : 2]}</p></div>)}
        </div>
      </section>
      <section id="how" className="relative mx-auto max-w-5xl px-5 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold text-forest">{t('how', lang)}</h2>
        <div className="grid gap-4 sm:grid-cols-4">{steps.map((s, i) => <div key={s} className="card p-5"><div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-leaf/30 text-lg">{['🗓️', '🧮', '🛒', '💚'][i]}</div><h3 className="text-lg font-bold">{t(s, lang)}</h3><p className="mt-1 text-sm text-muted">{t(s + 'd', lang)}</p></div>)}</div>
      </section>
      <section className="relative mx-auto grid max-w-3xl gap-4 px-5 py-10 sm:grid-cols-2">
        <h2 className="text-center text-3xl font-bold text-forest sm:col-span-2">{t('pricing', lang)}</h2>
        <div className="card p-6"><h3 className="text-xl font-bold">{t('free', lang)} · 0 MAD</h3><p className="mt-2 text-sm text-muted">{t('freeD', lang)}</p></div>
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
  const { lang, me, patchMe, createHouse, joinHouse, toast, award } = useApp()
  const [step, setStep] = useState(me!.onboarded ? 2 : 1)
  const [hh, setHh] = useState(''); const [code, setCode] = useState('')
  const finish = () => { if (!hh.trim()) return; createHouse(hh.trim()); toast(t('welcome', lang) + ' 🌿') }
  return (
    <div className="calm grid min-h-screen place-items-center px-5 py-10">
      <div className="rise card w-full max-w-md space-y-5 p-7">
        <div className="flex items-center justify-between"><Brand /><span className="text-xs font-semibold text-muted">{step}/2</span></div>
        <div className="h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-forest transition-all" style={{ width: step === 1 ? '50%' : '100%' }} /></div>
        {step === 1 ? (<>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="co" className="mb-1 block text-sm font-semibold">{t('country', lang)}</label><select id="co" className="input" value={me!.country} onChange={(e) => patchMe({ country: e.target.value, cuisine: e.target.value === 'FR' ? 'fr' : 'ma' })}><option value="MA">Maroc · MAD</option><option value="FR">France · EUR</option></select></div>
            <div><label htmlFor="ci" className="mb-1 block text-sm font-semibold">{t('city', lang)}</label><input id="ci" className="input" value={me!.city} onChange={(e) => patchMe({ city: e.target.value })} /></div>
          </div>
          <div><span className="mb-1 block text-sm font-semibold">{t('size', lang)}</span><div className="flex gap-2">{[1, 2, 3, 4, 5, 6].map((n) => <button key={n} className="chip" aria-pressed={me!.size === n} onClick={() => patchMe({ size: n })}>{n}</button>)}</div></div>
          <div><label htmlFor="bu" className="mb-1 flex justify-between text-sm font-semibold"><span>{t('budget', lang)}</span><span>{me!.budget} MAD</span></label><input id="bu" type="range" min={200} max={3000} step={50} value={me!.budget} onChange={(e) => patchMe({ budget: +e.target.value })} className="w-full accent-[#245B43]" /></div>
          <div className="flex gap-3"><button className="btn btn-soft flex-1" onClick={() => { patchMe({ onboarded: true }); setStep(2) }}>{t('skip', lang)}</button><button className="btn btn-primary flex-1" onClick={() => { patchMe({ onboarded: true }); setStep(2) }}>{t('go', lang)}</button></div>
        </>) : (<>
          <div><label htmlFor="hn" className="mb-1 block text-sm font-semibold">{t('hhName', lang)}</label><input id="hn" className="input" value={hh} onChange={(e) => setHh(e.target.value)} placeholder={`${me!.name} & co`} autoFocus /></div>
          <button className="btn btn-primary w-full" onClick={finish} disabled={!hh.trim()} style={{ opacity: hh.trim() ? 1 : 0.5 }}>{t('create', lang)}</button>
          <div className="border-t border-line pt-4"><label htmlFor="cd" className="mb-1 block text-sm font-semibold">{t('hhJoin', lang)}</label><div className="flex gap-2"><input id="cd" className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="KZ-XXXX" /><button className="btn btn-soft" onClick={async () => { if (await joinHouse(code)) award(20, t('welcome', lang)); else toast(t('badCode', lang)) }}>{t('join', lang)}</button></div></div>
        </>)}
      </div>
    </div>
  )
}

const TABS: [Tab, LucideIcon, string][] = [['home', Home, 'tHome'], ['week', CalendarDays, 'tWeek'], ['list', ShoppingCart, 'list'], ['sorties', MapPinned, 'tSorties'], ['profile', UserRound, 'profile']]

function Shell() {
  const { lang, me, house, patchMe, upHouse, award } = useApp()
  setCurrency(me!.country); setStoreCountry(me!.country)
  useEffect(() => { document.documentElement.dataset.country = me!.country }, [me!.country]) // eslint-disable-line react-hooks/exhaustive-deps
  const h = house!; const hasPlan = Object.keys(h.plan).length > 0
  const [tab, setTab] = useState<Tab>(hasPlan ? 'week' : 'home')
  const [sheet, setSheet] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [boom, setBoom] = useState(0)
  const p = usePrefs()
  const { extraCost, total, items, lines, homeCost, customCost, store, spent } = useBasket()
  const budget = me!.budget; const over = total > budget
  const celebrate = () => setBoom((b) => b + 1)
  const [undo, setUndo] = useState<[string, () => void] | null>(null)
  const [assist, setAssist] = useState(false); const [tour, setTour] = useState(() => !tourDone())
  const say = (m: string, u?: [string, () => void]) => { setNote(m); if (u) setUndo(u); setTimeout(() => setNote((x) => (x === m ? null : x)), u ? 8000 : 5000) }
  const snap = (label: string): [string, () => void] => { const prev = JSON.parse(JSON.stringify(h.plan)); const store = h.store; return [label, () => { upHouse((x) => { x.plan = prev; x.store = store }, '↩ ' + label); setUndo(null); setNote(null) }] }

  const compose = () => composeWith()
  const composeWith = (o: Partial<Prefs> = {}, stay = false) => {
    const u = snap(t('composeAuto', lang))
    // A brand-new week means last week was eaten: use up its ingredients from the pantry,
    // otherwise the same dishes would show an empty list (pantry still holding last trip).
    const pantry = { ...h.pantry }
    if (!stay && hasPlan) for (const l of buildList(h.plan, {}, {}, {})) if (pantry[l.id]) pantry[l.id] = Math.max(0, pantry[l.id] - l.need)
    const next = composeWeek({ ...p, ...o, budget: Math.max(0, budget - extraCost) }, pantry, h.extras ?? {})
    upHouse((x) => { x.plan = next; x.qty = {}; if (!stay) { x.pantry = Object.fromEntries(Object.entries(pantry).filter(([, v]) => v > 0)); x.checked = {} } }, 'composed the week'); award(15, '✨'); celebrate()
    const c = listCost(next, pantry, h.extras ?? {}) + extraCost
    say(c <= budget ? `🎉 ${Object.keys(next).length} ${t('meals', lang)} · ${money(budget - c, lang)} ${t('margin', lang)}` : t('tight', lang), hasPlan ? u : undefined); if (!stay) go('week')
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
  const makeHealthy = () => { const u = snap(t('makeHealthy', lang)); const r = adaptToMode(h.plan, 'light', p); upHouse((x) => { x.plan = r.plan }, 'made the week healthy'); say(`🥗 ${r.changed} ${t('adapted', lang)} · ${t('listUpdated', lang)}`, u); award(10, '🥗'); celebrate() }
  const [up, setUp] = useState(false); const space: 'food' | 'out' = tab === 'sorties' ? 'out' : 'food'
  useEffect(() => { const f = () => setUp(scrollY > 500); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  const go = (k: Tab) => { if (k === tab) scrollTo({ top: 0, behavior: 'smooth' }); else { try { history.pushState({ kz: k }, '') } catch { /* sandboxed */ } setTab(k); scrollTo(0, 0) } }
  // Browser / phone back button moves between screens and ends on Home instead of leaving the app.
  useEffect(() => {
    try { history.replaceState({ kz: tab }, '') } catch { /* sandboxed */ }
    const on = (e: PopStateEvent) => { const k = (e.state?.kz as Tab | undefined) ?? 'home'; setTab(k); scrollTo(0, 0) }
    addEventListener('popstate', on); return () => removeEventListener('popstate', on)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const nChk = Object.values(h.checked).filter(Boolean).length
  const steps: [string, Tab, boolean][] = [['st_compose', 'home', hasPlan], ['st_week', 'week', hasPlan], ['st_store', 'stores', !!h.store], ['st_list', 'list', nChk > 0 || (hasPlan && items.length === 0)], ['st_done', 'list', hasPlan && nChk >= items.length]]
  const cur = steps.findIndex((x) => !x[2])
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
  const more: [string, () => void][] = [
    ...(hasPlan && tab !== 'week' ? [[`🗓️ ${t('tWeek', lang)}`, () => go('week')] as [string, () => void]] : []),
    ...(hasPlan && tab !== 'list' ? [[`🛒 ${t('list', lang)}`, () => go('list')] as [string, () => void]] : []),
    ...(hasPlan && tab !== 'stores' ? [[`🏬 ${t('compareStores', lang)}`, () => go('stores')] as [string, () => void]] : []),
    ...(over ? [[`💰 ${t('h_budget', lang)}`, () => adapt()] as [string, () => void]] : []),
    [`⚙️ ${t('adjustB', lang)}`, () => setSheet(true)],
  ].filter((x) => x[0] !== help[0]) as [string, () => void][]
  const title = t(tab === 'stores' ? 'tStores' : tab === 'recipes' ? 'tRecipes' : TABS.find((x) => x[0] === tab)![2], lang)

  return (
    <div className="calm min-h-screen">
      <Confetti run={boom} />
      <header className="sticky top-0 z-40 bg-[rgb(var(--bg)/.88)] backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className={`mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5 ${tab === 'home' ? 'lg:max-w-5xl' : ''}`}>
          <button className="flex items-center gap-2" onClick={() => go('home')} aria-label={t('tHome', lang)}>{tab !== 'home' && <span className="text-xl font-bold text-forest" aria-hidden>‹</span>}<Logo size={32} /></button>{tab !== 'home' && <span className="font-display text-lg font-extrabold">{space === 'out' ? t('tSorties', lang) : title}</span>}
          {space === 'food' && <button data-tour="budget" className="ms-auto min-w-[9.5rem] rounded-2xl bg-surface px-3 py-1.5 text-start shadow-soft active:scale-[.98]" onClick={() => setSheet(true)} aria-label={t('adjustB', lang)}>
            <span className="flex items-baseline justify-between gap-2 text-xs"><b className={`tabular-nums ${over ? 'text-danger' : 'text-forest'}`}>{money(total, lang)}</b><span className="text-muted tabular-nums">/ {money(budget, lang)}</span></span>
            <span className={`block text-[10px] font-semibold tabular-nums ${over ? 'text-danger' : 'text-muted'}`}>{t('solde', lang)} {over ? '−' : ''}{money(Math.abs(budget - total), lang)} · {t('taken', lang)} {money(spent, lang)}</span>
            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-cream"><span className="block h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (total / budget) * 100)}%`, background: over ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }} /></span>
          </button>}
        </div>
        {space === 'food' && (tab !== 'home' || tour) && <><div data-tour="steps" className="mx-auto flex max-w-2xl items-center px-4 pb-1">{steps.map(([k, to, ok], i) => <button key={k} onClick={() => go(to)} className="flex flex-1 items-center gap-1 text-[10px] font-bold">
          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${ok ? 'bg-forest text-white' : i === cur ? 'bg-apricot text-ink ring-2 ring-apricot/40' : 'bg-cream text-muted'}`}>{ok ? '✓' : i + 1}</span>
          <span className={`truncate ${i === cur ? 'text-ink' : 'text-muted'}`}>{t(k, lang)}</span>{i < 4 && <span className={`h-0.5 min-w-1 flex-1 rounded ${ok ? 'bg-forest' : 'bg-line'}`} />}</button>)}</div>
        {tab !== 'home' && <p className="mx-auto max-w-2xl px-4 pb-2 text-[11px] font-semibold text-forest">{cur < 0 ? '🎉 Parcours terminé ! Recompose une nouvelle semaine quand tu veux.' : `👉 Étape ${cur + 1} sur 5 · ${[t('stepHint0', lang), t('stepHint1', lang), t('stepHint3', lang), t('stepHint2', lang), t('stepHint4', lang)][cur]}`}</p>}</>}
        {note && <div className="toast mx-auto max-w-2xl px-4 pb-2"><div className="flex items-center gap-2 rounded-2xl bg-forest px-4 py-2 text-sm font-semibold text-white" role="status"><button className="flex-1 text-start" onClick={() => setNote(null)}>{note}</button>{undo && <button className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold" onClick={undo[1]}>↩ {t('undo', lang)}</button>}</div></div>}
      </header>
      <main className={`mx-auto w-full max-w-2xl px-4 pb-40 pt-2 ${tab === 'home' ? 'lg:max-w-5xl' : ''}`}>
        {tab !== 'home' && <Hint tab={space === 'out' ? 'sorties' : tab} />}
        {space === 'out' ? <div className="fade-up"><SortiesTab /></div> : <div key={tab + lang} className="fade-up">
          {tab === 'home' && <HomeTab compose={compose} recompose={(o) => hasPlan && composeWith(o, true)} go={go} />}
          {tab === 'week' && <button className="mb-3 flex w-full items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-bold text-forest shadow-soft" onClick={() => go('recipes')}><BookOpen size={18} aria-hidden /> {t('tRecipes', lang)} · {lang === 'en' ? 'browse & favorites' : 'parcourir et favoris'} <span className="ms-auto">›</span></button>}
          {tab === 'week' && <WeekTab compose={compose} makeHealthy={makeHealthy} say={say} />}
          {tab === 'list' && <CoursesTab celebrate={celebrate} goStores={() => go('stores')} compose={compose} />}
          {tab === 'stores' && <><button className="mb-2 text-sm font-bold text-forest" onClick={() => setTab('list')}>‹ {t('list', lang)}</button><StoresStep onShop={() => go('list')} /></>}
          {tab === 'recipes' && <RecipesTab say={say} />}
          {tab === 'profile' && <ProfileScreen celebrate={celebrate} />}
          {nextStep && <button className="card fade-up mt-4 flex w-full items-center gap-3 p-4 text-start active:scale-[.98]" onClick={nextStep[2]}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-xl text-white">→</span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase tracking-wide text-muted">{t('nextStep', lang)}</span><span className="block font-display font-extrabold">{nextStep[0]}</span><span className="block text-xs text-muted">{nextStep[1]}</span></span></button>}
        </div>}
      </main>
      <><div data-tour="assist" style={space === 'out' || (tab === 'home' && !tour) ? { display: 'none' } : undefined} className="fixed bottom-[5.5rem] start-4 z-40 flex max-w-[78vw] items-center gap-1 rounded-full bg-ink/90 p-1 text-sm font-bold text-white shadow-lg backdrop-blur">
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-lg active:scale-90" onClick={() => setAssist(true)} aria-label={t('assistant', lang)}><Sparkles size={18} aria-hidden /></button>
        <button className="truncate px-3 py-2 active:scale-95" onClick={help[1]}>➜ {help[0]}</button>
      </div>
      <Assistant open={assist} onClose={() => setAssist(false)} tab={tab} next={help} more={more} undo={undo} onTour={() => setTour(true)} go={go} />
      <Tour run={tour} onEnd={() => setTour(false)} />
      {up && <button className="fixed bottom-[5.5rem] end-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-forest text-lg text-white shadow-lg" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} aria-label="top">↑</button>}
      <nav data-tour="tabs" className="tabbar" aria-label="Main">
        {TABS.map(([k, Icon, key]) => { const on = tab === k || (k === 'list' && tab === 'stores') || (k === 'week' && tab === 'recipes'); return <button key={k} onClick={() => go(k)} aria-current={on ? 'page' : undefined} className={`tab ${on ? 'tab-on' : ''}`}><Icon size={22} strokeWidth={on ? 2.4 : 1.8} className={on ? 'pop' : ''} aria-hidden /><span>{t(key, lang)}</span></button> })}
      </nav></>
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
  else if (!me.onboarded || !house) body = <Onboarding />
  else body = <Shell />
  return <><Toasts />{body}</>
}
