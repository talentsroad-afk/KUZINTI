import { useRef, useState } from 'react'
import { useApp } from './lib/store'
import { money, t, type Lang } from './lib/i18n'
import { Brand, Confetti, Toasts } from './ui'
import { RECIPES } from './data/recipes'
import { BudgetStep, Controls, ModePicker, WeekStep } from './Screens'
import { DishCatalog } from './Catalog'
import type { Meal } from './data/recipes'
import { ProfileScreen } from './ListScreen'
import { BasketStep, ShopMode, StoresStep, useBasket } from './Flow'
import { STORES, storeTotal } from './lib/stores'
import { adaptToBudget, adaptToMode, listCost, randomPlan, type Mode } from './lib/plan'
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
            <div><label htmlFor="co" className="mb-1 block text-sm font-semibold">{t('country', lang)}</label><select id="co" className="input" value={me!.country} onChange={(e) => patchMe({ country: e.target.value })}><option value="MA">Maroc · MAD</option><option value="FR">France · EUR</option></select></div>
            <div><label htmlFor="ci" className="mb-1 block text-sm font-semibold">{t('city', lang)}</label><input id="ci" className="input" value={me!.city} onChange={(e) => patchMe({ city: e.target.value })} /></div>
          </div>
          <div><span className="mb-1 block text-sm font-semibold">{t('size', lang)}</span><div className="flex gap-2">{[1, 2, 3, 4, 5, 6].map((n) => <button key={n} className="chip" aria-pressed={me!.size === n} onClick={() => patchMe({ size: n })}>{n}</button>)}</div></div>
          <div><label htmlFor="bu" className="mb-1 flex justify-between text-sm font-semibold"><span>{t('budget', lang)}</span><span>{me!.budget} MAD</span></label><input id="bu" type="range" min={200} max={3000} step={50} value={me!.budget} onChange={(e) => patchMe({ budget: +e.target.value })} className="w-full accent-[#245B43]" /></div>
          <ModePicker compact value={me!.mode ?? 'balanced'} onPick={(m) => patchMe({ mode: m })} />
          <div className="flex gap-3"><button className="btn btn-soft flex-1" onClick={() => { patchMe({ onboarded: true }); setStep(2) }}>{t('skip', lang)}</button><button className="btn btn-primary flex-1" onClick={() => { patchMe({ onboarded: true }); setStep(2) }}>{t('go', lang)}</button></div>
        </>) : (<>
          <div><label htmlFor="hn" className="mb-1 block text-sm font-semibold">{t('hhName', lang)}</label><input id="hn" className="input" value={hh} onChange={(e) => setHh(e.target.value)} placeholder={`${me!.name} & co`} autoFocus /></div>
          <button className="btn btn-primary w-full" onClick={finish} disabled={!hh.trim()} style={{ opacity: hh.trim() ? 1 : 0.5 }}>{t('create', lang)}</button>
          <div className="border-t border-line pt-4"><label htmlFor="cd" className="mb-1 block text-sm font-semibold">{t('hhJoin', lang)}</label><div className="flex gap-2"><input id="cd" className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="KZ-XXXX" /><button className="btn btn-soft" onClick={() => { if (joinHouse(code)) award(20, t('welcome', lang)); else toast(t('badCode', lang)) }}>{t('join', lang)}</button></div></div>
        </>)}
      </div>
    </div>
  )
}

const STEPS = [{ e: '🎯', k: 'st1' }, { e: '🗓️', k: 'st2' }, { e: '🧾', k: 'st3' }, { e: '🏬', k: 'st4' }]

