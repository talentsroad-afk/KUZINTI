import { Check, LayoutGrid, Layers, RotateCcw, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from './lib/store'
import { money, type Lang } from './lib/i18n'
import type { Aisle } from './data/catalog'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : fr)
/** One recognisable icon per ingredient, so a product is found at a glance in the aisle. */
export const ICON: Record<string, string> = {
  chicken: '🍗', beef: '🥩', lamb: '🍖', sardine: '🐟', tuna: '🥫', egg: '🥚', onion: '🧅', tomato: '🍅', potato: '🥔', carrot: '🥕', zucchini: '🥒', eggplant: '🍆', pumpkin: '🎃', pepper: '🫑', garlic: '🧄', lemon: '🍋', plemon: '🍋', olives: '🫒', banana: '🍌', coriander: '🌿', parsley: '🌿', mint: '🌱', oil: '🫗', flour: '🌾', semolina: '🌾', couscous: '🥣', rice: '🍚', pasta: '🍝', lentils: '🫘', chickpeas: '🫘', fava: '🫘', oats: '🥣', bread: '🥖', milk: '🥛', butter: '🧈', yogurt: '🥛', cheese: '🧀', honey: '🍯', sugar: '🍬', almonds: '🌰', dates: '🌴', tea: '🍵', coffee: '☕', orange: '🍊', apple: '🍎', fish: '🐠', vermicelli: '🍜', warqa: '🫓', sesame: '🌾', whitebeans: '🫘', raisins: '🍇', prunes: '🫐', soy: '🫙', salt: '🧂', cumin: '🧂', paprika: '🌶️', turmeric: '🧂', ginger: '🫚', cinnamon: '🧂',
}
const AISLE_E: Record<Aisle, string> = { produce: '🥬', meat: '🥩', dairy: '🥛', grocery: '🫙', bakery: '🥖', spices: '🧂' }
export const iconOf = (id: string, aisle?: Aisle) => ICON[id] ?? (aisle ? AISLE_E[aisle] : '🛒')

export interface CartItem { key: string; name: string; q: string; price: number; e: string; aisle: string }

