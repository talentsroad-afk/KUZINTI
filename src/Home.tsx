import { zf } from './lib/zgh'
import { ArrowRight, BookOpen, Dumbbell, Ticket, Carrot, Flame, Clock, Dices, Heart, Leaf, Plus, RefreshCw, Shuffle, SlidersHorizontal, Sparkles, Users, UtensilsCrossed, Wallet, Zap, type LucideIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { KcalGoal } from './Forme'
import { useApp } from './lib/store'
import { dayName, money, rname, t, type Lang } from './lib/i18n'
import { REC, RECIPES, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { entryCost, parseIng, recipeCost } from './lib/engine'
import { composeSides, cuisineOf, inCuisine, CUISINES, FLAG, REGIONS, type Prefs } from './lib/plan'
import { Badge, Dish, Sheet, type Tone } from './ui'
import type { Tab } from './Assist'
import { Controls, RecipeSheet, ReplaceSheet } from './Screens'
import { useBasket } from './Flow'
import { Welcome } from './Welcome'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : l === 'zgh' ? zf(fr) : fr)
const li = (l: Lang) => (l === 'en' ? 0 : l === 'ar' ? 2 : 1)
const ORDER: Meal[] = ['b', 'l', 'g', 'd']
const ENDS: Record<Meal, number> = { b: 10, l: 15, g: 18, d: 22 }

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
export function HomeTab({ compose, recompose, go, makeHealthy, openCountry, clear, composeFor }: { composeFor: (o: Partial<Prefs>) => void; clear: () => void; openCountry: () => void; compose: () => void; recompose: (o: Partial<Prefs>) => void; go: (t: Tab) => void; makeHealthy: () => void }) {
  const { lang, me, house, patchMe, upHouse, toast } = useApp()
  const [eat, setEat] = useState(false); const [wel, setWel] = useState(false); const [kc, setKc] = useState(false)
  const kt = useRef<number | undefined>(undefined)
  const onKcal = (k: number) => { clearTimeout(kt.current); kt.current = window.setTimeout(() => recompose({ kcal: k }), 450) }
  const { items, total, store } = useBasket()
  const [prefs, setPrefs] = useState(false); const [rv, setRv] = useState<Recipe | null>(null); const [rep, setRep] = useState<string | null>(null)
  const plan = house!.plan; const n = Object.keys(plan).length
  const now = new Date(); const today = (now.getDay() + 6) % 7
  const nm = nextMeal(plan, now)
  const cuisine = me!.cuisine ?? 'ma'; const region = me!.region ?? 'all'; const goals = me!.goals ?? []
  const left = items.filter((x) => !house!.checked[x.key])
  const firstName = me!.name.split(' ')[0]
  const greet = now.getHours() < 4 || now.getHours() >= 18 ? L(lang, 'Good evening', 'Bonsoir', 'مساء الخير') : L(lang, 'Hello', 'Bonjour', 'صباح الخير')
  const date = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA-u-nu-latn' : lang === 'zgh' ? 'fr' : lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)

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

  const money0 = me!.money; const mInc = money0 ? money0.inc.reduce((x, y) => x + y.a, 0) : 0
  const mPocket = money0 ? mInc - Object.values(money0.fix).reduce((x, y) => x + y, 0) - (money0.goal?.monthly ?? 0) - money0.exp.filter((e) => new Date(e.t).getMonth() === now.getMonth()).reduce((x, y) => x + y.a, 0) : 0
  const outs = (house as unknown as { outings2?: Record<string, Record<string, { acts: string[] }>> }).outings2 ?? {}
  const outDays = Object.values(outs).reduce((a, m) => a + Object.keys(m ?? {}).length, 0)
  const sp = (me as unknown as { sport?: { goal?: string } }).sport
  const nChecked = items.filter((x) => house!.checked[x.key]).length
  const STORY: { k: string; I: LucideIcon; tone: Tone; t: string; status: string; steps: string[]; done: number; cta: string; go: () => void }[] = [
    { k: 'food', I: UtensilsCrossed, tone: 'forest', t: L(lang, 'Meals', 'Repas', 'الوجبات'), steps: [L(lang, 'Week', 'Semaine', 'الأسبوع'), L(lang, 'Store', 'Magasin', 'المتجر'), L(lang, 'Shopping', 'Courses', 'التسوق')],
      done: !n ? 0 : !store ? 1 : left.length ? 2 : 3, status: !n ? L(lang, 'nothing planned', 'rien de prévu', 'لا شيء') : !store ? `${n} ${L(lang, 'meals', 'repas', 'وجبة')} · ${money(total, lang)}` : left.length ? `${nChecked}/${items.length} ${L(lang, 'in the cart', 'dans le caddie', 'في العربة')}` : L(lang, 'shopping done', 'courses faites', 'تم'),
      cta: !n ? L(lang, 'Compose', 'Composer', 'إنشاء') : !store ? L(lang, 'Store', 'Magasin', 'المتجر') : left.length ? L(lang, 'Shop', 'Courses', 'التسوق') : L(lang, 'See', 'Voir', 'عرض'), go: !n ? compose : !store ? () => go('stores') : () => go('list') },
    { k: 'out', I: Ticket, tone: 'grape', t: L(lang, 'Outings', 'Sorties', 'نزهات'), steps: [L(lang, 'Idea', 'Idée', 'فكرة'), L(lang, 'Program', 'Programme', 'برنامج')],
      done: outDays ? 2 : 0, status: outDays ? `${outDays} ${L(lang, 'day(s) planned', 'jour(s) prévu(s)', 'يوم')}` : L(lang, 'nothing for the weekend', 'rien pour le week-end', 'لا شيء'), cta: outDays ? L(lang, 'See', 'Voir', 'عرض') : L(lang, 'Plan', 'Planifier', 'خطط'), go: () => go('sorties') },
    { k: 'money', I: Wallet, tone: 'teal', t: L(lang, 'Budget', 'Budget', 'الميزانية'), steps: [L(lang, 'Income', 'Revenus', 'الدخل'), L(lang, 'Savings', 'Épargne', 'الادخار'), L(lang, 'Follow', 'Suivi', 'المتابعة')],
      done: !money0?.inc.length ? 0 : !money0.goal?.monthly ? 1 : money0.exp.length ? 3 : 2, status: money0?.inc.length ? `${L(lang, 'left', 'reste', 'الباقي')} ${money(Math.max(0, mPocket), lang)}` : L(lang, '2 min to set up', '2 min à régler', 'دقيقتان'),
      cta: !money0?.inc.length ? L(lang, 'Set up', 'Régler', 'إعداد') : money0.exp.length ? L(lang, 'See', 'Voir', 'عرض') : L(lang, 'Add', 'Ajouter', 'أضف'), go: () => go('budget') },
    { k: 'sport', I: Dumbbell, tone: 'sky', t: L(lang, 'Sport', 'Sport', 'الرياضة'), steps: [L(lang, 'Goal', 'Objectif', 'الهدف'), L(lang, 'Meals', 'Repas', 'وجبات')],
      done: sp?.goal ? (me!.health === 'sport' ? 2 : 1) : 0, status: sp?.goal ? `${me!.kcal ?? 2100} kcal/${L(lang, 'day', 'jour', 'يوم')}` : L(lang, 'optional', 'facultatif', 'اختياري'), cta: sp?.goal ? L(lang, 'See', 'Voir', 'عرض') : L(lang, 'Start', 'Commencer', 'ابدأ'), go: () => go('sport') },
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
      {/* Zone 1 — compact greeting */}
      <header className="rise flex items-start justify-between gap-3 pt-1 lg:col-span-12">
        <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-terracotta">{date}</p>
          <h1 className="font-serif text-[28px] font-semibold leading-tight tracking-tight text-ink lg:text-[40px]">{greet}, <span className="italic text-forest">{firstName}</span></h1></div>
      </header>
      <button className="rise -mt-2 flex max-w-full items-center gap-2 rounded-full bg-surface py-1 pe-3 ps-1 text-start text-xs font-semibold shadow-soft active:scale-[.98] lg:col-span-12" onClick={() => setWel(true)}><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf/30 text-[12px]">🍽️</span><span className="truncate">{prefLine}</span><span className="shrink-0 font-bold text-forest">{L(lang, 'Edit', 'Modifier', 'تعديل')}</span></button>

      {n === 0 && TUNE}
      {/* Zone 2 — next meal, compact */}
      {nr && nm && <article className="rise flex items-center gap-3 rounded-[24px] bg-surface p-2.5 shadow-soft lg:col-span-12">
        <button className="shrink-0" onClick={() => setRv(nr)} aria-label={rname(nr.n, lang)}><Dish r={nr} w={300} className="h-[84px] w-[84px] rounded-[18px]" /></button>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold uppercase tracking-[.14em] text-terracotta">{when(nm.off, nm.s, nm.d, lang)}</p>
          <button className="block w-full truncate text-start font-display text-[17px] font-extrabold leading-tight" onClick={() => setRv(nr)}>{rname(nr.n, lang)}</button>
          <p className="text-[11.5px] text-muted"><Clock size={12} className="-mt-0.5 inline" aria-hidden /> {nr.t} min · {money(entryCost(nm.e) / Math.max(1, nm.e.n), lang)} / {L(lang, 'pers.', 'pers.', 'شخص')}</p>
          <div className="mt-1.5 flex gap-1.5"><button className="rounded-full bg-forest px-3 py-1 text-xs font-bold text-white active:scale-95" onClick={() => setRv(nr)}>{L(lang, 'Recipe', 'Recette', 'الوصفة')}</button><button className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-forest active:scale-95" onClick={() => setRep(nm.k)}><RefreshCw size={12} className="-mt-0.5 inline" aria-hidden /> {L(lang, 'Replace', 'Remplacer', 'تغيير')}</button></div>
        </div>
      </article>}

      {/* Zone 3 — story line: for each theme, where I am and the one next step */}
      <section className="rise lg:col-span-12" aria-label={L(lang, 'My week at a glance', 'Ma semaine en un coup d’œil', 'أسبوعي بنظرة')}>
        <div className="mb-2 flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold">{L(lang, 'Where I am', 'Où j’en suis', 'أين وصلت')}</h2><span className="text-xs font-bold text-muted tabular-nums">{STORY.filter((x) => x.done >= x.steps.length).length}/{STORY.length} ✓</span></div>
        <ol className="relative space-y-2.5">
          <span className="absolute bottom-6 start-[27px] top-6 w-0.5 rounded bg-gradient-to-b from-forest/40 via-line to-transparent" aria-hidden />
          {STORY.map((x, i) => { const complete = x.done >= x.steps.length; return (
            <li key={x.k} className="rise relative" style={{ animationDelay: `${i * 70}ms` }}>
              <div className={`flex items-center gap-3 rounded-[22px] bg-surface p-3 shadow-soft ${!complete && i === STORY.findIndex((y) => y.done < y.steps.length) ? 'ring-2 ring-apricot/70' : ''}`}>
                <span className="relative"><Badge Icon={x.I} tone={x.tone} size={44} />{complete && <span className="pop absolute -bottom-1 -end-1 grid h-5 w-5 place-items-center rounded-full bg-forest text-[10px] font-bold text-white ring-2 ring-surface">✓</span>}</span>
                <button className="min-w-0 flex-1 text-start" onClick={x.go}>
                  <span className="flex items-center gap-1.5"><b className="text-[15px]">{x.t}</b><span className="truncate text-[11.5px] text-muted">· {x.status}</span></span>
                  <span className="mt-1 flex items-center gap-1" aria-label={`${x.done}/${x.steps.length}`}>{x.steps.map((st, j) => <span key={st} className={`flex items-center gap-1 text-[10px] font-bold ${j < x.done ? 'text-forest' : j === x.done ? 'text-ink' : 'text-muted/70'}`}><span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${j < x.done ? 'bg-forest text-white' : j === x.done ? 'bg-apricot text-ink' : 'bg-cream'}`}>{j < x.done ? '✓' : j + 1}</span><span className="hidden min-[400px]:inline">{st}</span>{j < x.steps.length - 1 && <span className={`h-0.5 w-2 rounded ${j < x.done ? 'bg-forest' : 'bg-line'}`} />}</span>)}</span>
                </button>
                <button className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-extrabold transition active:scale-95 ${complete ? 'bg-cream text-forest' : 'bg-forest text-white shadow-soft'}`} onClick={x.go}>{x.cta} ›</button>
              </div>
            </li>) })}
        </ol>
        <div className="mt-3 grid grid-cols-3 gap-2">{([[UtensilsCrossed, 'coral', L(lang, 'Eat today', 'Manger aujourd’hui', 'أكل اليوم'), () => setEat(true)], [BookOpen, 'leaf', L(lang, 'Recipes', 'Recettes', 'وصفات'), () => go('recipes')], [Users, 'sand', L(lang, 'Household', 'Foyer', 'الأسرة'), () => go('profile')]] as [LucideIcon, Tone, string, () => void][]).map(([I, tone, l, f]) => (
          <button key={l} className="dash-tile flex flex-col items-center gap-1.5 rounded-[20px] bg-surface p-2.5 text-center shadow-soft active:scale-95" onClick={f}><Badge Icon={I} tone={tone} size={34} /><span className="text-[11.5px] font-bold leading-tight">{l}</span></button>))}</div>
      </section>

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
        {shelves.slice(0, 1).map(([title, list]) => list.length > 0 && (
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
