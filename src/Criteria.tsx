import { SlidersHorizontal } from 'lucide-react'
import { useApp } from './lib/store'
import { t, type Lang } from './lib/i18n'
import { ALLERGY, CUISINES, FLAG, REGIONS, type Prefs } from './lib/plan'
import { Sheet } from './ui'
import { Leaf, Carrot, Wallet, Zap } from './icons'
import { Shuffle } from 'lucide-react'
import { HEALTH, type Health } from './lib/nutri'
import { Controls } from './Screens'

const li = (l: Lang) => (l === 'en' ? 0 : l === 'ar' ? 2 : 1)

/** Active meal criteria as short labels (shown on the Week tab). */
export function useCriteriaLabels(): string[] {
  const { lang, me } = useApp(); const u = me!
  const goals = u.goals ?? []; const out: string[] = []
  const c = (u.cuisine ?? 'ma').split(',')[0]
  out.push(`${FLAG[c] ?? ''} ${t('c_' + c, lang)}`.trim())
  if (goals.includes('healthy')) out.push('Healthy')
  if (u.diet.includes('vegetarian')) out.push(lang === 'en' ? 'Veggie' : 'Végé')
  for (const a of ALLERGY) if (u.diet.includes(a[0])) out.push(a[2][li(lang)])
  if (u.health && u.health !== 'none') out.push(HEALTH[u.health as Health][li(lang) === 0 ? 1 : li(lang) === 2 ? 3 : 2])
  if (u.ramadan) out.push('🌙 Ramadan')
  for (const g of ['cheap', 'quick', 'varied']) if (goals.includes(g)) out.push(t('g_' + g, lang))
  return out
}

