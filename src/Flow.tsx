import { Camera, History, Share2, ShoppingCart, Store } from 'lucide-react'
import { CartMode, iconOf, type CartItem } from './Cart'
import { PRODUCTS, norm } from './data/products'
import { CATALOG } from './data/catalog'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { CHAIN, chainKey } from './lib/countries'
import { curRate, curSym, money, money2, rname, t, type Lang } from './lib/i18n'
import { buildList, fmtQty, type Line } from './lib/engine'
import type { Aisle } from './data/catalog'
import { REC } from './data/recipes'
import { SIDE } from './data/sides'
import { HOME, HOME_BY } from './data/home'
import { storesNow, splitTotal, storeTotal } from './lib/stores'
import { Num, PriceDial, Sheet, Swipe } from './ui'
import { dayName } from './lib/i18n'
import { FridgeSheet } from './Extra'

const li = (l: Lang) => (l === 'en' ? 0 : l === 'ar' ? 2 : 1)
const AISLE: Record<Aisle, [string, string, string, string]> = {
  produce: ['Fruit & veg', 'Fruits & légumes', 'خضر وفواكه', '🥬'], meat: ['Meat & fish', 'Viande & poisson', 'لحوم وأسماك', '🥩'], dairy: ['Dairy & eggs', 'Laitier & œufs', 'ألبان وبيض', '🥚'],
  grocery: ['Grocery', 'Épicerie', 'بقالة', '🫙'], bakery: ['Bakery', 'Boulangerie', 'مخبزة', '🥖'], spices: ['Spices', 'Épices', 'توابل', '🧂'],
}
const m2 = (n: number, l: Lang) => money2(n, l)
const stepOf = (l: Line) => (l.ing.base === 'pc' ? 1 : l.buy < 100 && l.ing.aisle === 'spices' ? 10 : 50)
const unitP = (l: Line, m: number) => l.ing.base === 'pc' ? `${money2(l.ing.p * m, 'fr')}/u` : `${money2(l.ing.p * m * 1000, 'fr')}/${l.ing.base === 'g' ? 'kg' : 'L'}`
const useName = (u: string, lang: Lang) => (u === 'basics' ? t('basics', lang) : SIDE[u] ? SIDE[u].n[li(lang)] : REC[u] ? rname(REC[u].n, lang) : u)

/** Everything in the basket with one total. Estimates use the chosen store's price index when one is picked. */
export function useBasket() {
  const { house } = useApp(); const h = house!
  const lines = useMemo(() => buildList(h.plan, h.pantry, h.extras ?? {}, h.qty ?? {}), [h.plan, h.pantry, h.extras, h.qty])
  const store = storesNow().find((s) => s.id === h.store)
  const mul = (a: Aisle) => (store ? store.m[a] : 1)
  const homeRows = HOME.filter((x) => (h.home?.[x.id] ?? 0) > 0).map((x) => ({ ...x, q: h.home![x.id] }))
  const custom = h.custom ?? []
  const items = [
    ...lines.filter((l) => l.buy > 0).map((l) => ({ key: l.id, est: l.cost * mul(l.ing.aisle) })),
    ...homeRows.map((x) => ({ key: 'h:' + x.id, est: x.q * x.p * mul('grocery') })),
    ...custom.map((c) => ({ key: 'c:' + c.id, est: c.price })),
  ]
  const price = (k: string, est: number) => h.paid?.[k] ?? est
  const total = items.reduce((a, x) => a + price(x.key, x.est), 0)
  const spent = items.filter((x) => h.checked[x.key]).reduce((a, x) => a + price(x.key, x.est), 0)
  const homeCost = homeRows.reduce((a, x) => a + x.q * x.p, 0); const customCost = custom.reduce((a, c) => a + c.price, 0)
  return { lines, homeRows, custom, store, mul, price, total, spent, items, homeCost, customCost, extraCost: homeCost + customCost }
}


/** The whole week's basket as caddie cards + the "finish the trip" action, shared by Courses and the floating caddie button. */
export function useCart() {
  const { lang, house, upHouse, toast } = useApp()
  const { lines, homeRows, custom, store, mul, price } = useBasket()
  const cart: CartItem[] = [
    ...(Object.keys(AISLE) as Aisle[]).flatMap((a) => lines.filter((l) => l.buy > 0 && l.ing.aisle === a).map((l) => ({ key: l.id, name: l.ing.n[li(lang)], q: fmtQty(l.buy, l.ing.base), price: price(l.id, l.cost * mul(a)), e: iconOf(l.id, a), aisle: AISLE[a][li(lang)] }))),
    ...homeRows.map((x) => ({ key: 'h:' + x.id, name: x.n[li(lang)], q: `×${x.q}`, price: price('h:' + x.id, x.q * x.p * mul('grocery')), e: x.e, aisle: t('maison', lang) })),
    ...custom.map((c) => ({ key: 'c:' + c.id, name: c.name, q: c.qty, price: price('c:' + c.id, c.price), e: c.e ?? '📝', aisle: t('mine', lang) })),
  ]
  const finish = (done?: () => void) => {
    const chk = house!.checked
    const all = [...lines.map((l) => ({ k: l.id, n: l.ing.n[li(lang)], q: fmtQty(l.buy, l.ing.base), est: l.cost * mul(l.ing.aisle) })), ...homeRows.map((x) => ({ k: 'h:' + x.id, n: x.n[li(lang)], q: `×${x.q}`, est: x.q * x.p * mul('grocery') })), ...custom.map((c) => ({ k: 'c:' + c.id, n: c.name, q: c.qty, est: c.price }))]
    const got = all.filter((x) => chk[x.k]).map((x) => ({ n: x.n, q: x.q, p: Math.round(price(x.k, x.est) * 100) / 100 }))
    const trip = { t: Date.now(), store: store?.name, total: Math.round(got.reduce((a, x) => a + x.p, 0) * 100) / 100, items: got, missed: Object.keys(house!.missing ?? {}).length }
    upHouse((h) => { for (const l of lines) if (h.checked[l.id]) h.pantry[l.id] = (h.pantry[l.id] ?? 0) + l.buy; h.trips = [trip, ...(h.trips ?? [])].slice(0, 30); h.checked = {}; h.qty = {}; h.home = {}; h.custom = []; h.paid = {}; h.missing = {} }, 'finished the trip'); toast(t('pantry', lang) + ' ✓'); done?.()
  }
  const left = cart.filter((x) => !house!.checked[x.key] && !house!.missing?.[x.key]).length
  return { cart, finish, left }
}