/** In-store mode for one hand on the trolley: one big card at a time, swipe right = in the trolley, left = not found. */
export function CartMode({ open, onClose, items, onFinish }: { open: boolean; onClose: () => void; items: CartItem[]; onFinish: () => void }) {
  const { lang, house, upHouse, award } = useApp()
  const chk = house!.checked; const miss = house!.missing ?? {}
  const [grid, setGrid] = useState(false); const [dx, setDx] = useState(0); const [fly, setFly] = useState<0 | 1 | -1>(0)
  const [hist, setHist] = useState<string[]>([])
  const start = useRef<number | null>(null)
  if (!open) return null
  const todo = items.filter((x) => !chk[x.key] && !miss[x.key])
  const cur = todo[0]; const next = todo[1]
  const got = items.filter((x) => chk[x.key]); const spent = got.reduce((a, x) => a + x.price, 0)
  const pct = items.length ? ((items.length - todo.length) / items.length) * 100 : 0
  const decide = (yes: boolean) => {
    if (!cur || fly) return
    setFly(yes ? 1 : -1); try { navigator.vibrate?.(yes ? 18 : [10, 40, 10]) } catch { /* no vibration */ }
    setTimeout(() => {
      upHouse((h) => { if (yes) h.checked[cur.key] = true; else h.missing = { ...(h.missing ?? {}), [cur.key]: true } }, yes ? `🛒 ${cur.name}` : `✕ ${cur.name}`)
      if (yes) award(2, cur.name)
      setHist([...hist, cur.key]); setFly(0); setDx(0)
    }, 220)
  }
  const undo = () => { const k = hist[hist.length - 1]; if (!k) return; upHouse((h) => { h.checked[k] = false; if (h.missing) { const m = { ...h.missing }; delete m[k]; h.missing = m } }); setHist(hist.slice(0, -1)) }
  const toggle = (k: string) => upHouse((h) => { const on = !h.checked[k]; h.checked[k] = on; if (h.missing?.[k]) { const m = { ...h.missing }; delete m[k]; h.missing = m } })
  const x = fly ? fly * 520 : dx
  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-bg" role="dialog" aria-modal aria-label={L(lang, 'Store mode', 'Mode magasin', 'وضع المتجر')} style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pt-3">
        <button className="grid h-11 w-11 place-items-center rounded-full bg-surface shadow-soft" onClick={onClose} aria-label={L(lang, 'Close', 'Fermer', 'إغلاق')}><X size={20} aria-hidden /></button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between text-sm font-bold"><span className="tabular-nums">{items.length - todo.length} / {items.length}</span><span className="tabular-nums text-forest">{money(spent, lang)}</span></div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${pct}%` }} /></div>
        </div>
        <button className="grid h-11 w-11 place-items-center rounded-full bg-surface shadow-soft" onClick={() => setGrid(!grid)} aria-pressed={grid} aria-label={grid ? L(lang, 'One by one', 'Un par un', 'واحدًا تلو الآخر') : L(lang, 'Overview', 'Vue globale', 'نظرة شاملة')}>{grid ? <Layers size={20} aria-hidden /> : <LayoutGrid size={20} aria-hidden />}</button>
      </div>

      {grid ? (
        <div className="mx-auto grid w-full max-w-md flex-1 auto-rows-min grid-cols-3 gap-2 overflow-y-auto p-4">
          {items.map((it) => { const on = !!chk[it.key]; const no = !!miss[it.key]; return (
            <button key={it.key} className={`relative rounded-2xl border-2 p-2 text-center transition active:scale-95 ${on ? 'border-forest bg-leaf/25' : no ? 'border-line bg-cream opacity-60' : 'border-line bg-surface'}`} onClick={() => toggle(it.key)} aria-pressed={on}>
              <span className={`block text-3xl ${on ? 'pop' : ''}`}>{it.e}</span>
              <span className="mt-1 line-clamp-2 block text-[11px] font-semibold leading-tight">{it.name}</span>
              <span className="block text-[10px] text-muted">{it.q}</span>
              {on && <span className="pop absolute -end-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-forest text-white"><Check size={14} aria-hidden /></span>}
              {no && <span className="absolute -end-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-muted text-white"><X size={14} aria-hidden /></span>}
            </button>) })}
        </div>
      ) : cur ? (
        <div className="relative mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6">
          {next && <div className="absolute inset-x-10 top-1/2 h-[54%] -translate-y-[46%] scale-95 rounded-[32px] bg-surface opacity-70 shadow-soft" aria-hidden />}
          <div key={cur.key} className="relative w-full touch-none select-none rounded-[32px] bg-surface p-6 text-center shadow-[0_24px_60px_-30px_rgb(var(--shadow)/.6)] fade-up"
            style={{ transform: `translateX(${x}px) rotate(${x / 18}deg)`, transition: start.current === null ? 'transform .22s var(--ease)' : 'none' }}
            onPointerDown={(e) => { start.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId) }}
            onPointerMove={(e) => { if (start.current !== null) setDx(e.clientX - start.current) }}
            onPointerUp={() => { const d = dx; start.current = null; if (d > 90) decide(true); else if (d < -90) decide(false); else setDx(0) }}
            onPointerCancel={() => { start.current = null; setDx(0) }}>
            <span className="absolute start-5 top-5 rounded-full border-2 border-forest px-3 py-1 text-sm font-extrabold uppercase text-forest transition-opacity" style={{ opacity: Math.max(0, x / 90) }}>{L(lang, 'In the trolley', 'Dans le caddie', 'في العربة')}</span>
            <span className="absolute end-5 top-5 rounded-full border-2 border-muted px-3 py-1 text-sm font-extrabold uppercase text-muted transition-opacity" style={{ opacity: Math.max(0, -x / 90) }}>{L(lang, 'Not found', 'Pas trouvé', 'غير موجود')}</span>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[.18em] text-muted">{cur.aisle}</p>
            <div className="my-4 text-[88px] leading-none" aria-hidden>{cur.e}</div>
            <h2 className="font-serif text-[30px] font-semibold leading-tight">{cur.name}</h2>
            <p className="mt-2 font-display text-2xl font-extrabold text-forest">{cur.q}</p>
            <p className="mt-1 text-sm text-muted tabular-nums">≈ {money(cur.price, lang)}</p>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 text-center fade-up">
          <span className="pop grid h-24 w-24 place-items-center rounded-full bg-forest text-white"><Check size={48} aria-hidden /></span>
          <h2 className="font-serif text-[30px] font-semibold">{L(lang, 'Trolley complete!', 'Caddie complet !', 'العربة مكتملة!')}</h2>
          <p className="text-sm text-muted">{got.length} {L(lang, 'items', 'articles', 'منتجات')} · {money(spent, lang)}{Object.keys(miss).length ? ` · ${Object.keys(miss).length} ${L(lang, 'not found', 'pas trouvés', 'غير موجودة')}` : ''}</p>
          <button className="btn btn-primary mt-2 w-full !min-h-14 text-lg" onClick={() => { onFinish(); onClose() }}><Check size={20} aria-hidden /> {L(lang, 'Finish shopping', 'Terminer les courses', 'إنهاء التسوق')}</button>
          {Object.keys(miss).length > 0 && <button className="btn btn-soft w-full" onClick={() => upHouse((h) => { h.missing = {} })}>{L(lang, 'Look again for the missing items', 'Rechercher à nouveau les manquants', 'البحث مجددًا')}</button>}
        </div>
      )}

      {!grid && cur && (
        <div className="mx-auto flex w-full max-w-md items-center justify-center gap-5 px-6 pb-6 pt-2">
          <button className="grid h-16 w-16 place-items-center rounded-full bg-surface text-muted shadow-soft active:scale-90" onClick={() => decide(false)} aria-label={L(lang, 'Not found', 'Pas trouvé', 'غير موجود')}><X size={30} aria-hidden /></button>
          <button className="grid h-12 w-12 place-items-center rounded-full bg-surface text-muted shadow-soft active:scale-90 disabled:opacity-40" onClick={undo} disabled={!hist.length} aria-label={L(lang, 'Undo', 'Annuler', 'تراجع')}><RotateCcw size={20} aria-hidden /></button>
          <button className="grid h-20 w-20 place-items-center rounded-full bg-forest text-white shadow-lg active:scale-90" onClick={() => decide(true)} aria-label={L(lang, 'In the trolley', 'Dans le caddie', 'في العربة')}><Check size={38} aria-hidden /></button>
        </div>
      )}
      {!grid && cur && <p className="pb-4 text-center text-xs text-muted">{L(lang, 'Swipe right: in the trolley · left: not found', 'Glissez à droite : dans le caddie · à gauche : pas trouvé', 'اسحب يمينًا: في العربة · يسارًا: غير موجود')}</p>}
    </div>, document.body)
}
