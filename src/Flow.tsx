import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { money, rname, t, type Lang } from './lib/i18n'
import { buildList, fmtQty, type Line } from './lib/engine'
import type { Aisle } from './data/catalog'
import { REC } from './data/recipes'
import { HOME, HOME_BY } from './data/home'
import { STORES, splitTotal, storeTotal } from './lib/stores'
import { Sheet } from './ui'

const li = (l: Lang) => (l === 'en' ? 0 : l === 'fr' ? 1 : 2)
const AISLE: Record<Aisle, [string, string, string, string]> = {
  produce: ['Fruit & veg', 'Fruits & légumes', 'خضر وفواكه', '🥬'], meat: ['Meat & fish', 'Viande & poisson', 'لحوم وأسماك', '🥩'], dairy: ['Dairy & eggs', 'Laitier & œufs', 'ألبان وبيض', '🥚'],
  grocery: ['Grocery', 'Épicerie', 'بقالة', '🫙'], bakery: ['Bakery', 'Boulangerie', 'مخبزة', '🥖'], spices: ['Spices', 'Épices', 'توابل', '🧂'],
}
const BEMOJI: Record<string, string> = { tea: '🍵', sugar: '🍬', mint: '🌿', milk: '🥛', bread: '🥖', egg: '🥚', coffee: '☕', oil: '🫒', yogurt: '🥣', orange: '🍊', banana: '🍌', apple: '🍎', flour: '🌾', rice: '🍚' }
const BQ: Record<string, number> = { tea: 200, sugar: 1000, mint: 80, milk: 1000, bread: 7, egg: 12, coffee: 250, oil: 1000, yogurt: 4, orange: 6, banana: 6, apple: 6, flour: 1000, rice: 1000 }
const m2 = (n: number, l: Lang) => `${n.toFixed(2)} ${l === 'ar' ? 'د.م.' : 'MAD'}`
const stepOf = (l: Line) => (l.ing.base === 'pc' ? 1 : l.buy < 100 && l.ing.aisle === 'spices' ? 10 : 50)

/** Everything in the basket: recipe ingredients, home essentials and free-text additions, with one total. */
export function useBasket() {
  const { house } = useApp(); const h = house!
  const lines = useMemo(() => buildList(h.plan, h.pantry, h.extras ?? {}, h.qty ?? {}), [h.plan, h.pantry, h.extras, h.qty])
  const homeRows = HOME.filter((x) => (h.home?.[x.id] ?? 0) > 0).map((x) => ({ ...x, q: h.home![x.id] }))
  const custom = h.custom ?? []
  const foodCost = lines.reduce((a, l) => a + l.cost, 0)
  const homeCost = homeRows.reduce((a, x) => a + x.q * x.p, 0)
  const customCost = custom.reduce((a, c) => a + c.price, 0)
  return { lines, homeRows, custom, foodCost, homeCost, customCost, extraCost: homeCost + customCost, total: foodCost + homeCost + customCost }
}

const Mini = ({ v, dec, inc, label }: { v: string; dec: () => void; inc: () => void; label?: string }) => (
  <div className="inline-flex items-center rounded-full bg-cream p-0.5" aria-label={label}>
    <button className="grid h-8 w-8 place-items-center rounded-full bg-surface font-bold shadow-soft active:scale-90" onClick={dec} aria-label="−">−</button>
    <span className="min-w-[3.2rem] px-1 text-center text-xs font-bold tabular-nums">{v}</span>
    <button className="grid h-8 w-8 place-items-center rounded-full bg-surface font-bold shadow-soft active:scale-90" onClick={inc} aria-label="+">+</button>
  </div>
)

