import { FormeCard, KcalGoal } from './Forme'
import { useState } from 'react'
import { useApp } from './lib/store'
import { t, type Lang } from './lib/i18n'
import { fmtQty } from './lib/engine'
import { CATALOG } from './data/catalog'
import { Stepper } from './ui'
import { cname, countryOf } from './lib/countries'

const li = (l: Lang) => (l === 'en' ? 0 : l === 'ar' ? 2 : 1)

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

export function ProfileScreen({ celebrate, openCountry }: { celebrate: () => void; openCountry: () => void }) {
  const { lang, setLang, me, house, logout, toast, patchMe } = useApp()
  const copy = async () => { try { await navigator.clipboard.writeText(house!.code) } catch { /* shown on screen anyway */ } toast(t('copied', lang)); celebrate() }
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold text-forest">{t('profile', lang)}</h1>
      <div className="card flex items-center justify-between gap-3 p-4"><div><h2 className="font-display text-lg font-extrabold">🌍 {lang === 'en' ? 'Country' : 'Pays'}</h2><p className="text-xs text-muted">{lang === 'en' ? 'Stores, currency and default cuisine.' : 'Magasins, devise et cuisine par défaut.'}</p></div>
        <button className="btn btn-soft shrink-0 !min-h-11" onClick={openCountry}>{countryOf(me!.country).f} {cname(countryOf(me!.country), lang)} ›</button></div>
      <div className="card space-y-3 p-4">
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-extrabold">🎯 Forme & calories</h2>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted">Afficher dans Ma semaine<input type="checkbox" className="h-5 w-5 accent-[#245B43]" checked={!!me!.showForme} onChange={(e) => patchMe({ showForme: e.target.checked })} /></label></div>
        <KcalGoal onChange={() => toast(lang === 'en' ? 'Goal saved: re-plan your week to apply it' : 'Objectif enregistré : recompose ta semaine pour l’appliquer')} />
        <FormeCard plan={house!.plan} />
      </div>
      <div className="card grid grid-cols-3 gap-2 p-4 text-center"><div><p className="text-2xl">🔥</p><b className="tabular-nums">{me!.streak}</b><p className="text-xs text-muted">{t('streak', lang)}</p></div><div><p className="text-2xl">⭐</p><b className="tabular-nums">{t('level', lang)} {Math.floor(me!.xp / 100) + 1}</b><div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-cream"><div className="h-full rounded-full bg-apricot" style={{ width: `${me!.xp % 100}%` }} /></div></div><div><p className="text-2xl">✨</p><b className="tabular-nums">{me!.xp}</b><p className="text-xs text-muted">XP</p></div></div>
      <div className="card p-5"><p className="text-lg font-bold">{me!.name}</p><p className="text-sm text-muted">{me!.email} · {me!.city}</p>
        <div className="mt-4 flex gap-2" role="group" aria-label={t('language', lang)}>{(['fr', 'en', 'ar', 'zgh'] as Lang[]).map((l) => <button key={l} className="chip" aria-pressed={lang === l} onClick={() => setLang(l)}>{{ fr: 'Français', en: 'English', ar: 'العربية', zgh: 'ⵜⴰⵎⴰⵣⵉⵖⵜ (bêta)' }[l]}</button>)}</div></div>
      <div className="card space-y-3 p-5"><h2 className="font-bold">{house!.name}</h2><p className="text-sm text-muted">{t('invite', lang)}</p>
        <div className="flex items-center gap-3"><code className="flex-1 rounded-2xl bg-cream px-4 py-3 text-center font-display text-2xl font-extrabold tracking-widest text-forest">{house!.code}</code><button className="btn btn-primary" onClick={copy}>{t('copy', lang)}</button></div>
        <p className="text-xs text-muted">{t('twoTabs', lang)}</p>
        <h3 className="pt-2 text-sm font-bold text-muted">{t('members', lang)}</h3>
        {house!.members.map((m) => <div key={m.id} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-leaf/40 font-bold">{m.name[0]}</span><span className="flex-1 font-semibold">{m.name}</span><span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold">{t(m.role, lang)}</span></div>)}</div>
      <details className="card group p-5"><summary className="flex cursor-pointer list-none items-center justify-between font-bold">🥫 {t('pantry', lang)}<span className="text-muted transition-transform group-open:rotate-90">›</span></summary><div className="mt-3"><Pantry /></div></details>
      <details className="card group p-5"><summary className="flex cursor-pointer list-none items-center justify-between font-bold">🕘 {lang === 'en' ? 'Household activity' : 'Activité du foyer'}<span className="text-muted transition-transform group-open:rotate-90">›</span></summary><div className="mt-3"><Activity /></div></details>
      <p className="px-1 text-center text-xs text-muted">{t('soon', lang)} : {t('soonItems', lang)}</p>
      <button className="btn btn-soft w-full" onClick={logout}>{t('logout', lang)}</button>
    </div>
  )
}
