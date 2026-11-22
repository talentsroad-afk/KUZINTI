import { useEffect, useMemo, useState } from 'react'
import { E3 } from './E3'
import { StoreLogo } from './Flow'
import { createPortal } from 'react-dom'
import { useApp } from './lib/store'
import { money, type Lang } from './lib/i18n'
import { storesNow, storeTotal } from './lib/stores'
import { iconOf } from './Cart'
import type { Line } from './lib/engine'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : fr)

/** The basket story: my choices fly into the basket, then 1) best store, 2) shop together with my partner, 3) go. */
export function BasketStory({ open, lines, onClose, go }: { open: boolean; lines: Line[]; onClose: () => void; go: (k: 'list' | 'stores') => void }) {
  const { lang, house, upHouse } = useApp()
  const [phase, setPhase] = useState<'fly' | 'store' | 'partner'>('fly'); const [pick, setPick] = useState<string | null>(null)
  const buy = lines.filter((l) => l.buy > 0)
  const ems = useMemo(() => [...new Set(buy.map((l) => iconOf(l.id, l.ing.aisle)))].slice(0, 18), [buy.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const ranked = useMemo(() => storesNow().map((s) => ({ s, tot: storeTotal(buy, s) })).sort((a, b) => a.tot - b.tot), [buy.length]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!open) return; setPhase('fly'); setPick(null); const id = setTimeout(() => setPhase('store'), 1500); return () => clearTimeout(id) }, [open])
  if (!open || !house) return null
  const best = ranked[0]
  const W = typeof window !== 'undefined' ? window.innerWidth : 390; const H = typeof window !== 'undefined' ? window.innerHeight : 800
  const share = () => { const m = L(lang, 'Join my KUZINTI household to shop together: code ', 'Rejoins mon foyer KUZINTI pour faire les courses ensemble : code ', 'انضم إلى أسرتي في كوزينتي: الرمز ') + house.code + ' · ' + location.origin; window.open('https://wa.me/?text=' + encodeURIComponent(m), '_blank') }
  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label={L(lang, 'My basket', 'Mon panier', 'سلتي')}>
      <div className="absolute inset-0 bg-[#0d1f17]/70 backdrop-blur-sm transition-opacity" onClick={phase === 'fly' ? undefined : onClose} />
      {phase === 'fly' && <>
        {ems.map((e, i) => { const x = W / 2 + Math.cos(i * 2.4) * (60 + (i % 4) * 26) - 18; const y = H * 0.36 + Math.sin(i * 2.4) * (50 + (i % 3) * 24); return (
          <span key={i} className="fly-in absolute text-[34px]" style={{ left: x, top: y, animationDelay: `${i * 45}ms`, ['--tx' as string]: `${W / 2 - x - 18}px`, ['--ty' as string]: `${H - 70 - y}px` }} aria-hidden><E3 e={e} /></span>) })}
        <div className="absolute inset-x-0 top-[18%] text-center text-white"><p className="fade-up font-display text-2xl font-extrabold">{L(lang, 'Into the basket…', 'Direction le panier…', 'إلى السلة…')}</p><p className="text-sm text-white/75">{buy.length} {L(lang, 'products from your meals', 'produits tirés de vos repas', 'منتج')}</p></div>
        <span className="basket-catch absolute bottom-6 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full bg-apricot text-4xl shadow-lift" aria-hidden><E3 e="🛒" /></span>
      </>}
      {phase !== 'fly' && <div className="sheet-up absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-[30px] bg-surface p-5 pb-8 shadow-lift">
        <div className="mb-4 flex items-center gap-2"><button className="grid h-9 w-9 place-items-center rounded-full bg-cream text-lg font-bold active:scale-90" onClick={() => (phase === 'partner' ? setPhase('store') : onClose())} aria-label={L(lang, 'Back', 'Retour', 'رجوع')}>‹</button>{(['store', 'partner'] as const).map((p) => <span key={p} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${phase === p || (p === 'store' && phase === 'partner') ? 'bg-forest' : 'bg-line'}`} aria-hidden />)}<button className="grid h-9 w-9 place-items-center rounded-full bg-cream text-sm active:scale-90" onClick={onClose} aria-label="Close">✕</button></div>
        {phase === 'store' && best && <div key="s" className="fade-up space-y-3">
          <div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-terracotta">1/2 · {buy.length} {L(lang, 'products', 'produits', 'منتج')}</p><p className="font-display text-xl font-extrabold">{L(lang, 'Where do you want to shop?', 'Où voulez-vous faire vos courses ?', 'أين تريد التسوق؟')}</p></div>
          <div className="stagger max-h-[46vh] space-y-2 overflow-y-auto">{ranked.map((r, i) => { const on = pick === r.s.id; return (
            <button key={r.s.id} onClick={() => setPick(r.s.id)} aria-pressed={on} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-start transition active:scale-[.98] ${on ? 'border-forest bg-forest/[.06]' : 'border-line bg-surface'}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-forest bg-forest' : 'border-line'}`}>{on && <span className="h-2 w-2 rounded-full bg-white" />}</span>
              <StoreLogo id={r.s.id} w={84} /><span className="min-w-0 flex-1">{i === 0 ? <span className="text-[11px] font-bold text-forest">✓ {L(lang, 'Cheapest', 'Le moins cher', 'الأرخص')}</span> : <span className="text-[11px] text-muted">+{money(r.tot - best.tot, lang)}</span>}</span>
              <b className="font-display tabular-nums">{money(r.tot, lang)}</b></button>) })}</div>
          <button disabled={!pick} className="btn btn-primary w-full !min-h-14 text-base disabled:opacity-40" onClick={() => { const s = ranked.find((r) => r.s.id === pick)?.s; if (!s) return; upHouse((h) => { h.store = s.id }, `🏪 ${s.name}`); setPhase('partner') }}>{L(lang, 'Continue', 'Continuer', 'متابعة')} ›</button>
        </div>}
        {phase === 'partner' && <div key="p" className="fade-up space-y-4">
          <div className="flex items-center gap-3"><span className="pop grid h-14 w-14 place-items-center rounded-2xl bg-leaf/40 text-3xl">👫</span><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-terracotta">2/2 · {L(lang, 'Shop together', 'Faire les courses à deux', 'التسوق معا')}</p><p className="font-display text-xl font-extrabold">{L(lang, 'Split the list live', 'Partagez la liste en direct', 'شارك القائمة مباشرة')}</p></div></div>
          <div className="rounded-[22px] bg-cream p-4 text-center"><p className="text-xs font-semibold text-muted">{L(lang, 'Household code for your partner', 'Code du foyer pour votre partenaire', 'رمز الأسرة')}</p><p className="font-display text-[30px] font-extrabold tracking-[.18em]">{house.code}</p>
            <p className="text-xs text-muted">{L(lang, 'Each of you ticks in the store: the other sees it instantly.', 'Chacun coche en rayon : l’autre le voit tout de suite.', 'كل واحد يؤشر والآخر يرى فورا.')}</p>
            <p className="mt-1 text-xs font-semibold text-forest">👥 {house.members.length} {L(lang, house.members.length > 1 ? 'members connected' : 'member for now', house.members.length > 1 ? 'membres connectés' : 'membre pour l’instant', 'أعضاء')}</p></div>
          <div className="grid grid-cols-2 gap-2"><button className="btn btn-soft !min-h-12" onClick={share}>💬 WhatsApp</button><button className="btn btn-soft !min-h-12" onClick={() => { try { navigator.clipboard.writeText(house.code) } catch { /* ignore */ } }}>📋 {L(lang, 'Copy', 'Copier', 'نسخ')}</button></div>
          <button className="btn btn-primary w-full !min-h-14 text-base" onClick={() => { onClose(); go('list') }}>🛒 {L(lang, 'Start shopping', 'Commencer les courses', 'ابدأ التسوق')} ›</button>
        </div>}
      </div>}
    </div>, document.body)
}
