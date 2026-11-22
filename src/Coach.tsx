import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pause, Play, X } from 'lucide-react'
import type { Lang } from './lib/i18n'

/** Animated coach: a drawn athlete (side view) acts out each exercise, driven by requestAnimationFrame (no React re-render per frame). */
type Pose = { t: number; a1: number; e1: number; a2: number; e2: number; h1: number; k1: number; h2: number; k2: number; lift?: number }
// angles in degrees, 0 = pointing down, 90 = pointing forward (right), 180 = up. t: torso (hip→shoulder), a: upper arm, e: forearm, h: thigh, k: shin.
const UP: Pose = { t: 180, a1: 8, e1: 12, a2: -6, e2: 4, h1: 4, k1: 0, h2: -4, k2: -2 }
type Kind = 'squat' | 'lunge' | 'hinge' | 'press' | 'row' | 'curl' | 'plank' | 'pushup' | 'run' | 'walk' | 'bike' | 'rope' | 'box' | 'yoga' | 'bridge' | 'calf' | 'jump' | 'stretch'
const POSES: Record<Kind, [Pose, Pose, number]> = {
  squat: [{ ...UP, a1: 80, e1: 90, a2: 80, e2: 90 }, { t: 140, a1: 95, e1: 95, a2: 95, e2: 95, h1: 85, k1: -25, h2: 85, k2: -25 }, 2.2],
  jump: [{ t: 150, a1: -30, e1: -20, a2: -30, e2: -20, h1: 70, k1: -30, h2: 70, k2: -30 }, { ...UP, a1: 170, e1: 175, a2: 170, e2: 175, lift: 30 }, 1.1],
  lunge: [UP, { t: 175, a1: 5, e1: 10, a2: -5, e2: 0, h1: 85, k1: -5, h2: -35, k2: -95 }, 2.4],
  hinge: [{ ...UP }, { t: 100, a1: 2, e1: 2, a2: -2, e2: -2, h1: 12, k1: -6, h2: 10, k2: -6 }, 2.4],
  press: [{ ...UP, a1: 150, e1: 30, a2: 150, e2: 30 }, { ...UP, a1: 178, e1: 180, a2: 176, e2: 178 }, 1.8],
  row: [{ t: 115, a1: 2, e1: 2, a2: 0, e2: 0, h1: 15, k1: -10, h2: 15, k2: -10 }, { t: 115, a1: -60, e1: 20, a2: -58, e2: 18, h1: 15, k1: -10, h2: 15, k2: -10 }, 1.8],
  curl: [UP, { ...UP, a1: 10, e1: 165, a2: 6, e2: 160 }, 1.6],
  plank: [{ t: 97, a1: 0, e1: 90, a2: 0, e2: 90, h1: -83, k1: -83, h2: -84, k2: -84 }, { t: 99, a1: 0, e1: 90, a2: 0, e2: 90, h1: -82, k1: -82, h2: -83, k2: -83 }, 2.6],
  pushup: [{ t: 100, a1: 0, e1: 0, a2: 0, e2: 0, h1: -80, k1: -80, h2: -81, k2: -81 }, { t: 94, a1: -50, e1: 40, a2: -50, e2: 40, h1: -86, k1: -86, h2: -87, k2: -87 }, 1.8],
  run: [{ t: 170, a1: 50, e1: 140, a2: -40, e2: 60, h1: 45, k1: -30, h2: -30, k2: -90 }, { t: 170, a1: -40, e1: 60, a2: 50, e2: 140, h1: -30, k1: -90, h2: 45, k2: -30 }, 0.7],
  walk: [{ t: 178, a1: 25, e1: 40, a2: -20, e2: -10, h1: 22, k1: 5, h2: -18, k2: -30 }, { t: 178, a1: -20, e1: -10, a2: 25, e2: 40, h1: -18, k1: -30, h2: 22, k2: 5 }, 1.1],
  bike: [{ t: 140, a1: 70, e1: 80, a2: 70, e2: 80, h1: 95, k1: 10, h2: 50, k2: -40 }, { t: 140, a1: 70, e1: 80, a2: 70, e2: 80, h1: 50, k1: -40, h2: 95, k2: 10 }, 0.9],
  rope: [{ ...UP, a1: 25, e1: 70, a2: 25, e2: 70, lift: 0 }, { ...UP, a1: 25, e1: 70, a2: 25, e2: 70, h1: 8, k1: -10, h2: 0, k2: -10, lift: 14 }, 0.45],
  box: [{ t: 172, a1: 140, e1: 205, a2: 150, e2: 215, h1: 20, k1: 5, h2: -20, k2: -25 }, { t: 168, a1: 92, e1: 92, a2: 150, e2: 215, h1: 20, k1: 5, h2: -20, k2: -25 }, 0.7],
  yoga: [{ ...UP, a1: 178, e1: 180, a2: 176, e2: 180 }, { t: 25, a1: 0, e1: 0, a2: 0, e2: 0, h1: 2, k1: 0, h2: -2, k2: 0 }, 3.2],
  stretch: [{ ...UP, a1: 178, e1: 180, a2: 176, e2: 180 }, { t: 160, a1: 160, e1: 165, a2: 158, e2: 162, h1: 4, k1: 0, h2: -4, k2: 0 }, 3],
  bridge: [{ t: -95, a1: -90, e1: -90, a2: -92, e2: -92, h1: 120, k1: 0, h2: 118, k2: 0 }, { t: -70, a1: -90, e1: -90, a2: -92, e2: -92, h1: 140, k1: 0, h2: 138, k2: 0 }, 2],
  calf: [UP, { ...UP, lift: 10 }, 1.4],
}
export const kindOfEx = (n: string): Kind => {
  const s = n.toLowerCase()
  return /squat|presse|chaise/.test(s) ? 'squat' : /saut|burpee|jump/.test(s) ? 'jump' : /fente|lunge|step-up/.test(s) ? 'lunge' : /soulevé|deadlift|rdl|hinge/.test(s) ? 'hinge'
    : /militaire|élévation|press/.test(s) && !/couché/.test(s) ? 'press' : /pompe|couché|incliné|push/.test(s) ? 'pushup' : /rowing|tirage|traction|row|pull/.test(s) ? 'row' : /curl|triceps/.test(s) ? 'curl'
      : /gainage|planche|plank|superman/.test(s) ? 'plank' : /pont|hip thrust|bridge/.test(s) ? 'bridge' : /mollet|calf/.test(s) ? 'calf' : /corde|rope/.test(s) ? 'rope'
        : /shadow|sac|round|frappe|box/.test(s) ? 'box' : /vélo|bike|nage|swim/.test(s) ? 'bike' : /course|footing|fractionn|sprint|sortie longue|run/.test(s) ? 'run'
          : /marche|walk|pas\b|10 000/.test(s) ? 'walk' : /salutation|yoga|posture|guerrier|équilibre/.test(s) ? 'yoga' : /étirement|mobilité|relax|respiration|retour au calme|échauffement/.test(s) ? 'stretch' : 'squat'
}
const TIP: Record<Kind, [string, string]> = {
  squat: ['Heels down, chest up, knees follow the toes', 'Talons au sol, poitrine haute, genoux dans l’axe des pieds'], jump: ['Land softly, knees bent', 'Atterris en douceur, genoux fléchis'],
  lunge: ['Back knee close to the floor, torso straight', 'Genou arrière près du sol, buste droit'], hinge: ['Flat back, push the hips back', 'Dos plat, pousse les fesses en arrière'],
  press: ['Squeeze the glutes, do not arch', 'Serre les fessiers, ne cambre pas'], row: ['Pull the elbow to the hip', 'Tire le coude vers la hanche'], curl: ['Elbows still, slow on the way down', 'Coudes fixes, descente lente'],
  plank: ['Straight line head to heels, breathe', 'Ligne droite de la tête aux talons, respire'], pushup: ['Body rigid, chest to the floor', 'Corps gainé, poitrine vers le sol'],
  run: ['Relaxed shoulders, short steps', 'Épaules relâchées, petites foulées'], walk: ['Brisk pace, swing your arms', 'Pas rapide, balance les bras'], bike: ['Steady cadence, back relaxed', 'Cadence régulière, dos relâché'],
  rope: ['Small jumps on the balls of the feet', 'Petits sauts sur l’avant du pied'], box: ['Guard up, breathe out on each punch', 'Garde haute, souffle à chaque coup'], yoga: ['Move with your breath', 'Bouge au rythme de ta respiration'],
  stretch: ['Hold 20–30 s, never force', 'Tiens 20 à 30 s, sans forcer'], bridge: ['Push through the heels, squeeze at the top', 'Pousse dans les talons, serre en haut'], calf: ['Rise high, lower slowly', 'Monte haut, redescends lentement'],
}
const V = (d: number, len: number): [number, number] => { const r = (d * Math.PI) / 180; return [Math.sin(r) * len, Math.cos(r) * len] }
const lerp = (a: Pose, b: Pose, k: number): Pose => Object.fromEntries(Object.keys(UP).concat('lift').map((key) => [key, ((a as never)[key] ?? 0) + (((b as never)[key] ?? 0) - ((a as never)[key] ?? 0)) * k])) as Pose

