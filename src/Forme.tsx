import { useApp } from './lib/store'
import { Ic } from './Ic'
import { dailyKcal } from './lib/engine'
import { Ring } from './ui'

const PRESETS: [number, string, string, string][] = [
  [1700, '📉 Perdre du poids', 'Repas plus légers, soupes et légumes le soir.', '🏃'],
  [2100, '⚖️ Garder mon poids', 'Repas équilibrés, portions normales.', '🙂'],
  [2600, '📈 Prendre / sportif', 'Plats plus copieux, plus de protéines.', '💪'],
]
const today = () => new Date().toISOString().slice(0, 10)

/** One clear calorie goal (per person per day) that drives the composer. */
export function KcalGoal({ onChange }: { onChange: (k: number) => void }) {
  const { me, patchMe } = useApp(); const k = me!.kcal ?? 2100
  const set = (v: number) => { patchMe({ kcal: v }); onChange(v) }
  const near = PRESETS.reduce((a, b) => (Math.abs(b[0] - k) < Math.abs(a[0] - k) ? b : a))
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted"><Ic e="🎯" /> Mon objectif calories</p>
      <div className="grid grid-cols-3 gap-2">{PRESETS.map(([v, l]) => <button key={v} className={`rounded-2xl border p-2 text-center text-xs font-bold leading-tight transition ${near[0] === v ? 'border-forest bg-leaf/25 text-forest' : 'border-line bg-surface'}`} onClick={() => set(v)} aria-pressed={near[0] === v}>{l}</button>)}</div>
      <div className="mt-2 flex items-center gap-3"><input type="range" min={1400} max={3200} step={50} value={k} onChange={(e) => set(+e.target.value)} className="flex-1 accent-[#245B43]" aria-label="kcal par jour" /><b className="w-28 whitespace-nowrap text-end tabular-nums">{k} kcal/j</b></div>
      <p className="mt-1 text-[12px] text-muted">{near[2]} Par personne et par jour : KUZINTI choisit les plats pour s’en approcher.</p>
    </div>
  )
}

/** Daily health: planned calories vs goal, and steps vs a daily target, as two rings. */
export function FormeCard({ plan }: { plan: Record<string, { r: string; n: number }> }) {
  const { me, patchMe, award } = useApp(); const u = me!
  const goal = u.kcal ?? 2100; const kc = Math.round(dailyKcal(plan)); const ratio = kc / goal
  const steps = u.steps?.[today()] ?? 0; const target = 8000
  const add = (n: number) => { const v = Math.max(0, steps + n); patchMe({ steps: { ...(u.steps ?? {}), [today()]: v } }); if (steps < target && v >= target) award(20, '👟 8 000 pas !') }
  const face = ratio < 0.92 ? '🏃' : ratio <= 1.08 ? '🙂' : '🫃'
  const msg = ratio < 0.92 ? 'Un peu sous ton objectif : ajoute un goûter ou une portion.' : ratio <= 1.08 ? 'Pile dans ton objectif, bravo !' : 'Au-dessus de ton objectif : allège le dîner ou marche un peu plus.'
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2"><span className={`mascot text-3xl ${ratio > 1.08 ? 'mascot-belly' : ratio < 0.92 ? 'mascot-fit' : 'mascot-balanced'}`} aria-hidden>{face}</span><div className="min-w-0 flex-1"><p className="font-display font-extrabold">Ma forme du jour</p><p className="text-xs text-muted">{msg}</p></div></div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-cream/60 p-3"><Ring value={Math.min(1, ratio)} size={84}><span className="text-center leading-none"><b className="block font-display text-lg tabular-nums">{kc}</b><span className="text-[12px] text-muted">/ {goal} kcal</span></span></Ring><span className="text-xs font-bold"><Ic e="🍽️" /> Calories prévues</span></div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-cream/60 p-3"><Ring value={Math.min(1, steps / target)} size={84}><span className="text-center leading-none"><b className="block font-display text-lg tabular-nums">{steps}</b><span className="text-[12px] text-muted">/ 8 000 pas</span></span></Ring><span className="text-xs font-bold">👟 Pas du jour</span>
          <div className="flex gap-1">{[1000, 2000].map((n) => <button key={n} className="rounded-full bg-forest px-2.5 py-1 text-[12px] font-bold text-white active:scale-90" onClick={() => add(n)}>+{n / 1000}k</button>)}<button className="rounded-full bg-surface px-2 py-1 text-[12px] font-bold" onClick={() => add(-1000)} aria-label="−1000">−</button></div></div>
      </div>
      <p className="mt-2 text-center text-[12px] text-muted">≈ {Math.round(steps * 0.04)} kcal brûlées en marchant · calories estimées</p>
    </div>
  )
}