function Group({ icon, title, count, sub, open, toggle, children }: { icon: string; title: string; count: number; sub: number; open: boolean; toggle: () => void; children: React.ReactNode }) {
  const { lang } = useApp()
  return (
    <div className="card overflow-hidden">
      <button className="flex w-full items-center gap-3 p-4 text-start" onClick={toggle} aria-expanded={open}>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf/25 text-2xl">{icon}</span>
        <span className="min-w-0 flex-1"><span className="block font-display font-extrabold">{title}</span><span className="text-xs text-muted">{count} {t('itemsN', lang)}</span></span>
        <span className="font-bold tabular-nums">{m2(sub, lang)}</span>
        <span className={`text-muted transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden>›</span>
      </button>
      {open && <div className="rise border-t border-line/70 px-4 pb-2">{children}</div>}
    </div>
  )
}

/** Step 3: a short receipt on top, collapsible aisles below. Every quantity is editable. */
export function BasketStep({ adapt, openBudget }: { adapt: () => void; openBudget: () => void }) {
  const { lang, me, house, upHouse, award } = useApp()
  const { lines, homeRows, custom, foodCost, homeCost, customCost, total } = useBasket()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ name: '', qty: '', price: '', note: '' })
  const budget = me!.budget; const over = total > budget; const ex = house!.extras ?? {}
  const items = lines.filter((l) => l.buy > 0 || l.auto > 0)
  const groups = (Object.keys(AISLE) as Aisle[]).map((a) => [a, items.filter((l) => l.ing.aisle === a)] as const).filter(([, v]) => v.length)
  const tog = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }))
  const setQty = (l: Line, v: number) => upHouse((h) => { h.qty = { ...(h.qty ?? {}), [l.id]: Math.max(0, v) } })
  const resetQty = (id: string) => upHouse((h) => { const q = { ...(h.qty ?? {}) }; delete q[id]; h.qty = q })
  const setHome = (id: string, v: number) => upHouse((h) => { h.home = { ...(h.home ?? {}), [id]: Math.max(0, Math.min(9, v)) } })
  const saveCustom = () => { if (!f.name.trim()) return; upHouse((h) => { h.custom = [...(h.custom ?? []), { id: Math.random().toString(36).slice(2, 8), name: f.name.trim(), qty: f.qty.trim(), price: Math.max(0, parseFloat(f.price.replace(',', '.')) || 0), note: f.note.trim() }] }, `+ ${f.name.trim()}`); award(2, f.name.trim()); setF({ name: '', qty: '', price: '', note: '' }); setAdding(false); setOpen((o) => ({ ...o, mine: true })) }
  const allOpen = Object.values(open).some(Boolean)
  return (
    <div className="space-y-3">
      <div className="receipt p-5">
        <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-muted">🧾 {t('receipt', lang)}</span><button className="text-xs font-bold text-forest underline" onClick={openBudget}>{t('adjustB', lang)}</button></div>
        <div className="mt-2 flex items-end justify-between"><span className="font-display text-lg font-extrabold">{t('total', lang)}</span><span className="font-display text-4xl font-extrabold tabular-nums text-forest">{m2(total, lang)}</span></div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (total / budget) * 100)}%`, background: over ? 'rgb(var(--danger))' : total / budget > 0.88 ? 'rgb(var(--apricot))' : 'rgb(var(--forest))' }} /></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-muted">{t('budgetW', lang)} {money(budget, lang)}</span><span className="font-bold" style={{ color: over ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }}>{over ? t('overBy', lang) : t('left', lang)} {money(Math.abs(budget - total), lang)}</span></div>
        <div className="dash my-3" />
        <div className="grid grid-cols-3 gap-2 text-center text-xs"><div><p className="text-muted">🥬 {t('list', lang)}</p><b className="tabular-nums">{money(foodCost, lang)}</b></div><div><p className="text-muted">🏠 {t('maison', lang)}</p><b className="tabular-nums">{money(homeCost, lang)}</b></div><div><p className="text-muted">✍️ {t('mine', lang)}</p><b className="tabular-nums">{money(customCost, lang)}</b></div></div>
        {over && <button className="btn btn-warm mt-4 w-full" onClick={adapt}>{t('adaptBtn', lang)}</button>}
      </div>
      <div className="flex items-center justify-between px-1"><p className="text-xs text-muted">{t('avgPrice', lang)}</p><button className="text-xs font-bold text-forest" onClick={() => setOpen(allOpen ? {} : Object.fromEntries([...groups.map(([a]) => [a, true]), ['home', true], ['mine', true]]))}>{allOpen ? '⌃' : '⌄'}</button></div>

      {groups.map(([a, rows]) => (
        <Group key={a} icon={AISLE[a][3]} title={AISLE[a][li(lang)]} count={rows.length} sub={rows.reduce((s, l) => s + l.cost, 0)} open={!!open[a]} toggle={() => tog(a)}>
          {rows.map((l) => { const custom = l.buy !== l.auto; return (
            <div key={l.id} className="flex items-center gap-2 border-b border-line/50 py-2 last:border-0">
              <div className="min-w-0 flex-1"><p className={`truncate text-sm font-semibold ${l.buy === 0 ? 'line-through opacity-40' : ''}`}>{l.ing.n[li(lang)]}</p>
                <p className="truncate text-[11px] text-muted">{custom ? <button className="font-bold text-forest underline" onClick={() => resetQty(l.id)}>{t('reset', lang)}</button> : l.uses.map((u) => (u === 'basics' ? t('basics', lang) : rname(REC[u].n, lang))).join(' · ')}{l.buy < l.auto && ' ⚠'}</p></div>
              <Mini v={fmtQty(l.buy, l.ing.base)} dec={() => setQty(l, l.buy - stepOf(l))} inc={() => setQty(l, l.buy + stepOf(l))} />
              <span className="w-[4.2rem] text-end text-sm font-bold tabular-nums">{l.cost.toFixed(2)}</span>
            </div>) })}
        </Group>
      ))}

      <Group icon="🏠" title={t('maison', lang)} count={homeRows.length} sub={homeCost} open={!!open.home} toggle={() => tog('home')}>
        <p className="py-2 text-xs text-muted">{t('maisonHint', lang)}</p>
        <div className="grid grid-cols-3 gap-2 pb-3">
          {HOME.map((x) => { const q = house!.home?.[x.id] ?? 0; return (
            <div key={x.id} className={`rounded-2xl border-2 p-2 text-center transition-all ${q ? 'border-forest bg-leaf/20' : 'border-line bg-surface'}`}>
              <button className="block w-full active:scale-95" onClick={() => setHome(x.id, q ? 0 : 1)} aria-pressed={q > 0}><div className={`text-2xl ${q ? 'pop' : ''}`}>{x.e}</div><div className="mt-0.5 line-clamp-2 min-h-[2rem] text-[11px] font-semibold leading-tight">{x.n[li(lang)]}</div><div className="text-[11px] text-muted">{x.p} MAD</div></button>
              {q > 0 && <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold"><button className="h-6 w-6 rounded-full bg-surface shadow-soft" onClick={() => setHome(x.id, q - 1)} aria-label="−">−</button>{q}<button className="h-6 w-6 rounded-full bg-surface shadow-soft" onClick={() => setHome(x.id, q + 1)} aria-label="+">+</button></div>}
            </div>) })}
        </div>
      </Group>

      <Group icon="✍️" title={t('mine', lang)} count={custom.length} sub={customCost} open={!!open.mine} toggle={() => tog('mine')}>
        {custom.map((c) => (
          <div key={c.id} className="flex items-center gap-2 border-b border-line/50 py-2 last:border-0"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{c.name}{c.qty && <span className="text-muted"> · {c.qty}</span>}</p>{c.note && <p className="truncate text-[11px] italic text-muted">“{c.note}”</p>}</div><span className="text-sm font-bold tabular-nums">{c.price ? c.price.toFixed(2) : '—'}</span><button className="px-2 text-muted" onClick={() => upHouse((h) => { h.custom = (h.custom ?? []).filter((x) => x.id !== c.id) })} aria-label={t('remove', lang)}>✕</button></div>
        ))}
        <button className="btn btn-soft my-3 w-full" onClick={() => setAdding(true)}>＋ {t('addProd', lang)}</button>
      </Group>

      <div className="card p-4"><h3 className="text-sm font-bold uppercase tracking-wide text-muted">{t('addBasics', lang)}</h3>
        <div className="mt-3 flex flex-wrap gap-2">{Object.keys(BQ).map((id) => { const on = id in ex; const nm = HOME_NAME(id, lang); return (
          <button key={id} className="chip" aria-pressed={on} onClick={() => { upHouse((h) => { const e = { ...(h.extras ?? {}) }; if (on) delete e[id]; else e[id] = BQ[id]; h.extras = e }, `${on ? '−' : '+'} ${id}`); if (!on) award(2, nm) }}>{BEMOJI[id]} {nm}</button>) })}</div></div>

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('addProd', lang)}>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveCustom() }}>
          <div><label htmlFor="pn" className="mb-1 block text-sm font-semibold">{t('pName', lang)}</label><input id="pn" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></div>
          <div className="grid grid-cols-2 gap-3"><div><label htmlFor="pq" className="mb-1 block text-sm font-semibold">{t('pQty', lang)}</label><input id="pq" className="input" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></div><div><label htmlFor="pp" className="mb-1 block text-sm font-semibold">{t('pPrice', lang)}</label><input id="pp" inputMode="decimal" className="input" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div></div>
          <div><label htmlFor="pt" className="mb-1 block text-sm font-semibold">{t('pNote', lang)}</label><input id="pt" className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
          <button className="btn btn-primary w-full" disabled={!f.name.trim()} style={{ opacity: f.name.trim() ? 1 : 0.5 }}>{t('save', lang)}</button>
        </form>
      </Sheet>
    </div>
  )
}
import { CATALOG } from './data/catalog'
function HOME_NAME(id: string, lang: Lang) { return CATALOG.find((c) => c.id === id)!.n[li(lang)] }

