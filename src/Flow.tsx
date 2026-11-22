import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { money, rname, t, type Lang } from './lib/i18n'
import { buildList, fmtQty, type Line } from './lib/engine'
import type { Aisle } from './data/catalog'
import { REC } from './data/recipes'
import { SIDE } from './data/sides'
import { HOME, HOME_BY } from './data/home'
import { STORES, splitTotal, storeTotal } from './lib/stores'
import { Sheet } from './ui'
import { dayName } from './lib/i18n'
import { FridgeSheet } from './Extra'

const li = (l: Lang) => (l === 'en' ? 0 : l === 'fr' ? 1 : 2)
const AISLE: Record<Aisle, [string, string, string, string]> = {
  produce: ['Fruit & veg', 'Fruits & légumes', 'خضر وفواكه', '🥬'], meat: ['Meat & fish', 'Viande & poisson', 'لحوم وأسماك', '🥩'], dairy: ['Dairy & eggs', 'Laitier & œufs', 'ألبان وبيض', '🥚'],
  grocery: ['Grocery', 'Épicerie', 'بقالة', '🫙'], bakery: ['Bakery', 'Boulangerie', 'مخبزة', '🥖'], spices: ['Spices', 'Épices', 'توابل', '🧂'],
}
const m2 = (n: number, l: Lang) => `${n.toFixed(2)} ${l === 'ar' ? 'د.م.' : 'MAD'}`
const stepOf = (l: Line) => (l.ing.base === 'pc' ? 1 : l.buy < 100 && l.ing.aisle === 'spices' ? 10 : 50)
const unitP = (l: Line, m: number) => l.ing.base === 'pc' ? `${(l.ing.p * m).toFixed(2)} MAD/u` : `${(l.ing.p * m * 1000).toFixed(2)} MAD/${l.ing.base === 'g' ? 'kg' : 'L'}`
const useName = (u: string, lang: Lang) => (u === 'basics' ? t('basics', lang) : SIDE[u] ? SIDE[u].n[li(lang)] : REC[u] ? rname(REC[u].n, lang) : u)

