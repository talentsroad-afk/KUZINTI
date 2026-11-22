import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { useApp } from './lib/store'
import { Sheet } from './ui'
import { COUNTRIES, ZONES, cname, countryOf, storesOf } from './lib/countries'
import { norm } from './data/products'
import { type Lang } from './lib/i18n'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : fr)
const storeLine = (id: string) => id === 'MA' ? 'Marjane, BIM, Carrefour, souk…' : id === 'FR' ? 'Leclerc, Lidl, Carrefour, marché…' : storesOf(countryOf(id)).slice(0, 3).map((s) => s.name).join(', ') + '…'

/** One-tap country switch: search, recent countries on top, grouped by region. Changing applies at once (currency, stores, cuisine). */
export function CountrySheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const { lang, me } = useApp()
  const [q, setQ] = useState('')
  const cur = me!.country
  const recent: string[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('kz_recent_ctry') ?? '[]') } catch { return [] } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (id: string) => { try { localStorage.setItem('kz_recent_ctry', JSON.stringify([id, ...recent.filter((x) => x !== id)].slice(0, 4))) } catch { /* private mode */ } onPick(id); setQ(''); onClose() }
  const hits = COUNTRIES.filter((c) => !q || norm(c.n.join(' ') + ' ' + c.cur).includes(norm(q)))
  const Row = ({ id }: { id: string }) => { const c = countryOf(id); const on = c.id === cur
    return <button className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start transition active:scale-[.98] ${on ? 'bg-leaf/25 ring-2 ring-forest' : 'hover:bg-cream'}`} onClick={() => pick(c.id)}>
      <span className="text-3xl leading-none">{c.f}</span>
      <span className="min-w-0 flex-1"><b className="block truncate">{cname(c, lang)}</b><span className="block truncate text-xs text-muted">{storeLine(c.id)}</span></span>
      <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 text-xs font-bold tabular-nums">{c.sym}</span>{on && <Check size={20} className="text-forest" aria-hidden />}</button> }
  return (
    <Sheet open={open} onClose={onClose} title={L(lang, 'Your country', 'Votre pays', 'بلدك')}>
      <label className="mb-3 flex items-center gap-2 rounded-2xl bg-cream px-3"><Search size={18} className="text-muted" aria-hidden /><input className="min-h-12 flex-1 bg-transparent outline-none" placeholder={L(lang, 'Search a country or currency', 'Chercher un pays ou une devise', 'ابحث عن بلد')} value={q} onChange={(e) => setQ(e.target.value)} /></label>
      {!q && <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">{[...new Set([cur, ...recent, 'MA', 'FR', 'ES', 'BE'])].slice(0, 6).map((id) => { const c = countryOf(id); return <button key={id} className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-xs font-bold active:scale-95 ${id === cur ? 'bg-forest text-white' : 'bg-surface shadow-soft'}`} onClick={() => pick(id)}><span className="text-2xl">{c.f}</span>{cname(c, lang).split(' ')[0]}</button> })}</div>}
      {q ? <div className="space-y-1">{hits.map((c) => <Row key={c.id} id={c.id} />)}{!hits.length && <p className="py-6 text-center text-sm text-muted">{L(lang, 'Not available yet', 'Pas encore disponible', 'غير متوفر بعد')}</p>}</div>
        : ZONES.map(([z, fr, en, ar]) => <div key={z} className="mb-2"><p className="px-1 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted">{L(lang, en, fr, ar)}</p><div className="space-y-1">{COUNTRIES.filter((c) => c.zone === z).map((c) => <Row key={c.id} id={c.id} />)}</div></div>)}
      <p className="mt-3 text-xs text-muted">{L(lang, 'Currency, stores and prices change at once. Your week stays, with the local cuisine for new dishes. Prices are a local estimate.', 'La devise, les magasins et les prix changent tout de suite. Votre semaine reste, la cuisine locale sert pour les nouveaux plats. Prix : estimation locale.', 'تتغير العملة والمتاجر والأسعار فوراً.')}</p>
    </Sheet>
  )
}
export const flagOf = (id: string) => countryOf(id).f