/** Shopping: live budget (planned / spent / left), big checkboxes, tap a price to enter what you really paid. */
export function CoursesTab({ celebrate, goStores, compose }: { celebrate: () => void; goStores: () => void; compose: () => void }) {
  const [sure, setSure] = useState(false)
  const { lang, me, house, upHouse, award, toast } = useApp()
  const { lines, homeRows, custom, store, mul, price, total, spent, items } = useBasket()
  const [edit, setEdit] = useState<{ key: string; name: string; est: number; line?: Line } | null>(null)
  const [val, setVal] = useState('')
  const [homeOpen, setHomeOpen] = useState(false); const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ name: '', qty: '', price: '', note: '' })
  const [q, setQ] = useState(''); const [free, setFree] = useState(false)
  // Search over everyday products + the recipe ingredient catalog, accent-insensitive.
  const found = useMemo(() => {
    const nq = norm(q.trim()); const lx = lang === 'en' ? 'en' : lang === 'ar' ? 'ar' : 'fr'
    const all = [...PRODUCTS.map((x) => ({ key: x.id, name: x[lx], e: x.e, p: x.p, u: x.u, hay: norm(`${x.fr} ${x.en} ${x.ar}`) })), ...CATALOG.filter((c) => !PRODUCTS.some((x) => norm(x.fr) === norm(c.n[1]))).map((c) => ({ key: 'i:' + c.id, name: c.n[li(lang)], e: iconOf(c.id, c.aisle), p: c.base === 'pc' ? c.p : c.p * 1000, u: c.base === 'pc' ? 'pc' : 'kg', hay: norm(c.n.join(' ')) }))]
    return (nq ? all.filter((x) => x.hay.includes(nq)).sort((a, b) => Number(!norm(a.name).startsWith(nq)) - Number(!norm(b.name).startsWith(nq)) || a.name.length - b.name.length) : all.slice(0, 24)).slice(0, 40)
  }, [q, lang])
  const quickAdd = (name: string, e: string, p: number, u: string) => { upHouse((h) => { h.custom = [...(h.custom ?? []), { id: Math.random().toString(36).slice(2, 8), name, qty: u === 'kg' ? '1 kg' : u === 'bunch' ? '1' : '×1', price: Math.round(p * 100) / 100, note: '', e }] }, `+ ${name}`); toast(`＋ ${name}`) }
  const budget = me!.budget; const chk = house!.checked
  const done = items.filter((x) => chk[x.key]).length
  const pace = total; const over = pace > budget
  const day = house!.listDay ?? -1; const [fridge, setFridge] = useState(false)
  const dayLines = useMemo(() => day < 0 ? lines : buildList(Object.fromEntries(Object.entries(house!.plan).filter(([k]) => k.startsWith(day + '-'))), house!.pantry, {}, {}), [day, lines, house])
  const buy = dayLines.filter((l) => l.buy > 0 || l.auto > 0)
  const setDay = (d: number) => upHouse((h) => { h.listDay = d })
  const TODAY = (new Date().getDay() + 6) % 7
  // Save the list on screen (week, today or tomorrow) so it can be found, shared or reused later.
  const saveList = () => { const label = day < 0 ? t('lWeek', lang) : day === (TODAY + 1) % 7 ? (lang === 'en' ? 'Tomorrow' : 'Demain') + ' · ' + dayName(day, lang) : dayName(day, lang)
    const its = buy.filter((l) => l.buy > 0).map((l) => ({ n: l.ing.n[li(lang)], q: fmtQty(l.buy, l.ing.base), p: Math.round(price(l.id, l.cost * mul(l.ing.aisle)) * 100) / 100 }))
    if (!its.length) { toast(lang === 'en' ? 'Nothing to buy here' : 'Rien à acheter ici'); return }
    upHouse((h) => { h.saved = [{ t: Date.now(), label, items: its }, ...(h.saved ?? [])].slice(0, 10) }, `📌 ${label}`); toast(`📌 ${label} · ${its.length} ${lang === 'en' ? 'items saved' : 'articles enregistrés'}`) }
  const share = async () => {
    const L = (n: string, q: string, p: number) => `${chk[n] ? '✅' : '⬜'} ${q} · ${p.toFixed(2)}`
    const txt = [`🛒 KUZINTI · ${day < 0 ? t('lWeek', lang) : dayName(day, lang)}`, ...buy.map((l) => L(l.id, `${l.ing.n[li(lang)]} — ${fmtQty(l.buy, l.ing.base)}`, price(l.id, l.cost * mul(l.ing.aisle)))),
      ...(day < 0 ? [...homeRows.map((x) => L('h:' + x.id, `${x.n[li(lang)]} — ×${x.q}`, price('h:' + x.id, x.q * x.p * mul('grocery')))), ...custom.map((c) => L('c:' + c.id, `${c.name}${c.qty ? ' — ' + c.qty : ''}${c.note ? ' (' + c.note + ')' : ''}`, price('c:' + c.id, c.price)))] : []),
      `TOTAL ≈ ${money(day < 0 ? total : buy.reduce((a, l) => a + price(l.id, l.cost * mul(l.ing.aisle)), 0), lang)}`].join('\n')
    setShareTxt(txt)
  }
  const [shareTxt, setShareTxt] = useState<string | null>(null)
  const copy = async (x: string, msg: string) => { try { await navigator.clipboard.writeText(x); toast(msg) } catch { toast(x) } }
  const groups = (Object.keys(AISLE) as Aisle[]).map((a) => [a, buy.filter((l) => l.ing.aisle === a)] as const).filter(([, v]) => v.length)
  const toggle = (key: string, name: string) => {
    const on = !chk[key]; upHouse((h) => { h.checked[key] = on }, on ? `✔ ${name}` : `↩ ${name}`)
    if (on) { if (done + 1 === items.length) { celebrate(); award(40, t('tripDone', lang)) } else award(2, name) }
  }
  const openEdit = (key: string, name: string, est: number, line?: Line) => { setEdit({ key, name, est, line }); setVal(house!.paid?.[key] !== undefined ? String(Math.round(house!.paid![key] * curRate() * 100) / 100) : '') }
  const savePaid = () => { if (!edit) return; const v = parseFloat(val.replace(',', '.')) / curRate(); upHouse((h) => { const p = { ...(h.paid ?? {}) }; if (isNaN(v)) delete p[edit.key]; else p[edit.key] = v; h.paid = p; if (!isNaN(v)) h.checked[edit.key] = true }); setEdit(null) }
  const cart: CartItem[] = [
    ...groups.flatMap(([a, rows]) => rows.filter((l) => l.buy > 0).map((l) => ({ key: l.id, name: l.ing.n[li(lang)], q: fmtQty(l.buy, l.ing.base), price: price(l.id, l.cost * mul(a)), e: iconOf(l.id, a), aisle: AISLE[a][li(lang)] }))),
    ...(day < 0 ? [...homeRows.map((x) => ({ key: 'h:' + x.id, name: x.n[li(lang)], q: `×${x.q}`, price: price('h:' + x.id, x.q * x.p * mul('grocery')), e: x.e, aisle: t('maison', lang) })), ...custom.map((c) => ({ key: 'c:' + c.id, name: c.name, q: c.qty, price: price('c:' + c.id, c.price), e: c.e ?? '📝', aisle: t('mine', lang) }))] : []),
  ]
  const [cartOpen, setCartOpen] = useState(false); const [histOpen, setHistOpen] = useState(false)
  const { finish: endTrip } = useCart(); const finish = () => endTrip(celebrate)
  const saveCustom = () => { if (!f.name.trim()) return; upHouse((h) => { h.custom = [...(h.custom ?? []), { id: Math.random().toString(36).slice(2, 8), name: f.name.trim(), qty: f.qty.trim(), price: Math.max(0, parseFloat(f.price.replace(',', '.')) || 0), note: f.note.trim() }] }, `+ ${f.name.trim()}`); setF({ name: '', qty: '', price: '', note: '' }); setAdding(false) }
  // Swipe a row away when it is not needed: recipe items go to "already have", house items to 0, own items are removed. Undo for 6 s.
  const [gone, setGone] = useState<{ n: string; undo: () => void } | null>(null)
  useEffect(() => { if (!gone) return; const id = setTimeout(() => setGone(null), 6000); return () => clearTimeout(id) }, [gone])
  const remove = (k: string, name: string, line?: Line) => {
    if (line) { const was = house!.pantry[line.id]; upHouse((h) => { h.pantry[line.id] = (was ?? 0) + line.buy }, `🗑 ${name}`); setGone({ n: name, undo: () => upHouse((h) => { if (was === undefined) delete h.pantry[line.id]; else h.pantry[line.id] = was }) }) }
    else if (k.startsWith('h:')) { const id = k.slice(2); const was = house!.home?.[id] ?? 0; upHouse((h) => { h.home = { ...(h.home ?? {}), [id]: 0 } }, `🗑 ${name}`); setGone({ n: name, undo: () => upHouse((h) => { h.home = { ...(h.home ?? {}), [id]: was } }) }) }
    else if (k.startsWith('c:')) { const id = k.slice(2); const c = custom.find((x) => x.id === id); upHouse((h) => { h.custom = (h.custom ?? []).filter((x) => x.id !== id) }, `🗑 ${name}`); if (c) setGone({ n: name, undo: () => upHouse((h) => { h.custom = [...(h.custom ?? []), c] }) }) }
  }
  const Row = ({ k, name, sub, est, line, q, e }: { k: string; name: string; sub: string; est: number; line?: Line; q?: string; e?: string }) => { const on = !!chk[k]; const paid = house!.paid?.[k]; const no = !!house!.missing?.[k]; return (
    <Swipe onDelete={() => remove(k, name, line)} label={lang === 'en' ? 'Remove' : lang === 'ar' ? 'حذف' : 'Supprimer'} rtl={lang === 'ar'}>
    <div className={`flex items-center gap-3 py-2 transition-opacity ${on || no ? 'opacity-70' : ''}`}>
      <button data-on={on} className={`chk relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl transition active:scale-90 ${on ? 'bg-leaf/35' : 'bg-cream'}`} onClick={() => toggle(k, name)} aria-pressed={on} aria-label={name}><span className={on ? 'pop' : ''}>{e ?? '🛒'}</span>{on && <span className="pop absolute -bottom-1 -end-1 grid h-6 w-6 place-items-center rounded-full bg-forest text-xs font-bold text-white ring-2 ring-surface">✓</span>}{no && !on && <span className="absolute -bottom-1 -end-1 grid h-6 w-6 place-items-center rounded-full bg-muted text-xs font-bold text-white ring-2 ring-surface">✕</span>}</button>
      <button className="min-w-0 flex-1 text-start" onClick={() => openEdit(k, name, est, line)}><span className={`block truncate font-semibold ${on ? 'text-muted line-through' : ''}`}>{name}</span>{sub && <span className="block truncate text-xs text-muted">{sub}</span>}</button>
      <button className={`shrink-0 rounded-xl px-2.5 py-1 text-end tabular-nums ${paid !== undefined ? 'bg-leaf/30' : 'bg-cream'}`} onClick={() => openEdit(k, name, est, line)}>
        {q && <span className="block text-[15px] font-extrabold leading-tight text-forest">{q}</span>}
        <span className="block text-xs font-semibold leading-tight text-ink">{m2(price(k, est), lang)}</span>
      </button>
    </div></Swipe>) }
  return (
    <div className="space-y-3">
      {cart.length > 0 && <button className="fade-up flex w-full items-center gap-3 rounded-[24px] bg-forest p-4 text-start text-white shadow-lg active:scale-[.98]" onClick={() => setCartOpen(true)}>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15"><ShoppingCart size={28} aria-hidden /></span>
        <span className="min-w-0 flex-1"><b className="block font-display text-lg leading-tight">{lang === 'en' ? 'Start store mode' : 'Lancer le mode magasin'}</b><span className="block text-xs text-white/80">{lang === 'en' ? 'One hand, one swipe per product' : 'Une main, un geste par produit'} · {cart.filter((x) => !chk[x.key]).length} / {cart.length}</span></span>
        <span className="text-2xl" aria-hidden>→</span>
      </button>}
      <CartMode open={cartOpen} onClose={() => setCartOpen(false)} items={cart} onFinish={finish} />
      {!store && <button className="card fade-up flex w-full items-center gap-3 border-2 border-apricot p-4 text-start" onClick={goStores}><span className="text-3xl">🏬</span><span className="flex-1"><b className="block font-display">{lang === 'en' ? 'First, pick your store' : 'D’abord, choisis ton magasin'}</b><span className="text-xs text-muted">{lang === 'en' ? 'Your list will use its prices.' : 'Ta liste utilisera ses prix. Compare les magasins en un coup d’œil.'}</span></span><span className="text-xl text-forest">→</span></button>}
      <div className="card p-4">
        <div className="grid grid-cols-4 gap-1 text-center">
          {([[t('budgetW', lang), budget, 'ink'], [t('taken', lang), spent, 'forest'], [t('toTake', lang), pace - spent, 'ink'], [t('solde', lang), budget - pace, budget - pace < 0 ? 'danger' : 'forest']] as [string, number, string][]).map(([l, v, c]) => (
            <div key={l} className="rounded-xl bg-cream/60 px-1 py-1.5"><p className="text-[10px] font-semibold uppercase leading-tight text-muted">{l}</p><p className="whitespace-nowrap font-display text-[13px] font-extrabold tabular-nums" style={{ color: `rgb(var(--${c}))` }}><Num v={v} fmt={(x) => money(x, lang)} /></p></div>))}
        </div>
        <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-cream">
          <div className="absolute inset-y-0 start-0 rounded-full bg-leaf/50 transition-all duration-500" style={{ width: `${Math.min(100, (pace / budget) * 100)}%` }} />
          <div className="absolute inset-y-0 start-0 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (spent / budget) * 100)}%`, background: over ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }} />
        </div>
        <p className="mt-2 text-xs" style={{ color: over ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }}><b>{t('pace', lang)}: {money(pace, lang)}</b> · {over ? `${t('overBy', lang)} ${money(pace - budget, lang)}` : `${money(budget - pace, lang)} ${t('saving', lang)}`}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn btn-soft !min-h-11 !text-sm" onClick={goStores}><Store size={16} className="inline -mt-0.5" aria-hidden /> {t('compareStores', lang)}</button>
          <button className="btn btn-primary !min-h-11 !text-sm" onClick={share}><Share2 size={16} className="inline -mt-0.5" aria-hidden /> {t('shareList', lang)}</button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">{t('pricesAt', lang)}: {store ? store.name : t('avgPrice', lang)} · {t('qtyHint', lang)}</p>
      </div>
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        <div className="flex shrink-0 rounded-full bg-surface p-1 shadow-soft">{([[-1, t('lWeek', lang)], [TODAY, lang === 'en' ? 'Today' : 'Aujourd’hui'], [(TODAY + 1) % 7, lang === 'en' ? 'Tomorrow' : 'Demain']] as [number, string][]).map(([d, l]) => <button key={l} className={`rounded-full px-3 py-1.5 text-xs font-bold ${day === d ? 'bg-forest text-white' : 'text-muted'}`} onClick={() => setDay(d)}>{l}</button>)}</div>
        <button className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-bold shadow-soft" onClick={saveList}>📌 {lang === 'en' ? 'Save list' : 'Enregistrer'}</button>
        <button className="shrink-0 rounded-full bg-forest px-3 py-1.5 text-xs font-bold text-white shadow-soft" onClick={() => setAdding(true)}>＋ {lang === 'en' ? 'Product' : 'Produit'}</button>
        <button className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-bold shadow-soft" onClick={() => setHistOpen(true)}><History size={14} className="inline -mt-0.5" aria-hidden /> {lang === 'en' ? 'My lists' : 'Mes listes'}</button>
        <button className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-bold shadow-soft" onClick={() => setFridge(true)}><Camera size={14} className="inline -mt-0.5" aria-hidden /> {t('fridgeS', lang)}</button>
      </div>
      {day >= 0 && <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4">{Array.from({ length: 7 }, (_, d) => <button key={d} className={`chip shrink-0 capitalize ${d === day ? '!bg-forest !text-white' : ''}`} onClick={() => setDay(d)}>{dayName(d, lang).slice(0, 3)}</button>)}</div>}
      <FridgeSheet open={fridge} onClose={() => setFridge(false)} />
      {!Object.keys(house!.plan).length && !homeRows.length && !custom.length && <div className="card fade-up space-y-3 p-6 text-center"><p className="text-4xl">🛒</p><p className="font-display text-lg font-extrabold">{t('emptyListT', lang)}</p><p className="text-sm text-muted">{t('emptyListD', lang)}</p><button className="btn btn-primary w-full" onClick={compose}>✨ {t('composeAuto', lang)}</button><p className="text-xs text-muted">{t('emptyListOr', lang)}</p></div>}
      <p className="px-1 text-xs text-muted">{done}/{items.length} · {lang === 'en' ? 'Tap to tick · swipe left to remove' : lang === 'ar' ? 'المس للتأشير · اسحب للحذف' : 'Touchez pour cocher · glissez à gauche (ou survolez sur PC) pour supprimer'}</p>
      {gone && <div className="toast fixed inset-x-0 bottom-28 z-40 mx-auto flex w-[min(92vw,420px)] items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-lift" role="status"><span className="flex-1 truncate">🗑 {gone.n}</span><button className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold" onClick={() => { gone.undo(); setGone(null) }}>↩ {t('undo', lang)}</button></div>}
      {groups.map(([a, rows]) => (
        <div key={a} className="card px-4 py-2"><h3 className="pt-1 text-xs font-bold uppercase tracking-wider text-muted">{AISLE[a][3]} {AISLE[a][li(lang)]}</h3>
          <div className="divide-y divide-line/60">{rows.map((l) => <Row key={l.id} k={l.id} name={l.ing.n[li(lang)]} q={fmtQty(l.buy, l.ing.base)} sub={`${unitP(l, mul(a))} · ${l.uses.map((u) => useName(u, lang)).join(', ')}`} est={l.cost * mul(a)} line={l} e={iconOf(l.id, a)} />)}</div></div>
      ))}
      <div className="card px-4 py-2">
        <button className="flex w-full items-center justify-between py-1.5" onClick={() => setHomeOpen(!homeOpen)} aria-expanded={homeOpen}><h3 className="text-xs font-bold uppercase tracking-wider text-muted">🏠 {t('maison', lang)} · {homeRows.length}</h3><span className="text-sm font-bold text-forest">{homeOpen ? '−' : '＋'}</span></button>
        {homeOpen && <div className="grid grid-cols-4 gap-1.5 pb-2">{HOME.map((x) => { const q = house!.home?.[x.id] ?? 0; return <button key={x.id} className={`rounded-xl border p-1.5 text-center active:scale-95 ${q ? 'border-forest bg-leaf/20' : 'border-line'}`} onClick={() => upHouse((h) => { h.home = { ...(h.home ?? {}), [x.id]: q ? 0 : 1 } })} aria-pressed={q > 0}><div className="text-xl">{x.e}</div><div className="line-clamp-2 text-[10px] font-semibold leading-tight">{x.n[li(lang)]}</div></button> })}</div>}
        <div className="divide-y divide-line/60">{homeRows.map((x) => <Row key={x.id} k={'h:' + x.id} e={x.e} name={HOME_BY[x.id].n[li(lang)]} q={`×${x.q}`} sub='' est={x.q * x.p * mul('grocery')} />)}</div>
      </div>
      <div className="card px-4 py-2">
        <h3 className="pt-1 text-xs font-bold uppercase tracking-wider text-muted">✍️ {t('mine', lang)}</h3>
        <div className="divide-y divide-line/60">{custom.map((c) => <Row key={c.id} k={'c:' + c.id} e={c.e ?? '📝'} name={c.name} q={c.qty || undefined} sub={c.note} est={c.price} />)}</div>
        <button className="w-full py-2.5 text-start text-sm font-bold text-forest" onClick={() => setAdding(true)}>＋ {t('addProd', lang)}</button>
      </div>
      {done > 0 && (sure
        ? <div className="card fade-up space-y-2 p-4 text-center"><p className="text-sm">{t('finishSure', lang)}</p><div className="flex gap-2"><button className="btn btn-soft flex-1" onClick={() => setSure(false)}>{t('cancel', lang)}</button><button className="btn btn-primary flex-1" onClick={() => { setSure(false); finish() }}>✓ {t('confirm', lang)}</button></div></div>
        : <button className="btn btn-primary w-full !min-h-14" onClick={() => setSure(true)}>✓ {t('finish', lang)}</button>)}

      <Sheet open={!!shareTxt} onClose={() => setShareTxt(null)} title={lang === 'en' ? 'Share the list' : lang === 'ar' ? 'مشاركة القائمة' : 'Partager la liste'}>
        {shareTxt && <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[22px] bg-forest p-4 text-white">
            <span className="zellige pointer-events-none absolute inset-0 opacity-[.07]" aria-hidden />
            <p className="relative text-[11px] font-bold uppercase tracking-[.16em] text-apricot">{lang === 'en' ? 'Live with my partner' : lang === 'ar' ? 'مباشرة مع شريكي' : 'En direct avec mon partenaire'}</p>
            <div className="relative mt-1 flex items-center gap-3"><b className="flex-1 font-display text-[32px] font-extrabold tracking-[.18em] tabular-nums">{house!.code}</b>
              <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-forest active:scale-95" onClick={() => copy(house!.code, lang === 'en' ? 'Code copied' : 'Code copié')}>{lang === 'en' ? 'Copy' : 'Copier'}</button></div>
            <p className="relative mt-1 text-xs text-white/80">{lang === 'en' ? 'Your partner opens KUZINTI, taps “Join with a code” and sees the same list, ticks and prices in real time.' : lang === 'ar' ? 'يفتح شريكك كوزينتي ويدخل هذا الرمز ليرى نفس القائمة مباشرة.' : 'Votre partenaire ouvre KUZINTI, touche « Rejoindre avec un code » et voit la même liste, les cases cochées et les prix en temps réel.'}</p>
            <button className="relative mt-3 w-full rounded-2xl bg-white/15 py-2.5 text-sm font-bold active:scale-[.98]" onClick={() => { const m = (lang === 'en' ? 'Join my KUZINTI household to share our shopping list: code ' : 'Rejoins mon foyer KUZINTI pour partager notre liste de courses : code ') + house!.code + ' · ' + location.origin; window.open('https://wa.me/?text=' + encodeURIComponent(m), '_blank') }}>💬 {lang === 'en' ? 'Send the code on WhatsApp' : 'Envoyer le code par WhatsApp'}</button>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{lang === 'en' ? 'Or send the list as text' : 'Ou envoyer la liste en texte'}</p>
          <div className="grid grid-cols-3 gap-2">
            {([['💬', 'WhatsApp', () => window.open('https://wa.me/?text=' + encodeURIComponent(shareTxt), '_blank')], ['✉️', 'Mail', () => { location.href = 'mailto:?subject=' + encodeURIComponent('🛒 KUZINTI') + '&body=' + encodeURIComponent(shareTxt) }], ['📋', lang === 'en' ? 'Copy' : 'Copier', () => copy(shareTxt, t('shared', lang))]] as [string, string, () => void][]).map(([e, l, f]) => (
              <button key={l} className="dash-tile flex flex-col items-center gap-1 rounded-2xl bg-cream py-3 text-sm font-bold active:scale-95" onClick={f}><span className="text-2xl">{e}</span>{l}</button>))}
          </div>
          {typeof navigator !== 'undefined' && 'share' in navigator && <button className="btn btn-soft w-full" onClick={() => navigator.share({ text: shareTxt }).catch(() => undefined)}>{lang === 'en' ? 'Other apps…' : 'Autres applications…'}</button>}
        </div>}
      </Sheet>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.name ?? ''}>
        {edit && <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); savePaid() }}>
          {edit.line && <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-2"><span className="font-semibold">{fmtQty(edit.line.buy, edit.line.ing.base)}</span><span className="flex gap-2"><button type="button" className="btn btn-soft !min-h-9 !w-9 !px-0" onClick={() => { const l = edit.line!; upHouse((h) => { h.qty = { ...(h.qty ?? {}), [l.id]: Math.max(0, l.buy - stepOf(l)) } }); setEdit(null) }}>−</button><button type="button" className="btn btn-soft !min-h-9 !w-9 !px-0" onClick={() => { const l = edit.line!; upHouse((h) => { h.qty = { ...(h.qty ?? {}), [l.id]: l.buy + stepOf(l) } }); setEdit(null) }}>+</button></span></div>}
          <div><p className="mb-2 text-sm font-semibold">{t('paid', lang)}</p>
            <PriceDial value={parseFloat(val.replace(',', '.')) || (val === '0' ? 0 : Math.round(edit.est * curRate() * 100) / 100)} est={Math.round(edit.est * curRate() * 100) / 100} onChange={(n) => setVal(String(n))} fmt={(n) => m2(n / curRate(), lang)} />
            <label htmlFor="paid" className="mt-3 flex items-center gap-2 text-xs text-muted">{lang === 'en' ? 'Or type it' : 'Ou tapez-le'} <input id="paid" inputMode="decimal" className="input !h-9 flex-1 !text-sm" placeholder={(edit.est * curRate()).toFixed(2)} value={val} onChange={(e) => setVal(e.target.value)} /> {curSym()}</label></div>
          <button className="btn btn-primary w-full">{t('save', lang)}</button>
        </form>}
      </Sheet>
      <Sheet open={histOpen} onClose={() => setHistOpen(false)} title={lang === 'en' ? 'My lists and history' : 'Mes listes et historique'}>
        {(house!.saved ?? []).length > 0 && <div className="mb-4 space-y-2"><p className="text-xs font-bold uppercase tracking-wider text-muted">📌 {lang === 'en' ? 'Saved lists' : 'Listes enregistrées'}</p>
          {house!.saved!.map((sv, k) => <details key={sv.t} className="rounded-2xl bg-cream/70 p-3"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold"><span className="flex-1 capitalize">{sv.label}</span><span className="text-xs font-semibold text-muted">{sv.items.length} · {money(sv.items.reduce((a, x) => a + x.p, 0), lang)}</span></summary>
            <ul className="mt-2 space-y-1 text-sm">{sv.items.map((x, j) => <li key={j} className="flex justify-between gap-2"><span>{x.n} <span className="text-muted">· {x.q}</span></span><span className="tabular-nums">{money2(x.p, lang)}</span></li>)}</ul>
            <div className="mt-2 flex gap-2"><button className="btn btn-soft !min-h-9 flex-1 !text-xs" onClick={async () => { const txt = [`🛒 ${sv.label}`, ...sv.items.map((x) => `⬜ ${x.n} — ${x.q}`)].join('\n'); try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); toast(t('shared', lang)) } } catch { /* cancelled */ } }}>📤 {lang === 'en' ? 'Share' : 'Partager'}</button><button className="btn btn-soft !min-h-9 !text-xs text-danger" onClick={() => upHouse((h) => { h.saved = (h.saved ?? []).filter((_, i) => i !== k) }, '🗑 liste')}>🗑</button></div>
          </details>)}</div>}
        {!(house!.trips ?? []).length ? <p className="py-6 text-center text-sm text-muted">{lang === 'en' ? 'Your finished shopping trips will appear here, with date, store and total.' : 'Vos courses terminées apparaîtront ici, avec la date, le magasin et le total.'}</p>
          : <div className="space-y-2">{house!.trips!.map((tr) => (
            <details key={tr.t} className="group rounded-2xl border border-line p-3">
              <summary className="flex cursor-pointer list-none items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream"><ShoppingCart size={18} className="text-forest" aria-hidden /></span><span className="min-w-0 flex-1"><b className="block text-sm capitalize">{new Date(tr.t).toLocaleDateString(lang === 'ar' ? 'ar-MA-u-nu-latn' : lang, { weekday: 'long', day: 'numeric', month: 'long' })}</b><span className="block text-xs text-muted">{tr.store ?? '—'} · {tr.items.length} {lang === 'en' ? 'items' : 'articles'}{tr.missed ? ` · ${tr.missed} ${lang === 'en' ? 'not found' : 'pas trouvés'}` : ''}</span></span><b className="tabular-nums text-forest">{money(tr.total, lang)}</b></summary>
              <div className="mt-2 space-y-1 border-t border-line/70 pt-2 text-sm">{tr.items.map((it, i) => <p key={i} className="flex justify-between gap-2"><span className="truncate">{it.n} <span className="text-muted">· {it.q}</span></span><span className="shrink-0 tabular-nums">{m2(it.p, lang)}</span></p>)}</div>
            </details>))}</div>}
      </Sheet>
      <Sheet open={adding} onClose={() => { setAdding(false); setQ(''); setFree(false) }} title={t('addProd', lang)}>
        {!free ? <div>
          <input autoFocus className="input !min-h-12 text-lg" placeholder={lang === 'en' ? '🔍 Search a product (milk, apples…)' : '🔍 Chercher un produit (lait, pommes…)'} value={q} onChange={(e) => setQ(e.target.value)} aria-label={lang === 'en' ? 'Search a product' : 'Chercher un produit'} />
          <div className="mt-2 max-h-[52vh] divide-y divide-line/60 overflow-y-auto">
            {found.map((x) => { const n = custom.filter((c) => c.name === x.name).length; return (
              <button key={x.key} className="flex w-full items-center gap-3 py-2.5 text-start active:bg-cream" onClick={() => quickAdd(x.name, x.e, x.p, x.u)}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cream text-2xl">{x.e}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{x.name}</span><span className="text-xs text-muted">≈ {m2(x.p, lang)} / {x.u === 'kg' ? 'kg' : x.u === 'bunch' ? (lang === 'en' ? 'bunch' : 'botte') : (lang === 'en' ? 'unit' : 'unité')}</span></span>
                {n > 0 ? <span className="pop grid h-8 min-w-8 place-items-center rounded-full bg-forest px-2 text-sm font-bold text-white">×{n}</span> : <span className="grid h-8 w-8 place-items-center rounded-full bg-leaf/30 text-lg font-bold text-forest">＋</span>}
              </button>) })}
            {q.trim() && <button className="flex w-full items-center gap-3 py-3 text-start font-semibold text-forest" onClick={() => { setF({ ...f, name: q.trim() }); setFree(true) }}><span className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-dashed border-line">✍️</span>{lang === 'en' ? `Create “${q.trim()}”` : `Créer « ${q.trim()} »`}</button>}
          </div>
          <button className="btn btn-primary mt-3 w-full" onClick={() => { setAdding(false); setQ('') }}>{t('ok', lang)}</button>
        </div> : <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveCustom(); setFree(false); setQ('') }}>
          <input aria-label={t('pName', lang)} placeholder={t('pName', lang)} className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-3"><input aria-label={t('pQty', lang)} placeholder={t('pQty', lang)} className="input" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /><input aria-label={t('pPrice', lang)} placeholder={t('pPrice', lang)} inputMode="decimal" className="input" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <input aria-label={t('pNote', lang)} placeholder={t('pNote', lang)} className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <button className="btn btn-primary w-full" disabled={!f.name.trim()} style={{ opacity: f.name.trim() ? 1 : 0.5 }}>{t('save', lang)}</button>
        </form>}
      </Sheet>
    </div>
  )
}

