import { useState } from 'react'
import { useApp } from './lib/store'
import { money, t, type Lang } from './lib/i18n'
import { Brand, Confetti, Toasts } from './ui'
import { RECIPES } from './data/recipes'
import { BudgetStep, WeekStep } from './Screens'
import { ProfileScreen } from './ListScreen'
import { BasketStep, ShopMode, StoresStep, useLines } from './Flow'
import { STORES, storeTotal } from './lib/stores'
import { adaptToBudget, listCost, randomPlan } from './lib/plan'
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
  const diets = ['vegetarian', 'healthy', 'budget']
  const dKey = (d: string) => (d === 'budget' ? 'budgetT' : d)
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
          <div><span className="mb-1 block text-sm font-semibold">{t('diet', lang)}</span><div className="flex flex-wrap gap-2">{diets.map((d) => <button key={d} className="chip" aria-pressed={me!.diet.includes(d)} onClick={() => patchMe({ diet: me!.diet.includes(d) ? me!.diet.filter((x) => x !== d) : [...me!.diet, d] })}>{t(dKey(d), lang)}</button>)}</div></div>
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

const money0 = (n: number, l: Lang) => money(n, l)

function Shell() {
  const { lang, me, house, patchMe, upHouse, award, toast } = useApp()
  const [step, setStep] = useState(Object.keys(house!.plan).length ? 2 : 1)
  const [view, setView] = useState<'flow' | 'profile' | 'shop'>('flow')
  const [boom, setBoom] = useState(0)
  const lines = useLines()
  const total = lines.reduce((a, l) => a + l.cost, 0)
  const budget = me!.budget; const hasPlan = Object.keys(house!.plan).length > 0
  const celebrate = () => setBoom((b) => b + 1)
  const h = house!

  const compose = () => {
    const next = randomPlan(Math.max(1, me!.size), me!.diet, budget, h.pantry, h.extras ?? {})
    const c = listCost(next, h.pantry, h.extras ?? {})
    upHouse((x) => { x.plan = next; x.qty = {} }, 'built the week'); award(10, '✨'); celebrate()
    toast(c <= budget ? `🎉 ${money(budget - c, lang)} ${t('margin', lang)}` : t('tight', lang)); setStep(2)
  }
  const adapt = (b = budget) => {
    const next = adaptToBudget(h.plan, b, h.pantry, h.extras ?? {}, me!.diet); const c = listCost(next, h.pantry, h.extras ?? {})
    upHouse((x) => { x.plan = next; x.qty = {} }, 'fitted the budget'); toast(c <= b ? `✅ ${t('fitted', lang)}` : t('tight', lang))
  }
  const setBudget = (b: number) => { patchMe({ budget: b }); if (hasPlan && listCost(h.plan, h.pantry, h.extras ?? {}, h.qty ?? {}) > b) adapt(b) }
  const goNext = () => {
    if (step < 4) return setStep(step + 1)
    if (!h.store) upHouse((x) => { x.store = STORES.slice().sort((p, q) => storeTotal(lines, p) - storeTotal(lines, q))[0].id })
    setView('shop')
  }
  const labels = ['st1', 'st2', 'st3', 'st4']
  const nextLabel = step < 4 ? `${t('next', lang)} · ${t(labels[step], lang)}` : `🏬 ${t('shopAt', lang)}`
  const showBar = hasPlan
  const over = total > budget

  if (view === 'shop') return <><Confetti run={boom} /><ShopMode onExit={() => setView('flow')} celebrate={celebrate} /></>
  return (
    <div className="calm min-h-screen">
      <Confetti run={boom} />
      <header className="sticky top-0 z-40 bg-[rgb(var(--bg)/.85)] backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button onClick={() => setView('flow')} aria-label="KUZINTI"><Brand /></button>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="rounded-full bg-surface px-3 py-1.5 shadow-soft">🔥 {me!.streak}</span><span className="rounded-full bg-surface px-3 py-1.5 shadow-soft">⭐ {Math.floor(me!.xp / 100) + 1}</span>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-forest font-display font-extrabold text-white" onClick={() => setView(view === 'profile' ? 'flow' : 'profile')} aria-label={t('myAccount', lang)}>{me!.name[0]?.toUpperCase()}</button>
          </div>
        </div>
        {view === 'flow' && (
          <nav className="mx-auto flex max-w-2xl gap-1.5 px-4 pb-3" aria-label="Steps">
            {labels.map((k, i) => { const n = i + 1; const on = n === step; const done = n < step; return (
              <button key={k} onClick={() => setStep(n)} aria-current={on ? 'step' : undefined} className="flex-1 text-start">
                <div className={`h-1.5 rounded-full transition-all ${on || done ? 'bg-forest' : 'bg-line'}`} />
                <span className={`mt-1 block text-[11px] font-bold ${on ? 'text-forest' : 'text-muted'}`}>{n}. {t(k, lang)}</span>
              </button>) })}
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 pb-40 pt-3" key={view + step + lang}>
        {view === 'profile' ? <ProfileScreen celebrate={celebrate} /> : <>
          {step === 1 && <BudgetStep cost={total} setBudget={setBudget} compose={compose} hasPlan={hasPlan} go={setStep} />}
          {step === 2 && (hasPlan ? <WeekStep cost={total} compose={compose} adapt={() => adapt()} /> : <div className="card p-8 text-center"><p className="mb-4 text-muted">{t('nothing', lang)}</p><button className="btn btn-primary" onClick={compose}>✨ {t('compose', lang)}</button></div>)}
          {step === 3 && <BasketStep adapt={() => adapt()} />}
          {step === 4 && <StoresStep />}
        </>}
      </main>
      {view === 'flow' && showBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/92 backdrop-blur" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3">
            <div className="min-w-0 flex-1"><p className="text-sm tabular-nums"><b className={over ? 'text-danger' : 'text-forest'}>{money0(total, lang)}</b> <span className="text-muted">/ {money0(budget, lang)}</span></p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (total / budget) * 100)}%`, background: over ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }} /></div></div>
            <button className="btn btn-primary !px-5" onClick={goNext}>{nextLabel}</button>
          </div>
        </div>
      )}
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
