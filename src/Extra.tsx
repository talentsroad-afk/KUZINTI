import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { rname, t, type Lang } from './lib/i18n'
import { RECIPES, type Meal, type Recipe } from './data/recipes'
import { cuisineOf, entry } from './lib/plan'
import { kcalPerServing } from './lib/engine'
import { FoodTile, Sheet } from './ui'
import { RecipeSheet } from './Screens'
import { useBasket } from './Flow'

const li = (l: Lang) => (l === 'en' ? 0 : l === 'ar' ? 2 : 1)
const FILTERS = ['all', 'favs', 'ma', 'b', 'l', 'd', 'g', 'veg', 'world'] as const
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Browse every recipe: search, filters, favorites, add to today in one tap. */
export function RecipesTab({ say }: { say: (m: string) => void }) {
  const { lang, me, patchMe, upHouse, award } = useApp()
  const [q, setQ] = useState(''); const [f, setF] = useState<(typeof FILTERS)[number]>('ma')
  const [view, setView] = useState<Recipe | null>(null)
  const favs = me!.favs; const today = (new Date().getDay() + 6) % 7
  const list = useMemo(() => RECIPES.filter((r) => r.m.length > 0 || f === 'all' || f === 'ma').filter((r) => {
    if (q && !r.n.some((n) => norm(n).includes(norm(q)))) return false
    if (f === 'favs') return favs.includes(r.id)
    if (f === 'ma') return cuisineOf(r) === 'ma'
    if (f === 'world') return cuisineOf(r) !== 'ma'
    if (f === 'veg') return r.tags.includes('vegetarian')
    if (f === 'all') return true
    return r.m.includes(f as Meal)
  }), [q, f, favs])
  const fav = (r: Recipe) => { const on = favs.includes(r.id); patchMe({ favs: on ? favs.filter((x) => x !== r.id) : [...favs, r.id] }); if (!on) award(2, '❤️') }
  const add = (r: Recipe) => { const s = r.m[0]; if (!s) return; upHouse((h) => { h.plan[`${today}-${s}`] = entry(r.id, me!.size, s) }, `+ ${rname(r.n, lang)}`); say(`✅ ${rname(r.n, lang)} → ${t('today', lang)} · ${t(s, lang)}`) }
  return (
    <div className="space-y-3">
      <input className="w-full rounded-2xl bg-surface px-4 py-3 shadow-soft outline-none" placeholder={`🔍 ${t('searchRec', lang)}`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">{FILTERS.map((k) => <button key={k} className={`chip shrink-0 ${f === k ? '!bg-forest !text-white' : ''}`} onClick={() => setF(k)}>{t('rf_' + k, lang)}</button>)}</div>
      <p className="px-1 text-xs text-muted">{list.length} {t('recipesN', lang)}</p>
      <div className="grid grid-cols-2 gap-3">
        {list.map((r) => { const on = favs.includes(r.id); return (
          <div key={r.id} className="card overflow-hidden">
            <button className="block w-full text-start" onClick={() => setView(r)}>
              <FoodTile r={r} className="h-28" />
              <div className="p-2.5"><p className="line-clamp-2 text-sm font-bold leading-tight">{rname(r.n, lang)}</p><p className="mt-1 text-[11px] text-muted">⏱ {r.t} min · {Math.round(kcalPerServing(r.id))} kcal</p></div>
            </button>
            <div className="flex items-center justify-between px-2.5 pb-2.5">
              <button className="text-xl" aria-pressed={on} aria-label="favorite" onClick={() => fav(r)}>{on ? '❤️' : '🤍'}</button>
              {r.m.length > 0 && <button className="rounded-full bg-forest px-3 py-1 text-xs font-bold text-white active:scale-95" onClick={() => add(r)}>＋ {t('today', lang)}</button>}
            </div>
          </div>) })}
      </div>
      {!list.length && <p className="card p-6 text-center text-muted">{f === 'favs' ? t('noFavs', lang) : '—'}</p>}
      {view && <RecipeSheet r={view} onClose={() => setView(null)} />}
    </div>
  )
}

/** Fridge photo: take a picture, then confirm what is already at home so the list shrinks.
 *  Automatic recognition (vision AI) plugs in here later; for now the user ticks what they see. */
export function FridgeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang, upHouse, award } = useApp()
  const { lines } = useBasket()
  const [img, setImg] = useState<string | null>(null); const [have, setHave] = useState<Record<string, boolean>>({})
  const cands = lines.filter((l) => l.buy > 0 && ['produce', 'dairy', 'meat'].includes(l.ing.aisle)).slice(0, 18)
  const apply = () => {
    const ids = Object.keys(have).filter((k) => have[k]); if (!ids.length) return onClose()
    upHouse((h) => { for (const id of ids) { const l = lines.find((x) => x.id === id); if (l) h.pantry[id] = (h.pantry[id] ?? 0) + l.buy } }, `📸 ${ids.length}`)
    award(10, '📸'); setImg(null); setHave({}); onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title={`📸 ${t('fridge', lang)}`}>
      <label className="relative block cursor-pointer overflow-hidden rounded-3xl bg-cream">
        {img ? <img src={img} alt="" className="h-48 w-full object-cover" /> : <div className="grid h-40 place-items-center text-center text-muted"><span className="text-4xl">📷</span><span className="text-sm font-semibold">{t('fridgeShot', lang)}</span></div>}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setImg(URL.createObjectURL(file)) }} />
      </label>
      <p className="mt-3 text-sm font-semibold">{t('fridgeHave', lang)}</p>
      <p className="text-[11px] text-muted">{t('fridgeNote', lang)}</p>
      <div className="mt-2 flex flex-wrap gap-2">{cands.map((l) => <button key={l.id} className={`chip ${have[l.id] ? '!bg-forest !text-white' : ''}`} onClick={() => setHave({ ...have, [l.id]: !have[l.id] })}>{have[l.id] ? '✓ ' : ''}{l.ing.n[li(lang)]}</button>)}</div>
      <button className="btn btn-primary mt-4 w-full" onClick={apply}>{t('fridgeApply', lang)}</button>
    </Sheet>
  )
}
