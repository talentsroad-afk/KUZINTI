import { useState } from 'react'
import { CalendarDays, Check, Pencil, Scale, Trophy } from 'lucide-react'
import { E3 } from './E3'
import type { SportProfile } from './Sport'
import type { Lang } from './lib/i18n'

/** Goal journey: pick an objective and a target, see how long it takes, the phases with dates, and weigh in each week. */
export type GoalP = SportProfile & { tw?: number; race?: string; st?: string; w0?: number; log?: [string, number][] }
const T = (l: Lang, en: string, fr: string) => (l === 'en' ? en : fr)
const GO: [string, string, string, string][] = [['cut', '🔥', 'Lose fat', 'Perdre du gras'], ['bulk', '💪', 'Build muscle', 'Prendre du muscle'], ['perf', '⚡', 'Endurance', 'Endurance'], ['fit', '⚖️', 'Stay in shape', 'Garder la forme']]
const RACES: [string, string, number][] = [['5k', '5 km', 8], ['10k', '10 km', 12], ['21k', 'Semi 21 km', 16]]
const DAY = 86400000
const iso = (d: Date) => d.toISOString().slice(0, 10)

export function goalPlan(p: GoalP, lo: number, hi: number) {
  const w0 = p.st ? p.w0 ?? p.w : p.w
  const r1 = (x: number) => Math.round(x * 2) / 2
  let tw = 0, rate = 0, weeks = 12
  if (p.goal === 'cut') { tw = Math.max(lo, p.tw ?? Math.max(lo, r1(w0 > hi ? hi : w0 - 4))); rate = w0 - tw > 15 ? 0.7 : 0.5; weeks = Math.max(4, Math.ceil((w0 - tw) / rate)) }
  else if (p.goal === 'bulk') { tw = p.tw ?? r1(w0 + 4); rate = p.lvl === 'adv' ? 0.15 : 0.25; weeks = Math.max(4, Math.ceil((tw - w0) / rate)) }
  else if (p.goal === 'perf') { const r = RACES.find((x) => x[0] === (p.race ?? '10k'))!; weeks = r[2] + (p.lvl === 'adv' ? -4 : p.lvl === 'mid' ? 0 : 4) }
  const start = p.st ? new Date(p.st) : new Date(); const end = new Date(+start + weeks * 7 * DAY)
  const wk = p.st ? Math.min(weeks, Math.floor((Date.now() - +start) / (7 * DAY)) + 1) : 0
  const byW = tw && w0 !== tw ? Math.min(1, Math.max(0, (w0 - p.w) / (w0 - tw))) : 0
  const pct = Math.round(100 * (tw ? byW : wk / weeks))
  // three phases: base 30%, progression 40%, peak 30%
  const cuts = [Math.max(1, Math.round(weeks * 0.3)), Math.max(2, Math.round(weeks * 0.7)), weeks]
  return { w0, tw, rate, weeks, start, end, wk, pct, cuts }
}

