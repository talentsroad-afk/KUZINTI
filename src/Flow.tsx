import { useMemo } from 'react'
import { useApp } from './lib/store'
import { money, rname, t, type Lang } from './lib/i18n'
import { buildList, fmtQty, type Line } from './lib/engine'
import { CATALOG, type Aisle } from './data/catalog'
import { REC } from './data/recipes'
import { STORES, splitTotal, storeTotal } from './lib/stores'
import { Brand } from './ui'

const li = (l: Lang) => (l === 'en' ? 0 : l === 'fr' ? 1 : 2)
const AISLE: Record<Aisle, [string, string, string, string]> = {
  produce: ['Fruit & veg', 'Fruits & légumes', 'خضر وفواكه', '🥬'], meat: ['Meat & fish', 'Viande & poisson', 'لحوم وأسماك', '🥩'], dairy: ['Dairy & eggs', 'Laitier & œufs', 'ألبان وبيض', '🥚'],
  grocery: ['Grocery', 'Épicerie', 'بقالة', '🫙'], bakery: ['Bakery', 'Boulangerie', 'مخبزة', '🥖'], spices: ['Spices', 'Épices', 'توابل', '🧂'],
}
const BEMOJI: Record<string, string> = { tea: '🍵', sugar: '🍬', mint: '🌿', milk: '🥛', bread: '🥖', egg: '🥚', coffee: '☕', oil: '🫒', yogurt: '🥣', orange: '🍊', banana: '🍌', apple: '🍎', flour: '🌾', rice: '🍚' }
const BQ: Record<string, number> = { tea: 200, sugar: 1000, mint: 80, milk: 1000, bread: 7, egg: 12, coffee: 250, oil: 1000, yogurt: 4, orange: 6, banana: 6, apple: 6, flour: 1000, rice: 1000 }
const money2 = (n: number, l: Lang) => `${n.toFixed(2)} ${l === 'ar' ? 'د.م.' : 'MAD'}`
const unitPrice = (l: Line) => { const u = l.ing.base === 'pc' ? 1 : 1000; const v = l.ing.p * u; return `${v < 10 ? v.toFixed(1) : Math.round(v)} MAD/${l.ing.base === 'g' ? 'kg' : l.ing.base === 'ml' ? 'L' : 'pc'}` }
const stepOf = (l: Line) => (l.ing.base === 'pc' ? 1 : l.buy < 100 && l.ing.aisle === 'spices' ? 10 : 50)

export function useLines() {
  const { house } = useApp()
  const h = house!
  return useMemo(() => buildList(h.plan, h.pantry, h.extras ?? {}, h.qty ?? {}), [h.plan, h.pantry, h.extras, h.qty])
}

