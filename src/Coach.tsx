import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pause, Play, X } from 'lucide-react'
import type { Lang } from './lib/i18n'

/** Animated coach: a drawn athlete (side view) acts out each exercise, driven by requestAnimationFrame (no React re-render per frame). */
type Pose = { t: number; a1: number; e1: number; a2: number; e2: number; h1: number; k1: number; h2: number; k2: number; lift?: number }
// angles in degrees, 0 = pointing down, 90 = pointing forward (right), 180 = up. t: torso (hip→shoulder), a: upper arm, e: forearm, h: thigh, k: shin.
const UP: Pose = { t: 180, a1: 8, e1: 12, a2: -6, e2: 4, h1: 4, k1: 0, h2: -4, k2: -2 }
type Kind = 'squat' | 'lunge' | 'hinge' | 'press' | 'row' | 'curl' | 'plank' | 'pushup' | 'run' | 'walk' | 'bike' | 'rope' | 'box' | 'yoga' | 'bridge' | 'calf' | 'jump' | 'stretch' | 'swim' | 'kick' | 'burpee' | 'mountain' | 'crunch' | 'warrior' | 'tree' | 'sun' | 'sprint' | 'agility' | 'raise'
const POSES: Partial<Record<Kind, [Pose, Pose, number]>> = {
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
  yoga: [{ ...UP, a1: 178, e1: 180, a2: 176, e2: 180 }, { t: 25, a1: 0, e1: 0, a2: 0, e2: 0, h1: 2, k1: 0, h2: -2, k2: 0 }, 3.2],
  stretch: [{ ...UP, a1: 178, e1: 180, a2: 176, e2: 180 }, { t: 160, a1: 160, e1: 165, a2: 158, e2: 162, h1: 4, k1: 0, h2: -4, k2: 0 }, 3],
  bridge: [{ t: -95, a1: -90, e1: -90, a2: -92, e2: -92, h1: 120, k1: 0, h2: 118, k2: 0 }, { t: -70, a1: -90, e1: -90, a2: -92, e2: -92, h1: 140, k1: 0, h2: 138, k2: 0 }, 2],
  calf: [UP, { ...UP, lift: 10 }, 1.4],
  sprint: [{ t: 158, a1: 62, e1: 120, a2: -58, e2: 40, h1: 62, k1: -20, h2: -42, k2: -102 }, { t: 158, a1: -58, e1: 40, a2: 62, e2: 120, h1: -42, k1: -102, h2: 62, k2: -20 }, 0.5],
  agility: [{ t: 155, a1: 50, e1: 120, a2: 30, e2: 110, h1: 55, k1: -35, h2: 50, k2: -30 }, { t: 158, a1: 30, e1: 100, a2: 55, e2: 125, h1: 35, k1: -50, h2: 60, k2: -20, lift: 10 }, 0.5],
  raise: [UP, { ...UP, a1: 92, e1: 92, a2: 90, e2: 90 }, 2],
  mountain: [{ t: 97, a1: 0, e1: 0, a2: 0, e2: 0, h1: -83, k1: -83, h2: 48, k2: -45 }, { t: 97, a1: 0, e1: 0, a2: 0, e2: 0, h1: 48, k1: -45, h2: -83, k2: -83 }, 0.9],
  crunch: [{ t: -95, a1: -110, e1: -40, a2: -108, e2: -38, h1: 120, k1: 0, h2: 118, k2: 0 }, { t: -138, a1: -150, e1: -80, a2: -148, e2: -78, h1: 120, k1: 0, h2: 118, k2: 0 }, 1.8],
  warrior: [{ ...UP, a1: 178, e1: 180, a2: 176, e2: 180, h1: 8, k1: 0, h2: -8, k2: -5 }, { t: 180, a1: 178, e1: 180, a2: 176, e2: 180, h1: 80, k1: 2, h2: -58, k2: -60 }, 3.6],
  tree: [{ ...UP, a1: 55, e1: 150, a2: 60, e2: 155 }, { ...UP, a1: 178, e1: 180, a2: 176, e2: 180, h1: 2, k1: 0, h2: 75, k2: -25 }, 4.6],
}
const P = (o: Partial<Pose>): Pose => ({ ...UP, ...o })
const seqPose = (fr: Pose[], ph: number) => { const n = fr.length; const x = (((ph % 1) + 1) % 1) * n; const i = Math.floor(x); const u = x - i; return lerp(fr[i], fr[(i + 1) % n], (1 - Math.cos(u * Math.PI)) / 2) }
const G = P({ t: 172, a1: 55, e1: 165, a2: 75, e2: 175, h1: 22, k1: 8, h2: -22, k2: -25 })
const PLANK = P({ t: 100, a1: 0, e1: 0, a2: 0, e2: 0, h1: -80, k1: -80, h2: -81, k2: -81 })
const CROUCH = P({ t: 115, a1: 20, e1: 0, a2: 15, e2: 0, h1: 100, k1: -10, h2: 100, k2: -10 })
const FOLD = P({ t: 25, a1: 0, e1: 0, a2: 0, e2: 0, h1: 2, k1: 0, h2: -2, k2: 0 })
const ARMSUP = P({ a1: 178, e1: 180, a2: 176, e2: 180 })
const KS = P({ t: 182, a1: -30, e1: -10, a2: 50, e2: 60, h1: 4, k1: 0, h2: -4, k2: -2 })
/** Choreographed exercises: keyframe loops or functions of the phase (0..1) plus the loop duration in seconds. */
const ANIM: Partial<Record<Kind, [(ph: number) => Pose, number]>> = {
  box: [(ph) => seqPose([G, P({ ...G, t: 166, a1: 92, e1: 92, h1: 30 }), G, P({ ...G, t: 160, a2: 92, e2: 92, a1: 60, e1: 170, h1: 14, h2: -32 })], ph), 1.6],
  kick: [(ph) => seqPose([KS, P({ ...KS, t: 176, a1: -40, e1: -30, a2: 60, e2: 70, h2: -30, k2: -100 }), P({ ...KS, t: 196, a1: -50, e1: -60, a2: 110, e2: 100, h2: 80, k2: 84 }), KS], ph), 2.2],
  burpee: [(ph) => seqPose([P({}), CROUCH, PLANK, CROUCH, P({ ...ARMSUP, lift: 30, h1: 6, k1: -6, h2: -4, k2: -10 })], ph), 3.2],
  sun: [(ph) => seqPose([ARMSUP, FOLD, PLANK, P({ t: 140, a1: 5, e1: 0, a2: 5, e2: 0, h1: -88, k1: -88, h2: -89, k2: -89 }), PLANK, FOLD], ph), 7],
  swim: [(ph) => { const a = 90 - ph * 360; const fl = Math.sin(ph * 2 * Math.PI * 6); return P({ t: 88, a1: a, e1: a - 16, a2: a + 180, e2: a + 164, h1: -86 + 7 * fl, k1: -86 + 16 * Math.sin(ph * 12 * Math.PI - 1), h2: -86 - 7 * fl, k2: -86 - 16 * Math.sin(ph * 12 * Math.PI - 1) }) }, 2.4],
}
const FIXY: Partial<Record<Kind, number>> = { bike: 126, swim: 106 }
export const kindOfEx = (n: string): Kind => {
  const s = n.toLowerCase(); const m = (r: RegExp) => r.test(s)
  if (m(/guerrier|postures debout/)) return 'warrior'
  if (m(/équilibre|arbre/)) return 'tree'
  if (m(/salutation|yoga/)) return 'sun'
  if (m(/burpee|hiit|finisher/)) return 'burpee'
  if (m(/dynamique|mountain|grimpeur/)) return 'mountain'
  if (m(/leg curl|ischio/)) return 'bridge'
  if (m(/rotation|crunch|abdo/)) return 'crunch'
  if (m(/élévation/)) return 'raise'
  if (m(/échauffement ballon|petit match/)) return 'run'
  if (m(/atelier|penalty|coup de pied|kick|tir\b/)) return 'kick'
  if (m(/changements? de direction|appuis/)) return 'agility'
  if (m(/sprint/)) return 'sprint'
  if (m(/vélo|bike/)) return 'bike'
  if (m(/nage|swim|crawl|éducatifs/)) return 'swim'
  return m(/squat|presse|chaise/) ? 'squat' : m(/saut|jump/) ? 'jump' : m(/fente|lunge|step-up/) ? 'lunge' : m(/soulevé|deadlift|rdl|hinge/) ? 'hinge'
    : m(/militaire|press/) && !m(/couché/) ? 'press' : m(/pompe|couché|incliné|push/) ? 'pushup' : m(/rowing|tirage|traction|row|pull/) ? 'row' : m(/curl|triceps/) ? 'curl'
      : m(/gainage|planche|plank|superman/) ? 'plank' : m(/pont|hip thrust|bridge/) ? 'bridge' : m(/mollet|calf/) ? 'calf' : m(/corde|rope/) ? 'rope'
        : m(/shadow|sac|round|frappe|box|jab|direct/) ? 'box' : m(/course|footing|fractionn|sortie longue|run/) ? 'run'
          : m(/marche|walk|pas\b|10 000/) ? 'walk' : m(/posture/) ? 'yoga' : m(/étirement|mobilité|relax|respiration|retour au calme|échauffement/) ? 'stretch' : 'squat'
}
const TIP: Record<Kind, [string, string]> = {
  squat: ['Heels down, chest up, knees follow the toes', 'Talons au sol, poitrine haute, genoux dans l’axe des pieds'], jump: ['Land softly, knees bent', 'Atterris en douceur, genoux fléchis'],
  lunge: ['Back knee close to the floor, torso straight', 'Genou arrière près du sol, buste droit'], hinge: ['Flat back, push the hips back', 'Dos plat, pousse les fesses en arrière'],
  press: ['Squeeze the glutes, do not arch', 'Serre les fessiers, ne cambre pas'], row: ['Pull the elbow to the hip', 'Tire le coude vers la hanche'], curl: ['Elbows still, slow on the way down', 'Coudes fixes, descente lente'],
  plank: ['Straight line head to heels, breathe', 'Ligne droite de la tête aux talons, respire'], pushup: ['Body rigid, chest to the floor', 'Corps gainé, poitrine vers le sol'],
  run: ['Relaxed shoulders, short steps', 'Épaules relâchées, petites foulées'], walk: ['Brisk pace, swing your arms', 'Pas rapide, balance les bras'], bike: ['Steady cadence, back relaxed', 'Cadence régulière, dos relâché'],
  rope: ['Small jumps on the balls of the feet', 'Petits sauts sur l’avant du pied'], box: ['Guard up, breathe out on each punch', 'Garde haute, souffle à chaque coup'], yoga: ['Move with your breath', 'Bouge au rythme de ta respiration'],
  swim: ['Long strokes, exhale in the water', 'Grandes brasses, souffle dans l’eau'], kick: ['Plant the foot, swing the hip through', 'Pied d’appui planté, la hanche accompagne la frappe'],
  burpee: ['Chest to the floor, explode up', 'Poitrine au sol, explose vers le haut'], mountain: ['Hips low, drive the knees fast', 'Bassin bas, genoux rapides vers la poitrine'],
  crunch: ['Curl the ribs to the hips, no neck pulling', 'Enroule le buste, ne tire pas sur la nuque'], warrior: ['Front knee over the ankle, arms long', 'Genou avant au-dessus de la cheville, bras longs'],
  tree: ['Eyes on a fixed point, press foot and thigh', 'Regard fixe, pied et cuisse se poussent'], sun: ['One movement per breath', 'Un mouvement par respiration'],
  sprint: ['Drive the arms, stay tall and fast', 'Bras puissants, buste haut, foulée rapide'], agility: ['Low stance, quick light feet', 'Position basse, appuis rapides et légers'], raise: ['Lift to shoulder height, controlled', 'Monte à hauteur d’épaule, sans élan'],
  stretch: ['Hold 20–30 s, never force', 'Tiens 20 à 30 s, sans forcer'], bridge: ['Push through the heels, squeeze at the top', 'Pousse dans les talons, serre en haut'], calf: ['Rise high, lower slowly', 'Monte haut, redescends lentement'],
}
const V = (d: number, len: number): [number, number] => { const r = (d * Math.PI) / 180; return [Math.sin(r) * len, Math.cos(r) * len] }
const lerp = (a: Pose, b: Pose, k: number): Pose => Object.fromEntries(Object.keys(UP).concat('lift').map((key) => [key, ((a as never)[key] ?? 0) + (((b as never)[key] ?? 0) - ((a as never)[key] ?? 0)) * k])) as Pose

