import { zf } from './lib/zgh'
import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { rname, type Lang } from './lib/i18n'
import { RECIPES, type Meal, type Recipe } from './data/recipes'
import { kcalPerServing, protPerServing } from './lib/engine'
import { inCuisine } from './lib/plan'
import { Dish } from './ui'
import { RecipeSheet } from './Screens'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : l === 'zgh' ? zf(fr) : fr)
export type SportProfile = { sex: 'f' | 'm'; age: number; h: number; w: number; sport: string; goal: string; days: number }
const DEF: SportProfile = { sex: 'm', age: 30, h: 175, w: 75, sport: 'gym', goal: 'fit', days: 3 }

const SPORTS: [string, string, string, string, string][] = [
  ['gym', '🏋️', 'Weights', 'Muscu', 'كمال الأجسام'], ['run', '🏃', 'Running', 'Course', 'جري'], ['team', '⚽', 'Team', 'Collectif', 'جماعية'],
  ['fight', '🥊', 'Combat', 'Combat', 'قتال'], ['bike', '🚴', 'Bike/swim', 'Vélo, nage', 'دراجة / سباحة'], ['yoga', '🧘', 'Yoga', 'Yoga', 'يوغا'],
]
// goal: kcal delta, protein g/kg, label, short explanation
const GOALS: [string, string, number, number, [string, string, string], [string, string, string]][] = [
  ['bulk', '💪', 300, 1.9, ['Build muscle', 'Prendre du muscle', 'بناء العضلات'], ['A small surplus and lots of protein', 'Un léger surplus et beaucoup de protéines', 'فائض بسيط وبروتين كثير']],
  ['cut', '🔥', -400, 2.1, ['Lose fat', 'Perdre du gras', 'خسارة الدهون'], ['A deficit that keeps the muscle', 'Un déficit qui garde le muscle', 'عجز يحافظ على العضلات']],
  ['fit', '⚖️', 0, 1.5, ['Stay in shape', 'Garder la forme', 'الحفاظ على اللياقة'], ['Balanced, steady energy', 'Équilibré, énergie stable', 'متوازن']],
  ['perf', '⚡', 150, 1.6, ['Endurance', 'Endurance', 'التحمل'], ['More carbs for long efforts', 'Plus de glucides pour les longs efforts', 'نشويات أكثر']],
]
const SLOTS: [Meal, string, [string, string, string], number][] = [
  ['b', '🌅', ['Breakfast', 'Petit-déjeuner', 'الفطور'], 0.25], ['l', '☀️', ['Lunch', 'Déjeuner', 'الغداء'], 0.35], ['g', '🥤', ['Snack (after training)', 'Collation (après l’entraînement)', 'وجبة خفيفة'], 0.1], ['d', '🌙', ['Dinner', 'Dîner', 'العشاء'], 0.3],
]

/** Daily needs from Mifflin-St Jeor, activity from sessions per week, adjusted for the goal. */
export function needs(p: SportProfile) {
  const bmr = 10 * p.w + 6.25 * p.h - 5 * p.age + (p.sex === 'm' ? 5 : -161)
  const act = [1.2, 1.3, 1.375, 1.45, 1.55, 1.6, 1.7, 1.8][Math.min(7, p.days)]
  const g = GOALS.find((x) => x[0] === p.goal) ?? GOALS[2]
  const kcal = Math.round((bmr * act + g[2]) / 10) * 10
  const prot = Math.round(p.w * g[3]); const fat = Math.round(p.w * (p.goal === 'cut' ? 0.8 : 0.9))
  const carbs = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4))
  const water = Math.round((p.w * 0.035 + p.days * 0.07) * 10) / 10
  const m = p.h / 100; const lo = Math.round(18.5 * m * m); const hi = Math.round(24.9 * m * m)
  return { kcal, prot, fat, carbs, water, lo, hi, bmi: Math.round((p.w / (m * m)) * 10) / 10 }
}

function Num({ v, set, min, max, step = 1, unit, label }: { v: number; set: (n: number) => void; min: number; max: number; step?: number; unit: string; label: string }) {
  return <div className="rounded-2xl bg-cream/80 p-2 text-center">
    <p className="text-[10.5px] font-bold uppercase text-muted">{label}</p>
    <div className="flex items-center justify-between"><button className="grid h-8 w-8 place-items-center rounded-full bg-surface text-lg font-bold shadow-soft active:scale-90" onClick={() => set(Math.max(min, v - step))} aria-label="−">−</button>
      <b key={v} className="pop font-display text-lg tabular-nums">{v}<span className="text-[11px] font-semibold text-muted"> {unit}</span></b>
      <button className="grid h-8 w-8 place-items-center rounded-full bg-surface text-lg font-bold shadow-soft active:scale-90" onClick={() => set(Math.min(max, v + step))} aria-label="+">+</button></div>
  </div>
}