/** Styled wordmark tiles (demo). Official logos are not bundled. */
const BRAND: Record<string, { bg: string; fg: string; font: string; txt: string }> = {
  bim: { bg: '#d33a2c', fg: '#fff', font: '900 1.35rem Manrope', txt: 'BIM' },
  marjane: { bg: '#fff', fg: '#c8102e', font: '800 1.1rem Manrope', txt: 'Marjane' },
  carrefour: { bg: '#fff', fg: '#1d5fa8', font: '800 1rem Manrope', txt: 'Carrefour' },
  aswak: { bg: '#e08a1e', fg: '#fff', font: '800 .85rem Manrope', txt: 'Aswak Assalam' },
  labelvie: { bg: '#fff', fg: '#e30613', font: '800 1rem Manrope', txt: "Label'Vie" },
  carrefourmkt: { bg: '#1d5fa8', fg: '#fff', font: '800 .78rem Manrope', txt: 'Carrefour Market' },
  acima: { bg: '#00953a', fg: '#fff', font: '900 1.1rem Manrope', txt: 'ACIMA' },
  supeco: { bg: '#ffd400', fg: '#e2001a', font: '900 1.05rem Manrope', txt: 'Supeco' },
  hanout: { bg: '#245B43', fg: '#F4F1E8', font: '800 .95rem Manrope', txt: '🏪 Hanout' },
  souk: { bg: '#F2B96B', fg: '#3c280a', font: '800 .95rem Manrope', txt: '🧺 Souk' },
  leclerc: { bg: '#fff', fg: '#0060a9', font: '800 .95rem Manrope', txt: 'E.Leclerc' },
  lidl: { bg: '#0050aa', fg: '#fff200', font: '900 1.2rem Manrope', txt: 'LIDL' },
  'carrefour-fr': { bg: '#fff', fg: '#1d5fa8', font: '800 1rem Manrope', txt: 'Carrefour' },
  auchan: { bg: '#fff', fg: '#e2001a', font: '800 1.05rem Manrope', txt: 'Auchan' },
  intermarche: { bg: '#e30613', fg: '#fff', font: '800 .78rem Manrope', txt: 'Intermarché' },
  monoprix: { bg: '#111', fg: '#fff', font: '800 .9rem Manrope', txt: 'Monoprix' },
  'marche-fr': { bg: '#F2B96B', fg: '#3c280a', font: '800 .95rem Manrope', txt: '🧺 Marché' },
  atacadao: { bg: '#f2c200', fg: '#1d3f8f', font: '800 .95rem Manrope', txt: 'Atacadão' },
}
export function StoreLogo({ id, w = 92 }: { id: string; w?: number }) {
  const nm = storesNow().find((s) => s.id === id)?.name ?? id; const kind = (storesNow().find((s) => s.id === id) as { kind?: string } | undefined)?.kind
  const ch = CHAIN[chainKey(nm)]
  const b = BRAND[id] ?? (ch ? { bg: ch[0], fg: ch[1], font: `800 ${nm.length > 10 ? '.78rem' : nm.length > 6 ? '.95rem' : '1.15rem'} Manrope`, txt: nm }
    : { bg: kind === 'm' ? '#F2B96B' : '#245B43', fg: kind === 'm' ? '#3c280a' : '#F4F1E8', font: '800 .76rem Manrope', txt: `${kind === 'm' ? '🧺' : '🏪'} ${nm}` })
  return <span className="grid shrink-0 place-items-center rounded-xl px-2 text-center leading-none shadow-soft" style={{ width: w, height: 44, background: b.bg, color: b.fg, font: b.font, boxShadow: '0 0 0 1px rgb(0 0 0 / .08)' }} aria-label={storesNow().find((s) => s.id === id)?.name}>{b.txt}</span>
}