export function Athlete({ kind, paused, onRep }: { kind: Kind; paused?: boolean; onRep?: () => void }) {
  const ref = useRef<SVGSVGElement>(null); const pRef = useRef(paused); pRef.current = paused
  useEffect(() => {
    const an = ANIM[kind]; const [A, B, T0] = POSES[kind] ?? [UP, UP, 2]; const T = an ? an[1] : T0; let raf = 0; let t0 = performance.now(); let acc = 0; let last = t0; let lastRep = 0
    const svg = ref.current; if (!svg) return
    const q = (id: string) => svg.querySelector(`#${id}`) as SVGElement
    const ids = ['torso', 'neck', 'head', 'ua1', 'fa1', 'ua2', 'fa2', 'th1', 'sh1', 'th2', 'sh2', 'pt1', 'pt2', 'sf1', 'sf2', 'shadow', 'stripe', 'hand1', 'hand2']
    const E = Object.fromEntries(ids.map((i) => [i, q(i)])) as Record<string, SVGElement>
    const frame = (now: number) => {
      const dt = now - last; last = now; if (!pRef.current) acc += dt
      const ph = (acc / 1000) / T; const k = (1 - Math.cos(ph * 2 * Math.PI)) / 2 // smooth 0→1→0
      const rep = Math.floor(ph + 0.5); if (rep > lastRep) { lastRep = rep; onRep?.() }
      const P = an ? an[0](ph) : lerp(A, B, kind === 'run' || kind === 'sprint' || kind === 'walk' || kind === 'bike' ? (Math.sin(ph * 2 * Math.PI) + 1) / 2 : k)
      const hip: [number, number] = [0, 0]
      const sh = V(P.t, 50); const nk = V(P.t, 57); const hd = V(P.t, 68)
      const arm = (a: number, e: number) => { const el = V(a, 29); const ha = V(e, 27); return [sh, [sh[0] + el[0], sh[1] + el[1]], [sh[0] + el[0] + ha[0], sh[1] + el[1] + ha[1]]] as [number, number][] }
      const leg = (h: number, kn: number) => { const k1 = V(h, 38); const f = V(kn, 37); return [hip, [k1[0], k1[1]], [k1[0] + f[0], k1[1] + f[1]]] as [number, number][] }
      const A1 = arm(P.a1, P.e1), A2 = arm(P.a2, P.e2), L1 = leg(P.h1, P.k1), L2 = leg(P.h2, P.k2)
      const pts = [...A1, ...A2, ...L1, ...L2, hd]
      const ground = 180; const low = Math.max(...[L1[2], L2[2], A1[2], A2[2]].map((p) => p[1] + 4))
      const xs = pts.map((p) => p[0]); const cx = (Math.min(...xs) + Math.max(...xs)) / 2
      const oy = (FIXY[kind] ?? ground - low) - (P.lift ?? 0); const ox = 110 - (kind === 'swim' ? 28 : cx)
      const X = (p: number[]) => p[0] + ox, Y = (p: number[]) => p[1] + oy
      const f = (n: number) => n.toFixed(1)
      // tapered limb with a muscle bulge: half-widths w1 at a, w2 at b, bulge bm in the middle (outer side bo)
      const cap = (a: number[], b: number[], w1: number, w2: number, bm: number, bo = bm, mt = 0.42) => {
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux
        const mx = a[0] + dx * mt, my = a[1] + dy * mt, wm = (w1 + w2) / 2
        const P2 = (x: number, y: number) => `${f(x + ox)} ${f(y + oy)}`
        return `M${P2(a[0] + nx * w1, a[1] + ny * w1)} Q${P2(mx + nx * (wm + bm) * 1.6, my + ny * (wm + bm) * 1.6)} ${P2(b[0] + nx * w2, b[1] + ny * w2)} Q${P2(b[0] + ux * w2 * 1.5, b[1] + uy * w2 * 1.5)} ${P2(b[0] - nx * w2, b[1] - ny * w2)} Q${P2(mx - nx * (wm + bo) * 1.6, my - ny * (wm + bo) * 1.6)} ${P2(a[0] - nx * w1, a[1] - ny * w1)} Q${P2(a[0] - ux * w1 * 1.4, a[1] - uy * w1 * 1.4)} ${P2(a[0] + nx * w1, a[1] + ny * w1)}Z`
      }
      const at = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      E.torso.setAttribute('d', cap(hip, sh, 8.5, 13, 2.2, 1.4, 0.72)) // V-shape: narrow waist, wide back and chest
      E.stripe.setAttribute('d', cap(at(hip, sh, 0.05), at(hip, sh, 0.85), 2, 3, 0.4))
      E.neck.setAttribute('d', cap(sh, nk, 5.5, 4.5, 0.5))
      E.head.setAttribute('transform', `translate(${f(X(hd))},${f(Y(hd))}) rotate(${f(180 - P.t)})`)
      E.ua1.setAttribute('d', cap(A1[0], A1[1], 7, 4.6, 2.6, 1.6)); E.fa1.setAttribute('d', cap(A1[1], A1[2], 4.6, 3.2, 1.8, 0.6))
      E.ua2.setAttribute('d', cap(A2[0], A2[1], 7, 4.6, 2.6, 1.6)); E.fa2.setAttribute('d', cap(A2[1], A2[2], 4.6, 3.2, 1.8, 0.6))
      E.th1.setAttribute('d', cap(L1[0], L1[1], 9, 5.6, 2.4, 1.6)); E.sh1.setAttribute('d', cap(L1[1], L1[2], 5.4, 3.2, 2.4, 0.4))
      E.th2.setAttribute('d', cap(L2[0], L2[1], 9, 5.6, 2.4, 1.6)); E.sh2.setAttribute('d', cap(L2[1], L2[2], 5.4, 3.2, 2.4, 0.4))
      E.pt1.setAttribute('d', cap(L1[0], at(L1[0], L1[1], 0.62), 10.5, 8, 1.2)); E.pt2.setAttribute('d', cap(L2[0], at(L2[0], L2[1], 0.62), 10.5, 8, 1.2))
      const shoe = (el: SVGElement, L: [number, number][]) => { // toes point forward (or down when lying)
        const dx = L[2][0] - L[1][0], dy = L[2][1] - L[1][1], l = Math.hypot(dx, dy) || 1; let tx = -dy / l, ty = dx / l
        if (tx + ty * 0.8 < -tx - ty * 0.8) { tx = -tx; ty = -ty }
        const b = [L[2][0] + (dx / l) * 2 - tx * 3, L[2][1] + (dy / l) * 2 - ty * 3]; el.setAttribute('d', cap(b, [b[0] + tx * 12, b[1] + ty * 12], 4.6, 3.6, 0.5))
      }
      shoe(E.sf1, L1); shoe(E.sf2, L2)
      E.hand1.setAttribute('transform', `translate(${f(X(A1[2]))},${f(Y(A1[2]))})`); E.hand2.setAttribute('transform', `translate(${f(X(A2[2]))},${f(Y(A2[2]))})`)
      E.shadow.setAttribute('rx', String(36 - (P.lift ?? 0) * 0.5))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf)
  }, [kind]) // eslint-disable-line react-hooks/exhaustive-deps
  const part = (id: string, fill: string, extra?: object) => <path id={id} d="M0 0" fill={fill} stroke="rgba(0,0,0,.18)" strokeWidth=".8" strokeLinejoin="round" {...extra} />
  return (
    <svg ref={ref} viewBox="0 -16 220 216" className="mx-auto block w-full max-w-[300px] drop-shadow-[0_12px_24px_rgba(0,0,0,.35)]" aria-hidden>
      <defs>
        <linearGradient id="mat" x1="0" x2="1"><stop offset="0" stopColor="#245B43" /><stop offset="1" stopColor="#2f7d5b" /></linearGradient>
        <radialGradient id="spot" cx=".5" cy=".55" r=".5"><stop offset="0" stopColor="#F2B96B" stopOpacity=".38" /><stop offset=".6" stopColor="#8DBB91" stopOpacity=".12" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <linearGradient id="skin" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#d9a27a" /><stop offset="1" stopColor="#b67a52" /></linearGradient>
        <linearGradient id="skin2" x1="0" x2="1"><stop offset="0" stopColor="#a86d47" /><stop offset="1" stopColor="#8f5a3a" /></linearGradient>
        <linearGradient id="tank" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#F2B96B" /><stop offset="1" stopColor="#e0913a" /></linearGradient>
      </defs>
      <circle cx="110" cy="110" r="98" fill="url(#spot)" />
      <g stroke="#fff" strokeOpacity=".12" strokeWidth="2" strokeLinecap="round" className="coach-lines"><path d="M18 60h26M24 78h18M176 52h26M170 70h20M14 120h20M184 118h22" /></g>
      <g fill="#fff" opacity=".1"><rect x="20" y="150" width="6" height="26" rx="2" /><rect x="14" y="158" width="18" height="10" rx="3" /><rect x="190" y="154" width="18" height="22" rx="4" /><rect x="194" y="148" width="10" height="8" rx="2" /></g>
      <rect x="6" y="180" width="208" height="8" rx="4" fill="url(#mat)" />
      <ellipse id="shadow" cx="110" cy="184" rx="36" ry="4" fill="#000" opacity=".3" />
      {kind === 'bike' && <g stroke="#9aa6b0" strokeWidth="4" fill="none" strokeLinecap="round"><circle cx="70" cy="160" r="22" /><circle cx="160" cy="160" r="22" /><path d="M70 160 L105 132 L150 132 L160 160 M105 132 L118 160" /></g>}
      {kind === 'kick' && <g><circle className="ball-roll" cx="168" cy="170" r="9" fill="#fff" stroke="#245B43" strokeWidth="2" /><path d="M163 166l5-3 5 3-2 6h-6z" fill="#245B43" /></g>}
      {kind === 'rope' && <ellipse className="rope-spin" cx="110" cy="110" rx="46" ry="80" stroke="#F2B96B" strokeWidth="2" fill="none" />}
      {/* back limbs (darker) */}
      {part('ua2', 'url(#skin2)')}{part('fa2', 'url(#skin2)')}<g id="hand2"><circle r="4" fill={kind === 'box' ? '#c0392b' : '#8f5a3a'} /></g>
      {part('th2', 'url(#skin2)')}{part('sh2', 'url(#skin2)')}{part('pt2', '#16212b')}{part('sf2', '#e9edf0', { stroke: '#F2B96B', strokeWidth: 1.6 })}
      {/* torso: tank top over a V-shaped back */}
      {part('neck', 'url(#skin)')}
      {part('torso', 'url(#tank)')}
      <path id="stripe" d="M0 0" fill="#245B43" opacity=".9" />
      <g id="head">
        <ellipse rx="12.5" ry="13.5" fill="url(#skin)" />
        <path d="M-12.5 -1 C-14 -16 10 -19 13 -5 C10 -10 2 -12 -4 -11 C-8 -10 -11 -6 -12.5 -1Z" fill="#1d140f" />
        <path d="M-12.8 -4.5 C-5 -8.5 6 -9 13.2 -5.2 L13 -1.2 C6 -5 -5 -4.6 -12.8 -0.6Z" fill="#245B43" />
        <path d="M-12 -3 l-7 -4 l1 5 Z" fill="#245B43" />
        <ellipse cx="-3" cy="1.5" rx="2.4" ry="3.2" fill="#b67a52" />
        <path d="M5 -0.5 l4 -0.8" stroke="#1d140f" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="7" cy="1.8" r="1.5" fill="#1d140f" />
        <path d="M5 8 q3 1.8 6 -0.4" stroke="#7a3f25" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M12.3 2 l2.4 2.6 l-2.2 .6" fill="#c98a60" />
        <path d="M-6 11 C-2 14.5 6 14.5 10 10" stroke="#1d140f" strokeOpacity=".5" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* front limbs */}
      {part('th1', 'url(#skin)')}{part('sh1', 'url(#skin)')}{part('pt1', '#22313f')}{part('sf1', '#ffffff', { stroke: '#F2B96B', strokeWidth: 1.6 })}
      {part('ua1', 'url(#skin)')}{part('fa1', 'url(#skin)')}<g id="hand1"><circle r="4.4" fill={kind === 'box' ? '#e74c3c' : '#c98a60'} /></g>
      {kind === 'swim' && <g><rect x="6" y="118" width="208" height="62" rx="6" fill="#3aa0d8" opacity=".3" /><path className="coach-lines" d="M10 120q13-7 26 0t26 0t26 0t26 0t26 0t26 0t26 0t26 0" stroke="#fff" strokeOpacity=".6" strokeWidth="2.4" fill="none" strokeLinecap="round" /></g>}
    </svg>)
}