export function Athlete({ kind, paused, onRep }: { kind: Kind; paused?: boolean; onRep?: () => void }) {
  const ref = useRef<SVGSVGElement>(null); const pRef = useRef(paused); pRef.current = paused
  useEffect(() => {
    const [A, B, T] = POSES[kind]; let raf = 0; let t0 = performance.now(); let acc = 0; let last = t0; let lastRep = 0
    const svg = ref.current; if (!svg) return
    const q = (id: string) => svg.querySelector(`#${id}`) as SVGElement
    const parts = ['torso', 'head', 'ua1', 'fa1', 'ua2', 'fa2', 'th1', 'sh1', 'th2', 'sh2', 'shadow'].map(q)
    const frame = (now: number) => {
      const dt = now - last; last = now; if (!pRef.current) acc += dt
      const ph = (acc / 1000) / T; const k = (1 - Math.cos(ph * 2 * Math.PI)) / 2 // smooth 0→1→0
      const rep = Math.floor(ph + 0.5); if (rep > lastRep) { lastRep = rep; onRep?.() }
      const P = lerp(A, B, kind === 'run' || kind === 'walk' || kind === 'bike' ? (Math.sin(ph * 2 * Math.PI) + 1) / 2 : k)
      const hip: [number, number] = [0, 0]
      const sh = V(P.t, 52).map((v, i) => v + hip[i]) as [number, number]
      const hd = V(P.t, 70).map((v, i) => v + hip[i]) as [number, number]
      const arm = (a: number, e: number) => { const el = V(a, 30); const ha = V(e, 28); return [sh, [sh[0] + el[0], sh[1] + el[1]], [sh[0] + el[0] + ha[0], sh[1] + el[1] + ha[1]]] as [number, number][] }
      const leg = (h: number, kn: number) => { const k1 = V(h, 38); const f = V(kn, 38); return [hip, [k1[0], k1[1]], [k1[0] + f[0], k1[1] + f[1]]] as [number, number][] }
      const A1 = arm(P.a1, P.e1), A2 = arm(P.a2, P.e2), L1 = leg(P.h1, P.k1), L2 = leg(P.h2, P.k2)
      const pts = [...A1, ...A2, ...L1, ...L2, hd]
      const ground = 182; const low = Math.max(...[L1[2], L2[2], A1[2], A2[2]].map((p) => p[1]))
      const xs = pts.map((p) => p[0]); const cx = (Math.min(...xs) + Math.max(...xs)) / 2
      const oy = (kind === 'bike' ? 128 : ground - low) - (P.lift ?? 0); const ox = 110 - cx
      const tr = (p: [number, number]) => `${(p[0] + ox).toFixed(1)},${(p[1] + oy).toFixed(1)}`
      const line = (el: SVGElement, a: [number, number], b: [number, number]) => el.setAttribute('points', `${tr(a)} ${tr(b)}`)
      line(parts[0], hip, sh); parts[1].setAttribute('transform', `translate(${tr(hd)})`)
      line(parts[2], A1[0], A1[1]); line(parts[3], A1[1], A1[2]); line(parts[4], A2[0], A2[1]); line(parts[5], A2[1], A2[2])
      line(parts[6], L1[0], L1[1]); line(parts[7], L1[1], L1[2]); line(parts[8], L2[0], L2[1]); line(parts[9], L2[1], L2[2])
      parts[10].setAttribute('rx', String(34 - (P.lift ?? 0) * 0.5))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf)
  }, [kind]) // eslint-disable-line react-hooks/exhaustive-deps
  const limb = (id: string, c: string, w: number) => <polyline id={id} points="0,0 0,0" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
  return (
    <svg ref={ref} viewBox="0 0 220 200" className="mx-auto block w-full max-w-[300px]" aria-hidden>
      <defs><linearGradient id="mat" x1="0" x2="1"><stop offset="0" stopColor="#245B43" /><stop offset="1" stopColor="#2f7d5b" /></linearGradient></defs>
      <rect x="10" y="182" width="200" height="8" rx="4" fill="url(#mat)" opacity=".9" />
      <ellipse id="shadow" cx="110" cy="186" rx="34" ry="4" fill="#000" opacity=".25" />
      {kind === 'bike' && <g stroke="#9aa6b0" strokeWidth="4" fill="none"><circle cx="70" cy="160" r="22" /><circle cx="160" cy="160" r="22" /><path d="M70 160 L105 132 L150 132 L160 160 M105 132 L118 160" /></g>}
      {kind === 'rope' && <ellipse className="rope-spin" cx="110" cy="110" rx="46" ry="80" stroke="#f2b96b" strokeWidth="2" fill="none" />}
      {limb('ua2', '#1f4d39', 11)}{limb('fa2', '#1f4d39', 10)}{limb('th2', '#22313a', 14)}{limb('sh2', '#22313a', 12)}
      {limb('torso', '#2f7d5b', 22)}
      {limb('th1', '#2c3e4a', 14)}{limb('sh1', '#2c3e4a', 12)}
      <g id="head"><circle r="13" fill="#f3c49b" /><path d="M-13 -2 C-13 -14 13 -16 13 -4 C8 -9 -6 -10 -13 -2Z" fill="#3b2a20" /><circle cx="6" cy="0" r="1.6" fill="#2b1d14" /></g>
      {limb('ua1', '#2f7d5b', 11)}{limb('fa1', '#f3c49b', 9)}
    </svg>)
}