/** Step 4: store comparison with a clear recommendation. Prices per store are a labelled demo index. */
export function StoresStep({ onShop }: { onShop: (id: string) => void }) {
  const { lang, house, upHouse, me } = useApp()
  const { lines, homeRows, custom, homeCost, customCost } = useBasket()
  const [open, setOpen] = useState<string | null>(null)
  const buy = lines.filter((l) => l.buy > 0)
  const tot = (s: ReturnType<typeof storesNow>[number]) => storeTotal(buy, s) + homeCost * s.m.grocery + customCost
  const rows = storesNow().map((s) => ({ s, tot: tot(s) })).sort((a, b) => a.tot - b.tot)
  const best = rows[0], worst = rows[rows.length - 1]; const split = splitTotal(buy) + homeCost * Math.min(...storesNow().map((s) => s.m.grocery)) + customCost
  const chosen = house!.store ?? best.s.id
  const st = storesNow().find((s) => s.id === open)
  const r2 = (n: number) => Math.round(n * 100) / 100
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold text-forest">{t('storesTitle', lang)}</h1>
      <p className="text-sm text-muted">{lang === 'en' ? 'Pick where you shop: go straight to your checklist, or open the detailed ticket to compare.' : 'Choisissez votre magasin : allez droit à votre checklist, ou ouvrez le ticket détaillé pour comparer.'}</p>
      {rows.map(({ s, tot }, i) => (
        <div key={s.id} className={`card rise p-3 transition-all ${chosen === s.id && house!.store ? '!shadow-[0_0_0_2px_rgb(var(--forest))]' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex items-center gap-3">
            <StoreLogo id={s.id} />
            <span className="min-w-0 flex-1">{i === 0 ? <span className="inline-block rounded-full bg-apricot px-2.5 py-0.5 text-[11px] font-bold text-[#3c280a]">👑 {t('best', lang)}</span> : <span className="text-xs text-muted">+{money(tot - best.tot, lang)}</span>}</span>
            <span className="text-end"><span className="block font-display text-xl font-extrabold tabular-nums text-forest">{money(tot, lang)}</span>{i === 0 && <span className="text-[11px] font-semibold text-forest">−{money(worst.tot - tot, lang)}</span>}</span>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <button className="btn btn-primary !min-h-11 !text-sm" onClick={() => { upHouse((h) => { h.store = s.id }); onShop(s.id) }}><ShoppingCart size={16} aria-hidden /> {lang === 'en' ? 'Shop here' : 'Mes courses ici'}</button>
            <button className="btn btn-soft !min-h-11 !text-sm" onClick={() => setOpen(s.id)}>🧾 {lang === 'en' ? 'Ticket' : 'Ticket'}</button>
          </div>
        </div>
      ))}
      <div className="card flex items-center justify-between gap-3 p-4"><span className="text-sm font-semibold">🔀 {t('split', lang)}</span><b className="tabular-nums">{money(split, lang)}</b></div>
      <p className="text-xs text-muted">{t('storesNote', lang)} {t('logoNote', lang)}</p>

      <Sheet open={!!st} onClose={() => setOpen(null)} title={st ? `${t('ticket', lang)} · ${st.name}` : ''}>
        {st && (() => {
          const food = buy.map((l) => ({ k: l.id, name: l.ing.n[li(lang)], q: fmtQty(l.buy, l.ing.base), unit: l.ing.p * st.m[l.ing.aisle] * (l.ing.base === 'pc' ? 1 : 1000), ub: l.ing.base === 'g' ? 'kg' : l.ing.base === 'ml' ? 'L' : 'pc', total: r2(l.cost * st.m[l.ing.aisle]) }))
          const home = homeRows.map((x) => ({ k: 'h' + x.id, name: `${x.e} ${x.n[li(lang)]}`, q: `×${x.q}`, unit: x.p * st.m.grocery, ub: 'pc', total: r2(x.q * x.p * st.m.grocery) }))
          const mine = custom.map((c) => ({ k: 'c' + c.id, name: c.name, q: c.qty, unit: 0, ub: '', total: c.price }))
          const all = [...food, ...home, ...mine]; const total = r2(all.reduce((a, x) => a + x.total, 0)); const budget = me!.budget
          return (
            <div>
              <div className="receipt p-4 text-[13px]">
                <div className="flex items-center justify-between"><StoreLogo id={st.id} w={104} /><span className="text-end text-[11px] text-muted">{new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA-u-nu-latn' : lang)}<br />{t('ticket', lang)} · demo</span></div>
                <div className="dash my-3" />
                <div className="space-y-1.5">
                  {all.map((x) => (
                    <div key={x.k} className="flex items-baseline gap-2"><span className="min-w-0 flex-1 truncate">{x.name}<span className="text-muted"> · {x.q}</span></span>{x.unit > 0 && <span className="shrink-0 text-[11px] text-muted tabular-nums">{x.unit.toFixed(1)}/{x.ub}</span>}<span className="w-14 shrink-0 text-end font-semibold tabular-nums">{x.total.toFixed(2)}</span></div>
                  ))}
                </div>
                <div className="dash my-3" />
                <div className="flex items-end justify-between"><span className="font-display text-base font-extrabold">{t('total', lang)}</span><span className="font-display text-2xl font-extrabold tabular-nums text-forest">{m2(total, lang)}</span></div>
                <div className="mt-1 flex justify-between text-xs" style={{ color: total > budget ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }}><span>{t('budgetW', lang)} {money(budget, lang)}</span><b>{total > budget ? t('overBy', lang) : t('left', lang)} {money(Math.abs(budget - total), lang)}</b></div>
                <div className="mt-3 h-8 opacity-70" style={{ background: 'repeating-linear-gradient(90deg, rgb(var(--ink)) 0 2px, transparent 2px 4px, rgb(var(--ink)) 4px 5px, transparent 5px 9px)' }} aria-hidden />
              </div>
              <p className="mb-3 text-[11px] text-muted">{t('storesNote', lang)}</p>
              <div className="grid gap-2"><button className="btn btn-primary" onClick={() => { upHouse((h) => { h.store = st.id }); setOpen(null); onShop(st.id) }}>🏬 {t('shopHere', lang)}</button><button className="btn btn-soft" onClick={() => { upHouse((h) => { h.store = st.id }); setOpen(null) }}>{chosen === st.id ? '✓ ' : ''}{t('chooseStore', lang)}</button></div>
            </div>
          )
        })()}
      </Sheet>
    </div>
  )
}
