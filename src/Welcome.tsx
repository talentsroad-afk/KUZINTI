import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useApp } from './lib/store'
import { money, setCurrency, t, type Lang } from './lib/i18n'
import { setStoreCountry } from './lib/stores'
import { COUNTRIES, cname, countryOf } from './lib/countries'
import { FLAG, type Prefs } from './lib/plan'
import type { Meal } from './data/recipes'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : fr)
const CUIS = ['ma', 'fr', 'med', 'it', 'es', 'tr', 'in', 'jp', 'hint']
const KCAL: [number, string, string][] = [[1700, '🏃', 'Perdre'], [2100, '🙂', 'Garder'], [2500, '💪', 'Prendre']]

/** First meeting: four short cards so KUZINTI knows who it cooks for before proposing a single dish. */
export function Welcome({ onDone }: { onDone: (o?: Partial<Prefs>) => void }) {
  const { lang, me, patchMe } = useApp()
  const [i, setI] = useState(0)
  const [cc, setCc] = useState(me!.country)
  const [size, setSize] = useState(me!.size || 2)
  const [meals, setMeals] = useState<Meal[]>(me!.meals ?? ['b', 'l', 'd'])
  const [cu, setCu] = useState<string[]>(() => me!.known && me!.cuisine ? me!.cuisine.split(',') : [])
  const [veg, setVeg] = useState(me!.diet.includes('vegetarian'))
  const [goals, setGoals] = useState<string[]>((me!.goals ?? []).filter((g) => ['cheap', 'quick', 'healthy', 'varied'].includes(g)))
  const [budget, setBudget] = useState(me!.budget || 800)
  const [kcal, setKcal] = useState(me!.kcal ?? 2100)
  const pickC = (id: string) => { setCc(id); setCurrency(id); setStoreCountry(id); patchMe({ country: id, city: countryOf(id).cities?.[0] ?? me!.city }) }
  const tog = <T,>(a: T[], x: T) => (a.includes(x) ? a.filter((y) => y !== x) : [...a, x])
  const finish = () => {
    const cuisine = (cu.length ? cu : [countryOf(cc).cuisine]).join(','); const diet = veg ? ['vegetarian'] : []
    const o = { cuisine, region: 'all', diet, size, meals, goals, budget, kcal }
    patchMe({ ...o, known: true }); onDone(o)
  }
  const steps = [
    [L(lang, 'Where do you cook?', 'D’où cuisinez-vous ?', 'من أين تطبخ؟'), L(lang, 'Currency, stores and local dishes.', 'Pour la devise, les magasins et les plats locaux.', 'للعملة والمتاجر')],
    [L(lang, 'Who eats at home?', 'Qui mange à la maison ?', 'من يأكل في البيت؟'), L(lang, 'Portions and meals of the day.', 'Pour les portions et les repas de la journée.', 'للكميات والوجبات')],
    [L(lang, 'What do you love?', 'Qu’aimez-vous manger ?', 'ماذا تحب؟'), L(lang, 'Pick one or several cuisines.', 'Choisissez une ou plusieurs cuisines.', 'اختر مطبخًا أو أكثر')],
    [L(lang, 'Your priorities', 'Vos priorités', 'أولوياتك'), L(lang, 'Budget, goals and energy.', 'Budget, objectifs et énergie.', 'الميزانية والأهداف')],
  ]
  return (
    <div className="rise mx-auto max-w-xl pb-6">
      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-forest to-[#173d2d] p-5 text-cream">
        <div className="zellige pointer-events-none absolute inset-0 opacity-[.07]" aria-hidden />
        <p className="relative text-[11px] font-bold uppercase tracking-[.18em] text-apricot">{L(lang, 'Let’s get to know you', 'Faisons connaissance', 'لنتعارف')} · {i + 1}/4</p>
        <h1 className="relative mt-1 font-serif text-[30px] font-semibold leading-tight text-cream">{steps[i][0]}</h1>
        <p className="relative text-sm text-cream/80">{steps[i][1]}</p>
        <div className="relative mt-4 flex gap-1.5">{steps.map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full transition-all ${k <= i ? 'bg-apricot' : 'bg-white/20'}`} />)}</div>
      </div>
      <div key={i} className="fade-up mt-4 space-y-4">
        {i === 0 && <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">{COUNTRIES.map((c) => <button key={c.id} onClick={() => pickC(c.id)} aria-pressed={cc === c.id} className={`flex flex-col items-center gap-0.5 rounded-2xl p-2 text-[11px] font-bold transition active:scale-95 ${cc === c.id ? 'bg-forest text-white shadow-lift' : 'bg-surface shadow-soft'}`}><span className="text-[28px] leading-none">{c.f}</span><span className="w-full truncate text-center">{cname(c, lang)}</span></button>)}</div>}
        {i === 1 && <>
          <div className="card p-4"><p className="mb-2 text-sm font-bold">{L(lang, 'People', 'Personnes', 'الأشخاص')}</p><div className="grid grid-cols-8 gap-1.5">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <button key={n} onClick={() => setSize(n)} className={`aspect-square rounded-xl text-base font-extrabold ${size === n ? 'bg-forest text-white' : 'bg-cream'}`}>{n}</button>)}</div>
            <p className="mt-2 text-center text-2xl tracking-tight">{'🧑'.repeat(Math.min(size, 8))}</p></div>
          <div className="card p-4"><p className="mb-2 text-sm font-bold">{L(lang, 'Meals to plan', 'Repas à prévoir', 'الوجبات')}</p><div className="grid grid-cols-2 gap-2">{([['b', '🌅'], ['l', '☀️'], ['g', '🍪'], ['d', '🌙']] as [Meal, string][]).map(([m, e]) => <button key={m} onClick={() => setMeals(tog(meals, m))} aria-pressed={meals.includes(m)} className={`flex items-center gap-2 rounded-2xl p-3 text-sm font-bold ${meals.includes(m) ? 'bg-leaf/30 text-forest ring-2 ring-forest' : 'bg-cream'}`}><span className="text-xl">{e}</span>{t(m, lang)}{meals.includes(m) && <Check size={16} className="ms-auto" aria-hidden />}</button>)}</div></div>
        </>}
        {i === 2 && <>
          <div className="grid grid-cols-3 gap-2">{CUIS.map((c) => <button key={c} onClick={() => setCu(tog(cu, c))} aria-pressed={cu.includes(c)} className={`relative flex flex-col items-center gap-1 rounded-2xl p-3 text-xs font-bold transition active:scale-95 ${cu.includes(c) ? 'bg-forest text-white shadow-lift' : 'bg-surface shadow-soft'}`}><span className="text-3xl leading-none">{FLAG[c]}</span>{c === 'hint' ? 'Healthy' : t('c_' + c, lang)}{cu.includes(c) && <Check size={14} className="absolute end-2 top-2" aria-hidden />}</button>)}</div>
          <button onClick={() => setVeg(!veg)} aria-pressed={veg} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-start text-sm font-bold ${veg ? 'bg-leaf/30 text-forest ring-2 ring-forest' : 'bg-surface shadow-soft'}`}><span className="text-xl">🥕</span>{L(lang, 'Vegetarian', 'Végétarien', 'نباتي')}<span className="ms-auto text-xs font-normal text-muted">{L(lang, 'no meat, no fish', 'ni viande ni poisson', 'بدون لحم')}</span></button>
          {!cu.length && <p className="text-center text-xs text-muted">{L(lang, 'Nothing picked: we start with', 'Rien de choisi : on part de la cuisine', 'لا شيء: نبدأ بمطبخ')} {FLAG[countryOf(cc).cuisine]} {t('c_' + countryOf(cc).cuisine, lang)}</p>}
        </>}
        {i === 3 && <>
          <div className="grid grid-cols-2 gap-2">{([['cheap', '💰'], ['quick', '⚡'], ['healthy', '🥗'], ['varied', '🎨']] as [string, string][]).map(([g, e]) => <button key={g} onClick={() => setGoals(tog(goals, g))} aria-pressed={goals.includes(g)} className={`flex items-center gap-2 rounded-2xl p-3 text-sm font-bold ${goals.includes(g) ? 'bg-leaf/30 text-forest ring-2 ring-forest' : 'bg-surface shadow-soft'}`}><span className="text-xl">{e}</span>{t('g_' + g, lang)}</button>)}</div>
          <div className="card p-4"><p className="flex items-baseline justify-between text-sm font-bold">{L(lang, 'Weekly grocery budget', 'Budget courses par semaine', 'الميزانية الأسبوعية')}<b className="font-display text-xl text-forest tabular-nums">{money(budget, lang)}</b></p><input type="range" min={200} max={3000} step={50} value={budget} onChange={(e) => setBudget(+e.target.value)} className="mt-2 w-full accent-[#245B43]" aria-label="Budget" /></div>
          <div className="grid grid-cols-3 gap-2">{KCAL.map(([k, e, l]) => <button key={k} onClick={() => setKcal(k)} className={`rounded-2xl p-2.5 text-center text-xs font-bold ${kcal === k ? 'bg-forest text-white' : 'bg-surface shadow-soft'}`}><span className="block text-2xl">{e}</span>{l} · {k} kcal</button>)}</div>
        </>}
      </div>
      <div className="mt-5 flex gap-2">
        {i > 0 ? <button className="btn btn-soft !min-h-14 !px-5" onClick={() => setI(i - 1)} aria-label={t('back', lang)}><ArrowLeft size={20} aria-hidden /></button> : <button className="btn btn-soft !min-h-14 !px-5 text-sm" onClick={() => { patchMe({ known: true }); onDone() }}>{L(lang, 'Later', 'Plus tard', 'لاحقًا')}</button>}
        {i < 3 ? <button className="btn btn-primary flex-1 !min-h-14 text-base" onClick={() => setI(i + 1)}>{L(lang, 'Next', 'Suivant', 'التالي')} <ArrowRight size={20} aria-hidden /></button>
          : <button className="btn btn-primary flex-1 !min-h-14 text-base" onClick={finish}>✨ {L(lang, 'My tailored week', 'Ma semaine sur mesure', 'أسبوعي على المقاس')}</button>}
      </div>
    </div>
  )
}
