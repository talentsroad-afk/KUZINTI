import { useMemo, useState } from 'react'
import { useApp } from './lib/store'
import { dayName, money, rname, t } from './lib/i18n'
import { RECIPES, type Meal } from './data/recipes'
import { kcalPerServing, recipeCost } from './lib/engine'
import { modeWeight } from './lib/plan'
import { FoodTile } from './ui'
import { kcalBadge } from './Screens'

export const SLOTS: Meal[] = ['b', 'l', 'd', 'g']
export const SLOT_E: Record<Meal, string> = { b: '🌅', l: '☀️', d: '🌙', g: '🍵' }
const STYLES = ['healthy', 'protein', 'vegetarian', 'ftour', 'budget', 'quick', 'moroccan']
const BANDS: Record<string, [number, number]> = { kLow: [0, 350], kMid: [350, 650], kHigh: [650, 9999] }

/** Browse every dish, filter by meal / style / calories, and drop it straight into a day and slot. */
export function DishCatalog({ onClose, day0, slot0 }: { onClose: () => void; day0: number; slot0: Meal }) {
  const { lang, me, house, upHouse, award, toast } = useApp()
  const plan = house!.plan; const hh = Math.max(1, me!.size); const mode = me!.mode ?? 'balanced'
  const [day, setDay] = useState(day0); const [slot, setSlot] = useState<Meal>(slot0)
  const [q, setQ] = useState(''); const [meal, setMeal] = useState<Meal | 'all'>(slot0); const [style, setStyle] = useState('all'); const [band, setBand] = useState('all')
  const list = useMemo(() => RECIPES.filter((r) => (meal === 'all' || r.m.includes(meal)) && (style === 'all' || r.tags.includes(style)) && (band === 'all' || (() => { const k = kcalPerServing(r.id); const [a, b] = BANDS[band]; return k >= a && k < b })()) && (rname(r.n, lang) + ' ' + r.n[0]).toLowerCase().includes(q.toLowerCase())).sort((a, b) => modeWeight(mode, kcalPerServing(b.id)) - modeWeight(mode, kcalPerServing(a.id))), [meal, style, band, q, lang, mode])
  const where = (rid: string) => Object.entries(plan).filter(([, e]) => e.r === rid).map(([k]) => k)
  const nextEmpty = (from: number, s: Meal): [number, Meal] => { for (let i = 0; i < 28; i++) { const d = (from + Math.floor((SLOTS.indexOf(s) + i) / 4)) % 7; const sl = SLOTS[(SLOTS.indexOf(s) + i) % 4]; if (sl !== 'g' && !plan[`${d}-${sl}`]) return [d, sl] } return [from, s] }
  const add = (rid: string, nm: string) => {
    upHouse((h) => { h.plan[`${day}-${slot}`] = { r: rid, n: hh } }, `added ${nm}`); award(10, nm)
    toast(`${SLOT_E[slot]} ${dayName(day, lang)} · ${t(slot, lang)}`)
    if (slot !== 'g') { const [d, s] = nextEmpty(day, slot); setDay(d); setSlot(s) }
  }
  const cur = plan[`${day}-${slot}`]
  const Chip = ({ on, set, label }: { on: boolean; set: () => void; label: string }) => <button className="chip" aria-pressed={on} onClick={set}>{label}</button>
  return (
    <div className="calm fixed inset-0 z-[60] flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }} role="dialog" aria-label={t('browse', lang)}>
      <div className="mx-auto w-full max-w-2xl px-4 pt-3">
        <div className="flex items-center justify-between"><h1 className="text-xl font-extrabold text-forest">📖 {t('browse', lang)}</h1><button className="btn btn-primary !min-h-10 !px-5" onClick={onClose}>{t('done2', lang)}</button></div>
        <div className="card mt-3 space-y-2 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{t('addTo', lang)}{cur && <span className="ms-2 font-semibold normal-case text-[#9a6a1a]">↻ {t('replaces', lang)}</span>}</p>
          <div className="flex gap-1.5 overflow-x-auto" data-noswipe>{Array.from({ length: 7 }, (_, d) => <button key={d} className="chip" aria-pressed={day === d} onClick={() => setDay(d)}>{dayName(d, lang).slice(0, 3)}</button>)}</div>
          <div className="flex gap-1.5">{SLOTS.map((s) => <button key={s} className="chip flex-1 justify-center" aria-pressed={slot === s} onClick={() => { setSlot(s); setMeal(s) }}>{SLOT_E[s]} {t(s, lang)}</button>)}</div>
        </div>
        <input className="input mt-3" placeholder={t('search', lang)} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mt-2 space-y-1.5" data-noswipe>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5"><Chip on={meal === 'all'} set={() => setMeal('all')} label={t('all', lang)} />{SLOTS.map((s) => <Chip key={s} on={meal === s} set={() => setMeal(s)} label={`${SLOT_E[s]} ${t(s, lang)}`} />)}</div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5"><Chip on={style === 'all'} set={() => setStyle('all')} label={t('all', lang)} />{STYLES.map((k) => <Chip key={k} on={style === k} set={() => setStyle(k)} label={k === 'healthy' ? t('styleHealthy', lang) : k === 'budget' ? t('budgetT', lang) : t(k, lang)} />)}</div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5"><Chip on={band === 'all'} set={() => setBand('all')} label={`🔥 ${t('kcalL', lang)}`} />{Object.keys(BANDS).map((k) => <Chip key={k} on={band === k} set={() => setBand(k)} label={t(k, lang)} />)}</div>
        </div>
      </div>
      <div className="mx-auto mt-2 w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-8">
        <div className="space-y-2">
          {list.map((r) => { const kb = kcalBadge(r.id); const w = where(r.id); return (
            <div key={r.id} className="card flex items-center gap-3 p-2.5">
              <FoodTile r={r} className="h-16 w-16 shrink-0 rounded-2xl !text-3xl" />
              <div className="min-w-0 flex-1"><p className="font-display text-[15px] font-extrabold leading-tight">{rname(r.n, lang)}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted"><span className={`rounded-full px-2 py-0.5 font-bold ${kb.c}`}>{kb.k} kcal</span><span>{money(recipeCost(r.id) / r.s, lang)}/👤</span>{r.m.map((m) => <span key={m}>{SLOT_E[m]}</span>)}{r.tags.includes('ftour') && <span>🌙</span>}</p>
                {w.length > 0 && <p className="mt-0.5 text-[11px] font-semibold text-forest">✓ {t('inWeek', lang)}: {w.map((k) => `${dayName(+k.split('-')[0], lang).slice(0, 3)} ${SLOT_E[k.split('-')[1] as Meal]}`).join(' · ')}</p>}</div>
              <button className="btn btn-primary !min-h-11 !w-11 !px-0 text-xl" onClick={() => add(r.id, rname(r.n, lang))} aria-label={t('add', lang)}>＋</button>
            </div>) })}
          {!list.length && <p className="card p-6 text-center text-muted">{t('noMatch', lang)}</p>}
        </div>
      </div>
    </div>
  )
}
