import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react"
import { createPortal } from 'react-dom'
import { useApp } from './lib/store'
import type { Recipe } from './data/recipes'
import { photoOf, photoSrc } from './data/photos'

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
/** Real food photo when the dish family has one (free Unsplash License), the drawn tile otherwise or if it fails to load. */
export function Dish({ r, className = '', w = 600, credit = false }: { r: Recipe; className?: string; w?: number; credit?: boolean }) {
  const p = photoOf(r); const [bad, setBad] = useState(false); const [ok, setOk] = useState(false)
  if (!p || bad) return <FoodTile r={r} className={className} />
  return (
    <div className={`relative overflow-hidden bg-cream ${className}`}>
      <img src={photoSrc(p, w)} alt="" loading="lazy" decoding="async" onLoad={() => setOk(true)} onError={() => setBad(true)} className={`h-full w-full object-cover transition-[opacity,transform] duration-700 ${ok ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`} />
      {credit && <span className="absolute bottom-2 end-3 text-[9px] font-medium text-white/75">Photo {p.by} · Unsplash</span>}
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 px-4" style={{ paddingBottom: 'calc(92px + env(safe-area-inset-bottom))' }} aria-live="polite">
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
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#10201a]/45 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()} className="rise card max-h-[88vh] w-full max-w-xl overflow-auto rounded-b-none p-5 sm:rounded-3xl" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button className="btn btn-soft !min-h-10 !px-4" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
export const Stepper = ({ v, set, min = 1, max = 20 }: { v: number; set: (n: number) => void; min?: number; max?: number }) => (
  <div className="inline-flex items-center gap-1 rounded-full bg-cream p-1">
    <button className="btn btn-soft !min-h-9 !w-9 !px-0" onClick={() => set(Math.max(min, v - 1))} aria-label="−">−</button>
    <span className="w-8 text-center font-bold tabular-nums">{v}</span>
    <button className="btn btn-soft !min-h-9 !w-9 !px-0" onClick={() => set(Math.min(max, v + 1))} aria-label="+">+</button>
  </div>
)

/** iOS-style swipe-to-delete: drag the row right-to-left (left-to-right in Arabic), it reveals a red bin; past ~40% it slides out and collapses. */
export function Swipe({ onDelete, label, rtl, children }: { onDelete: () => void; label: string; rtl?: boolean; children: ReactNode }) {
  const [dx, setDx] = useState(0); const [gone, setGone] = useState(false); const [drag, setDrag] = useState(false)
  const s = useRef<{ x: number; y: number; w: number; lock?: 'x' | 'y' } | null>(null); const box = useRef<HTMLDivElement>(null)
  const dir = rtl ? 1 : -1
  const start = (x: number, y: number) => { s.current = { x, y, w: box.current?.offsetWidth ?? 360 } }
  const move = (x: number, y: number, e?: { cancelable: boolean; preventDefault: () => void }) => { const c = s.current; if (!c) return; const mx = x - c.x, my = y - c.y
    if (!c.lock) { if (Math.abs(mx) < 8 && Math.abs(my) < 8) return; c.lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y' }
    if (c.lock !== 'x') return; if (e?.cancelable) e.preventDefault(); setDrag(true); const v = mx * dir; setDx(v > 0 ? -dir * Math.min(v, c.w) : mx * 0.15) }
  const end = () => { const c = s.current; s.current = null; setDrag(false); if (!c || c.lock !== 'x') return
    if (Math.abs(dx) > c.w * 0.38) { setDx(dir * c.w); setTimeout(() => setGone(true), 180); setTimeout(onDelete, 380) } else setDx(Math.abs(dx) > 60 ? dir * 84 : 0) }
  return (
    <div ref={box} data-noswipe className={`swipe relative select-none overflow-hidden transition-[max-height,opacity] duration-200 ${gone ? 'max-h-0 opacity-0' : 'max-h-40'}`}
      onTouchStart={(e) => start(e.touches[0].clientX, e.touches[0].clientY)} onTouchMove={(e) => move(e.touches[0].clientX, e.touches[0].clientY, e)} onTouchEnd={end}
      onMouseDown={(e) => start(e.clientX, e.clientY)} onMouseMove={(e) => s.current && move(e.clientX, e.clientY)} onMouseUp={end} onMouseLeave={() => s.current && end()}>
      <button aria-label={label} onClick={() => { setDx(dir * 400); setTimeout(() => setGone(true), 160); setTimeout(onDelete, 360) }} className={`absolute inset-y-0 ${rtl ? 'start-0' : 'end-0'} flex w-full items-center justify-end gap-1.5 bg-[#e5484d] px-5 text-sm font-bold text-white`} style={{ justifyContent: rtl ? 'flex-start' : 'flex-end', opacity: dx ? 1 : 0 }} tabIndex={dx ? 0 : -1}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>{label}
      </button>
      <div className="relative bg-surface" style={{ transform: `translateX(${dx}px)`, transition: drag ? 'none' : 'transform .32s cubic-bezier(.2,.9,.25,1)' }}>{children}</div>
    </div>)
}

/** Modern duotone icon badge: soft gradient tile, white glyph, subtle inner light. Used for dashboard shortcuts and the three spaces. */
export const TONES = {
  forest: 'linear-gradient(140deg,#3f8a63,#1d4b37)', leaf: 'linear-gradient(140deg,#a7d3a1,#5e9c6a)', apricot: 'linear-gradient(140deg,#ffcf8a,#ee9b45)',
  coral: 'linear-gradient(140deg,#ff9a8b,#e2574c)', sky: 'linear-gradient(140deg,#8fd3ff,#3d8fd6)', grape: 'linear-gradient(140deg,#c3a3ff,#7a52d6)',
  sand: 'linear-gradient(140deg,#f1d9a8,#c79b52)', teal: 'linear-gradient(140deg,#7fe0cf,#219a8a)',
} as const
export type Tone = keyof typeof TONES
export function Badge({ Icon, tone, size = 44, className = '' }: { Icon: ComponentType<any>; tone: Tone; size?: number; className?: string }) {
  return <span className={`badge relative grid shrink-0 place-items-center text-white ${className}`} style={{ width: size, height: size, borderRadius: size * 0.34, background: TONES[tone] }} aria-hidden>
    <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/35 to-transparent opacity-60" style={{ height: '55%' }} />
    <Icon size={Math.round(size * 0.5)} strokeWidth={2.2} aria-hidden /></span>
}
