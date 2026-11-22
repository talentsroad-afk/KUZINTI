import { zf } from './lib/zgh'
import { E3 } from './E3'
import { HealthPlan } from './Health'
import { GoalJourney, goalPlan, type GoalP } from './Goal'
import { Ic } from './Ic'
import { useApp } from './lib/store'
import type { Lang } from './lib/i18n'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : l === 'zgh' ? zf(fr) : fr)
export type SportProfile = { sex: 'f' | 'm'; age: number; h: number; w: number; sport: string; goal: string; days: number; kcalO?: number; protO?: number; lvl?: 'beg' | 'mid' | 'adv' }
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
  const n0 = needs(p); const n = { ...n0, kcal: p.kcalO ?? n0.kcal, prot: p.protO ?? n0.prot }
  n.carbs = Math.max(0, Math.round((n.kcal - n.prot * 4 - n.fat * 9) / 4))
  const g = GOALS.find((x) => x[0] === p.goal)!
  const weightMsg = p.w < n.lo ? L(lang, `Below the healthy range: aim for ${n.lo} kg, +0.25 kg a week.`, `Sous la zone santé : visez ${n.lo} kg, à +0,25 kg par semaine.`, `أقل من النطاق الصحي`)
    : p.w > n.hi && p.goal !== 'bulk' ? L(lang, `Above the range: ${n.hi} kg is a good target, about −0.5 kg a week.`, `Au-dessus de la zone : ${n.hi} kg est une bonne cible, environ −0,5 kg par semaine.`, `أعلى من النطاق`)
    : L(lang, 'You are in the healthy range. Keep it and work on the muscle.', 'Vous êtes dans la zone santé. Gardez-la et travaillez le muscle.', 'أنت في النطاق الصحي')
  const pct = Math.min(100, Math.max(0, ((p.w - (n.lo - 10)) / (n.hi + 10 - (n.lo - 10))) * 100))
  return (
    <div className="stagger space-y-4 pb-4">
      <GoalJourney p={p as GoalP} set={set as never} lang={lang} lo={n.lo} hi={n.hi} />
      <section className="relative overflow-hidden rounded-[28px] p-4 text-white" style={{ background: 'linear-gradient(140deg,#2f6fa8,#1d3f6e)' }}>
        <span className="zellige pointer-events-none absolute inset-0 opacity-[.07]" aria-hidden />
        <p className="relative text-[11px] font-bold uppercase tracking-[.16em] text-white/70">{L(lang, 'My needs today', 'Mes besoins du jour', 'احتياجاتي اليوم')}</p>
        <div className="relative mt-1 flex items-end gap-3"><span className="float text-5xl" aria-hidden>{SPORTS.find((x) => x[0] === p.sport)?.[1]}</span>
          <div><b className="font-display text-[40px] font-extrabold leading-none tabular-nums">{n.kcal}</b><span className="ms-1 text-sm">kcal</span><p className="text-sm text-white/80">{g[1]} {g[4][lang === 'en' ? 0 : lang === 'ar' ? 2 : 1]}</p></div></div>
        <div className="relative mt-3 grid grid-cols-4 gap-1.5 text-center">{([['🥩', n.prot, 'g', L(lang, 'protein', 'protéines', 'بروتين')], ['🍚', n.carbs, 'g', L(lang, 'carbs', 'glucides', 'نشويات')], ['🥑', n.fat, 'g', L(lang, 'fat', 'lipides', 'دهون')], ['💧', n.water, 'L', L(lang, 'water', 'eau', 'ماء')]] as [string, number, string, string][]).map(([e, v, u, l], i) => (
          <div key={l} className="rounded-2xl bg-white/12 p-2" style={{ background: 'rgba(255,255,255,.12)' }}><span className="float inline-block text-xl" style={{ animationDelay: `${i * 0.35}s` }}><E3 e={e} /></span><b className="block text-[15px] tabular-nums">{v}{u}</b><span className="block text-[10px] text-white/75">{l}</span></div>))}</div>
      </section>

      <HealthPlan wk0={(Math.max(1, goalPlan(p as GoalP, n.lo, n.hi).wk) - 1) % 4} p={p} set={set} lang={lang} kcal={p.kcalO ?? n.kcal} prot={p.protO ?? n.prot} />

      <details className="group rounded-[24px] bg-surface p-4 shadow-soft"><summary className="flex cursor-pointer list-none items-center justify-between font-display font-extrabold">{L(lang, 'My sports profile', 'Mon profil sportif', 'ملفي الرياضي')}<span className="text-sm font-semibold text-muted">{p.w} kg · {p.days}/{L(lang, 'wk', 'sem', 'أسبوع')} <span className="inline-block transition-transform group-open:rotate-90">›</span></span></summary><div className="mt-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[.14em] text-muted">{L(lang, 'My sport', 'Mon sport', 'رياضتي')}</p>
        <div className="grid grid-cols-3 gap-2">{SPORTS.map(([k, e, en, fr, ar]) => { const on = p.sport === k; return <button key={k} className={`flex items-center gap-2 rounded-[16px] p-2 text-start text-[12.5px] font-bold transition-all duration-300 active:scale-95 ${on ? 'bg-[#2f6fa8] text-white shadow-lift' : 'bg-cream/80'}`} onClick={() => set({ sport: k })} aria-pressed={on}><span className={`text-xl ${on ? 'pop' : ''}`}><E3 e={e} /></span><span className="truncate">{L(lang, en, fr, ar)}</span></button> })}</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="col-span-2 flex rounded-full bg-cream p-1">{(['f', 'm'] as const).map((s) => <button key={s} className={`flex-1 rounded-full py-1.5 text-sm font-bold transition ${p.sex === s ? 'bg-forest text-white' : 'text-muted'}`} onClick={() => set({ sex: s })}>{s === 'f' ? L(lang, '👩 Woman', '👩 Femme', '👩 امرأة') : L(lang, '👨 Man', '👨 Homme', '👨 رجل')}</button>)}</div>
          <Num v={p.w} set={(w) => set({ w })} min={35} max={180} unit="kg" label={L(lang, 'Weight', 'Poids', 'الوزن')} />
          <Num v={p.h} set={(h) => set({ h })} min={140} max={215} unit="cm" label={L(lang, 'Height', 'Taille', 'الطول')} />
          <Num v={p.age} set={(age) => set({ age })} min={14} max={90} unit={L(lang, 'yrs', 'ans', 'سنة')} label={L(lang, 'Age', 'Âge', 'العمر')} />
          <Num v={p.days} set={(days) => set({ days })} min={0} max={7} unit={L(lang, '/wk', '/sem', '/أسبوع')} label={L(lang, 'Sessions', 'Séances', 'حصص')} />
        </div>
      </div></details>

      <details className="group rounded-[24px] bg-surface p-4 shadow-soft"><summary className="flex cursor-pointer list-none items-center justify-between font-display font-extrabold">{L(lang, 'Weight & targets', 'Poids et objectifs', 'الوزن والأهداف')}<span className="inline-block text-muted transition-transform group-open:rotate-90">›</span></summary><div className="mt-3 space-y-4">
      <div>
        <div className="flex items-baseline justify-between"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted"><Ic e="⚖️" /> {L(lang, 'Advised weight', 'Poids conseillé', 'الوزن المنصوح')}</p><b className="font-display text-lg tabular-nums text-forest">{n.lo}–{n.hi} kg</b></div>
        <div className="relative mt-3 h-3 rounded-full" style={{ background: 'linear-gradient(90deg,#8fd3ff 0%,#7fc79a 25%,#7fc79a 75%,#ffcf8a 100%)' }}>
          <span className="absolute -top-1.5 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full bg-ink text-[10px] font-bold text-white shadow-lift transition-all duration-500" style={{ left: `${pct}%` }}>{p.w}</span></div>
        <p className="mt-3 text-sm">{weightMsg}</p>
        <p className="mt-1 text-[11px] text-muted">IMC {n.bmi}. {L(lang, 'A muscular body can weigh a bit more: trust the mirror and your waist too.', 'Un corps musclé peut peser un peu plus : fiez-vous aussi au miroir et au tour de taille.', 'الجسم العضلي قد يزن أكثر.')}</p>
      </div>
      <div className="border-t border-line pt-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[.14em] text-muted">🎚️ {L(lang, 'Adjust my targets', 'Ajuster mes objectifs', 'ضبط أهدافي')}</p>
        {([['🔥', L(lang, 'Calories', 'Calories', 'سعرات'), n.kcal, n0.kcal, 1200, 4500, 50, 'kcal', (v?: number) => set({ kcalO: v })], ['🥩', L(lang, 'Protein', 'Protéines', 'بروتين'), n.prot, n0.prot, 40, 260, 5, 'g', (v?: number) => set({ protO: v })]] as [string, string, number, number, number, number, number, string, (v?: number) => void][]).map(([e, l, v, rec, mn, mx, st, u, f]) => (
          <div key={l} className="mb-3">
            <div className="flex items-center gap-2"><span className="text-xl"><E3 e={e} /></span><span className="flex-1 text-sm font-bold">{l}</span>
              <button className="grid h-8 w-8 place-items-center rounded-full bg-cream font-bold active:scale-90" onClick={() => f(Math.max(mn, v - st))} aria-label="−">−</button>
              <b key={v} className="pop w-20 text-center font-display text-lg tabular-nums">{v} <span className="text-[11px] text-muted">{u}</span></b>
              <button className="grid h-8 w-8 place-items-center rounded-full bg-cream font-bold active:scale-90" onClick={() => f(Math.min(mx, v + st))} aria-label="+">+</button></div>
            <input type="range" min={mn} max={mx} step={st} value={v} onChange={(ev) => f(+ev.target.value)} className="mt-1 w-full accent-[#2f6fa8]" aria-label={l} />
            <p className="text-[10.5px] text-muted">{L(lang, 'Advised for you', 'Conseillé pour vous', 'المنصوح')} : {rec} {u}{v !== rec && <button className="ms-2 font-bold text-forest" onClick={() => f(undefined)}>↺ {L(lang, 'reset', 'revenir', 'إرجاع')}</button>}</p>
          </div>))}
      </div>
      </div></details>
    </div>
  )
}
