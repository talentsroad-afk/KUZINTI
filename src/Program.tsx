import { useState } from 'react'
import { Activity, Bike, ChevronDown, Dumbbell, Flame, Footprints, HeartPulse, Moon, StretchHorizontal, Swords, Timer, Trophy, Waves, type LucideIcon } from 'lucide-react'
import type { Lang } from './lib/i18n'
import type { SportProfile } from './Sport'

type Lvl = 'beg' | 'mid' | 'adv'
type Ex = [string, string] // name (fr), dose
type Sess = { t: string; icon: LucideIcon; min: number; hard: 1 | 2 | 3; ex: Ex[] }
const L = (l: Lang, en: string, fr: string) => (l === 'en' ? en : fr)

/** A personal 4-week programme: sport, goal, level, sessions per week and body (low-impact when BMI is high). Week 4 is a lighter recovery week. */
export function buildProgram(p: SportProfile & { lvl?: Lvl }, week: number) {
  const lvl: Lvl = p.lvl ?? 'beg'; const bmi = p.w / (p.h / 100) ** 2; const soft = bmi >= 30 || p.age >= 60
  const cyc = week % 4, blk = Math.floor(week / 4)
  const k = [1, 1.15, 1.3, 0.7][cyc] * (1 + 0.08 * Math.min(blk, 3)) // 4-week blocks: build, build, build, deload; each block starts a bit higher
  const base = { beg: 2, mid: 3, adv: 4 }[lvl]; const sets = (x = 0) => Math.max(2, Math.round((base + x) * (cyc === 3 ? 0.7 : 1)))
  const reps = p.goal === 'bulk' ? '8-10' : p.goal === 'cut' ? '12-15' : '10-12'
  const m = (x: number) => Math.round(x * k / 5) * 5
  const fin: Ex = p.goal === 'cut' ? ['Finisher HIIT 30 s / 30 s', `${lvl === 'beg' ? 6 : 10} tours`] : p.goal === 'perf' ? ['Gainage dynamique', '3 × 45 s'] : ['Étirements', '5 min']
  const cardio = soft ? 'Marche rapide ou vélo' : 'Course'
  const S: Record<string, Sess[]> = {
    gym: [
      { t: 'Full body A', icon: Dumbbell, min: m(45), hard: 2, ex: [[soft ? 'Squat sur chaise' : 'Squat', `${sets()} × ${reps}`], ['Développé couché ou pompes', `${sets()} × ${reps}`], ['Rowing haltère', `${sets()} × ${reps}`], ['Gainage', `3 × ${lvl === 'beg' ? 30 : 45} s`], fin] },
      { t: 'Full body B', icon: Dumbbell, min: m(45), hard: 2, ex: [['Soulevé de terre roumain', `${sets()} × ${reps}`], ['Développé militaire', `${sets()} × ${reps}`], ['Tirage vertical', `${sets()} × ${reps}`], [soft ? 'Step-up bas' : 'Fentes marchées', `${sets(-1)} × 10/jambe`], fin] },
      { t: 'Haut du corps', icon: Dumbbell, min: m(50), hard: 3, ex: [['Développé incliné', `${sets(1)} × ${reps}`], ['Tractions assistées', `${sets()} × max`], ['Élévations latérales', `${sets()} × 15`], ['Curl + extension triceps', `${sets()} × 12`]] },
      { t: 'Bas du corps', icon: Dumbbell, min: m(50), hard: 3, ex: [['Squat ou presse', `${sets(1)} × ${reps}`], ['Hip thrust', `${sets()} × 10`], ['Leg curl', `${sets()} × 12`], ['Mollets', `${sets()} × 15`]] },
    ],
    run: [
      { t: soft ? 'Marche active' : 'Footing facile', icon: Footprints, min: m(soft ? 35 : 30), hard: 1, ex: [[cardio, `${m(soft ? 35 : 30)} min, on peut parler`], ['Étirements', '5 min']] },
      { t: soft ? 'Vélo fractionné doux' : 'Fractionné', icon: Timer, min: m(35), hard: 3, ex: [['Échauffement', '10 min'], [soft ? 'Vélo 1 min fort / 2 min doux' : '1 min vite / 1 min 30 lent', `${lvl === 'beg' ? 6 : lvl === 'mid' ? 8 : 10} fois`], ['Retour au calme', '5 min']] },
      { t: 'Sortie longue', icon: Activity, min: m(lvl === 'beg' ? 40 : lvl === 'mid' ? 60 : 80), hard: 2, ex: [[cardio, `${m(lvl === 'beg' ? 40 : lvl === 'mid' ? 60 : 80)} min tranquille`]] },
      { t: 'Renfo coureur', icon: Dumbbell, min: m(30), hard: 2, ex: [['Squat', `${sets()} × 12`], ['Fentes', `${sets()} × 10/jambe`], ['Gainage', '3 × 40 s'], ['Mollets', `${sets()} × 15`]] },
    ],
    team: [
      { t: 'Technique et jeu', icon: Trophy, min: m(60), hard: 2, ex: [['Échauffement ballon', '10 min'], ['Ateliers technique', '30 min'], ['Petit match', '20 min']] },
      { t: 'Explosivité', icon: Flame, min: m(35), hard: 3, ex: [[soft ? 'Step-up rapide' : 'Sprints 20 m', `${sets(2)} fois`], [soft ? 'Squat' : 'Sauts', `${sets()} × 8`], ['Changements de direction', `${sets()} × 6`]] },
      { t: 'Renfo + gainage', icon: Dumbbell, min: m(35), hard: 2, ex: [['Squat', `${sets()} × 10`], ['Pompes', `${sets()} × max`], ['Gainage', '3 × 45 s'], fin] },
    ],
    fight: [
      { t: 'Technique', icon: Swords, min: m(50), hard: 2, ex: [['Corde à sauter', `${lvl === 'beg' ? 3 : 5} × 2 min`], ['Shadow', '4 × 2 min'], ['Sac de frappe', `${lvl === 'beg' ? 4 : 6} × 2 min`]] },
      { t: 'Cardio combat', icon: HeartPulse, min: m(35), hard: 3, ex: [['Rounds 3 min / 1 min', `${lvl === 'beg' ? 4 : 6} rounds`], ['Burpees', `${sets()} × 10`]] },
      { t: 'Force', icon: Dumbbell, min: m(40), hard: 2, ex: [['Soulevé de terre', `${sets()} × 6`], ['Tractions', `${sets()} × max`], ['Rotations médecine-ball', `${sets()} × 12`]] },
    ],
    bike: [
      { t: 'Endurance', icon: Bike, min: m(60), hard: 1, ex: [['Vélo ou nage tranquille', `${m(60)} min`]] },
      { t: 'Intervalles', icon: Timer, min: m(40), hard: 3, ex: [['Échauffement', '10 min'], ['3 min fort / 2 min facile', `${lvl === 'beg' ? 4 : 6} fois`]] },
      { t: 'Nage technique', icon: Waves, min: m(40), hard: 2, ex: [['Éducatifs', '10 × 50 m'], ['Nage continue', `${m(15)} min`]] },
      { t: 'Gainage', icon: Dumbbell, min: m(25), hard: 2, ex: [['Planche', '3 × 45 s'], ['Pont fessier', `${sets()} × 15`], ['Superman', `${sets()} × 12`]] },
    ],
    yoga: [
      { t: 'Flow énergie', icon: StretchHorizontal, min: m(40), hard: 2, ex: [['Salutations au soleil', `${lvl === 'beg' ? 4 : 8} tours`], ['Postures debout', '15 min'], ['Respiration', '5 min']] },
      { t: 'Yoga force', icon: Dumbbell, min: m(40), hard: 2, ex: [['Chaise, guerrier, planche', '3 tours'], ['Équilibres', '10 min']] },
      { t: 'Mobilité et détente', icon: Moon, min: m(30), hard: 1, ex: [['Étirements profonds', '20 min'], ['Relaxation', '10 min']] },
    ],
  }
  const sport = p.goal === 'perf' ? 'run' : p.sport // an endurance goal means running sessions
  let pool = S[sport] ?? S.gym
  if (sport === 'gym' && p.days <= 3) pool = pool.slice(0, 2)
  if (sport === 'gym' && p.days >= 4) pool = [pool[2], pool[3], pool[0], pool[1]]
  const n = Math.max(1, Math.min(6, p.days))
  const extra: Sess = { t: p.goal === 'cut' ? 'Cardio brûle-graisse' : 'Récupération active', icon: p.goal === 'cut' ? Flame : Footprints, min: m(30), hard: 1, ex: [[cardio + (p.goal === 'cut' ? ' zone 2' : ' léger'), `${m(30)} min`], ['10 000 pas dans la journée', 'objectif']] }
  const sess = Array.from({ length: n }, (_, i) => i < pool.length ? pool[i] : i % 2 ? extra : pool[i % pool.length])
  // spread sessions over 7 days with rest in between
  const SPREAD: Record<number, number[]> = { 1: [2], 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] }
  const days: (Sess | null)[] = Array(7).fill(null); SPREAD[n].forEach((d, i) => { days[d] = sess[i] })
  return { days, soft, bmi }
}