/** Styled wordmark tiles (demo). Official logos are not bundled. */
const BRAND: Record<string, { bg: string; fg: string; font: string; txt: string }> = {
  bim: { bg: '#d33a2c', fg: '#fff', font: '900 1.35rem Manrope', txt: 'BIM' },
  marjane: { bg: '#fff', fg: '#c8102e', font: '800 1.1rem Manrope', txt: 'Marjane' },
  carrefour: { bg: '#fff', fg: '#1d5fa8', font: '800 1rem Manrope', txt: 'Carrefour' },
  aswak: { bg: '#e08a1e', fg: '#fff', font: '800 .85rem Manrope', txt: 'Aswak Assalam' },
  atacadao: { bg: '#f2c200', fg: '#1d3f8f', font: '800 .95rem Manrope', txt: 'Atacadão' },
}
export function StoreLogo({ id, w = 92 }: { id: string; w?: number }) {
  const b = BRAND[id]
  return <span className="grid shrink-0 place-items-center rounded-xl px-2 text-center leading-none shadow-soft" style={{ width: w, height: 44, background: b.bg, color: b.fg, font: b.font, boxShadow: '0 0 0 1px rgb(0 0 0 / .08)' }} aria-label={STORES.find((s) => s.id === id)?.name}>{b.txt}</span>
}

