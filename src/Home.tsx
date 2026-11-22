import { ArrowRight, BookOpen, ChevronRight, Clock, Heart, Plus, RefreshCw, ShoppingBasket, Shuffle, SlidersHorizontal, Sparkles, Users, Wallet, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { dayName, money, rname, t, type Lang } from './lib/i18n'
import { REC, RECIPES, type Meal, type Recipe } from './data/recipes'
import { ING } from './data/catalog'
import { entryCost, parseIng } from './lib/engine'
import { cuisineOf, CUISINES, FLAG, REGIONS, type Prefs } from './lib/plan'
import { Dish, Sheet } from './ui'
import { Controls, RecipeSheet, ReplaceSheet } from './Screens'
import { useBasket } from './Flow'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : fr)
const li = (l: Lang) => (l === 'en' ? 0 : l === 'fr' ? 1 : 2)
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
export function HomeTab({ compose, recompose, go }: { compose: () => void; recompose: (o: Partial<Prefs>) => void; go: (t: 'week' | 'list' | 'stores' | 'recipes') => void }) {
  const { lang, me, house, patchMe, toast } = useApp()
  const { items, total, spent, store, price } = useBasket()
  const [prefs, setPrefs] = useState(false); const [rv, setRv] = useState<Recipe | null>(null); const [rep, setRep] = useState<string | null>(null)
  const plan = house!.plan; const n = Object.keys(plan).length
  const now = new Date(); const today = (now.getDay() + 6) % 7
  const nm = nextMeal(plan, now)
  const cuisine = me!.cuisine ?? 'ma'; const region = me!.region ?? 'all'; const goals = me!.goals ?? []
  const left = items.filter((x) => !house!.checked[x.key]); const leftCost = left.reduce((a, x) => a + price(x.key, x.est), 0)
  const firstName = me!.name.split(' ')[0]
  const greet = now.getHours() < 4 || now.getHours() >= 18 ? L(lang, 'Good evening', 'Bonsoir', 'مساء الخير') : L(lang, 'Hello', 'Bonjour', 'صباح الخير')
  const date = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA-u-nu-latn' : lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const lead = !n ? L(lang, 'Nothing is planned yet. Let’s build a week that fits your table and your budget.', 'Rien n’est encore prévu. Composons une semaine à votre goût et à votre budget.', 'لا شيء مخطط بعد. لنركّب أسبوعًا يناسب ذوقكم وميزانيتكم.')
    : L(lang, `${n} meals planned for ${me!.size}, shopping estimated at ${money(total, lang)}.`, `${n} repas prévus pour ${me!.size}, des courses estimées à ${money(total, lang)}.`, `${n} وجبة لـ${me!.size} أشخاص، والمشتريات بحوالي ${money(total, lang)}.`)
  const week = Array.from({ length: 7 }, (_, i) => (today + i) % 7).map((d) => { const s = MAINS.find((x) => plan[`${d}-${x}`]); return { d, s, e: s ? plan[`${d}-${s}`] : undefined } })

  // Suggestions from real data only: pantry matches, then favourites, then quick dishes of the chosen cuisine.
  const sugg = useMemo(() => {
    const inPlan = new Set(Object.values(plan).map((e) => e.r)); const pantry = house!.pantry
    const ok = (r: Recipe) => r.m.length > 0 && !inPlan.has(r.id) && (cuisine === 'mix' || cuisineOf(r) === cuisine || cuisine === 'healthy') && !(me!.diet.includes('vegetarian') && !r.tags.includes('vegetarian'))
    const out: { r: Recipe; why: string }[] = []; const seen = new Set<string>()
    const push = (r: Recipe, why: string) => { if (out.length < 3 && !seen.has(r.id)) { seen.add(r.id); out.push({ r, why }) } }
    const have = RECIPES.filter(ok).map((r) => ({ r, hit: r.ing.map((s) => parseIng(s).id).filter((id) => (pantry[id] ?? 0) > 0 && ['produce', 'meat', 'dairy'].includes(ING[id]?.aisle)) })).filter((x) => x.hit.length >= 2).sort((a, b) => b.hit.length - a.hit.length)
    for (const x of have.slice(0, 2)) push(x.r, L(lang, 'With what you have: ', 'Avec ce que vous avez : ', 'بما لديكم: ') + x.hit.slice(0, 2).map((id) => ING[id].n[li(lang)].toLowerCase()).join(', '))
    for (const id of me!.favs) if (REC[id] && ok(REC[id])) push(REC[id], L(lang, 'In your favourites', 'Dans vos favoris', 'من مفضلاتكم'))
    for (const r of RECIPES.filter(ok).filter((r) => r.t <= 30).sort((a, b) => a.t - b.t)) push(r, L(lang, `Ready in ${r.t} min`, `Prêt en ${r.t} min`, `جاهز في ${r.t} دقيقة`))
    return out
  }, [plan, house, me, cuisine, lang])

  const tg = (g: string) => { const ng = goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g]; patchMe({ goals: ng }); recompose({ goals: ng }) }
  const prefLine = [`${FLAG[cuisine]} ${t('c_' + cuisine, lang)}`, cuisine === 'ma' && region !== 'all' ? t('r_' + region, lang) : '', ...goals.filter((g) => ['cheap', 'quick', 'varied'].includes(g)).map((g) => t('g_' + g, lang)), `${me!.size} ${t('people', lang).toLowerCase()}`, money(me!.budget, lang)].filter(Boolean).join(' · ')
  const nr = nm ? REC[nm.e.r] : null

  return (
    <div className="riad pb-4">
      {/* Zone 1 — personal introduction */}
      <header className="rise pt-2 lg:col-span-12">
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-terracotta">{date}</p>
        <h1 className="mt-1 font-serif text-[34px] font-semibold leading-[1.05] tracking-tight text-ink lg:text-[46px]">{greet}, <span className="italic text-forest">{firstName}</span>.</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">{lead}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted"><Users size={14} aria-hidden /> {house!.name} · {house!.members.length} {L(lang, house!.members.length > 1 ? 'members' : 'member', house!.members.length > 1 ? 'membres' : 'membre', 'أعضاء')}</p>
      </header>

      {/* Zone 2 — the next meal */}
      <section className="lg:col-span-7" aria-label={L(lang, 'Next meal', 'Prochain repas', 'الوجبة القادمة')}>
        {nr && nm ? (
          <article className="hero-meal rise -mx-4 overflow-hidden bg-surface sm:mx-0 sm:rounded-[28px] sm:shadow-soft">
            <button className="relative block w-full text-start" onClick={() => setRv(nr)} aria-label={rname(nr.n, lang)}>
              <Dish r={nr} w={1100} credit className="h-[330px] kenburns lg:h-[420px]" />
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
        ) : (
          <article className="rise relative -mx-4 overflow-hidden bg-forest p-6 text-white sm:mx-0 sm:rounded-[28px] lg:p-10">
            <span className="zellige pointer-events-none absolute inset-0 opacity-[.06]" aria-hidden />
            <p className="relative text-[11px] font-bold uppercase tracking-[.18em] text-apricot">{n ? L(lang, 'Your week is over', 'Semaine terminée', 'انتهى الأسبوع') : L(lang, 'Your first week', 'Votre première semaine', 'أسبوعكم الأول')}</p>
            <h2 className="relative mt-2 max-w-md font-serif text-[30px] font-semibold leading-[1.1] text-white lg:text-[40px]">{L(lang, 'Real home cooking, without the headache.', 'La vraie cuisine maison, sans y penser.', 'طبخ منزلي حقيقي، بلا عناء.')}</h2>
            <p className="relative mt-2 max-w-md text-sm text-white/80">{t('composeSub', lang)}</p>
            <div className="relative mt-5 flex flex-wrap gap-2">
              <button className="btn bg-white !text-forest" onClick={compose}><Sparkles size={17} aria-hidden /> {t('composeAuto', lang)}</button>
              <button className="btn border border-white/30 bg-transparent text-white" onClick={() => setPrefs(true)}><SlidersHorizontal size={17} aria-hidden /> {t('prefs', lang)}</button>
            </div>
          </article>
        )}
      </section>

      {/* Zone 3 — the week ahead */}
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

      {/* Zone 4 + 5 — shopping and ideas (right column on desktop) */}
      <aside className="space-y-8 lg:col-span-5 lg:space-y-6">
        {n > 0 && (
          <section className="rise">
            <h2 className="mb-3 font-serif text-[22px] font-semibold">{t('list', lang)}</h2>
            <button className="group w-full rounded-[24px] bg-cream p-4 text-start transition active:scale-[.99]" onClick={() => go(store ? 'list' : 'stores')}>
              <span className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface text-forest shadow-soft"><ShoppingBasket size={20} aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  {!items.length ? <><span className="block font-semibold">{L(lang, 'Everything is at home', 'Tout est déjà à la maison', 'كل شيء متوفر في البيت')}</span><span className="block text-xs text-muted">{L(lang, 'Your pantry covers this week.', 'Votre garde-manger couvre la semaine.', 'المخزن يغطي هذا الأسبوع.')}</span></>
                    : !left.length ? <><span className="block font-semibold">{L(lang, 'Shopping done', 'Courses faites', 'تم التسوق')} ✓</span><span className="block text-xs text-muted">{money(spent, lang)}{store ? ` · ${store.name}` : ''}</span></>
                    : <><span className="block font-semibold">{left.length} {L(lang, 'items left', left.length > 1 ? 'articles restants' : 'article restant', 'منتجات متبقية')} · <span className="tabular-nums">{money(leftCost, lang)}</span></span>
                      <span className="block truncate text-xs text-muted">{store ? store.name : L(lang, 'Choose your store to see its prices', 'Choisissez votre magasin pour ses prix', 'اختر متجرك لرؤية أسعاره')}</span></>}
                </span>
                <ChevronRight size={18} className="mt-3 shrink-0 text-muted transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
              </span>
              {items.length > 0 && <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-surface"><span className="block h-full rounded-full bg-forest transition-all duration-700" style={{ width: `${((items.length - left.length) / items.length) * 100}%` }} /></span>}
            </button>
          </section>
        )}
        {sugg.length > 0 && (
          <section className="rise">
            <div className="mb-3 flex items-baseline justify-between"><h2 className="font-serif text-[22px] font-semibold">{L(lang, 'Ideas for you', 'Idées pour vous', 'أفكار لكم')}</h2><button className="text-sm font-semibold text-forest" onClick={() => go('recipes')}>{L(lang, 'All recipes', 'Toutes les recettes', 'كل الوصفات')}</button></div>
            <div className="space-y-3">{sugg.map(({ r, why }) => (
              <button key={r.id} className="flex w-full items-center gap-3 text-start active:scale-[.99]" onClick={() => setRv(r)}>
                <Dish r={r} w={240} className="h-[72px] w-[72px] shrink-0 rounded-2xl" />
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{rname(r.n, lang)}</span><span className="block truncate text-xs text-muted">{me!.favs.includes(r.id) && <Heart size={11} className="-mt-0.5 me-1 inline fill-terracotta text-terracotta" aria-hidden />}{why}</span></span>
                <Plus size={18} className="shrink-0 text-forest" aria-hidden />
              </button>))}</div>
          </section>
        )}
      </aside>

      {/* Zone 6 — settings stay one discreet line away */}
      <nav className="rise flex flex-wrap gap-x-6 gap-y-2 border-t border-line/70 pt-4 text-sm lg:col-span-12" aria-label={t('prefs', lang)}>
        <button className="inline-flex min-w-0 items-center gap-2 font-semibold text-ink" onClick={() => setPrefs(true)}><SlidersHorizontal size={16} className="text-forest" aria-hidden /> {t('prefs', lang)} <span className="truncate font-normal text-muted">{prefLine}</span></button>
        {n > 0 && <button className="inline-flex items-center gap-2 font-semibold text-ink" onClick={compose}><RefreshCw size={16} className="text-forest" aria-hidden /> {t('newWeek', lang)}</button>}
      </nav>

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
