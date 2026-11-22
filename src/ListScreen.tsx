import { useState } from 'react'
import { useApp } from './lib/store'
import { t, type Lang } from './lib/i18n'
import { fmtQty } from './lib/engine'
import { CATALOG } from './data/catalog'
import { Stepper } from './ui'

const li = (l: Lang) => (l === 'en' ? 0 : l === 'fr' ? 1 : 2)

function Pantry() {
  const { lang, house, upHouse } = useApp()
  const [add, setAdd] = useState('')
  const items = Object.entries(house!.pantry).filter(([, v]) => v > 0)
  const step = (id: string) => (CATALOG.find((c) => c.id === id)!.base === 'pc' ? 1 : 50)
  return (
    <div className="space-y-2">
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

export function ProfileScreen({ celebrate }: { celebrate: () => void }) {
  const { lang, setLang, me, house, logout, toast } = useApp()
  const copy = async () => { try { await navigator.clipboard.writeText(house!.code) } catch { /* shown on screen anyway */ } toast(t('copied', lang)); celebrate() }
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold text-forest">{t('profile', lang)}</h1>
      <div className="card grid grid-cols-3 gap-2 p-4 text-center"><div><p className="text-2xl">🔥</p><b className="tabular-nums">{me!.streak}</b><p className="text-xs text-muted">{t('streak', lang)}</p></div><div><p className="text-2xl">⭐</p><b className="tabular-nums">{t('level', lang)} {Math.floor(me!.xp / 100) + 1}</b><div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-cream"><div className="h-full rounded-full bg-apricot" style={{ width: `${me!.xp % 100}%` }} /></div></div><div><p className="text-2xl">✨</p><b className="tabular-nums">{me!.xp}</b><p className="text-xs text-muted">XP</p></div></div>
      <div className="card p-5"><p className="text-lg font-bold">{me!.name}</p><p className="text-sm text-muted">{me!.email} · {me!.city}</p>
        <div className="mt-4 flex gap-2" role="group" aria-label={t('language', lang)}>{(['fr', 'en', 'ar'] as Lang[]).map((l) => <button key={l} className="chip" aria-pressed={lang === l} onClick={() => setLang(l)}>{{ fr: 'Français', en: 'English', ar: 'العربية' }[l]}</button>)}</div></div>
      <div className="card space-y-3 p-5"><h2 className="font-bold">{house!.name}</h2><p className="text-sm text-muted">{t('invite', lang)}</p>
        <div className="flex items-center gap-3"><code className="flex-1 rounded-2xl bg-cream px-4 py-3 text-center font-display text-2xl font-extrabold tracking-widest text-forest">{house!.code}</code><button className="btn btn-primary" onClick={copy}>{t('copy', lang)}</button></div>
        <p className="text-xs text-muted">{t('twoTabs', lang)}</p>
        <h3 className="pt-2 text-sm font-bold text-muted">{t('members', lang)}</h3>
        {house!.members.map((m) => <div key={m.id} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-leaf/40 font-bold">{m.name[0]}</span><span className="flex-1 font-semibold">{m.name}</span><span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold">{t(m.role, lang)}</span></div>)}</div>
      <div className="card space-y-2 p-5"><h3 className="font-bold">{t('pantry', lang)}</h3><Pantry /></div>
      <Activity />
      <div className="card p-5"><h3 className="font-bold">{t('soon', lang)}</h3><p className="mt-1 text-sm text-muted">{t('soonItems', lang)}</p></div>
      <button className="btn btn-soft w-full" onClick={logout}>{t('logout', lang)}</button>
    </div>
  )
}
