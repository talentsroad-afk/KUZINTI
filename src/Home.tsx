import { ArrowRight, BookOpen, Carrot, Check, ChevronDown, Flame, Clock, Dices, Heart, Leaf, Plus, RefreshCw, ShoppingCart, Shuffle, SlidersHorizontal, Sparkles, Store, Users, UtensilsCrossed, Wallet, Zap, type LucideIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { KcalGoal } from './Forme'
import { useApp } from './lib/store'
import { dayName, money, rname, t, type Lang } from './lib/i18n'
import { REC, RECIPES, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { entryCost, parseIng, recipeCost } from './lib/engine'
import { composeSides, cuisineOf, inCuisine, CUISINES, FLAG, REGIONS, type Prefs } from './lib/plan'
import { Dish, Sheet } from './ui'
import { Controls, RecipeSheet, ReplaceSheet } from './Screens'
import { useBasket } from './Flow'
import { Welcome } from './Welcome'
import { cname, countryOf } from './lib/countries'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : fr)
const li = (l: Lang) => (l === 'en' ? 0 : l === 'ar' ? 2 : 1)
const ORDER: Meal[] = ['b', 'l', 'g', 'd']
const ENDS: Record<Meal, number> = { b: 10, l: 15, g: 18, d: 22 }
const MAINS: Meal[] = ['l', 'd', 'b', 'g']

/** The next planned meal from now on (today's remaining slots, then the following days). */
function nextMeal(plan: Record<string, { r: string; n: number }>, now: Date) {
  const today = (now.getDay() + 6) % 7; const h = now.getHours()
  for (let off = 0; off < 7; off++) {
    const d = (today + off) % 7
    for (const s of ORDER) { if (off === 0 && h >= ENDS[s]) continue; const k = `${d}-${s}`; if (plan[k]) return { k, d, s, off, e: plan[k] } }
  }
  return null
}
const when = (off: number, s: Meal, d: number, l: Lang) => {
  const part = { b: L(l, 'breakfast', 'petit-déjeuner', 'الفطور'), l: L(l, 'lunch', 'déjeuner', 'الغداء'), g: L(l, 'tea time', 'goûter', 'اللمجة'), d: L(l, 'dinner', 'dîner', 'العشاء') }[s]
  if (off === 0) return { b: L(l, 'This morning', 'Ce matin', 'هذا الصباح'), l: L(l, 'This noon', 'Ce midi', 'هذا الزوال'), g: L(l, 'This afternoon', 'Cet après-midi', 'بعد الزوال'), d: L(l, 'Tonight', 'Ce soir', 'هذا المساء') }[s] + ' · ' + part
  if (off === 1) return L(l, 'Tomorrow', 'Demain', 'غدًا') + ' · ' + part
  return dayName(d, l) + ' · ' + part
}

/** Home, "Riad" direction: an editorial page built only from the household's real data. */
export function HomeTab({ compose, recompose, go, makeHealthy, openCountry, clear, composeFor }: { composeFor: (o: Partial<Prefs>) => void; clear: () => void; openCountry: () => void; compose: () => void; recompose: (o: Partial<Prefs>) => void; go: (t: 'week' | 'list' | 'stores' | 'recipes') => void; makeHealthy: () => void }) {
  const { lang, me, house, patchMe, upHouse, toast } = useApp()
  const [eat, setEat] = useState(false); const [wel, setWel] = useState(false); const [kc, setKc] = useState(false)
  const kt = useRef<number | undefined>(undefined)
  const onKcal = (k: number) => { clearTimeout(kt.current); kt.current = window.setTimeout(() => recompose({ kcal: k }), 450) }
  const { items, total, spent, store, price } = useBasket()
  const [prefs, setPrefs] = useState(false); const [rv, setRv] = useState<Recipe | null>(null); const [rep, setRep] = useState<string | null>(null)
  const plan = house!.plan; const n = Object.keys(plan).length
  const now = new Date(); const today = (now.getDay() + 6) % 7
  const nm = nextMeal(plan, now)
  const cuisine = me!.cuisine ?? 'ma'; const region = me!.region ?? 'all'; const goals = me!.goals ?? []
  const left = items.filter((x) => !house!.checked[x.key]); const leftCost = left.reduce((a, x) => a + price(x.key, x.est), 0)
  const firstName = me!.name.split(' ')[0]
  const greet = now.getHours() < 4 || now.getHours() >= 18 ? L(lang, 'Good evening', 'Bonsoir', 'مساء الخير') : L(lang, 'Hello', 'Bonjour', 'صباح الخير')
  const date = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA-u-nu-latn' : lang === 'zgh' ? 'fr' : lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const lead = !n ? L(lang, 'Nothing is planned yet. Let’s build a week that fits your table and your budget.', 'Rien n’est encore prévu. Composons une semaine à votre goût et à votre budget.', 'لا شيء مخطط بعد. لنركّب أسبوعًا يناسب ذوقكم وميزانيتكم.')
    : L(lang, `${n} meals planned for ${me!.size}, shopping estimated at ${money(total, lang)}.`, `${n} repas prévus pour ${me!.size}, des courses estimées à ${money(total, lang)}.`, `${n} وجبة لـ${me!.size} أشخاص، والمشتريات بحوالي ${money(total, lang)}.`)
  const week = Array.from({ length: 7 }, (_, i) => (today + i) % 7).map((d) => { const s = MAINS.find((x) => plan[`${d}-${x}`]); return { d, s, e: s ? plan[`${d}-${s}`] : undefined } })

  // Suggestions from real data only: pantry matches, then favourites, then quick dishes of the chosen cuisine.
  const sugg = useMemo(() => {
    const inPlan = new Set(Object.values(plan).map((e) => e.r)); const pantry = house!.pantry
    const ok = (r: Recipe) => (r.m.includes('l') || r.m.includes('d')) && !inPlan.has(r.id) && (cuisine === 'healthy' || inCuisine(r, cuisine)) && !(me!.diet.includes('vegetarian') && !r.tags.includes('vegetarian'))
    const out: { r: Recipe; why: string }[] = []; const seen = new Set<string>()
    const push = (r: Recipe, why: string) => { if (out.length < 3 && !seen.has(r.id)) { seen.add(r.id); out.push({ r, why }) } }
    const have = RECIPES.filter(ok).map((r) => ({ r, hit: r.ing.map((s) => parseIng(s).id).filter((id) => (pantry[id] ?? 0) > 0 && ['produce', 'meat', 'dairy'].includes(ING[id]?.aisle)) })).filter((x) => x.hit.length >= 2).sort((a, b) => b.hit.length - a.hit.length)
    for (const x of have.slice(0, 2)) push(x.r, L(lang, 'With what you have: ', 'Avec ce que vous avez : ', 'بما لديكم: ') + x.hit.slice(0, 2).map((id) => ING[id].n[li(lang)].toLowerCase()).join(', '))
    for (const id of me!.favs) if (REC[id] && ok(REC[id])) push(REC[id], L(lang, 'In your favourites', 'Dans vos favoris', 'من مفضلاتكم'))
    for (const r of RECIPES.filter(ok).filter((r) => r.t <= 30).sort((a, b) => a.t - b.t)) push(r, L(lang, `Ready in ${r.t} min`, `Prêt en ${r.t} min`, `جاهز في ${r.t} دقيقة`))
    return out
  }, [plan, house, me, cuisine, lang])

  const tg = (g: string) => { const on = !goals.includes(g); const ng = on ? [...goals.filter((x) => !(g === 'healthy' && x === 'gourmand')), g] : goals.filter((x) => x !== g); patchMe({ goals: ng }); if (g === 'healthy' && on && n) makeHealthy(); else recompose({ goals: ng }) }
  const veg = me!.diet.includes('vegetarian')
  const QUICK: [string, string, LucideIcon, boolean, () => void][] = [
    ['healthy', 'Healthy', Leaf, goals.includes('healthy'), () => tg('healthy')],
    ['veg', L(lang, 'Veggie', 'Végé', 'نباتي'), Carrot, veg, () => { const d = veg ? [] : ['vegetarian']; patchMe({ diet: d }); recompose({ diet: d }) }],
    ['cheap', t('g_cheap', lang), Wallet, goals.includes('cheap'), () => tg('cheap')],
    ['quick', t('g_quick', lang), Zap, goals.includes('quick'), () => tg('quick')],
  ]
  // One journey for the whole app: week → store → shopping.
  const stepI = !n ? 0 : !store ? 1 : left.length ? 2 : 3
  const STEPS = [L(lang, 'Week', 'Semaine', 'الأسبوع'), L(lang, 'Store', 'Magasin', 'المتجر'), L(lang, 'Shopping', 'Courses', 'التسوق')]
  const act: [string, string, LucideIcon, () => void] = stepI === 0 ? [t('composeAuto', lang), L(lang, '7 days of meals, the list and the budget in one tap', '7 jours de repas, la liste et le budget en un geste', '7 أيام من الوجبات واللائحة والميزانية بلمسة'), Sparkles, compose]
    : stepI === 1 ? [L(lang, 'Choose my store', 'Choisir mon magasin', 'اختيار متجري'), L(lang, `${items.length} items · compare prices or go straight to the list`, `${items.length} articles · comparez les prix ou allez droit à la liste`, `${items.length} منتج · قارن الأسعار أو اذهب للائحة`), Store, () => go('stores')]
    : stepI === 2 ? [L(lang, 'Go shopping', 'Faire mes courses', 'التسوق'), `${left.length} ${L(lang, 'items', 'articles', 'منتج')} · ${money(leftCost, lang)} · ${store!.name}`, ShoppingCart, () => go('list')]
    : [L(lang, 'Shopping done', 'Courses faites', 'تم التسوق') + ' ✓', items.length ? `${money(spent, lang)} · ${store?.name ?? ''}` : L(lang, 'Everything is already at home', 'Tout est déjà à la maison', 'كل شيء متوفر في البيت'), Check, () => go('week')]
  // "What do we eat today?": dishes ranked by what is already at home (bought or in the pantry).
  const [shift, setShift] = useState(0)
  const ideas = useMemo(() => {
    const pantry = house!.pantry
    const ok = (r: Recipe) => (r.m.includes('l') || r.m.includes('d')) && (cuisine === 'healthy' || inCuisine(r, cuisine)) && !(veg && !r.tags.includes('vegetarian'))
    return RECIPES.filter(ok).map((r) => { const ids = r.ing.map((x) => parseIng(x).id); const fresh = ids.filter((id) => ['produce', 'meat', 'dairy'].includes(ING[id]?.aisle)); const hit = fresh.filter((id) => (pantry[id] ?? 0) > 0); return { r, hit, of: fresh.length, score: hit.length * 3 - (fresh.length - hit.length) * 0.5 + (r.t <= 35 ? 2 : 0) - r.t / 60 } })
      .sort((a, b) => b.score - a.score || a.r.t - b.r.t)
  }, [house, cuisine, veg])
  const hasHome = ideas.some((x) => x.hit.length > 0)
  const shown = ideas.slice(shift % Math.max(1, ideas.length - 3), (shift % Math.max(1, ideas.length - 3)) + 3)
  const slotNow: Meal = now.getHours() < 15 ? 'l' : 'd'
  const putToday = (r: Recipe) => { upHouse((h) => { h.plan[`${today}-${slotNow}`] = { r: r.id, n: me!.size, x: composeSides(r.id, slotNow) } }, `+ ${rname(r.n, lang)}`); toast(`✅ ${rname(r.n, lang)} · ${t(slotNow, lang)}`); setEat(false) }
  const prefLine = [cuisine.split(',').map((c) => `${FLAG[c] ?? ''} ${t('c_' + c, lang)}`).join(', '), cuisine === 'ma' && region !== 'all' ? t('r_' + region, lang) : '', ...goals.filter((g) => ['cheap', 'quick', 'varied'].includes(g)).map((g) => t('g_' + g, lang)), `${me!.size} ${t('people', lang).toLowerCase()}`, money(me!.budget, lang)].filter(Boolean).join(' · ')
  const nr = nm ? REC[nm.e.r] : null
  // Real catalog only: one dish of the day (changes every day) and three short shelves.
  const pool = RECIPES.filter((r) => (r.m.includes('l') || r.m.includes('d')) && inCuisine(r, cuisine) && !(veg && !r.tags.includes('vegetarian')))
  const doy = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 864e5)
  const daily = pool.length ? pool[doy % pool.length] : null
  const shelves: [string, Recipe[]][] = [
    [L(lang, 'Ready in 30 min', 'Prêt en 30 min', 'جاهز في 30 دقيقة'), pool.filter((r) => r.t <= 30 && r !== daily).slice(0, 10)],
    [L(lang, 'Vegetarian', 'Végétarien', 'نباتي'), RECIPES.filter((r) => r.tags.includes('vegetarian') && (r.m.includes('l') || r.m.includes('d')) && inCuisine(r, cuisine)).slice(0, 10)],
    [cuisine === 'ma' ? L(lang, 'Moroccan family classics', 'Les classiques de la famille', 'كلاسيكيات العائلة') : L(lang, 'From around the world', 'Cuisine du monde', 'من مطابخ العالم'), (cuisine === 'ma' ? pool.filter((r) => r.tags.includes('family')) : RECIPES.filter((r) => cuisineOf(r) !== 'ma' && r.m.length)).slice(0, 10)],
  ]

  const TUNE = (
      <section className={`rise space-y-3 lg:col-span-12 ${n ? 'rounded-[24px] bg-surface/70 p-4 shadow-soft' : ''}`}>
      {n > 0 && <h2 className="font-serif text-[20px] font-semibold">{L(lang, 'Tune my week', 'Ajuster ma semaine', 'ضبط أسبوعي')}</h2>}
      <button className={`btn w-full lg:w-auto lg:px-10 ${n ? 'btn-soft !min-h-12' : 'btn-primary !min-h-14 text-[17px]'}`} onClick={compose}>{n ? <RefreshCw size={20} aria-hidden /> : <Sparkles size={20} aria-hidden />} {n ? L(lang, 'Recompose my week', 'Recomposer ma semaine', 'إعادة تركيب أسبوعي') : t('composeAuto', lang)}</button>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" data-noswipe>
        <button className="chip shrink-0" onClick={() => setKc(true)}><Flame size={15} className="me-1.5 text-terracotta" aria-hidden />{me!.kcal ?? 2100} kcal</button>
        {QUICK.map(([k, l, I, on, f]) => <button key={k} className="chip shrink-0" aria-pressed={on} onClick={f}><I size={15} className="me-1.5" aria-hidden />{l}</button>)}
        <button className="chip shrink-0" onClick={() => setPrefs(true)}><Wallet size={15} className="me-1.5" aria-hidden />{money(me!.budget, lang)} · {me!.size} {L(lang, 'pers.', 'pers.', 'أشخاص')}</button>
        <button className="chip shrink-0" onClick={() => setPrefs(true)}><SlidersHorizontal size={15} className="me-1.5" aria-hidden />{L(lang, 'More', 'Plus', 'المزيد')}</button>
      </div>
      </section>
  )
  if (!me!.known || wel) return <Welcome onDone={(o) => { setWel(false); if (o) composeFor(o) }} />
  return (
    <div className="riad pb-4">
      {/* Zone 1 — personal introduction */}
      <header className="rise pt-2 lg:col-span-12">
        <div className="flex items-center justify-between gap-3"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-terracotta">{date}</p>
          <button className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm font-bold shadow-soft active:scale-95" onClick={openCountry} aria-label={L(lang, 'Change country', 'Changer de pays', 'تغيير البلد')}>{countryOf(me!.country).f} {cname(countryOf(me!.country), lang)} · {countryOf(me!.country).sym} <ChevronDown size={15} aria-hidden /></button></div>
        <h1 className="mt-1 font-serif text-[34px] font-semibold leading-[1.05] tracking-tight text-ink lg:text-[46px]">{greet}, <span className="italic text-forest">{firstName}</span>.</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">{lead}</p>
        <button className="mt-3 flex max-w-full items-center gap-2 rounded-full bg-surface py-1.5 pe-3 ps-1.5 text-start text-xs font-semibold shadow-soft active:scale-[.98]" onClick={() => setWel(true)}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf/30 text-sm">🍽️</span><span className="truncate">{prefLine}</span><span className="shrink-0 font-bold text-forest">{L(lang, 'Edit', 'Modifier', 'تعديل')}</span></button>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted"><Users size={14} aria-hidden /> {house!.name} · {house!.members.length} {L(lang, house!.members.length > 1 ? 'members' : 'member', house!.members.length > 1 ? 'membres' : 'membre', 'أعضاء')}</p>
      </header>

      {n === 0 && TUNE}
      {/* 3 — today */}
      <section className="rise space-y-3 lg:col-span-7">
        <h2 className="mb-3 font-serif text-[22px] font-semibold">{L(lang, 'Today', 'Aujourd’hui', 'اليوم')}</h2>
      {nm && <div>
        {nr && nm ? (
          <article className="hero-meal rise -mx-4 overflow-hidden bg-surface sm:mx-0 sm:rounded-[28px] sm:shadow-soft">
            <button className="relative block w-full text-start" onClick={() => setRv(nr)} aria-label={rname(nr.n, lang)}>
              <Dish r={nr} w={1100} credit className="h-[220px] kenburns lg:h-[300px]" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                <span className="text-[11px] font-bold uppercase tracking-[.18em] text-apricot">{when(nm.off, nm.s, nm.d, lang)}</span>
                <span className="mt-1 block font-serif text-[30px] font-semibold leading-[1.08] lg:text-[36px]">{rname(nr.n, lang)}</span>
                <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/85"><span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden /> {nr.t} min</span><span className="inline-flex items-center gap-1"><Users size={14} aria-hidden /> {nm.e.n}</span><span>{money(entryCost(nm.e) / Math.max(1, nm.e.n), lang)} / {L(lang, 'serving', 'pers.', 'للفرد')}</span></span>
              </span>
            </button>
            <div className="flex gap-2 p-4">
              <button className="btn btn-primary flex-1" onClick={() => setRv(nr)}><BookOpen size={17} aria-hidden /> {L(lang, 'Recipe', 'La recette', 'الوصفة')}</button>
              <button className="btn btn-soft flex-1" onClick={() => setRep(nm.k)}><RefreshCw size={17} aria-hidden /> {L(lang, 'Replace', 'Remplacer', 'تغيير')}</button>
            </div>
          </article>
        ) : null}
      </div>}
      <button className="group flex w-full items-center gap-3 rounded-[24px] bg-apricot/25 p-4 text-start transition active:scale-[.98]" onClick={() => setEat(true)}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-apricot text-ink"><UtensilsCrossed size={22} aria-hidden /></span>
        <span className="min-w-0 flex-1"><span className="block font-serif text-[19px] font-semibold leading-tight">{L(lang, 'What do we eat today?', 'Que manger aujourd’hui ?', 'ماذا نأكل اليوم؟')}</span><span className="block truncate text-xs text-muted">{hasHome ? L(lang, 'Ideas with what you already have', 'Des idées avec ce que vous avez déjà', 'أفكار بما لديكم') : L(lang, 'A quick idea for today', 'Une idée rapide pour aujourd’hui', 'فكرة سريعة لليوم')}</span></span>
        <ArrowRight size={18} className="shrink-0 text-ink/60 transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
      </button>
      </section>

      {/* 4 — shopping: one next step */}
      {n > 0 && <section className="rise lg:col-span-5" aria-label={L(lang, 'Your shopping', 'Vos courses', 'مشترياتك')}>
        <h2 className="mb-3 font-serif text-[22px] font-semibold">{L(lang, 'Your shopping', 'Vos courses', 'مشترياتك')}</h2>
        <div className="relative overflow-hidden rounded-[28px] bg-forest p-4 text-white sm:p-5">
          <span className="zellige pointer-events-none absolute inset-0 opacity-[.06]" aria-hidden />
          <ol className="relative flex items-center gap-1.5 text-[12px] font-bold">{STEPS.map((x, i) => <li key={x} className="flex flex-1 items-center gap-1.5"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs transition ${i < stepI ? 'bg-white text-forest' : i === stepI ? 'bg-apricot text-ink ring-4 ring-apricot/30' : 'bg-white/15 text-white/70'}`}>{i < stepI ? '✓' : i + 1}</span><span className={i === stepI ? 'text-white' : 'text-white/65'}>{x}</span>{i < 2 && <span className={`h-0.5 min-w-2 flex-1 rounded ${i < stepI ? 'bg-white' : 'bg-white/20'}`} />}</li>)}</ol>
          <button className="relative mt-4 flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-start text-ink shadow-lg transition active:scale-[.98]" onClick={act[3]}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-forest text-white">{(() => { const I = act[2]; return <I size={22} aria-hidden /> })()}</span>
            <span className="min-w-0 flex-1"><span className="block font-display text-[17px] font-extrabold leading-tight">{act[0]}</span><span className="block truncate text-xs text-muted">{act[1]}</span></span>
            <ArrowRight size={20} className="shrink-0 text-forest rtl:rotate-180" aria-hidden />
          </button>
        </div>
      </section>}

      {/* 5 — the week */}
      {n > 0 && (
        <section className="rise lg:col-span-12">
          <div className="mb-3 flex items-baseline justify-between"><h2 className="font-serif text-[22px] font-semibold">{L(lang, 'The week ahead', 'La semaine', 'الأسبوع')}</h2><button className="inline-flex items-center gap-1 text-sm font-semibold text-forest" onClick={() => go('week')}>{L(lang, 'See all', 'Tout voir', 'عرض الكل')} <ArrowRight size={15} className="rtl:rotate-180" aria-hidden /></button></div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0" data-noswipe>
            {week.map(({ d, s, e }, i) => {
              const r = e ? REC[e.r] : null
              return (
                <div key={d} className={`w-[136px] shrink-0 snap-start lg:w-auto ${i % 2 ? 'pt-5 lg:pt-0' : ''}`}>
                  {r && s ? <button className="block w-full text-start" onClick={() => setRep(`${d}-${s}`)} aria-label={`${dayName(d, lang)} · ${rname(r.n, lang)} · ${L(lang, 'replace', 'remplacer', 'تغيير')}`}>
                    <Dish r={r} w={320} className={`h-[150px] w-full rounded-[20px] lg:h-[130px] ${i === 0 ? 'ring-2 ring-forest ring-offset-2 ring-offset-[rgb(var(--bg))]' : ''}`} />
                    <span className={`mt-2 block text-[11px] font-bold uppercase tracking-wider ${i === 0 ? 'text-forest' : 'text-muted'}`}>{i === 0 ? L(lang, 'Today', 'Aujourd’hui', 'اليوم') : dayName(d, lang)}</span>
                    <span className="line-clamp-2 text-sm font-semibold leading-snug">{rname(r.n, lang)}</span>
                  </button>
                    : <button className="grid h-[150px] w-full place-items-center rounded-[20px] border-2 border-dashed border-line text-sm font-semibold text-muted lg:h-[130px]" onClick={() => setRep(`${d}-l`)}><span><Plus size={18} className="mx-auto" aria-hidden />{dayName(d, lang)}</span></button>}
                </div>)
            })}
          </div>
        </section>
      )}

      {n > 0 && TUNE}
      {/* 6 — ideas and recipes */}
      <section className="rise lg:col-span-12">
        <h2 className="mb-3 font-serif text-[22px] font-semibold">{L(lang, 'Ideas & recipes', 'Idées et recettes', 'أفكار ووصفات')}</h2>
        <div className="space-y-8 lg:grid lg:grid-cols-12 lg:gap-10 lg:space-y-0">
      <div className="space-y-6 lg:col-span-7">
        {daily && <button className="group relative block w-full overflow-hidden rounded-[28px] bg-surface text-start shadow-soft active:scale-[.99]" onClick={() => setRv(daily)}>
          <div className="grid grid-cols-[42%_1fr] lg:grid-cols-[320px_1fr]"><Dish r={daily} w={500} className="h-full min-h-[170px]" />
            <div className="p-4 lg:p-6"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-terracotta">{L(lang, 'Recipe of the day', 'Recette du jour', 'وصفة اليوم')}</p><h3 className="mt-1 font-serif text-[24px] font-semibold leading-tight lg:text-[30px]">{rname(daily.n, lang)}</h3><p className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted"><span>⏱ {daily.t} min</span><span>{'●'.repeat(daily.d)}{'○'.repeat(3 - daily.d)}</span><span>{money(recipeCost(daily.id) / daily.s, lang)} / {L(lang, 'serving', 'pers.', 'للفرد')}</span></p><span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-forest">{L(lang, 'See the recipe', 'Voir la recette', 'عرض الوصفة')} <ArrowRight size={15} className="transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden /></span></div></div>
        </button>}
        {shelves.map(([title, list]) => list.length > 0 && (
          <div key={title}>
            <div className="mb-2 flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold">{title}</h2><button className="text-sm font-semibold text-forest" onClick={() => go('recipes')}>{L(lang, 'All', 'Tout', 'الكل')}</button></div>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0" data-noswipe>{list.map((r) => (
              <button key={r.id} className="w-[132px] shrink-0 snap-start text-start active:scale-[.97]" onClick={() => setRv(r)}>
                <Dish r={r} w={300} className="h-[104px] w-full rounded-[18px]" />
                <span className="mt-1.5 line-clamp-2 block text-sm font-semibold leading-snug">{rname(r.n, lang)}</span><span className="text-[11px] text-muted">⏱ {r.t} min</span>
              </button>))}</div>
          </div>))}
      </div>
      <aside className="lg:col-span-5">
        {sugg.length > 0 && (
          <section className="rise">
            <div className="mb-3 flex items-baseline justify-between"><h2 className="font-serif text-[22px] font-semibold">{L(lang, 'For you', 'Pour vous', 'لكم')}</h2><button className="text-sm font-semibold text-forest" onClick={() => go('recipes')}>{L(lang, 'All recipes', 'Toutes les recettes', 'كل الوصفات')}</button></div>
            <div className="space-y-3">{sugg.map(({ r, why }) => (
              <button key={r.id} className="flex w-full items-center gap-3 text-start active:scale-[.99]" onClick={() => setRv(r)}>
                <Dish r={r} w={240} className="h-[72px] w-[72px] shrink-0 rounded-2xl" />
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{rname(r.n, lang)}</span><span className="block truncate text-xs text-muted">{me!.favs.includes(r.id) && <Heart size={11} className="-mt-0.5 me-1 inline fill-terracotta text-terracotta" aria-hidden />}{why}</span></span>
                <Plus size={18} className="shrink-0 text-forest" aria-hidden />
              </button>))}</div>
          </section>
        )}
      </aside>
        </div>
      </section>

      {/* Zone 6 — settings stay one discreet line away */}
      <nav className="rise flex flex-wrap gap-x-6 gap-y-2 border-t border-line/70 pt-4 text-sm lg:col-span-12" aria-label={t('prefs', lang)}>
        <button className="inline-flex min-w-0 items-center gap-2 font-semibold text-ink" onClick={() => setPrefs(true)}><SlidersHorizontal size={16} className="text-forest" aria-hidden /> {t('prefs', lang)} <span className="truncate font-normal text-muted">{prefLine}</span></button>
        {n > 0 && <button className="inline-flex items-center gap-2 font-semibold text-ink" onClick={compose}><RefreshCw size={16} className="text-forest" aria-hidden /> {t('newWeek', lang)}</button>}
        {n > 0 && <button className="inline-flex items-center gap-2 font-semibold text-danger" onClick={clear}>🗑 {L(lang, 'Clear the week', 'Vider la semaine', 'إفراغ الأسبوع')}</button>}
      </nav>

      <Sheet open={kc} onClose={() => setKc(false)} title={L(lang, 'Calories', 'Calories', 'السعرات')}>
        <KcalGoal onChange={onKcal} />
        <p className="mt-3 text-xs text-muted">{n ? L(lang, 'Your week adapts automatically.', 'Votre semaine s’adapte automatiquement.', 'يتكيف أسبوعك تلقائيًا.') : L(lang, 'Used when you compose your week.', 'Pris en compte quand vous composez la semaine.', 'يؤخذ بعين الاعتبار عند التركيب.')}</p>
        <button className="btn btn-primary mt-4 w-full" onClick={() => setKc(false)}>{t('ok', lang)}</button>
      </Sheet>
      <Sheet open={eat} onClose={() => setEat(false)} title={L(lang, 'What do we eat today?', 'Que manger aujourd’hui ?', 'ماذا نأكل اليوم؟')}>
        <p className="mb-3 text-sm text-muted">{hasHome ? L(lang, 'Ranked by what is already at home (your last shopping and pantry).', 'Classées selon ce que vous avez déjà (vos dernières courses et le garde-manger).', 'مرتبة حسب ما لديكم في البيت.') : L(lang, 'Nothing in the pantry yet: here are quick dishes. After your shopping, ideas will use what you bought.', 'Rien au garde-manger pour l’instant : voici des plats rapides. Après vos courses, les idées utiliseront ce que vous avez acheté.', 'المخزن فارغ: إليكم أطباق سريعة.')}</p>
        <div className="space-y-3">{shown.map(({ r, hit, of }) => (
          <div key={r.id} className="fade-up flex items-center gap-3 rounded-2xl border border-line p-2.5">
            <button className="shrink-0" onClick={() => setRv(r)} aria-label={rname(r.n, lang)}><Dish r={r} w={200} className="h-16 w-16 rounded-xl" /></button>
            <button className="min-w-0 flex-1 text-start" onClick={() => setRv(r)}><span className="line-clamp-2 block font-semibold leading-snug">{rname(r.n, lang)}</span><span className="block truncate text-xs text-muted">{hit.length ? `${L(lang, 'You have', 'Vous avez', 'لديكم')} ${hit.length}/${of} : ${hit.slice(0, 3).map((id) => ING[id].n[li(lang)].toLowerCase()).join(', ')}` : `⏱ ${r.t} min`}</span></button>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-white shadow-lg active:scale-90" onClick={() => putToday(r)} aria-label={L(lang, 'Add to today', 'Ajouter à aujourd’hui', 'أضف لليوم')}><Plus size={20} aria-hidden /></button>
          </div>))}</div>
        <button className="btn btn-soft mt-3 w-full" onClick={() => setShift(shift + 3)}><Dices size={17} aria-hidden /> {L(lang, 'Other ideas', 'D’autres idées', 'أفكار أخرى')}</button>
        <p className="mt-2 text-center text-[11px] text-muted">{L(lang, 'Adds the dish to today’s', 'Ajoute le plat au', 'يضيف الطبق إلى')} {t(slotNow, lang).toLowerCase()} · {L(lang, 'your list updates', 'la liste se met à jour', 'تتحدث اللائحة')}</p>
      </Sheet>
      <Sheet open={prefs} onClose={() => setPrefs(false)} title={t('prefs', lang)}>
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t('cuisine', lang)}</p>
            <div className="flex flex-wrap gap-2">{CUISINES.map((c) => <button key={c} className="chip" aria-pressed={cuisine === c} onClick={() => { patchMe({ cuisine: c, region: 'all' }); recompose({ cuisine: c, region: 'all' }) }}>{FLAG[c]} {t('c_' + c, lang)}</button>)}</div>
            {cuisine === 'ma' && <div className="mt-2 flex flex-wrap gap-1.5">{REGIONS.map((r) => <button key={r} className={`rounded-full px-3 py-1 text-xs font-semibold ${region === r ? 'bg-leaf/40 text-forest' : 'text-muted'}`} onClick={() => { patchMe({ region: r }); recompose({ region: r }) }}>{t('r_' + r, lang)}</button>)}</div>}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t('goals', lang)}</p>
            <div className="flex flex-wrap gap-2">{([['cheap', Wallet], ['quick', Zap], ['varied', Shuffle]] as const).map(([g, E]) => <button key={g} className="chip" aria-pressed={goals.includes(g)} onClick={() => tg(g)}><E size={15} className="me-1.5" aria-hidden />{t('g_' + g, lang)}</button>)}</div>
          </div>
          <Controls setBudget={(b) => patchMe({ budget: b })} />
          <button className="btn btn-primary w-full" onClick={() => { setPrefs(false); if (!n) compose() }}>{n ? t('ok', lang) : t('composeAuto', lang)}</button>
        </div>
      </Sheet>
      {rv && <RecipeSheet r={rv} onClose={() => setRv(null)} />}
      {rep && <ReplaceSheet k={rep} onClose={() => setRep(null)} say={(m) => toast(m)} />}
    </div>
  )
}
