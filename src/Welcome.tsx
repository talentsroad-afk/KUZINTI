import { zf } from './lib/zgh'
import { E3 } from './E3'
import { Ic } from './Ic'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useApp } from './lib/store'
import { setCurrency, t, type Lang } from './lib/i18n'
import { setStoreCountry } from './lib/stores'
import { COUNTRIES, cname, countryOf } from './lib/countries'
import { ALLERGY, FLAG, type Prefs } from './lib/plan'
import type { Meal } from './data/recipes'
import { HEALTH, nutName, type Health } from './lib/nutri'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : l === 'zgh' ? zf(fr) : fr)
const TOPC = ['MA', 'FR', 'BE', 'ES', 'DZ', 'TN', 'CA']
const CUIS = ['ma', 'fr', 'med', 'it', 'es', 'tr', 'in', 'jp', 'hint']
const KCAL: [number, string, string][] = [[1700, '🏃', 'Perdre'], [2100, '🙂', 'Garder'], [2500, '💪', 'Prendre']]

/** First meeting: four short cards so KUZINTI knows who it cooks for before proposing a single dish. */
export function Welcome({ onDone }: { onDone: (o?: Partial<Prefs>) => void }) {
  const { lang, me, patchMe } = useApp()
  const [i, setI] = useState(0); const [allC, setAllC] = useState(false)
  const [cc, setCc] = useState(me!.country)
  const [size, setSize] = useState(me!.size || 2)
  const [meals, setMeals] = useState<Meal[]>(me!.meals ?? ['b', 'l', 'd'])
  const [cu, setCu] = useState<string[]>(() => me!.known && me!.cuisine ? me!.cuisine.split(',') : [])
  const [veg, setVeg] = useState(me!.diet.includes('vegetarian'))
  const [goals, setGoals] = useState<string[]>((me!.goals ?? []).filter((g) => ['cheap', 'quick', 'healthy', 'varied'].includes(g)))
  const [alg, setAlg] = useState<string[]>(me!.diet.filter((d) => d.startsWith('no-')))
  const [kcal, setKcal] = useState(me!.kcal ?? 2100)
  const [health, setHealth] = useState<Health>((me!.health as Health) ?? 'none')
  const pickC = (id: string) => { setCc(id); setCurrency(id); setStoreCountry(id); patchMe({ country: id, city: countryOf(id).cities?.[0] ?? me!.city }) }
  const tog = <T,>(a: T[], x: T) => (a.includes(x) ? a.filter((y) => y !== x) : [...a, x])
  const finish = () => {
    const cuisine = (cu.length ? cu : [countryOf(cc).cuisine, 'med']).join(','); const diet = [...(veg ? ['vegetarian'] : []), ...alg]
    const o = { cuisine, region: 'all', diet, size, meals, goals, kcal, health }
    patchMe({ ...o, known: true }); onDone(o)
  }
  const steps = [
    [L(lang, 'Where and for whom?', 'Où et pour qui ?', 'أين ولمن؟'), L(lang, 'Country, people and meals of the day.', 'Pays, personnes et repas de la journée.', 'البلد والأشخاص والوجبات')],
    [L(lang, 'What do you love?', 'Qu’aimez-vous manger ?', 'ماذا تحب؟'), L(lang, 'Cuisines, diet and allergies.', 'Cuisines, régime et allergies.', 'المطابخ والحمية والحساسية')],
    [L(lang, 'Your priorities', 'Vos priorités', 'أولوياتك'), L(lang, 'Goals and energy.', 'Objectifs et énergie.', 'الأهداف والطاقة')],
  ]
  return (
    <div className="rise mx-auto max-w-xl pb-6">
      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-forest to-[#173d2d] p-5 text-cream">
        <div className="zellige pointer-events-none absolute inset-0 opacity-[.07]" aria-hidden />
        <p className="relative text-[11px] font-bold uppercase tracking-[.18em] text-apricot">{L(lang, 'Let’s get to know you', 'Faisons connaissance', 'لنتعارف')}{i > 0 ? ` · ${i + 1}/3` : ''}</p>
        <h1 className="relative mt-1 font-serif text-[30px] font-semibold leading-tight text-cream">{steps[i][0]}</h1>
        <p className="relative text-sm text-cream/80">{steps[i][1]}</p>
        <div className={`relative mt-4 flex gap-1.5 ${i === 0 ? 'hidden' : ''}`}>{steps.map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full transition-all ${k <= i ? 'bg-apricot' : 'bg-white/20'}`} />)}</div>
      </div>
      <div key={i} className="fade-up mt-4 space-y-4">
        {i === 0 && <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">{(allC ? COUNTRIES : COUNTRIES.filter((c) => TOPC.includes(c.id) || c.id === cc)).map((c) => <button key={c.id} onClick={() => pickC(c.id)} aria-pressed={cc === c.id} className={`flex flex-col items-center gap-0.5 rounded-2xl p-2 text-[11px] font-bold transition active:scale-95 ${cc === c.id ? 'bg-forest text-white shadow-lift' : 'bg-surface shadow-soft'}`}><span className="text-[28px] leading-none">{c.f}</span><span className="w-full truncate text-center">{cname(c, lang)}</span></button>)}{!allC && <button onClick={() => setAllC(true)} className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-cream p-2 text-[11px] font-bold text-forest active:scale-95"><span className="text-[22px] leading-none"><Ic e="🌍" /> </span>{L(lang, 'Others', 'Autres', 'أخرى')}</button>}</div>}
        {i === 0 && <>
          <div className="card p-4"><p className="mb-2 text-sm font-bold">{L(lang, 'People', 'Personnes', 'الأشخاص')}</p><div className="grid grid-cols-8 gap-1.5">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <button key={n} onClick={() => setSize(n)} className={`aspect-square rounded-xl text-base font-extrabold ${size === n ? 'bg-forest text-white' : 'bg-cream'}`}>{n}</button>)}</div>
            <p className="mt-2 text-center text-2xl tracking-tight">{'🧑'.repeat(Math.min(size, 8))}</p></div>
          <div className="card p-4"><p className="mb-2 text-sm font-bold">{L(lang, 'Meals to plan', 'Repas à prévoir', 'الوجبات')}</p><div className="grid grid-cols-2 gap-2">{([['b', '🌅'], ['l', '☀️'], ['g', '🍪'], ['d', '🌙']] as [Meal, string][]).map(([m, e]) => <button key={m} onClick={() => setMeals(tog(meals, m))} aria-pressed={meals.includes(m)} className={`flex items-center gap-2 rounded-2xl p-3 text-sm font-bold ${meals.includes(m) ? 'bg-leaf/30 text-forest ring-2 ring-forest' : 'bg-cream'}`}><span className="text-xl"><E3 e={e} /></span>{t(m, lang)}{meals.includes(m) && <Check size={16} className="ms-auto" aria-hidden />}</button>)}</div></div>
        </>}
        {i === 1 && <>
          <div className="grid grid-cols-3 gap-2">{CUIS.map((c) => <button key={c} onClick={() => setCu(tog(cu, c))} aria-pressed={cu.includes(c)} className={`relative flex flex-col items-center gap-1 rounded-2xl p-3 text-xs font-bold transition active:scale-95 ${cu.includes(c) ? 'bg-forest text-white shadow-lift' : 'bg-surface shadow-soft'}`}><span className="text-3xl leading-none">{FLAG[c]}</span>{c === 'hint' ? 'Healthy' : t('c_' + c, lang)}{cu.includes(c) && <Check size={14} className="absolute end-2 top-2" aria-hidden />}</button>)}</div>
          <button onClick={() => setVeg(!veg)} aria-pressed={veg} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-start text-sm font-bold ${veg ? 'bg-leaf/30 text-forest ring-2 ring-forest' : 'bg-surface shadow-soft'}`}><span className="text-xl">🥕</span>{L(lang, 'Vegetarian', 'Végétarien', 'نباتي')}<span className="ms-auto text-xs font-normal text-muted">{L(lang, 'no meat, no fish', 'ni viande ni poisson', 'بدون لحم')}</span></button>
          <div><p className="mb-2 text-sm font-bold">{L(lang, 'Allergies or foods to avoid', 'Allergies ou aliments à éviter', 'حساسية أو أطعمة يجب تجنبها')}</p>
            <div className="grid grid-cols-2 gap-2">{ALLERGY.map(([k, e, n]) => <button key={k} onClick={() => setAlg(tog(alg, k))} aria-pressed={alg.includes(k)} className={`flex items-center gap-2 rounded-2xl p-2.5 text-start text-[12.5px] font-bold transition active:scale-95 ${alg.includes(k) ? 'bg-[#e2574c] text-white shadow-lift' : 'bg-surface shadow-soft'}`}><span className={`text-xl ${alg.includes(k) ? 'pop' : ''}`}><E3 e={e} /></span>{n[lang === 'en' ? 0 : lang === 'ar' ? 2 : 1]}</button>)}</div></div>
          {!cu.length && <p className="text-center text-xs text-muted">{L(lang, 'Nothing picked: we mix', 'Rien de choisi : on mélange', 'لا شيء: نمزج')} {FLAG[countryOf(cc).cuisine]} {t('c_' + countryOf(cc).cuisine, lang)} + 🌊 {t('c_med', lang)}</p>}
        </>}
        {i === 2 && <>
          <div className="grid grid-cols-2 gap-2">{([['cheap', '💰'], ['quick', '⚡'], ['healthy', '🥗'], ['varied', '🎨']] as [string, string][]).map(([g, e]) => <button key={g} onClick={() => setGoals(tog(goals, g))} aria-pressed={goals.includes(g)} className={`flex items-center gap-2 rounded-2xl p-3 text-sm font-bold ${goals.includes(g) ? 'bg-leaf/30 text-forest ring-2 ring-forest' : 'bg-surface shadow-soft'}`}><span className="text-xl"><E3 e={e} /></span>{t('g_' + g, lang)}</button>)}</div>
          <div><p className="mb-2 text-sm font-bold">{L(lang, 'Health profile', 'Profil santé', 'الملف الصحي')}</p><div className="grid grid-cols-4 gap-1.5">{(Object.keys(HEALTH) as Health[]).map((h) => <button key={h} onClick={() => setHealth(h)} aria-pressed={health === h} className={`rounded-2xl p-2 text-center text-[11px] font-bold ${health === h ? 'bg-forest text-white' : 'bg-surface shadow-soft'}`}><span className="block text-2xl">{HEALTH[h][0]}</span>{HEALTH[h][lang === 'en' ? 1 : lang === 'ar' ? 3 : 2]}</button>)}</div>
            {health !== 'none' && <p className="mt-1.5 text-xs text-muted">{L(lang, 'Dishes rich in', 'Les plats riches en', 'أطباق غنية بـ')} {HEALTH[health][4].map((n) => nutName(n, lang).toLowerCase()).join(', ')} {L(lang, 'come up more often.', 'reviennent plus souvent.', '')}</p>}</div>
          <div className="grid grid-cols-3 gap-2">{KCAL.map(([k, e, l]) => <button key={k} onClick={() => setKcal(k)} className={`rounded-2xl p-2.5 text-center text-xs font-bold ${kcal === k ? 'bg-forest text-white' : 'bg-surface shadow-soft'}`}><span className="block text-2xl"><E3 e={e} /></span>{l} · {k} kcal</button>)}</div>
        </>}
      </div>
      {i === 0 && <button className="mt-3 w-full text-center text-sm font-semibold text-forest" onClick={() => setI(1)}>{L(lang, 'Refine: cuisines, allergies, health ›', 'Affiner : cuisines, allergies, santé ›', 'تخصيص: المطابخ والحساسية والصحة ›')}</button>}
      <div className="mt-5 flex gap-2">
        {i > 0 ? <button className="btn btn-soft !min-h-14 !px-5" onClick={() => setI(i - 1)} aria-label={t('back', lang)}><ArrowLeft size={20} aria-hidden /></button> : <button className="btn btn-soft !min-h-14 !px-5 text-sm" onClick={() => { patchMe({ known: true }); onDone() }}>{L(lang, 'Later', 'Plus tard', 'لاحقًا')}</button>}
        {i === 0 ? <button className="btn btn-primary flex-1 !min-h-14 text-base" onClick={finish}><Ic e="✨" /> {L(lang, 'My tailored week', 'Ma semaine sur mesure', 'أسبوعي على المقاس')}</button>
          : i < 2 ? <button className="btn btn-primary flex-1 !min-h-14 text-base" onClick={() => setI(i + 1)}>{L(lang, 'Next', 'Suivant', 'التالي')} <ArrowRight size={20} aria-hidden /></button>
          : <button className="btn btn-primary flex-1 !min-h-14 text-base" onClick={finish}><Ic e="✨" /> {L(lang, 'My tailored week', 'Ma semaine sur mesure', 'أسبوعي على المقاس')}</button>}
      </div>
    </div>
  )
}