/** One place to change every meal criterion (country, healthy, allergies…): the week is rebuilt on each change. */
export function CriteriaSheet({ open, onClose, recompose, makeHealthy, setBudget }: { open: boolean; onClose: () => void; recompose: (o: Partial<Prefs>) => void; makeHealthy: () => void; setBudget: (b: number) => void }) {
  const { lang, me, patchMe, house } = useApp(); const u = me!
  const goals = u.goals ?? []; const cuisine = u.cuisine ?? 'ma'; const region = u.region ?? 'all'
  const has = Object.keys(house!.plan).length > 0
  const tg = (g: string) => { const on = !goals.includes(g); const ng = on ? [...goals.filter((x) => !(g === 'healthy' && x === 'gourmand')), g] : goals.filter((x) => x !== g); patchMe({ goals: ng }); if (g === 'healthy' && on && has) makeHealthy(); else recompose({ goals: ng }) }
  const setDiet = (d: string[]) => { patchMe({ diet: d }); recompose({ diet: d }) }
  const togD = (k: string) => setDiet(u.diet.includes(k) ? u.diet.filter((x) => x !== k) : [...u.diet, k])
  const setKids = (d: number) => { const k0 = u.kids ?? 0; const k = Math.max(0, Math.min(6, k0 + d)); if (k === k0) return; const adults = Math.max(1, u.size - Math.round(k0 * 0.6)); const size = adults + Math.round(k * 0.6); patchMe({ kids: k, size }); recompose({ size }) }
  const T = (fr: string, en: string) => (lang === 'en' ? en : fr)
  return (
    <Sheet open={open} onClose={onClose} title={T('Mes critères repas', 'My meal criteria')}>
      <div className="space-y-4">
        <p className="text-xs text-muted">{T('Changez un critère : la semaine et la liste de courses se refont automatiquement.', 'Change a criterion: the week and shopping list rebuild automatically.')}</p>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{T('Style', 'Style')}</p>
          <div className="flex flex-wrap gap-2">
            <button className="chip" aria-pressed={goals.includes('healthy')} onClick={() => tg('healthy')}><Leaf size={15} className="me-1.5" aria-hidden />Healthy</button>
            <button className="chip" aria-pressed={u.diet.includes('vegetarian')} onClick={() => togD('vegetarian')}><Carrot size={15} className="me-1.5" aria-hidden />{T('Végé', 'Veggie')}</button>
            <button className="chip" aria-pressed={goals.includes('cheap')} onClick={() => tg('cheap')}><Wallet size={15} className="me-1.5" aria-hidden />{t('g_cheap', lang)}</button>
            <button className="chip" aria-pressed={goals.includes('quick')} onClick={() => tg('quick')}><Zap size={15} className="me-1.5" aria-hidden />{t('g_quick', lang)}</button>
            <button className="chip" aria-pressed={goals.includes('varied')} onClick={() => tg('varied')}><Shuffle size={15} className="me-1.5" aria-hidden />{t('g_varied', lang)}</button>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{T('Allergies et régimes', 'Allergies and diets')}</p>
          <div className="flex flex-wrap gap-2">{ALLERGY.map(([k, e, n]) => <button key={k} className="chip" aria-pressed={u.diet.includes(k)} onClick={() => togD(k)}>{e} {n[li(lang)]}</button>)}</div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t('cuisine', lang)}</p>
          <div className="flex flex-wrap gap-2">{CUISINES.map((c) => <button key={c} className="chip" aria-pressed={cuisine === c} onClick={() => { patchMe({ cuisine: c, region: 'all' }); recompose({ cuisine: c, region: 'all' }) }}>{FLAG[c]} {t('c_' + c, lang)}</button>)}</div>
          {cuisine === 'ma' && <div className="mt-2 flex flex-wrap gap-1.5">{REGIONS.map((r) => <button key={r} className={`rounded-full px-3 py-1 text-xs font-semibold ${region === r ? 'bg-leaf/40 text-forest' : 'text-muted'}`} onClick={() => { patchMe({ region: r }); recompose({ region: r }) }}>{t('r_' + r, lang)}</button>)}</div>}
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{T('Profil santé', 'Health profile')}</p>
          <div className="grid grid-cols-4 gap-1.5 [&>button]:min-w-0">{(Object.keys(HEALTH) as Health[]).map((h) => <button key={h} onClick={() => { patchMe({ health: h }); recompose({ health: h }) }} aria-pressed={(u.health ?? 'none') === h} className={`rounded-2xl p-2 text-center text-[12px] font-bold ${(u.health ?? 'none') === h ? 'bg-forest text-white' : 'bg-cream'}`}><span className="block text-2xl">{HEALTH[h][0]}</span>{HEALTH[h][lang === 'en' ? 1 : lang === 'ar' ? 3 : 2]}</button>)}</div>
        </div>
        <button onClick={() => { const r = !u.ramadan; patchMe({ ramadan: r }); recompose({ ramadan: r, meals: r ? ['d', 'b'] : u.meals ?? ['b', 'l', 'd'] }) }} aria-pressed={!!u.ramadan} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-start text-sm font-bold ${u.ramadan ? 'bg-leaf/30 text-forest ring-2 ring-forest' : 'bg-cream'}`}>🌙 {T('Mode Ramadan (ftour et shour)', 'Ramadan mode (iftar and suhoor)')}</button>
        <div className="card flex items-center justify-between p-3"><span className="text-sm font-bold">{T('Enfants (portions réduites)', 'Children (smaller portions)')}</span><span className="flex items-center gap-2"><button className="grid h-9 w-9 place-items-center rounded-full bg-cream text-lg font-bold" onClick={() => setKids(-1)} aria-label="−">−</button><b className="w-6 text-center tabular-nums">{u.kids ?? 0}</b><button className="grid h-9 w-9 place-items-center rounded-full bg-cream text-lg font-bold" onClick={() => setKids(1)} aria-label="+">+</button></span></div>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{T('Budget, personnes, repas', 'Budget, people, meals')}</p>
          <Controls setBudget={setBudget} />
        </div>
        <button className="btn btn-primary w-full" onClick={onClose}>OK</button>
      </div>
    </Sheet>
  )
}

/** Floating shortcut + summary entry point. */
export function CriteriaFab({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick} className="fixed bottom-[184px] end-4 z-30 flex items-center gap-2 rounded-full bg-surface px-4 py-3 text-sm font-bold text-forest shadow-lift active:scale-95 lg:hidden" aria-label={label}><SlidersHorizontal size={17} aria-hidden /> {label}</button>
}