function Shell() {
  const { lang, me, house, patchMe, upHouse, award } = useApp()
  const [step, setStepRaw] = useState(Object.keys(house!.plan).length ? 2 : 1)
  const [dir, setDir] = useState<'l' | 'r'>('l')
  const [view, setView] = useState<'flow' | 'profile' | 'shop'>('flow')
  const [sheet, setSheet] = useState(false)
  const [cat, setCat] = useState<{ d: number; s: Meal } | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [boom, setBoom] = useState(0)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const { lines, extraCost, total } = useBasket()
  const h = house!; const budget = me!.budget; const mode = me!.mode ?? 'balanced'
  const hasPlan = Object.keys(h.plan).length > 0; const over = total > budget
  const celebrate = () => setBoom((b) => b + 1)
  const say = (m: string) => { setNote(m); setTimeout(() => setNote((x) => (x === m ? null : x)), 6000) }
  const setStep = (n: number) => { setDir(n >= step ? 'l' : 'r'); setStepRaw(Math.max(1, Math.min(4, n))); setView('flow') }

  const compose = (m: Mode = mode, b: number = budget) => {
    const next = randomPlan(Math.max(1, me!.size), me!.diet, m, Math.max(0, b - extraCost), h.pantry, h.extras ?? {})
    upHouse((x) => { x.plan = next; x.qty = {} }, 'built the week'); award(10, '✨'); celebrate()
    const c = listCost(next, h.pantry, h.extras ?? {}) + extraCost
    say(c <= b ? `🎉 ${money(b - c, lang)} ${t('margin', lang)}` : t('tight', lang))
    if (step === 1) setStep(2)
  }
  const adapt = (b: number = budget) => {
    const fit = adaptToBudget(h.plan, Math.max(0, b - extraCost), h.pantry, h.extras ?? {}, me!.diet)
    upHouse((x) => { x.plan = fit.plan; x.qty = {} }, 'fitted the budget')
    const bits = [fit.swapped && `${fit.swapped} ${t('swapped', lang)}`, fit.scaled && `${fit.scaled} ${t('scaled', lang)}`].filter(Boolean).join(' · ')
    say(fit.after + extraCost <= b ? `✅ ${bits || t('fitted', lang)} · −${money(fit.before - fit.after, lang)}` : `${t('tight', lang)} ${bits}`)
  }
  const setBudget = (b: number) => { patchMe({ budget: b }); if (hasPlan && total > b) adapt(b) }
  const setMode = (m: Mode) => { patchMe({ mode: m }) }
  const adaptMode = () => {
    const r = adaptToMode(h.plan, mode, me!.diet); upHouse((x) => { x.plan = r.plan }, 'adapted the week to ' + mode)
    say(`${{ light: '🥗', balanced: '⚖️', gourmet: '😋' }[mode]} ${r.changed} ${t('adapted', lang)}`); award(10, '✨'); celebrate()
  }
  const pickOwn = () => { setStep(2); setCat({ d: (new Date().getDay() + 6) % 7, s: 'b' }) }
  const goNext = () => {
    if (step === 1 && !hasPlan) return compose()
    if (step < 4) return setStep(step + 1)
    if (!h.store) upHouse((x) => { x.store = STORES.slice().sort((p, q) => storeTotal(lines, p) - storeTotal(lines, q))[0].id })
    setView('shop')
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current; touch.current = null; if (!s || (e.target as HTMLElement).closest('[data-noswipe],input,[role=dialog]')) return
    const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y
    if (Math.abs(dx) > 70 && Math.abs(dy) < 45) setStep(step + (dx < 0 ? 1 : -1) * (lang === 'ar' ? -1 : 1))
  }

  if (view === 'shop') return <><Toasts /><Confetti run={boom} /><ShopMode onExit={() => setView('flow')} celebrate={celebrate} /></>
  const pct = Math.min(100, (total / budget) * 100)
  return (
    <div className="calm min-h-screen">
      <Confetti run={boom} />
      <header className="sticky top-0 z-40 bg-[rgb(var(--bg)/.88)] backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button onClick={() => setView('flow')} aria-label="KUZINTI"><Logo size={36} /></button>
          <button className="min-w-0 flex-1 rounded-2xl bg-surface px-4 py-2 text-start shadow-soft active:scale-[.98]" onClick={() => setSheet(true)} aria-label={t('adjustB', lang)}>
            <span className="flex items-baseline justify-between text-sm"><b className={`tabular-nums ${over ? 'text-danger' : 'text-forest'}`}>💰 {money(total, lang)}</b><span className="text-xs text-muted tabular-nums">/ {money(budget, lang)}</span></span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-cream"><span className="block h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: over ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }} /></span>
          </button>
          <button className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest font-display font-extrabold text-white" onClick={() => setView(view === 'profile' ? 'flow' : 'profile')} aria-label={t('myAccount', lang)}>{me!.name[0]?.toUpperCase()}<span className="absolute -bottom-1 -end-1 rounded-full bg-apricot px-1.5 text-[10px] font-bold text-[#3c280a]">🔥{me!.streak}</span></button>
        </div>
        {note && <div className="toast mx-auto max-w-2xl px-4 pb-2"><button className="w-full rounded-2xl bg-forest px-4 py-2 text-start text-sm font-semibold text-white" onClick={() => setNote(null)}>{note}</button></div>}
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-36 pt-2" onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }} onTouchEnd={onTouchEnd}>
        <div key={view + step + lang} className={dir === 'l' ? 'slide-l' : 'slide-r'}>
          {view === 'profile' ? <ProfileScreen celebrate={celebrate} /> : <>
            {step === 1 && <BudgetStep setBudget={setBudget} setMode={setMode} compose={() => compose()} hasPlan={hasPlan} go={setStep} pickOwn={pickOwn} />}
            {step === 2 && (hasPlan ? <WeekStep compose={() => compose()} setMode={setMode} adaptMode={adaptMode} openCatalog={(d, sl) => setCat({ d, s: sl })} /> : <div className="card space-y-3 p-8 text-center"><p className="text-muted">{t('nothing', lang)}</p><button className="btn btn-primary w-full" onClick={pickOwn}>📖 {t('chooseMine', lang)}</button><button className="btn btn-soft w-full" onClick={() => compose()}>✨ {t('compose', lang)}</button></div>)}
            {step === 3 && <BasketStep adapt={() => adapt()} openBudget={() => setSheet(true)} />}
            {step === 4 && <StoresStep onShop={() => setView('shop')} />}
          </>}
        </div>
      </main>

      <nav className="dock" style={{ bottom: 'max(12px, env(safe-area-inset-bottom))' }} aria-label="Steps">
        <button className="dock-arrow" onClick={() => setStep(step - 1)} disabled={step === 1 && view === 'flow'} aria-label={t('back', lang)}>‹</button>
        <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden">
          {STEPS.map((x, i) => { const n = i + 1; const on = n === step && view === 'flow'; return (
            <div key={x.k} className="flex items-center">
              <button onClick={() => setStep(n)} aria-label={t(x.k, lang)} aria-current={on ? "step" : undefined} className={`dock-node ${on ? 'dock-node-on' : ''}`}><span className="text-lg">{x.e}</span>{on && step < 4 && <span className="text-xs font-bold">{t(x.k, lang)}</span>}</button>
            </div>) })}
        </div>
        <button className={`dock-arrow dock-next ${step === 4 ? '!w-auto px-4' : ''}`} onClick={goNext} aria-label={t('next', lang)}>{step === 4 ? <span className="text-sm font-bold">🏬 {t('shopShort', lang)}</span> : '›'}</button>
      </nav>

      {cat && <DishCatalog day0={cat.d} slot0={cat.s} onClose={() => setCat(null)} />}
      <Sheet open={sheet} onClose={() => setSheet(false)} title={t('adjustB', lang)}>
        <Controls setBudget={setBudget} setMode={setMode} />
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