export function Program({ p, set, lang }: { p: SportProfile & { lvl?: Lvl }; set: (o: Partial<SportProfile & { lvl?: Lvl }>) => void; lang: Lang }) {
  const [w, setW] = useState(0); const [open, setOpen] = useState<number | null>(null)
  const { days, soft } = buildProgram(p, w)
  const DN = lang === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const tot = days.reduce((a, d) => a + (d?.min ?? 0), 0)
  return (
    <section className="rounded-[24px] bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">{L(lang, 'My programme', 'Mon programme')}</p><span className="text-xs font-semibold text-muted">{days.filter(Boolean).length} {L(lang, 'sessions', 'séances')} · {tot} min</span></div>
      <div className="mt-3 flex rounded-full bg-cream p-1">{(['beg', 'mid', 'adv'] as Lvl[]).map((l) => <button key={l} onClick={() => set({ lvl: l })} className={`flex-1 rounded-full py-1.5 text-sm font-bold transition ${(p.lvl ?? 'beg') === l ? 'bg-forest text-white shadow-soft' : 'text-muted'}`}>{{ beg: L(lang, 'Beginner', 'Débutant'), mid: L(lang, 'Intermediate', 'Intermédiaire'), adv: L(lang, 'Advanced', 'Confirmé') }[l]}</button>)}</div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">{[0, 1, 2, 3].map((i) => <button key={i} onClick={() => { setW(i); setOpen(null) }} className={`rounded-2xl py-2 text-center transition active:scale-95 ${w === i ? 'bg-ink text-white' : 'bg-cream'}`}><b className="block text-sm">{L(lang, 'Wk', 'S')}{i + 1}</b><span className={`text-[10px] ${w === i ? 'text-white/70' : 'text-muted'}`}>{i === 3 ? L(lang, 'recovery', 'récup') : i === 0 ? L(lang, 'base', 'base') : `+${i * 15} %`}</span></button>)}</div>
      {soft && <p className="mt-2 rounded-xl bg-leaf/20 px-3 py-2 text-xs text-forest">{L(lang, 'Low-impact version: easy on the joints.', 'Version douce pour les articulations : sans sauts ni course au début.')}</p>}
      <div key={w} className="stagger mt-3 space-y-1.5">{days.map((d, i) => d ? (
        <div key={i} className="overflow-hidden rounded-2xl border border-line">
          <button className="flex w-full items-center gap-3 px-3 py-2.5 text-start active:bg-cream" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
            <span className="w-8 text-[11px] font-extrabold uppercase text-muted">{DN[i]}</span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: ['#25a35a', '#e0a526', '#e5484d'][d.hard - 1] }}><d.icon size={18} strokeWidth={2.2} aria-hidden /></span>
            <span className="min-w-0 flex-1"><b className="block truncate text-[14.5px]">{d.t}</b><span className="text-xs text-muted">{d.min} min · {'●'.repeat(d.hard)}{'○'.repeat(3 - d.hard)}</span></span>
            <ChevronDown size={18} className={`text-muted transition-transform ${open === i ? 'rotate-180' : ''}`} aria-hidden /></button>
          {open === i && <ul className="fade-up space-y-1 border-t border-line bg-cream/50 px-4 py-2.5">{d.ex.map(([n, dose], j) => <li key={j} className="flex justify-between gap-3 text-sm"><span>{n}</span><b className="shrink-0 tabular-nums text-forest">{dose}</b></li>)}</ul>}
        </div>) : <div key={i} className="flex items-center gap-3 px-3 py-1.5 text-muted"><span className="w-8 text-[11px] font-extrabold uppercase">{DN[i]}</span><Moon size={15} aria-hidden /><span className="text-xs">{L(lang, 'Rest', 'Repos')}</span></div>)}</div>
    </section>)
}