/** Story mode for a session: one exercise per slide, the athlete shows it, reps count up, tap to go on, hold or ⏸ to pause. */
export function WorkoutStory({ title, ex, lang, onClose }: { title: string; ex: [string, string][]; lang: Lang; onClose: () => void }) {
  const [i, setI] = useState(0); const [paused, setPaused] = useState(false); const [reps, setReps] = useState(0)
  const [sec, setSec] = useState(0)
  useEffect(() => { setReps(0); setSec(0) }, [i])
  useEffect(() => { if (paused) return; const id = setInterval(() => setSec((x) => x + 1), 1000); return () => clearInterval(id) }, [paused, i])
  const N = ex.length + 1; const done = i >= ex.length
  const kind = done ? 'stretch' : kindOfEx(ex[i][0]); const timed = !done && /\d+\s*(s|min)\b/.test(ex[i][1])
  return createPortal(
    <div className={`fixed inset-0 z-[80] flex select-none flex-col text-white ${paused ? 'story-paused' : ''}`} style={{ background: 'radial-gradient(120% 70% at 50% 0%, #2f7d5b, #0b1712 70%)' }} role="dialog" aria-label={title}>
      <div className="flex gap-1 px-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>{Array.from({ length: N }, (_, k) => <span key={k} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"><span className={`block h-full rounded-full bg-white transition-all duration-300 ${k <= i ? 'w-full' : 'w-0'}`} /></span>)}</div>
      <div className="flex items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><b className="block truncate">{title}</b><span className="text-[11px] text-white/60">{done ? L2(lang, 'Done!', 'Terminé !') : `${i + 1}/${ex.length}`}</span></span>
        <button className="grid h-9 w-9 place-items-center rounded-full bg-white/15" onClick={() => setPaused(!paused)} aria-label="Pause">{paused ? <Play size={16} /> : <Pause size={16} />}</button>
        <button className="grid h-9 w-9 place-items-center rounded-full bg-white/15" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
      <button className="relative flex flex-1 flex-col justify-center px-6 text-center" onClick={() => (done ? onClose() : setI(i + 1))} aria-label="›">
        <div key={i} className="fade-up">
          <Athlete kind={kind} paused={paused} onRep={() => setReps((r) => r + 1)} />
          {!done ? <>
            <p className="mt-4 font-display text-[26px] font-extrabold leading-tight">{ex[i][0]}</p>
            <p className="mt-1 inline-block rounded-full bg-white px-4 py-1 font-display text-lg font-extrabold text-ink">{ex[i][1]}</p>
            <p className="mt-3 text-sm text-white/75">{TIP[kind][lang === 'en' ? 0 : 1]}</p>
            <p className="mt-4 font-display text-5xl font-extrabold tabular-nums text-apricot">{timed ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : reps}</p>
            <p className="text-[11px] uppercase tracking-[.2em] text-white/50">{timed ? L2(lang, 'time', 'chrono') : L2(lang, 'reps', 'répétitions')}</p>
          </> : <><p className="mt-4 font-display text-3xl font-extrabold">{L2(lang, 'Great job!', 'Bravo, séance terminée !')}</p><p className="mt-1 text-white/70">{L2(lang, 'Drink water and stretch 5 minutes', 'Bois de l’eau et étire-toi 5 minutes')}</p></>}
        </div>
        <span className="mt-6 text-xs text-white/45">{done ? L2(lang, 'tap to close', 'touchez pour fermer') : L2(lang, 'tap for the next exercise', 'touchez pour l’exercice suivant')}</span>
      </button>
    </div>, document.body)
}
const L2 = (l: Lang, en: string, fr: string) => (l === 'en' ? en : fr)