export function GoalJourney({ p, set, lang, lo, hi }: { p: GoalP; set: (o: Partial<GoalP>) => void; lang: Lang; lo: number; hi: number }) {
  const [weigh, setWeigh] = useState<number | null>(null)
  const g = goalPlan(p, lo, hi); const go = GO.find((x) => x[0] === p.goal) ?? GO[3]
  const fmt = (d: Date) => d.toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'long' })
  const race = RACES.find((x) => x[0] === (p.race ?? '10k'))!
  const what = p.goal === 'cut' ? T(lang, `Lose ${(g.w0 - g.tw).toFixed(1).replace('.0', '')} kg → ${g.tw} kg`, `Perdre ${(g.w0 - g.tw).toFixed(1).replace('.0', '').replace('.', ',')} kg → ${String(g.tw).replace('.', ',')} kg`)
    : p.goal === 'bulk' ? T(lang, `Gain ${(g.tw - g.w0).toFixed(1).replace('.0', '')} kg of muscle → ${g.tw} kg`, `Prendre ${(g.tw - g.w0).toFixed(1).replace('.0', '').replace('.', ',')} kg de muscle → ${String(g.tw).replace('.', ',')} kg`)
      : p.goal === 'perf' ? T(lang, `Run ${race[1]} without stopping`, `Courir ${race[1]} sans m’arrêter`) : T(lang, 'Train 3× a week for good', 'M’entraîner 3 fois par semaine, durablement')
  const at = (k: number) => (g.tw ? Math.round((g.w0 + ((g.tw - g.w0) * g.cuts[k]) / g.weeks) * 2) / 2 : 0)
  const PH: [string, string][] = p.goal === 'cut' ? [[T(lang, 'Base: habits', 'Base : habitudes'), T(lang, `Reach ${at(0)} kg. about −550 kcal, protein at each meal, 8,000 steps`, `Atteindre ${at(0)} kg. environ −550 kcal, protéines à chaque repas, 8 000 pas`)], [T(lang, 'Progression', 'Progression'), T(lang, `Reach ${at(1)} kg. Heavier weights, +1 cardio session`, `Atteindre ${at(1)} kg. Charges plus lourdes, +1 séance cardio`)], [T(lang, 'Final push', 'Dernière ligne droite'), T(lang, `Reach ${g.tw} kg and keep the muscle`, `Atteindre ${g.tw} kg en gardant le muscle`)]]
    : p.goal === 'bulk' ? [[T(lang, 'Base: technique', 'Base : technique'), T(lang, `Reach ${at(0)} kg. Learn the big lifts, +300 kcal`, `Atteindre ${at(0)} kg. Apprendre les mouvements, +300 kcal`)], [T(lang, 'Progressive overload', 'Surcharge progressive'), T(lang, `Reach ${at(1)} kg. +2.5 kg on the bar every week`, `Atteindre ${at(1)} kg. +2,5 kg sur la barre chaque semaine`)], [T(lang, 'Peak', 'Pic'), T(lang, `Reach ${g.tw} kg, beat your records`, `Atteindre ${g.tw} kg, battre ses records`)]]
      : p.goal === 'perf' ? [[T(lang, 'Base', 'Base'), T(lang, 'Run 30 min non-stop, easy pace', 'Courir 30 min sans arrêt, allure facile')], [T(lang, 'Build-up', 'Montée en charge'), T(lang, `Run ${Math.round(parseInt(race[1]) * 0.7)} km, one interval session a week`, `Courir ${Math.round(parseInt(race[1]) * 0.7)} km, 1 séance de fractionné par semaine`)], [T(lang, 'Race ready', 'Prêt pour la course'), T(lang, `${race[1]} at your target pace`, `${race[1]} à votre allure cible`)]]
        : [[T(lang, 'Start', 'Démarrage'), T(lang, '3 sessions a week, kept', '3 séances par semaine tenues')], [T(lang, 'Progress', 'Progrès'), T(lang, '+20% reps, better sleep', '+20 % de répétitions, meilleur sommeil')], [T(lang, 'Habit', 'Habitude'), T(lang, 'Training is part of your week', 'Le sport fait partie de la semaine')]]
  const startW = [1, g.cuts[0] + 1, g.cuts[1] + 1]
  const cur = g.wk ? (g.wk <= g.cuts[0] ? 0 : g.wk <= g.cuts[1] ? 1 : 2) : -1
  const log = p.log ?? []
  const choose = (o: Partial<GoalP>) => set({ ...o, tw: undefined })

  if (!p.st) return (
    <section className="rounded-[24px] bg-surface p-4 shadow-soft">
      <p className="text-[12px] font-bold uppercase tracking-[.14em] text-muted">{T(lang, 'Step 1 · My goal', 'Étape 1 · Mon objectif')}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">{GO.map(([k, e, en, fr]) => <button key={k} onClick={() => choose({ goal: k })} className={`flex items-center gap-2 rounded-[16px] p-2.5 text-start text-[13px] font-bold transition-all active:scale-95 ${p.goal === k ? 'bg-forest text-white shadow-lift' : 'bg-cream'}`}><span className="text-2xl"><E3 e={e} /></span>{T(lang, en, fr)}</button>)}</div>
      <p className="mt-4 text-[12px] font-bold uppercase tracking-[.14em] text-muted">{T(lang, 'Step 2 · My target', 'Étape 2 · Ma cible')}</p>
      {p.goal === 'cut' || p.goal === 'bulk' ? <div className="mt-2 flex items-center justify-between rounded-2xl bg-cream p-2">
        <span className="ps-1 text-sm text-muted">{T(lang, `Now ${p.w} kg · target`, `Aujourd’hui ${p.w} kg · cible`)}</span>
        <span className="flex items-center gap-2"><button className="grid h-9 w-9 place-items-center rounded-full bg-surface text-lg font-bold shadow-soft active:scale-90" onClick={() => set({ tw: Math.max(p.goal === 'cut' ? lo : 35, g.tw - 0.5) })} aria-label="−">−</button>
          <b key={g.tw} className="pop w-16 text-center font-display text-xl tabular-nums">{g.tw}<span className="text-xs text-muted"> kg</span></b>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-surface text-lg font-bold shadow-soft active:scale-90" onClick={() => set({ tw: Math.min(180, g.tw + 0.5) })} aria-label="+">+</button></span></div>
        : p.goal === 'perf' ? <div className="mt-2 flex gap-2">{RACES.map(([k, l]) => <button key={k} onClick={() => set({ race: k })} className={`flex-1 rounded-full py-2 text-sm font-bold ${race[0] === k ? 'bg-ink text-white' : 'bg-cream text-muted'}`}>{l}</button>)}</div>
          : <p className="mt-2 rounded-2xl bg-cream p-3 text-sm">{what}</p>}
      <div className="mt-4 rounded-[20px] p-4 text-white" style={{ background: 'linear-gradient(140deg,#245B43,#173d2c)' }}>
        <p className="text-[12px] font-bold uppercase tracking-[.14em] text-white/60">{T(lang, 'Step 3 · My plan', 'Étape 3 · Mon plan')}</p>
        <p className="mt-1 font-display text-[22px] font-extrabold leading-tight">{what}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80"><CalendarDays size={15} /> {T(lang, `${g.weeks} weeks · by ${fmt(g.end)}`, `${g.weeks} semaines · objectif le ${fmt(g.end)}`)}</p>
        {g.rate > 0 && <p className="text-xs text-white/60">{T(lang, `At a healthy pace of ${g.rate} kg per week`, `À un rythme sain de ${String(g.rate).replace('.', ',')} kg par semaine`)}</p>}
        <button className="mt-3 w-full rounded-full bg-apricot py-3 font-display font-extrabold text-ink shadow-lift active:scale-95" onClick={() => set({ st: iso(new Date()), w0: p.w, log: [[iso(new Date()), p.w]] })}>{T(lang, 'Start my plan', 'Lancer mon plan')}</button>
      </div>
    </section>)

  const R = 30, C = 2 * Math.PI * R
  const ws = log.map((x) => x[1]); const mn = Math.min(...ws, g.tw || p.w) - 1, mx = Math.max(...ws, g.tw || p.w) + 1
  return (
    <section className="overflow-hidden rounded-[24px] bg-surface shadow-soft">
      <div className="relative p-4 text-white" style={{ background: 'linear-gradient(140deg,#245B43,#173d2c)' }}>
        <button className="absolute end-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/15" onClick={() => set({ st: undefined })} aria-label={T(lang, 'Change goal', 'Changer d’objectif')}><Pencil size={14} /></button>
        <p className="text-[12px] font-bold uppercase tracking-[.14em] text-white/60">{T(lang, 'My goal', 'Mon objectif')}</p>
        <div className="mt-1 flex items-center gap-3">
          <svg viewBox="0 0 76 76" className="h-[76px] w-[76px] shrink-0 -rotate-90"><circle cx="38" cy="38" r={R} stroke="rgba(255,255,255,.15)" strokeWidth="8" fill="none" /><circle cx="38" cy="38" r={R} stroke="#F2B96B" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - g.pct / 100)} style={{ transition: 'stroke-dashoffset 1s' }} /><text x="38" y="44" transform="rotate(90 38 38)" textAnchor="middle" fill="#fff" fontSize="17" fontWeight="800">{g.pct}%</text></svg>
          <div className="min-w-0 pe-6"><p className="font-display text-[19px] font-extrabold leading-tight"><span className="me-1"><E3 e={go[1]} /></span>{what}</p>
            <p className="mt-1 text-[13px] text-white/80">{T(lang, `Week ${g.wk} of ${g.weeks} · by ${fmt(g.end)}`, `Semaine ${g.wk} sur ${g.weeks} · fin le ${fmt(g.end)}`)}</p></div>
        </div>
        {log.length > 1 && g.tw > 0 && <svg viewBox="0 0 300 50" className="mt-3 h-12 w-full" preserveAspectRatio="none" aria-hidden>
          <line x1="0" x2="300" y1={50 - ((g.tw - mn) / (mx - mn)) * 50} y2={50 - ((g.tw - mn) / (mx - mn)) * 50} stroke="#F2B96B" strokeDasharray="4 4" />
          <polyline fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" points={log.map(([, w], i) => `${(i / (log.length - 1)) * 300},${50 - ((w - mn) / (mx - mn)) * 50}`).join(' ')} /></svg>}
        {weigh === null ? <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 font-display font-extrabold text-forest active:scale-95" onClick={() => setWeigh(p.w)}><Scale size={17} /> {T(lang, 'Weekly weigh-in', 'Pesée de la semaine')}</button>
          : <div className="mt-3 flex items-center gap-2 rounded-full bg-white p-1 text-ink">
            <button className="grid h-9 w-9 place-items-center rounded-full bg-cream text-lg font-bold" onClick={() => setWeigh(Math.round((weigh - 0.1) * 10) / 10)} aria-label="−">−</button>
            <b className="flex-1 text-center font-display text-xl tabular-nums">{weigh.toFixed(1)} kg</b>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-cream text-lg font-bold" onClick={() => setWeigh(Math.round((weigh + 0.1) * 10) / 10)} aria-label="+">+</button>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-forest text-white" onClick={() => { set({ w: weigh, log: [...log.filter((x) => x[0] !== iso(new Date())), [iso(new Date()), weigh]] }); setWeigh(null) }} aria-label="OK"><Check size={18} /></button></div>}
      </div>
      <ol className="p-4">{PH.map(([t, d], k) => {
        const done = k < cur, on = k === cur
        return <li key={k} className="relative flex gap-3 pb-4 last:pb-0">
          {k < 2 && <span className={`absolute start-[13px] top-7 h-[calc(100%-20px)] w-0.5 ${done ? 'bg-forest' : 'bg-line'}`} />}
          <span className={`relative z-[1] grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${done ? 'bg-forest text-white' : on ? 'bg-apricot text-ink ring-4 ring-apricot/30' : 'bg-cream text-muted'}`}>{done ? <Check size={14} /> : k + 1}</span>
          <div className="min-w-0"><p className="text-[12px] font-bold uppercase tracking-wider text-muted">{T(lang, `Weeks ${startW[k]}–${g.cuts[k]}`, `Semaines ${startW[k]} à ${g.cuts[k]}`)} · {fmt(new Date(+g.start + g.cuts[k] * 7 * DAY))}</p>
            <p className={`font-display font-extrabold ${on ? 'text-forest' : ''}`}>{t}{on && <span className="ms-2 rounded-full bg-apricot/30 px-2 py-0.5 text-[12px] font-bold text-ink">{T(lang, 'now', 'en cours')}</span>}</p>
            <p className="text-[13px] text-muted">{d}</p></div></li>
      })}
        <li className="flex items-center gap-3 pt-1"><span className="grid h-7 w-7 place-items-center rounded-full bg-apricot text-ink"><Trophy size={14} /></span><b className="text-sm">{T(lang, `Goal reached on ${fmt(g.end)}`, `Objectif atteint le ${fmt(g.end)}`)}</b></li></ol>
    </section>)
}