/** Step 4: store comparison with a clear recommendation. Prices per store are a labelled demo index. */
export function StoresStep({ onShop }: { onShop: (id: string) => void }) {
  const { lang, house, upHouse, me } = useApp()
  const { lines, homeRows, custom, homeCost, customCost } = useBasket()
  const [open, setOpen] = useState<string | null>(null)
  const buy = lines.filter((l) => l.buy > 0)
  const tot = (s: (typeof STORES)[number]) => storeTotal(buy, s) + homeCost * s.m.grocery + customCost
  const rows = STORES.map((s) => ({ s, tot: tot(s) })).sort((a, b) => a.tot - b.tot)
  const best = rows[0], worst = rows[rows.length - 1]; const split = splitTotal(buy) + homeCost * Math.min(...STORES.map((s) => s.m.grocery)) + customCost
  const chosen = house!.store ?? best.s.id
  const st = STORES.find((s) => s.id === open)
  const r2 = (n: number) => Math.round(n * 100) / 100
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold text-forest">{t('storesTitle', lang)}</h1>
      {rows.map(({ s, tot }, i) => (
        <button key={s.id} className={`card rise flex w-full items-center gap-3 p-3 text-start transition-all active:scale-[.98] ${chosen === s.id ? '!shadow-[0_0_0_2px_rgb(var(--forest))]' : ''}`} style={{ animationDelay: `${i * 60}ms` }} onClick={() => setOpen(s.id)}>
          <StoreLogo id={s.id} />
          <span className="min-w-0 flex-1">{i === 0 && <span className="inline-block rounded-full bg-apricot px-2.5 py-0.5 text-[11px] font-bold text-[#3c280a]">👑 {t('best', lang)}</span>}<span className="block text-xs text-muted">🧾 {t('viewTicket', lang)} ›</span></span>
          <span className="text-end"><span className="block font-display text-xl font-extrabold tabular-nums text-forest">{money(tot, lang)}</span>{i === 0 ? <span className="text-[11px] font-semibold text-forest">−{money(worst.tot - tot, lang)}</span> : <span className="text-[11px] text-muted">+{money(tot - best.tot, lang)}</span>}</span>
        </button>
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

/** In-store mode: big rows, tick off together. */
export function ShopMode({ onExit, celebrate }: { onExit: () => void; celebrate: () => void }) {
  const { lang, house, upHouse, award, toast } = useApp()
  const { lines, homeRows, custom } = useBasket()
  const buy = lines.filter((l) => l.buy > 0)
  const store = STORES.find((s) => s.id === house!.store) ?? STORES[0]
  const chk = house!.checked
  const total = buy.length + homeRows.length + custom.length
  const done = buy.filter((l) => chk[l.id]).length + homeRows.filter((x) => chk['h:' + x.id]).length + custom.filter((c) => chk['c:' + c.id]).length
  const groups = (Object.keys(AISLE) as Aisle[]).map((a) => [a, buy.filter((l) => l.ing.aisle === a)] as const).filter(([, v]) => v.length)
  const toggle = (key: string, name: string) => {
    const on = !chk[key]; upHouse((h) => { h.checked[key] = on }, on ? `✔ ${name}` : `↩ ${name}`)
    if (on) { if (done + 1 === total) { celebrate(); award(40, t('tripDone', lang)) } else award(2, name) }
  }
  const finish = () => { upHouse((h) => { for (const l of buy) if (h.checked[l.id]) h.pantry[l.id] = (h.pantry[l.id] ?? 0) + l.buy; h.checked = {}; h.qty = {}; h.home = {}; h.custom = [] }, 'finished the trip'); toast(t('pantry', lang) + ' ✓'); onExit() }
  const Row = ({ k, name, right }: { k: string; name: string; right: string }) => { const on = !!chk[k]; return (
    <button className="flex min-h-16 w-full items-center gap-3 border-b border-line/60 text-start last:border-0" onClick={() => toggle(k, name)} aria-pressed={on}><span className="check" data-on={on}>{on && '✓'}</span><span className={`flex-1 font-semibold transition-opacity ${on ? 'line-through opacity-40' : ''}`}>{name}</span><span className="tabular-nums text-muted">{right}</span></button>) }
  return (
    <div className="calm fixed inset-0 z-50 overflow-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-auto max-w-2xl space-y-4 px-4 pb-32 pt-5 text-lg">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-muted">{t('shopMode', lang)}</p><div className="mt-1"><StoreLogo id={store.id} /></div></div><button className="btn btn-soft !min-h-11" onClick={onExit}>{t('exit', lang)}</button></div>
        <div className="card p-4"><div className="mb-2 flex justify-between font-bold"><span>{done}/{total}</span><span className="text-sm font-semibold text-forest">● {t('live', lang)}</span></div><div className="h-4 rounded-full bg-cream"><div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>{total > 0 && done === total && <p className="pop mt-3 text-center font-display text-xl font-extrabold text-forest">🎉 {t('tripDone', lang)}</p>}</div>
        {groups.map(([a, rows]) => (<div key={a} className="card p-4"><h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">{AISLE[a][3]} {AISLE[a][li(lang)]}</h3>{rows.map((l) => <Row key={l.id} k={l.id} name={l.ing.n[li(lang)]} right={fmtQty(l.buy, l.ing.base)} />)}</div>))}
        {homeRows.length > 0 && <div className="card p-4"><h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">🏠 {t('maison', lang)}</h3>{homeRows.map((x) => <Row key={x.id} k={'h:' + x.id} name={`${x.e} ${HOME_BY[x.id].n[li(lang)]}`} right={`×${x.q}`} />)}</div>}
        {custom.length > 0 && <div className="card p-4"><h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">✍️ {t('mine', lang)}</h3>{custom.map((c) => <Row key={c.id} k={'c:' + c.id} name={c.name + (c.note ? ` — ${c.note}` : '')} right={c.qty} />)}</div>}
        {done > 0 && <div className="fixed inset-x-0 bottom-0 z-10 p-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}><button className="btn btn-primary mx-auto flex w-full max-w-2xl !min-h-14 shadow-lift" onClick={finish}>✓ {t('finish', lang)}</button></div>}
      </div>
    </div>
  )
}