/** Everything in the basket with one total. Estimates use the chosen store's price index when one is picked. */
export function useBasket() {
  const { house } = useApp(); const h = house!
  const lines = useMemo(() => buildList(h.plan, h.pantry, h.extras ?? {}, h.qty ?? {}), [h.plan, h.pantry, h.extras, h.qty])
  const store = STORES.find((s) => s.id === h.store)
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

/** Shopping: live budget (planned / spent / left), big checkboxes, tap a price to enter what you really paid. */
export function CoursesTab({ celebrate, goStores }: { celebrate: () => void; goStores: () => void }) {
  const { lang, me, house, upHouse, award, toast } = useApp()
  const { lines, homeRows, custom, store, mul, price, total, spent, items } = useBasket()
  const [edit, setEdit] = useState<{ key: string; name: string; est: number; line?: Line } | null>(null)
  const [val, setVal] = useState('')
  const [homeOpen, setHomeOpen] = useState(false); const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ name: '', qty: '', price: '', note: '' })
  const budget = me!.budget; const chk = house!.checked
  const done = items.filter((x) => chk[x.key]).length
  const pace = total; const left = budget - spent; const over = pace > budget
  const day = house!.listDay ?? -1; const [fridge, setFridge] = useState(false)
  const dayLines = useMemo(() => day < 0 ? lines : buildList(Object.fromEntries(Object.entries(house!.plan).filter(([k]) => k.startsWith(day + '-'))), house!.pantry, {}, {}), [day, lines, house])
  const buy = dayLines.filter((l) => l.buy > 0 || l.auto > 0)
  const setDay = (d: number) => upHouse((h) => { h.listDay = d })
  const share = async () => {
    const L = (n: string, q: string, p: number) => `${chk[n] ? '✅' : '⬜'} ${q} · ${p.toFixed(2)}`
    const txt = [`🛒 KUZINTI · ${day < 0 ? t('lWeek', lang) : dayName(day, lang)}`, ...buy.map((l) => L(l.id, `${l.ing.n[li(lang)]} — ${fmtQty(l.buy, l.ing.base)}`, price(l.id, l.cost * mul(l.ing.aisle)))),
      ...(day < 0 ? [...homeRows.map((x) => L('h:' + x.id, `${x.n[li(lang)]} — ×${x.q}`, price('h:' + x.id, x.q * x.p * mul('grocery')))), ...custom.map((c) => L('c:' + c.id, `${c.name}${c.qty ? ' — ' + c.qty : ''}${c.note ? ' (' + c.note + ')' : ''}`, price('c:' + c.id, c.price)))] : []),
      `TOTAL ≈ ${money(day < 0 ? total : buy.reduce((a, l) => a + price(l.id, l.cost * mul(l.ing.aisle)), 0), lang)}`].join('\n')
    try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); toast(t('shared', lang)) } } catch { /* user cancelled */ }
  }
  const groups = (Object.keys(AISLE) as Aisle[]).map((a) => [a, buy.filter((l) => l.ing.aisle === a)] as const).filter(([, v]) => v.length)
  const toggle = (key: string, name: string) => {
    const on = !chk[key]; upHouse((h) => { h.checked[key] = on }, on ? `✔ ${name}` : `↩ ${name}`)
    if (on) { if (done + 1 === items.length) { celebrate(); award(40, t('tripDone', lang)) } else award(2, name) }
  }
  const openEdit = (key: string, name: string, est: number, line?: Line) => { setEdit({ key, name, est, line }); setVal(house!.paid?.[key] !== undefined ? String(house!.paid![key]) : '') }
  const savePaid = () => { if (!edit) return; const v = parseFloat(val.replace(',', '.')); upHouse((h) => { const p = { ...(h.paid ?? {}) }; if (isNaN(v)) delete p[edit.key]; else p[edit.key] = v; h.paid = p; if (!isNaN(v)) h.checked[edit.key] = true }); setEdit(null) }
  const finish = () => { upHouse((h) => { for (const l of lines) if (h.checked[l.id]) h.pantry[l.id] = (h.pantry[l.id] ?? 0) + l.buy; h.checked = {}; h.qty = {}; h.home = {}; h.custom = []; h.paid = {} }, 'finished the trip'); toast(t('pantry', lang) + ' ✓') }
  const saveCustom = () => { if (!f.name.trim()) return; upHouse((h) => { h.custom = [...(h.custom ?? []), { id: Math.random().toString(36).slice(2, 8), name: f.name.trim(), qty: f.qty.trim(), price: Math.max(0, parseFloat(f.price.replace(',', '.')) || 0), note: f.note.trim() }] }, `+ ${f.name.trim()}`); setF({ name: '', qty: '', price: '', note: '' }); setAdding(false) }
  const Row = ({ k, name, sub, est, line, q }: { k: string; name: string; sub: string; est: number; line?: Line; q?: string }) => { const on = !!chk[k]; const paid = house!.paid?.[k]; return (
    <div className="flex items-center gap-3 py-2">
      <button className="check !h-8 !w-8" data-on={on} onClick={() => toggle(k, name)} aria-pressed={on} aria-label={name}>{on && '✓'}</button>
      <button className="min-w-0 flex-1 text-start" onClick={() => openEdit(k, name, est, line)}><span className={`block truncate font-semibold ${on ? 'text-muted line-through' : ''}`}>{name}</span>{sub && <span className="block truncate text-xs text-muted">{sub}</span>}</button>
      <button className={`shrink-0 rounded-xl px-2.5 py-1 text-end tabular-nums ${paid !== undefined ? 'bg-leaf/30' : 'bg-cream'}`} onClick={() => openEdit(k, name, est, line)}>
        {q && <span className="block text-[15px] font-extrabold leading-tight text-forest">{q}</span>}
        <span className="block text-xs font-semibold leading-tight text-ink">{m2(price(k, est), lang)}</span>
      </button>
    </div>) }
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-[11px] font-semibold uppercase text-muted">{t('budgetW', lang)}</p><p className="font-display text-lg font-extrabold tabular-nums">{money(budget, lang)}</p></div>
          <div><p className="text-[11px] font-semibold uppercase text-muted">{t('spent', lang)}</p><p className="font-display text-lg font-extrabold tabular-nums text-forest">{money(spent, lang)}</p></div>
          <div><p className="text-[11px] font-semibold uppercase text-muted">{t('left', lang)}</p><p className="font-display text-lg font-extrabold tabular-nums" style={{ color: left < 0 ? 'rgb(var(--danger))' : 'rgb(var(--ink))' }}>{money(left, lang)}</p></div>
        </div>
        <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-cream">
          <div className="absolute inset-y-0 start-0 rounded-full bg-leaf/50 transition-all duration-500" style={{ width: `${Math.min(100, (pace / budget) * 100)}%` }} />
          <div className="absolute inset-y-0 start-0 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (spent / budget) * 100)}%`, background: over ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }} />
        </div>
        <p className="mt-2 text-xs" style={{ color: over ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }}><b>{t('pace', lang)}: {money(pace, lang)}</b> · {over ? `${t('overBy', lang)} ${money(pace - budget, lang)}` : `${money(budget - pace, lang)} ${t('saving', lang)}`}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn btn-soft !min-h-11 !text-sm" onClick={goStores}>🏬 {t('compareStores', lang)}</button>
          <button className="btn btn-primary !min-h-11 !text-sm" onClick={share}>↗ {t('shareList', lang)}</button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">{t('pricesAt', lang)}: {store ? store.name : t('avgPrice', lang)} · {t('qtyHint', lang)}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-full bg-surface p-1 shadow-soft">{[-1, (new Date().getDay() + 6) % 7].map((d, i) => <button key={i} className={`rounded-full px-3 py-1.5 text-xs font-bold ${(i === 0 ? day < 0 : day >= 0) ? 'bg-forest text-white' : 'text-muted'}`} onClick={() => setDay(d)}>{i === 0 ? t('lWeek', lang) : t('lDay', lang)}</button>)}</div>
        <button className="ms-auto rounded-full bg-surface px-3 py-1.5 text-xs font-bold shadow-soft" onClick={() => setFridge(true)}>📸 {t('fridgeS', lang)}</button>
      </div>
      {day >= 0 && <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4">{Array.from({ length: 7 }, (_, d) => <button key={d} className={`chip shrink-0 capitalize ${d === day ? '!bg-forest !text-white' : ''}`} onClick={() => setDay(d)}>{dayName(d, lang).slice(0, 3)}</button>)}</div>}
      <FridgeSheet open={fridge} onClose={() => setFridge(false)} />
      <p className="px-1 text-xs text-muted">{done}/{items.length} · {t('paid', lang).replace(' (MAD)', '')} → {t('ok', lang)}</p>
      {groups.map(([a, rows]) => (
        <div key={a} className="card px-4 py-2"><h3 className="pt-1 text-xs font-bold uppercase tracking-wider text-muted">{AISLE[a][3]} {AISLE[a][li(lang)]}</h3>
          <div className="divide-y divide-line/60">{rows.map((l) => <Row key={l.id} k={l.id} name={l.ing.n[li(lang)]} q={fmtQty(l.buy, l.ing.base)} sub={`${unitP(l, mul(a))} · ${l.uses.map((u) => useName(u, lang)).join(', ')}`} est={l.cost * mul(a)} line={l} />)}</div></div>
      ))}
      <div className="card px-4 py-2">
        <button className="flex w-full items-center justify-between py-1.5" onClick={() => setHomeOpen(!homeOpen)} aria-expanded={homeOpen}><h3 className="text-xs font-bold uppercase tracking-wider text-muted">🏠 {t('maison', lang)} · {homeRows.length}</h3><span className="text-sm font-bold text-forest">{homeOpen ? '−' : '＋'}</span></button>
        {homeOpen && <div className="grid grid-cols-4 gap-1.5 pb-2">{HOME.map((x) => { const q = house!.home?.[x.id] ?? 0; return <button key={x.id} className={`rounded-xl border p-1.5 text-center active:scale-95 ${q ? 'border-forest bg-leaf/20' : 'border-line'}`} onClick={() => upHouse((h) => { h.home = { ...(h.home ?? {}), [x.id]: q ? 0 : 1 } })} aria-pressed={q > 0}><div className="text-xl">{x.e}</div><div className="line-clamp-2 text-[10px] font-semibold leading-tight">{x.n[li(lang)]}</div></button> })}</div>}
        <div className="divide-y divide-line/60">{homeRows.map((x) => <Row key={x.id} k={'h:' + x.id} name={`${x.e} ${HOME_BY[x.id].n[li(lang)]}`} q={`×${x.q}`} sub='' est={x.q * x.p * mul('grocery')} />)}</div>
      </div>
      <div className="card px-4 py-2">
        <h3 className="pt-1 text-xs font-bold uppercase tracking-wider text-muted">✍️ {t('mine', lang)}</h3>
        <div className="divide-y divide-line/60">{custom.map((c) => <Row key={c.id} k={'c:' + c.id} name={c.name} q={c.qty || undefined} sub={c.note} est={c.price} />)}</div>
        <button className="w-full py-2.5 text-start text-sm font-bold text-forest" onClick={() => setAdding(true)}>＋ {t('addProd', lang)}</button>
      </div>
      {done > 0 && <button className="btn btn-primary w-full !min-h-14" onClick={finish}>✓ {t('finish', lang)}</button>}

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.name ?? ''}>
        {edit && <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); savePaid() }}>
          {edit.line && <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-2"><span className="font-semibold">{fmtQty(edit.line.buy, edit.line.ing.base)}</span><span className="flex gap-2"><button type="button" className="btn btn-soft !min-h-9 !w-9 !px-0" onClick={() => { const l = edit.line!; upHouse((h) => { h.qty = { ...(h.qty ?? {}), [l.id]: Math.max(0, l.buy - stepOf(l)) } }); setEdit(null) }}>−</button><button type="button" className="btn btn-soft !min-h-9 !w-9 !px-0" onClick={() => { const l = edit.line!; upHouse((h) => { h.qty = { ...(h.qty ?? {}), [l.id]: l.buy + stepOf(l) } }); setEdit(null) }}>+</button></span></div>}
          <div><label htmlFor="paid" className="mb-1 block text-sm font-semibold">{t('paid', lang)}</label><input id="paid" inputMode="decimal" className="input text-lg" placeholder={edit.est.toFixed(2)} value={val} onChange={(e) => setVal(e.target.value)} autoFocus /><p className="mt-1 text-xs text-muted">{t('estimated', lang)}: {m2(edit.est, lang)}</p></div>
          <button className="btn btn-primary w-full">{t('save', lang)}</button>
        </form>}
      </Sheet>
      <Sheet open={adding} onClose={() => setAdding(false)} title={t('addProd', lang)}>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveCustom() }}>
          <input aria-label={t('pName', lang)} placeholder={t('pName', lang)} className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
          <div className="grid grid-cols-2 gap-3"><input aria-label={t('pQty', lang)} placeholder={t('pQty', lang)} className="input" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /><input aria-label={t('pPrice', lang)} placeholder={t('pPrice', lang)} inputMode="decimal" className="input" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <input aria-label={t('pNote', lang)} placeholder={t('pNote', lang)} className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <button className="btn btn-primary w-full" disabled={!f.name.trim()} style={{ opacity: f.name.trim() ? 1 : 0.5 }}>{t('save', lang)}</button>
        </form>
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