/** Sport space: pick a sport and a goal, see the daily needs and the meals that fit. */
export function SportTab({ apply }: { apply: (kcal: number) => void }) {
  const { lang, me, patchMe } = useApp()
  const p: SportProfile = { ...DEF, ...((me as unknown as { sport?: SportProfile }).sport ?? {}) }
  const set = (o: Partial<SportProfile>) => patchMe({ sport: { ...p, ...o } } as never)
  const n = needs(p)
  const [rv, setRv] = useState<Recipe | null>(null); const [shift, setShift] = useState(0)
  const cuisine = me!.cuisine ?? 'ma'
  // Meals of the day: for each slot, the dish closest to the slot's kcal share with the best protein density.
  const day = useMemo(() => SLOTS.map(([s, e, lab, share], i) => {
    const target = n.kcal * share
    const pool = RECIPES.filter((r) => r.m.includes(s) && (inCuisine(r, cuisine) || s === 'g')).map((r) => ({ r, k: kcalPerServing(r.id), pr: protPerServing(r.id) }))
      .filter((x) => x.k > 0).sort((a, b) => (Math.abs(a.k - target) / target - (a.pr / a.k) * (p.goal === 'bulk' || p.goal === 'cut' ? 3 : 1.5)) - (Math.abs(b.k - target) / target - (b.pr / b.k) * (p.goal === 'bulk' || p.goal === 'cut' ? 3 : 1.5)))
    const x = pool[(shift + i) % Math.max(1, Math.min(4, pool.length))]
    return { s, e, lab, target, x }
  }), [n.kcal, cuisine, shift, p.goal])
  const tk = day.reduce((a, d) => a + (d.x?.k ?? 0), 0); const tp = day.reduce((a, d) => a + (d.x?.pr ?? 0), 0)
  const g = GOALS.find((x) => x[0] === p.goal)!
  const BAR: [string, string, number, number, string, string][] = [
    ['🔥', L(lang, 'Calories', 'Calories', 'سعرات'), tk, n.kcal, 'kcal', '#ee9b45'], ['🥩', L(lang, 'Protein', 'Protéines', 'بروتين'), tp, n.prot, 'g', '#e2574c'],
  ]
  const weightMsg = p.w < n.lo ? L(lang, `Below the healthy range: aim for ${n.lo} kg, +0.25 kg a week.`, `Sous la zone santé : visez ${n.lo} kg, à +0,25 kg par semaine.`, `أقل من النطاق الصحي`)
    : p.w > n.hi && p.goal !== 'bulk' ? L(lang, `Above the range: ${n.hi} kg is a good target, about −0.5 kg a week.`, `Au-dessus de la zone : ${n.hi} kg est une bonne cible, environ −0,5 kg par semaine.`, `أعلى من النطاق`)
    : L(lang, 'You are in the healthy range. Keep it and work on the muscle.', 'Vous êtes dans la zone santé. Gardez-la et travaillez le muscle.', 'أنت في النطاق الصحي')
  const pct = Math.min(100, Math.max(0, ((p.w - (n.lo - 10)) / (n.hi + 10 - (n.lo - 10))) * 100))
  return (
    <div className="stagger space-y-4 pb-4">
      <section className="relative overflow-hidden rounded-[28px] p-4 text-white" style={{ background: 'linear-gradient(140deg,#2f6fa8,#1d3f6e)' }}>
        <span className="zellige pointer-events-none absolute inset-0 opacity-[.07]" aria-hidden />
        <p className="relative text-[11px] font-bold uppercase tracking-[.16em] text-white/70">{L(lang, 'My needs today', 'Mes besoins du jour', 'احتياجاتي اليوم')}</p>
        <div className="relative mt-1 flex items-end gap-3"><span className="float text-5xl" aria-hidden>{SPORTS.find((x) => x[0] === p.sport)?.[1]}</span>
          <div><b className="font-display text-[40px] font-extrabold leading-none tabular-nums">{n.kcal}</b><span className="ms-1 text-sm">kcal</span><p className="text-sm text-white/80">{g[1]} {g[4][lang === 'en' ? 0 : lang === 'ar' ? 2 : 1]}</p></div></div>
        <div className="relative mt-3 grid grid-cols-4 gap-1.5 text-center">{([['🥩', n.prot, 'g', L(lang, 'protein', 'protéines', 'بروتين')], ['🍚', n.carbs, 'g', L(lang, 'carbs', 'glucides', 'نشويات')], ['🥑', n.fat, 'g', L(lang, 'fat', 'lipides', 'دهون')], ['💧', n.water, 'L', L(lang, 'water', 'eau', 'ماء')]] as [string, number, string, string][]).map(([e, v, u, l], i) => (
          <div key={l} className="rounded-2xl bg-white/12 p-2" style={{ background: 'rgba(255,255,255,.12)' }}><span className="float inline-block text-xl" style={{ animationDelay: `${i * 0.35}s` }}>{e}</span><b className="block text-[15px] tabular-nums">{v}{u}</b><span className="block text-[10px] text-white/75">{l}</span></div>))}</div>
      </section>

      <section className="rounded-[24px] bg-surface p-4 shadow-soft">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[.14em] text-muted">{L(lang, 'My sport', 'Mon sport', 'رياضتي')}</p>
        <div className="grid grid-cols-3 gap-2">{SPORTS.map(([k, e, en, fr, ar]) => { const on = p.sport === k; return <button key={k} className={`flex items-center gap-2 rounded-[16px] p-2 text-start text-[12.5px] font-bold transition-all duration-300 active:scale-95 ${on ? 'bg-[#2f6fa8] text-white shadow-lift' : 'bg-cream/80'}`} onClick={() => set({ sport: k })} aria-pressed={on}><span className={`text-xl ${on ? 'pop' : ''}`}>{e}</span><span className="truncate">{L(lang, en, fr, ar)}</span></button> })}</div>
        <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[.14em] text-muted">{L(lang, 'My goal', 'Mon objectif', 'هدفي')}</p>
        <div className="grid grid-cols-2 gap-2">{GOALS.map(([k, e, , , t, d]) => { const on = p.goal === k; const li = lang === 'en' ? 0 : lang === 'ar' ? 2 : 1; return <button key={k} className={`rounded-[18px] p-2.5 text-start transition-all duration-300 active:scale-95 ${on ? 'bg-forest text-white shadow-lift' : 'bg-cream/80'}`} onClick={() => set({ goal: k })} aria-pressed={on}><span className={`text-2xl ${on ? 'pop inline-block' : ''}`}>{e}</span><b className="block text-[13.5px]">{t[li]}</b><span className={`block text-[11px] leading-tight ${on ? 'text-white/80' : 'text-muted'}`}>{d[li]}</span></button> })}</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="col-span-2 flex rounded-full bg-cream p-1">{(['f', 'm'] as const).map((s) => <button key={s} className={`flex-1 rounded-full py-1.5 text-sm font-bold transition ${p.sex === s ? 'bg-forest text-white' : 'text-muted'}`} onClick={() => set({ sex: s })}>{s === 'f' ? L(lang, '👩 Woman', '👩 Femme', '👩 امرأة') : L(lang, '👨 Man', '👨 Homme', '👨 رجل')}</button>)}</div>
          <Num v={p.w} set={(w) => set({ w })} min={35} max={180} unit="kg" label={L(lang, 'Weight', 'Poids', 'الوزن')} />
          <Num v={p.h} set={(h) => set({ h })} min={140} max={215} unit="cm" label={L(lang, 'Height', 'Taille', 'الطول')} />
          <Num v={p.age} set={(age) => set({ age })} min={14} max={90} unit={L(lang, 'yrs', 'ans', 'سنة')} label={L(lang, 'Age', 'Âge', 'العمر')} />
          <Num v={p.days} set={(days) => set({ days })} min={0} max={7} unit={L(lang, '/wk', '/sem', '/أسبوع')} label={L(lang, 'Sessions', 'Séances', 'حصص')} />
        </div>
      </section>

      <section className="rounded-[24px] bg-surface p-4 shadow-soft">
        <div className="flex items-baseline justify-between"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">⚖️ {L(lang, 'Advised weight', 'Poids conseillé', 'الوزن المنصوح')}</p><b className="font-display text-lg tabular-nums text-forest">{n.lo}–{n.hi} kg</b></div>
        <div className="relative mt-3 h-3 rounded-full" style={{ background: 'linear-gradient(90deg,#8fd3ff 0%,#7fc79a 25%,#7fc79a 75%,#ffcf8a 100%)' }}>
          <span className="absolute -top-1.5 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full bg-ink text-[10px] font-bold text-white shadow-lift transition-all duration-500" style={{ left: `${pct}%` }}>{p.w}</span></div>
        <p className="mt-3 text-sm">{weightMsg}</p>
        <p className="mt-1 text-[11px] text-muted">IMC {n.bmi}. {L(lang, 'A muscular body can weigh a bit more: trust the mirror and your waist too.', 'Un corps musclé peut peser un peu plus : fiez-vous aussi au miroir et au tour de taille.', 'الجسم العضلي قد يزن أكثر.')}</p>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold">{L(lang, 'My meals today', 'Mes repas du jour', 'وجباتي اليوم')}</h2><button className="text-sm font-bold text-forest" onClick={() => setShift(shift + 1)}>🎲 {L(lang, 'Others', 'Autres', 'أخرى')}</button></div>
        <div className="mb-3 space-y-2 rounded-[20px] bg-surface p-3 shadow-soft">{BAR.map(([e, l, v, t, u, c]) => <div key={l}>
          <div className="flex items-baseline justify-between text-xs"><span className="font-bold">{e} {l}</span><span className="tabular-nums"><b>{Math.round(v)}</b> / {t} {u}</span></div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-cream"><span className="block h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (v / t) * 100)}%`, background: c }} /></div></div>)}
          {tp < n.prot * 0.85 && <p className="text-[11.5px] text-muted">💡 {L(lang, `Add ${Math.round(n.prot - tp)} g of protein: 2 eggs (12 g), a yogurt (4 g), a can of tuna (25 g) or a glass of milk (8 g).`, `Ajoutez ${Math.round(n.prot - tp)} g de protéines : 2 œufs (12 g), un yaourt (4 g), une boîte de thon (25 g) ou un verre de lait (8 g).`, `أضف ${Math.round(n.prot - tp)} غ بروتين`)}</p>}
        </div>
        <div className="space-y-2">{day.map(({ s, e, lab, target, x }) => x && (
          <button key={s} className="flex w-full items-center gap-3 rounded-[20px] bg-surface p-2.5 text-start shadow-soft active:scale-[.98]" onClick={() => setRv(x.r)}>
            <Dish r={x.r} w={200} className="h-16 w-16 shrink-0 rounded-2xl" />
            <span className="min-w-0 flex-1"><span className="block text-[10.5px] font-bold uppercase tracking-wide text-muted">{e} {lab[lang === 'en' ? 0 : lang === 'ar' ? 2 : 1]} · {L(lang, 'target', 'cible', 'الهدف')} {Math.round(target)} kcal</span>
              <span className="block truncate font-semibold">{rname(x.r.n, lang)}</span>
              <span className="mt-0.5 flex gap-1.5 text-[11px] font-bold"><span className="rounded-full bg-apricot/30 px-2 py-0.5">🔥 {Math.round(x.k)}</span><span className="rounded-full bg-[#e2574c]/15 px-2 py-0.5">🥩 {Math.round(x.pr)} g</span></span></span>
          </button>))}</div>
        <div className="mt-3 rounded-[20px] bg-cream/80 p-3 text-[12px] leading-relaxed">
          <p>⏱️ <b>{L(lang, 'Before training', 'Avant la séance', 'قبل التمرين')}</b> · {L(lang, 'banana, dates or bread with honey, 1 h before', 'banane, dattes ou pain au miel, 1 h avant', 'موز أو تمر قبل ساعة')}</p>
          <p>🔁 <b>{L(lang, 'After', 'Après', 'بعد')}</b> · {L(lang, 'protein within 2 h: eggs, yogurt, tuna, chicken', 'des protéines dans les 2 h : œufs, yaourt, thon, poulet', 'بروتين خلال ساعتين')}</p>
          <p>💧 <b>{n.water} L</b> {L(lang, 'of water a day, more on training days', 'd’eau par jour, plus les jours d’entraînement', 'ماء يوميا')}</p>
        </div>
        <button className="btn btn-primary mt-3 w-full !min-h-14" onClick={() => apply(n.kcal)}>✨ {L(lang, `Apply ${n.kcal} kcal to my week`, `Appliquer ${n.kcal} kcal à ma semaine`, `تطبيق ${n.kcal} على أسبوعي`)}</button>
        <p className="mt-2 text-center text-[10.5px] text-muted">{L(lang, 'Estimates for healthy adults. Pregnancy, illness or a competition: ask a doctor or a coach.', 'Estimations pour adultes en bonne santé. Grossesse, maladie ou compétition : demandez l’avis d’un médecin ou d’un coach.', 'تقديرات للبالغين الأصحاء.')}</p>
      </section>
      {rv && <RecipeSheet r={rv} onClose={() => setRv(null)} />}
    </div>
  )
}
