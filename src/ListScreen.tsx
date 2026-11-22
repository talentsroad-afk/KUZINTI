import { FormeCard, KcalGoal } from './Forme'
import { Ic } from './Ic'
import { useState } from 'react'
import { E3 } from './E3'
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
      <select className="input" value={add} onChange={(e) => { const id = e.target.value; if (id) upHouse((h) => { h.pantry[id] = (h.pantry[id] ?? 0) + step(id) * 2 }, `pantry +${id}`); setAdd('') }}><option value="">+ {t('addPantry', lang)}</option>{(['produce', 'meat', 'dairy', 'bakery', 'grocery', 'spices'] as const).map((a) => <optgroup key={a} label={{ produce: '🥬 Fruits et légumes', meat: '🥩 Viandes et poissons', dairy: '🥛 Crèmerie', bakery: '🥖 Boulangerie', grocery: '🫙 Épicerie', spices: '🧂 Épices' }[a]}>{CATALOG.filter((c) => c.aisle === a).map((c) => <option key={c.id} value={c.id}>{c.n[li(lang)]}</option>)}</optgroup>)}</select>
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

const AV = ['🧑‍🍳', '👩‍🍳', '👨‍🍳', '🦊', '🐼', '🦁', '🐨', '🐸']
const JOKES = [['Chef in training 👨‍🍳', 'Chef étoilé en devenir 👨‍🍳'], ['The fridge says hi 🧊', 'Le frigo vous salue 🧊'], ['Onions made me cry again 🧅', 'Les oignons m’ont encore fait pleurer 🧅'], ['Tajine level: legendary 🍲', 'Niveau tajine : légendaire 🍲'], ['Hungry? Me too 😋', 'Faim ? Moi aussi 😋']]
export function ProfileScreen({ celebrate, openCountry }: { celebrate: () => void; openCountry: () => void }) {
  const { lang, setLang, me, house, logout, toast, patchMe } = useApp()
  const [av, setAv] = useState(() => { try { return Number(localStorage.getItem('kz-av') ?? [...me!.name].reduce((a, c) => a + c.charCodeAt(0), 0)) % AV.length } catch { return 0 } })
  const [wig, setWig] = useState(0)
  const poke = () => { const n = (av + 1) % AV.length; setAv(n); setWig(wig + 1); try { localStorage.setItem('kz-av', String(n)) } catch { /* ignore */ } toast(JOKES[(wig) % JOKES.length][lang === 'en' ? 0 : 1]) }
  const copy = async () => { try { await navigator.clipboard.writeText(house!.code) } catch { /* shown on screen anyway */ } toast(t('copied', lang)); celebrate() }
  const share = () => window.open('https://wa.me/?text=' + encodeURIComponent((lang === 'en' ? 'Join my KUZINTI household: code ' : 'Rejoins mon foyer KUZINTI : code ') + house!.code + ' · ' + location.origin), '_blank')
  const lvl = Math.floor(me!.xp / 100) + 1; const c = countryOf(me!.country)
  const Row = ({ e, label, children, onClick }: { e: string; label: string; children?: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition active:bg-cream"><span className="text-[22px]"><E3 e={e} /></span><span className="flex-1 font-semibold">{label}</span>{children}<span className="text-muted">›</span></button>)
  return (
    <div className="space-y-4">
      <section className="rise relative overflow-hidden rounded-[30px] bg-gradient-to-br from-forest to-[#0f2a1f] p-5 text-white shadow-lift">
        <span className="zellige pointer-events-none absolute inset-0 opacity-[.07]" aria-hidden />
        <span className="glow pointer-events-none absolute -end-10 -top-10 h-44 w-44 rounded-full bg-apricot/30 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4">
          <button key={wig} onClick={poke} className="wiggle grid h-24 w-24 shrink-0 place-items-center rounded-full bg-white/10 text-[64px] ring-4 ring-apricot/60 active:scale-90" aria-label="Avatar"><span className="alive"><E3 e={AV[av]} /></span></button>
          <div className="min-w-0"><p className="truncate font-display text-2xl font-extrabold">{me!.name}</p><p className="text-sm text-white/70">{c.f} {me!.city || cname(c, lang)}</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-apricot px-3 py-1 text-xs font-extrabold text-[#3c280a]"><E3 e="⭐" /> {t('level', lang)} {lvl}</span></div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">{([['🔥', me!.streak, t('streak', lang)], ['✨', me!.xp, 'XP'], ['👥', house!.members.length, t('members', lang)]] as [string, number, string][]).map(([e, v, l], k) => (
          <div key={k} className="rise rounded-2xl bg-white/10 py-2.5" style={{ animationDelay: `${k * 80}ms` }}><span className="text-2xl"><E3 e={e} /></span><b className="block font-display text-lg tabular-nums">{v}</b><span className="text-[12px] text-white/65">{l}</span></div>))}</div>
        <div className="relative mt-3"><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="grow-x h-full rounded-full bg-apricot" style={{ width: `${me!.xp % 100}%` }} /></div><p className="mt-1 text-[12px] text-white/60">{100 - (me!.xp % 100)} XP {lang === 'en' ? 'to level' : 'avant le niveau'} {lvl + 1}</p></div>
      </section>
      <section className="card space-y-3 p-4">
        <div className="flex items-center gap-2"><span className="text-2xl"><E3 e="🏡" /></span><h2 className="flex-1 font-display text-lg font-extrabold">{house!.name}</h2><span className="flex -space-x-2">{house!.members.map((m) => <span key={m.id} className="grid h-8 w-8 place-items-center rounded-full bg-leaf/50 text-xs font-bold ring-2 ring-surface" title={m.name}>{m.name[0]}</span>)}</span></div>
        <div className="rounded-2xl bg-cream p-3 text-center"><p className="text-xs font-semibold text-muted">{t('invite', lang)}</p><p className="font-display text-[28px] font-extrabold tracking-[.18em] text-forest">{house!.code}</p></div>
        <div className="grid grid-cols-2 gap-2"><button className="btn btn-primary !min-h-12" onClick={share}><Ic e="💬" /> WhatsApp</button><button className="btn btn-soft !min-h-12" onClick={copy}><Ic e="📋" /> {t('copy', lang)}</button></div>
      </section>
      <section className="card divide-y divide-line/70 overflow-hidden !p-0">
        <Row e="🌍" label={lang === 'en' ? 'Country' : 'Pays'} onClick={openCountry}><span className="text-sm text-muted">{c.f} {cname(c, lang)}</span></Row>
        <div className="flex items-center gap-3 px-4 py-3"><span className="text-[22px]"><E3 e="🗣️" /></span><span className="flex-1 font-semibold">{t('language', lang)}</span>
          <span className="flex rounded-full bg-cream p-0.5" role="group" aria-label={t('language', lang)}>{(['fr', 'en', 'ar', 'zgh'] as Lang[]).map((l) => <button key={l} className={`rounded-full px-2.5 py-1 text-xs font-bold ${lang === l ? 'bg-forest text-white' : 'text-muted'}`} aria-pressed={lang === l} onClick={() => setLang(l)}>{{ fr: 'FR', en: 'EN', ar: 'ع', zgh: 'ⵣ' }[l]}</button>)}</span></div>
        <details className="group"><summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5"><span className="text-[22px]"><E3 e="🎯" /></span><span className="flex-1 font-semibold">{lang === 'en' ? 'Fitness & calories' : 'Forme & calories'}</span><span className="text-muted transition-transform group-open:rotate-90">›</span></summary>
          <div className="space-y-3 px-4 pb-4"><label className="flex items-center justify-between gap-2 text-sm font-semibold text-muted">{lang === 'en' ? 'Show in My week' : 'Afficher dans Ma semaine'}<input type="checkbox" className="h-5 w-5 accent-[#245B43]" checked={!!me!.showForme} onChange={(e) => patchMe({ showForme: e.target.checked })} /></label>
            <KcalGoal onChange={() => toast(lang === 'en' ? 'Goal saved: re-plan your week to apply it' : 'Objectif enregistré : recompose ta semaine pour l’appliquer')} /><FormeCard plan={house!.plan} /></div></details>
        <details className="group"><summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5"><span className="text-[22px]"><E3 e="🥫" /></span><span className="flex-1 font-semibold">{t('pantry', lang)}</span><span className="text-muted transition-transform group-open:rotate-90">›</span></summary><div className="px-4 pb-4"><Pantry /></div></details>
        <details className="group"><summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5"><span className="text-[22px]"><E3 e="🕘" /></span><span className="flex-1 font-semibold">{lang === 'en' ? 'Household activity' : 'Activité du foyer'}</span><span className="text-muted transition-transform group-open:rotate-90">›</span></summary><div className="px-4 pb-4"><Activity /></div></details>
      </section>
      <button className="w-full py-3 text-sm font-bold text-[#c2410c]" onClick={logout}>{t('logout', lang)}</button>
    </div>
  )
}
