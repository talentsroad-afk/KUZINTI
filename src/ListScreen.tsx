import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { money, t, type Lang } from './lib/i18n'
import { buildList, fmtQty } from './lib/engine'
import { CATALOG, type Aisle } from './data/catalog'
import type { Props } from './Screens'
import { Stepper } from './ui'

const li = (l: Lang) => (l === 'en' ? 0 : l === 'fr' ? 1 : 2)
const AISLE: Record<Aisle, [string, string, string, string]> = {
  produce: ['Fruit & veg', 'Fruits & légumes', 'خضر وفواكه', '🥬'], meat: ['Meat & fish', 'Viande & poisson', 'لحوم وأسماك', '🥩'], dairy: ['Dairy & eggs', 'Laitier & œufs', 'ألبان وبيض', '🥚'],
  grocery: ['Grocery', 'Épicerie', 'بقالة', '🫙'], bakery: ['Bakery', 'Boulangerie', 'مخبزة', '🥖'], spices: ['Spices', 'Épices', 'توابل', '🧂'],
}

export function ListScreen({ celebrate }: Props) {
  const { lang, house, upHouse, award, toast } = useApp()
  const [shop, setShop] = useState(false)
  const [pantryOpen, setPantryOpen] = useState(false)
  const lines = useMemo(() => buildList(house!.plan, house!.pantry), [house])
  const toBuy = lines.filter((l) => l.buy > 0), have = lines.filter((l) => l.buy === 0)
  const done = toBuy.filter((l) => house!.checked[l.id]).length
  const total = toBuy.reduce((a, l) => a + l.cost, 0)
  const groups = (Object.keys(AISLE) as Aisle[]).map((a) => [a, toBuy.filter((l) => l.ing.aisle === a)] as const).filter(([, v]) => v.length)

  const toggle = (id: string, name: string) => {
    const on = !house!.checked[id]
    upHouse((h) => { h.checked[id] = on }, on ? `✔ ${name}` : `↩ ${name}`)
    if (on) {
      if (done + 1 === toBuy.length) { celebrate(); award(40, '🎉'); } else award(2, name)
    }
  }
  const finish = () => {
    upHouse((h) => { for (const l of toBuy) if (h.checked[l.id]) h.pantry[l.id] = (h.pantry[l.id] ?? 0) + l.buy; h.checked = {} }, 'finished the trip')
    toast(t('pantry', lang) + ' ✓'); setShop(false)
  }
  if (!toBuy.length && !have.length) return <div className="card p-8 text-center"><div className="mb-3 text-5xl">🛒</div><p className="text-muted">{t('emptyList', lang)}</p></div>

  return (
    <div className={`space-y-4 ${shop ? 'text-lg' : ''}`}>
      <div className="flex items-center justify-between gap-2"><h1 className="text-3xl font-extrabold text-forest">{t('list', lang)}</h1>
        <button className={`btn ${shop ? 'btn-warm' : 'btn-primary'} !min-h-11`} onClick={() => setShop(!shop)}>{shop ? t('exit', lang) : `🏬 ${t('shopMode', lang)}`}</button></div>
      <div className="card p-4"><div className="mb-2 flex justify-between text-sm font-semibold"><span>{done}/{toBuy.length}</span>{!shop && <span>{t('estTotal', lang)}: {money(total, lang)}</span>}</div>
        <div className="h-3 rounded-full bg-cream"><div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${toBuy.length ? (done / toBuy.length) * 100 : 0}%` }} /></div>
        {!shop && <p className="mt-2 text-xs text-muted">{t('estNote', lang)} · <span className="text-forest">● {t('live', lang)}</span></p>}</div>
      {groups.map(([a, items]) => (
        <div key={a} className="card p-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{AISLE[a][3]} {AISLE[a][li(lang)]}</h3>
          <ul>{items.map((l) => {
            const on = !!house!.checked[l.id]; const name = l.ing.n[li(lang)]
            return (
              <li key={l.id}><button className={`flex w-full items-center gap-3 border-b border-line/60 text-start last:border-0 ${shop ? 'min-h-16' : 'min-h-14'}`} onClick={() => toggle(l.id, name)} aria-pressed={on}>
                <span className="check" data-on={on}>{on && '✓'}</span>
                <span className={`flex-1 font-semibold transition-opacity ${on ? 'line-through opacity-40' : ''}`}>{name}</span>
                <span className="tabular-nums text-muted">{fmtQty(l.buy, l.ing.base)}</span>{!shop && <span className="w-16 text-end text-sm tabular-nums text-muted">{money(l.cost, lang)}</span>}
              </button></li>)
          })}</ul>
        </div>
      ))}
      {done > 0 && <button className="btn btn-primary w-full !min-h-14" onClick={finish}>✓ {t('finish', lang)}</button>}
      {!shop && have.length > 0 && <div className="card p-4"><h3 className="mb-2 text-sm font-bold text-muted">{t('inPantry', lang)}</h3><p className="text-sm text-muted">{have.map((l) => l.ing.n[li(lang)]).join(' · ')}</p></div>}
      {!shop && <button className="btn btn-soft w-full" onClick={() => setPantryOpen(!pantryOpen)}>🫙 {t('pantry', lang)}</button>}
      {pantryOpen && !shop && <Pantry />}
      <Activity />
    </div>
  )
}

function Pantry() {
  const { lang, house, upHouse } = useApp()
  const [add, setAdd] = useState('')
  const items = Object.entries(house!.pantry).filter(([, v]) => v > 0)
  const step = (id: string) => (CATALOG.find((c) => c.id === id)!.base === 'pc' ? 1 : 50)
  return (
    <div className="card space-y-2 p-4">
      {items.map(([id, v]) => { const c = CATALOG.find((x) => x.id === id)!; return (
        <div key={id} className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{c.n[li(lang)]}</span>
          <span className="flex items-center gap-2"><span className="text-sm tabular-nums text-muted">{fmtQty(v, c.base)}</span><Stepper v={Math.round(v / step(id))} min={0} max={200} set={(n) => upHouse((h) => { h.pantry[id] = n * step(id) })} /></span></div>) })}
      <select className="input" value={add} onChange={(e) => { const id = e.target.value; if (id) upHouse((h) => { h.pantry[id] = (h.pantry[id] ?? 0) + step(id) * 2 }, `pantry +${id}`); setAdd('') }}><option value="">+ {t('addPantry', lang)}</option>{CATALOG.map((c) => <option key={c.id} value={c.id}>{c.n[li(lang)]}</option>)}</select>
    </div>
  )
}

function Activity() {
  const { lang, house } = useApp()
  if (!house!.log.length) return null
  return (
    <div className="card p-4"><h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{t('activity', lang)}</h3>
      <ul className="space-y-1 text-sm">{house!.log.slice(0, 5).map((e, i) => <li key={i}><b>{e.who}</b> <span className="text-muted">{e.msg}</span></li>)}</ul></div>
  )
}

export function ProfileScreen({ celebrate }: Props) {
  const { lang, setLang, me, house, logout, toast } = useApp()
  const copy = async () => { try { await navigator.clipboard.writeText(house!.code) } catch { /* shown on screen anyway */ } toast(t('copied', lang)); celebrate() }
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold text-forest">{t('profile', lang)}</h1>
      <div className="card p-5"><p className="text-lg font-bold">{me!.name}</p><p className="text-sm text-muted">{me!.email} · {me!.city}</p>
        <div className="mt-4 flex gap-2" role="group" aria-label={t('language', lang)}>{(['fr', 'en', 'ar'] as Lang[]).map((l) => <button key={l} className="chip" aria-pressed={lang === l} onClick={() => setLang(l)}>{{ fr: 'Français', en: 'English', ar: 'العربية' }[l]}</button>)}</div></div>
      <div className="card space-y-3 p-5"><h2 className="font-bold">{house!.name}</h2><p className="text-sm text-muted">{t('invite', lang)}</p>
        <div className="flex items-center gap-3"><code className="flex-1 rounded-2xl bg-cream px-4 py-3 text-center font-display text-2xl font-extrabold tracking-widest text-forest">{house!.code}</code><button className="btn btn-primary" onClick={copy}>{t('copy', lang)}</button></div>
        <p className="text-xs text-muted">{t('twoTabs', lang)}</p>
        <h3 className="pt-2 text-sm font-bold text-muted">{t('members', lang)}</h3>
        {house!.members.map((m) => <div key={m.id} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-leaf/40 font-bold">{m.name[0]}</span><span className="flex-1 font-semibold">{m.name}</span><span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold">{t(m.role, lang)}</span></div>)}</div>
      <div className="card p-5"><h3 className="font-bold">{t('soon', lang)}</h3><p className="mt-1 text-sm text-muted">{t('soonItems', lang)}</p></div>
      <button className="btn btn-soft w-full" onClick={logout}>{t('logout', lang)}</button>
    </div>
  )
}