/** Step 3: receipt-style basket. Every quantity is editable and the total moves live. */
export function BasketStep({ adapt }: { adapt: () => void }) {
  const { lang, me, house, upHouse, award } = useApp()
  const lines = useLines()
  const items = lines.filter((l) => l.buy > 0 || l.auto > 0)
  const total = lines.reduce((a, l) => a + l.cost, 0); const budget = me!.budget; const over = total > budget
  const groups = (Object.keys(AISLE) as Aisle[]).map((a) => [a, items.filter((l) => l.ing.aisle === a)] as const).filter(([, v]) => v.length)
  const setQty = (l: Line, v: number) => upHouse((h) => { h.qty = { ...(h.qty ?? {}), [l.id]: Math.max(0, v) } })
  const resetQty = (id: string) => upHouse((h) => { const q = { ...(h.qty ?? {}) }; delete q[id]; h.qty = q })
  const ex = house!.extras ?? {}
  if (!items.length && !Object.keys(ex).length) return <div className="card p-8 text-center"><div className="mb-3 text-5xl">🧾</div><p className="text-muted">{t('emptyList', lang)}</p></div>
  return (
    <div className="space-y-5">
      <div className="receipt p-5">
        <div className="flex items-center justify-between"><Brand /><span className="text-xs font-semibold text-muted">{new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA-u-nu-latn' : lang)}</span></div>
        <p className="mt-1 text-xs text-muted">{t('receipt', lang)} · {house!.name} · {t('avgPrice', lang)}</p>
        <div className="dash my-4" />
        {groups.map(([a, rows]) => (
          <div key={a} className="mb-4">
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">{AISLE[a][3]} {AISLE[a][li(lang)]}</h3>
            {rows.map((l) => {
              const custom = l.buy !== l.auto; const low = l.buy < l.auto
              return (
                <div key={l.id} className="flex items-start gap-3 border-b border-line/60 py-2.5 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold ${l.buy === 0 ? 'line-through opacity-40' : ''}`}>{l.ing.n[li(lang)]}</p>
                    <p className="truncate text-xs text-muted">{l.uses.map((u) => (u === 'basics' ? t('basics', lang) : rname(REC[u].n, lang))).join(' · ')}</p>
                    <p className="text-xs text-muted">{unitPrice(l)}{custom && <button className="ms-2 font-semibold text-forest underline" onClick={() => resetQty(l.id)}>{t('reset', lang)}</button>}{low && <span className="ms-2 text-[#9a6a1a]">⚠ {t('lessThan', lang)}</span>}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-bold tabular-nums">{money2(l.cost, lang)}</p>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-cream p-0.5">
                      <button className="grid h-8 w-8 place-items-center rounded-full bg-surface font-bold shadow-soft" onClick={() => setQty(l, l.buy - stepOf(l))} aria-label="−">−</button>
                      <span className="min-w-[3.5rem] text-center text-xs font-bold tabular-nums">{fmtQty(l.buy, l.ing.base)}</span>
                      <button className="grid h-8 w-8 place-items-center rounded-full bg-surface font-bold shadow-soft" onClick={() => setQty(l, l.buy + stepOf(l))} aria-label="+">+</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div className="dash my-3" />
        <div className="flex items-end justify-between"><span className="font-display text-lg font-extrabold">{t('total', lang)}</span><span className="font-display text-3xl font-extrabold tabular-nums text-forest">{money2(total, lang)}</span></div>
        <div className="mt-2 flex justify-between text-sm text-muted"><span>{t('budgetW', lang)}</span><span className="tabular-nums">{money2(budget, lang)}</span></div>
        <div className="flex justify-between text-sm font-bold" style={{ color: over ? 'rgb(var(--danger))' : 'rgb(var(--forest))' }}><span>{over ? t('overBy', lang) : t('left', lang)}</span><span className="tabular-nums">{money2(Math.abs(budget - total), lang)}</span></div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (total / budget) * 100)}%`, background: over ? 'rgb(var(--danger))' : total / budget > 0.88 ? 'rgb(var(--apricot))' : 'rgb(var(--forest))' }} /></div>
        {over && <button className="btn btn-warm mt-4 w-full" onClick={adapt}>{t('adaptBtn', lang)}</button>}
      </div>
      <div className="card p-4"><h3 className="text-sm font-bold uppercase tracking-wide text-muted">{t('addBasics', lang)}</h3><p className="mb-3 text-xs text-muted">{t('basicsHint', lang)}</p>
        <div className="flex flex-wrap gap-2">{Object.keys(BQ).map((id) => { const on = id in ex; const c = CATALOG.find((x) => x.id === id)!; return (
          <button key={id} className="chip" aria-pressed={on} onClick={() => { upHouse((h) => { const e = { ...(h.extras ?? {}) }; if (on) delete e[id]; else e[id] = BQ[id]; h.extras = e }, `${on ? '−' : '+'} ${c.n[0]}`); if (!on) award(2, c.n[li(lang)]) }}>{BEMOJI[id]} {c.n[li(lang)]}</button>) })}</div></div>
    </div>
  )
}

/** Step 4: store comparison with a clear recommendation. Prices per store are a labelled demo index. */
export function StoresStep() {
  const { lang, house, upHouse } = useApp()
  const lines = useLines().filter((l) => l.buy > 0)
  const rows = STORES.map((s) => ({ s, tot: storeTotal(lines, s) })).sort((a, b) => a.tot - b.tot)
  const best = rows[0], worst = rows[rows.length - 1]; const split = splitTotal(lines)
  const chosen = house!.store ?? best.s.id
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-forest">{t('storesTitle', lang)}</h1>
      {rows.map(({ s, tot }, i) => {
        const sel = chosen === s.id
        return (
          <button key={s.id} className={`card rise block w-full p-4 text-start transition-all ${sel ? 'ring-2 ring-forest' : ''}`} style={{ animationDelay: `${i * 60}ms` }} onClick={() => upHouse((h) => { h.store = s.id })}>
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-display text-lg font-extrabold">{s.name}</p>{i === 0 && <span className="mt-1 inline-block rounded-full bg-apricot px-3 py-0.5 text-xs font-bold text-[#3c280a]">👑 {t('best', lang)}</span>}</div>
              <div className="text-end"><p className="font-display text-2xl font-extrabold tabular-nums text-forest">{money(tot, lang)}</p>{i === 0 ? <p className="text-xs font-semibold text-forest">−{money(worst.tot - tot, lang)} {t('saves', lang)}</p> : <p className="text-xs text-muted">+{money(tot - best.tot, lang)}</p>}</div>
            </div>
          </button>
        )
      })}
      <div className="card flex items-center justify-between p-4"><span className="text-sm font-semibold">🔀 {t('split', lang)}</span><b className="tabular-nums">{money(split, lang)}</b></div>
      <p className="text-xs text-muted">{t('storesNote', lang)}</p>
    </div>
  )
}

/** In-store mode: big rows, tick off together, finish to refill the pantry. */
export function ShopMode({ onExit, celebrate }: { onExit: () => void; celebrate: () => void }) {
  const { lang, house, upHouse, award, toast } = useApp()
  const lines = useLines().filter((l) => l.buy > 0)
  const store = STORES.find((s) => s.id === house!.store) ?? STORES[0]
  const done = lines.filter((l) => house!.checked[l.id]).length
  const groups = (Object.keys(AISLE) as Aisle[]).map((a) => [a, lines.filter((l) => l.ing.aisle === a)] as const).filter(([, v]) => v.length)
  const toggle = (l: Line) => {
    const on = !house!.checked[l.id]; const name = l.ing.n[li(lang)]
    upHouse((h) => { h.checked[l.id] = on }, on ? `✔ ${name}` : `↩ ${name}`)
    if (on) { if (done + 1 === lines.length) { celebrate(); award(40, t('tripDone', lang)) } else award(2, name) }
  }
  const finish = () => { upHouse((h) => { for (const l of lines) if (h.checked[l.id]) h.pantry[l.id] = (h.pantry[l.id] ?? 0) + l.buy; h.checked = {}; h.qty = {} }, 'finished the trip'); toast(t('pantry', lang) + ' ✓'); onExit() }
  return (
    <div className="calm fixed inset-0 z-50 overflow-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-auto max-w-2xl space-y-4 px-4 pb-32 pt-5 text-lg">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-muted">{t('shopMode', lang)}</p><h1 className="text-2xl font-extrabold text-forest">{store.name}</h1></div><button className="btn btn-soft !min-h-11" onClick={onExit}>{t('exit', lang)}</button></div>
        <div className="card p-4"><div className="mb-2 flex justify-between font-bold"><span>{done}/{lines.length}</span><span className="text-sm font-semibold text-forest">● {t('live', lang)}</span></div><div className="h-4 rounded-full bg-cream"><div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${lines.length ? (done / lines.length) * 100 : 0}%` }} /></div>{lines.length > 0 && done === lines.length && <p className="pop mt-3 text-center font-display text-xl font-extrabold text-forest">🎉 {t('tripDone', lang)}</p>}</div>
        {groups.map(([a, rows]) => (
          <div key={a} className="card p-4"><h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">{AISLE[a][3]} {AISLE[a][li(lang)]}</h3>
            {rows.map((l) => { const on = !!house!.checked[l.id]; return (
              <button key={l.id} className="flex min-h-16 w-full items-center gap-3 border-b border-line/60 text-start last:border-0" onClick={() => toggle(l)} aria-pressed={on}>
                <span className="check" data-on={on}>{on && '✓'}</span><span className={`flex-1 font-semibold transition-opacity ${on ? 'line-through opacity-40' : ''}`}>{l.ing.n[li(lang)]}</span><span className="tabular-nums text-muted">{fmtQty(l.buy, l.ing.base)}</span>
              </button>) })}</div>
        ))}
        {done > 0 && <div className="fixed inset-x-0 bottom-0 z-10 p-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}><button className="btn btn-primary mx-auto flex w-full max-w-2xl !min-h-14 shadow-lift" onClick={finish}>✓ {t('finish', lang)}</button></div>}
      </div>
    </div>
  )
}