/** Story mode for a session: one exercise per slide, the athlete shows it, reps count up, tap to go on, hold or ⏸ to pause. */
export function WorkoutStory({ title, ex, lang, onClose }: { title: string; ex: [string, string][]; lang: Lang; onClose: () => void }) {
  const [i, setI] = useState(0); const [paused, setPaused] = useState(false); const [reps, setReps] = useState(0)
  const [sec, setSec] = useState(0); const [rest, setRest] = useState(0)
  useEffect(() => { setReps(0); setSec(0) }, [i])
  // Rest between strength sets: countdown with a short beep at the end.
  useEffect(() => {
    if (paused || rest <= 0) return
    const id = setTimeout(() => { setRest((r) => r - 1); if (rest === 1) { try { const a = new AudioContext(); const o = a.createOscillator(); o.connect(a.destination); o.frequency.value = 880; o.start(); o.stop(a.currentTime + 0.25) } catch { /* no audio */ } } }, 1000)
    return () => clearTimeout(id)
  }, [rest, paused])
  const next = () => { if (i < ex.length && /×/.test(ex[i][1])) setRest(60); setI(i + 1) }
  useEffect(() => { if (paused) return; const id = setInterval(() => setSec((x) => x + 1), 1000); return () => clearInterval(id) }, [paused, i])
  const N = ex.length + 1; const done = i >= ex.length
  const kind = done ? 'stretch' : kindOfEx(ex[i][0]); const timed = !done && /\d+\s*(s|min)\b/.test(ex[i][1])
  return createPortal(
    <div className={`fixed inset-0 z-[80] flex select-none flex-col text-white ${paused ? 'story-paused' : ''}`} style={{ background: 'radial-gradient(120% 70% at 50% 0%, #2f7d5b, #0b1712 70%)' }} role="dialog" aria-label={title}>
      <div className="flex gap-1 px-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>{Array.from({ length: N }, (_, k) => <span key={k} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"><span className={`block h-full rounded-full bg-white transition-all duration-300 ${k <= i ? 'w-full' : 'w-0'}`} /></span>)}</div>
      <div className="flex items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><b className="block truncate">{title}</b><span className="text-[12px] text-white/60">{done ? L2(lang, 'Done!', 'Terminé !') : `${i + 1}/${ex.length}`}</span></span>
        <button className="grid h-9 w-9 place-items-center rounded-full bg-white/15" onClick={() => setPaused(!paused)} aria-label="Pause">{paused ? <Play size={16} /> : <Pause size={16} />}</button>
        <button className="grid h-9 w-9 place-items-center rounded-full bg-white/15" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
      <button className="relative flex flex-1 flex-col justify-center px-6 text-center" onClick={() => (done ? onClose() : next())} aria-label="›">
        <div key={i} className="fade-up">
          {rest > 0 && <div className="mb-2 flex items-center justify-center gap-3 rounded-full bg-white/15 px-4 py-2 text-sm font-bold"><span>{L2(lang, 'Rest', 'Repos')} {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</span><span role="button" tabIndex={0} className="rounded-full bg-apricot px-3 py-1 text-ink" onClick={(ev) => { ev.stopPropagation(); setRest(0) }}>{L2(lang, 'Skip', 'Passer')}</span></div>}
          <Athlete kind={kind} paused={paused} onRep={() => setReps((r) => r + 1)} />
          {!done ? <>
            <p className="mt-4 font-display text-[26px] font-extrabold leading-tight">{ex[i][0]}</p>
            <p className="mt-1 inline-block rounded-full bg-white px-4 py-1 font-display text-lg font-extrabold text-ink">{ex[i][1]}</p>
            <p className="mt-3 text-sm text-white/75">{TIP[kind][lang === 'en' ? 0 : 1]}</p>
            <p className="mt-4 font-display text-5xl font-extrabold tabular-nums text-apricot">{timed ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : reps}</p>
            <p className="text-[12px] uppercase tracking-[.2em] text-white/50">{timed ? L2(lang, 'time', 'chrono') : L2(lang, 'reps', 'répétitions')}</p>
          </> : <><p className="mt-4 font-display text-3xl font-extrabold">{L2(lang, 'Great job!', 'Bravo, séance terminée !')}</p><p className="mt-1 text-white/70">{L2(lang, 'Drink water and stretch 5 minutes', 'Bois de l’eau et étire-toi 5 minutes')}</p></>}
        </div>
        <span className="mt-6 text-xs text-white/45">{done ? L2(lang, 'tap to close', 'touchez pour fermer') : L2(lang, 'tap for the next exercise', 'touchez pour l’exercice suivant')}</span>
      </button>
    </div>, document.body)
}
const L2 = (l: Lang, en: string, fr: string) => (l === 'en' ? en : fr)
