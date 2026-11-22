import { useEffect, useState, type ReactNode } from 'react'
import { useApp } from './lib/store'
import type { Recipe } from './data/recipes'

export const Logo = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden><rect width="96" height="96" rx="26" fill="#245B43" /><path d="M30 66c0-22 14-36 38-38 0 22-12 38-34 38" fill="#8DBB91" /><path d="M30 66c8-14 18-24 30-30" stroke="#F4F1E8" strokeWidth="4" strokeLinecap="round" fill="none" /><circle cx="66" cy="66" r="7" fill="#F2B96B" /></svg>
)
export const Brand = () => <span className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-forest"><Logo size={30} />KUZINTI</span>

/** Illustrated tile. Swap `e` for a Higgsfield / licensed photo via the `img` prop later. */
export function FoodTile({ r, className = '' }: { r: Recipe; className?: string }) {
  return (
    <div className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, hsl(${r.h} 80% 88%), hsl(${(r.h + 30) % 360} 70% 78%))` }}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/40 blur-xl" />
      <span className="relative text-5xl drop-shadow-sm" role="img" aria-hidden>{r.e}</span>
    </div>
  )
}
export function Ring({ value, size = 84, children }: { value: number; size?: number; children?: ReactNode }) {
  const R = size / 2 - 7, C = 2 * Math.PI * R
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgb(var(--line))" strokeWidth="7" /><circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgb(var(--forest))" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, value))} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }} /></svg>
      <div className="absolute text-center font-display font-bold">{children}</div>
    </div>
  )
}
export function Toasts() {
  const { toasts } = useApp()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex flex-col items-center gap-2 px-4" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }} aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className={`toast rounded-full px-4 py-2.5 text-sm font-semibold shadow-lift ${x.kind === 'xp' ? 'bg-apricot text-[#3c280a]' : 'bg-forest text-white'}`}>{x.msg}</div>
      ))}
    </div>
  )
}
export function Confetti({ run }: { run: number }) {
  const [on, setOn] = useState(false)
  useEffect(() => { if (!run) return; setOn(true); const i = setTimeout(() => setOn(false), 2600); return () => clearTimeout(i) }, [run])
  if (!on) return null
  const cols = ['#245B43', '#8DBB91', '#F2B96B', '#F4F1E8', '#e58a6a']
  return <div className="confetti" aria-hidden>{Array.from({ length: 36 }, (_, i) => <i key={i} style={{ left: `${(i * 97) % 100}%`, background: cols[i % 5], animationDelay: `${(i % 9) * 0.07}s` }} />)}</div>
}
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#10201a]/45 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()} className="rise card max-h-[88vh] w-full max-w-xl overflow-auto rounded-b-none p-5 sm:rounded-3xl" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button className="btn btn-soft !min-h-10 !px-4" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  )
}
export const Stepper = ({ v, set, min = 1, max = 20 }: { v: number; set: (n: number) => void; min?: number; max?: number }) => (
  <div className="inline-flex items-center gap-1 rounded-full bg-cream p-1">
    <button className="btn btn-soft !min-h-9 !w-9 !px-0" onClick={() => set(Math.max(min, v - 1))} aria-label="−">−</button>
    <span className="w-8 text-center font-bold tabular-nums">{v}</span>
    <button className="btn btn-soft !min-h-9 !w-9 !px-0" onClick={() => set(Math.min(max, v + 1))} aria-label="+">+</button>
  </div>
)
