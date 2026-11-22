import { zf } from './lib/zgh'
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { AlertTriangle, Lightbulb, Lock, ShieldCheck, Target, TrendingUp } from './icons'
import { useMemo, useState } from 'react'
import { useApp, type MoneyData } from './lib/store'
import { curRate, money, type Lang } from './lib/i18n'
import { Sheet } from './ui'

const L = (l: Lang, en: string, fr: string, ar: string) => (l === 'en' ? en : l === 'ar' ? ar : l === 'zgh' ? zf(fr) : fr)
type Kind = 'need' | 'want'
// Category catalogue. "need" = essentials (target 50%), "want" = lifestyle (30%), savings = 20%.
export const CATS: Record<string, { e: string; n: [string, string, string]; k: Kind; fixed?: boolean }> = {
  rent: { e: '🏠', n: ['Rent / mortgage', 'Loyer / crédit immo', 'الكراء / القرض السكني'], k: 'need', fixed: true },
  bills: { e: '⚡', n: ['Water, power, internet', 'Eau, électricité, internet', 'الماء والكهرباء والإنترنت'], k: 'need', fixed: true },
  phone: { e: '📱', n: ['Phones', 'Téléphones', 'الهواتف'], k: 'need', fixed: true },
  transport: { e: '🚗', n: ['Transport, fuel', 'Transport, carburant', 'النقل والوقود'], k: 'need', fixed: true },
  credit: { e: '💳', n: ['Consumer loans', 'Crédits conso', 'قروض الاستهلاك'], k: 'need', fixed: true },
  insurance: { e: '🛡️', n: ['Insurance', 'Assurances', 'التأمين'], k: 'need', fixed: true },
  school: { e: '🎒', n: ['School, childcare', 'École, garde', 'المدرسة والحضانة'], k: 'need', fixed: true },
  subs: { e: '📺', n: ['Subscriptions', 'Abonnements', 'الاشتراكات'], k: 'want', fixed: true },
  food: { e: '🛒', n: ['Groceries', 'Courses', 'المشتريات'], k: 'need' },
  health: { e: '💊', n: ['Health', 'Santé', 'الصحة'], k: 'need' },
  outings: { e: '🎈', n: ['Outings', 'Sorties', 'الخرجات'], k: 'want' },
  clothes: { e: '👕', n: ['Clothes', 'Vêtements', 'الملابس'], k: 'want' },
  home: { e: '🛋️', n: ['Home', 'Maison', 'البيت'], k: 'want' },
  gifts: { e: '🎁', n: ['Gifts, events', 'Cadeaux, fêtes', 'الهدايا والمناسبات'], k: 'want' },
  misc: { e: '🧾', n: ['Other', 'Divers', 'متفرقات'], k: 'want' },
}
const FIXED = Object.keys(CATS).filter((k) => CATS[k].fixed)
const VAR = Object.keys(CATS).filter((k) => !CATS[k].fixed)
// Validated categorical palette (needs / wants / savings) and reserved status colours.
const C = { need: '#1E7A52', want: '#3D7DB8', save: '#D97A1E' }
const cn = (k: string, l: Lang) => CATS[k].n[l === 'en' ? 0 : l === 'ar' ? 2 : 1]
const ym = (t: number) => { const d = new Date(t); return d.getFullYear() * 12 + d.getMonth() }
const monthName = (m: number, l: Lang) => new Intl.DateTimeFormat(l === 'ar' ? 'ar-MA-u-nu-latn' : l === 'zgh' ? 'fr' : l, { month: 'long', year: 'numeric' }).format(new Date(Math.floor(m / 12), m % 12, 1))
const uid = () => Math.random().toString(36).slice(2, 9)
const EMPTY: MoneyData = { inc: [], fix: {}, env: {}, exp: [], since: Date.now() }

/** Household budget, A to Z. Private: stored in the signed-in person's own profile, never in the shared household. */
export function BudgetTab() {
  const { lang, me, patchMe, house } = useApp()
  const m = me!.money
  const [edit, setEdit] = useState(false)
  if (!m || edit || !m.inc.length) return <Setup start={m ?? { ...EMPTY, env: { food: Math.round(me!.budget * 4.33) } }} onDone={(d) => { patchMe({ money: d }); setEdit(false) }} onCancel={m?.inc.length ? () => setEdit(false) : undefined} lang={lang} weekly={me!.budget} />
  return <Dashboard m={m} lang={lang} onEdit={() => setEdit(true)} save={(d) => patchMe({ money: d })} trips={house!.trips ?? []} />
}

/** Setup as a deck of cards, like the store mode: one question per card, previous and next always visible. */
function Setup({ start, onDone, onCancel, lang, weekly }: { start: MoneyData; onDone: (d: MoneyData) => void; onCancel?: () => void; lang: Lang; weekly: number }) {
  const [d, setD] = useState<MoneyData>(JSON.parse(JSON.stringify(start)))
  const [i, setI] = useState(0); const [dir, setDir] = useState(1)
  const r = curRate(); const num = (v: string) => Math.max(0, (parseFloat(v.replace(',', '.')) || 0) / r)
  const show = (v: number | undefined) => (v ? String(Math.round(v * r)) : '')
  const inc = d.inc.reduce((a, x) => a + x.a, 0); const fix = Object.values(d.fix).reduce((a, x) => a + x, 0)
  const left = inc - fix
  const suggest = () => {
    // 20% saved first, groceries from KUZINTI, 3% health, the rest split across lifestyle envelopes. Never more than income.
    const save = d.goal?.monthly || Math.round(inc * 0.2); const food = Math.round(Math.max(d.env.food ?? 0, weekly * 4.33)); const health = Math.round(inc * 0.03)
    const rest = Math.max(0, left - save - food - health); const sh: [string, number][] = [['outings', 0.3], ['clothes', 0.2], ['home', 0.15], ['gifts', 0.15], ['misc', 0.2]]
    setD({ ...d, env: { food, health, ...Object.fromEntries(sh.map(([k, f]) => [k, Math.round(rest * f)])) }, goal: { n: d.goal?.n ?? '', target: d.goal?.target ?? 0, saved: d.goal?.saved ?? 0, monthly: d.goal?.monthly || save } })
  }
  const suggestInto = () => { const save = d.goal?.monthly ?? Math.round(inc * 0.2); const food = Math.round(Math.max(d.env.food ?? 0, weekly * 4.33)); const health = Math.round(inc * 0.03); const rest = Math.max(0, left - save - food - health); const sh: [string, number][] = [['outings', 0.3], ['clothes', 0.2], ['home', 0.15], ['gifts', 0.15], ['misc', 0.2]]
    onDone({ ...d, since: d.since || Date.now(), env: { food, health, ...Object.fromEntries(sh.map(([k, f]) => [k, Math.round(rest * f)])) }, goal: { n: d.goal?.n ?? '', target: d.goal?.target ?? 0, saved: d.goal?.saved ?? 0, monthly: save } }) }
  const salary = d.inc.find((x) => x.id === 'salary')?.a; const other = d.inc.find((x) => x.id === 'other')?.a
  const setInc = (id: string, n: string, a: number) => setD({ ...d, inc: [...d.inc.filter((x) => x.id !== id), ...(a > 0 ? [{ id, n, a }] : [])] })
  const cards: { t: string; s: string; body: JSX.Element; ok: boolean }[] = [
    { t: L(lang, 'Your income', 'Vos revenus', 'مداخيلك'), s: L(lang, 'Net monthly amounts. Only you can see them.', 'Montants nets par mois. Vous seul les voyez.', 'المبالغ الصافية شهريًا. أنت فقط من يراها.'), ok: inc > 0, body: <div className="space-y-3">
      <Field label={L(lang, 'Net salary', 'Salaire net', 'الراتب الصافي')} v={show(salary)} set={(v) => setInc('salary', 'Salaire', num(v))} big />
      <div className="flex flex-wrap gap-1.5">{[3000, 5000, 8000, 12000, 20000].map((a0) => { const v = a0 * r; const q = 10 ** Math.max(0, Math.floor(Math.log10(v)) - 1); return Math.round(v / q) * q / r }).map((a) => <button key={a} className={`rounded-full px-3 py-1.5 text-sm font-bold tabular-nums transition active:scale-95 ${salary === a ? 'bg-forest text-white' : 'bg-cream'}`} onClick={() => setInc('salary', 'Salaire', a)}>{money(a, lang)}</button>)}</div>
      <Field label={L(lang, 'Partner, rent received, extras', 'Conjoint, loyers perçus, extras', 'الزوج، كراء، إضافات')} v={show(other)} set={(v) => setInc('other', 'Autres revenus', num(v))} />
    </div> },
    { t: L(lang, 'Fixed charges', 'Charges fixes', 'المصاريف الثابتة'), s: L(lang, 'What leaves every month, whatever happens.', 'Ce qui part chaque mois, quoi qu’il arrive.', 'ما يُصرف كل شهر مهما حدث.'), ok: true, body: <div className="grid grid-cols-2 gap-2">
      {FIXED.map((k) => <label key={k} className="rounded-2xl border border-line bg-surface p-2.5"><span className="block text-xs font-semibold text-muted">{CATS[k].e} {cn(k, lang)}</span><input inputMode="decimal" className="mt-1 w-full bg-transparent font-display text-lg font-extrabold tabular-nums outline-none" placeholder="0" value={show(d.fix[k])} onChange={(e) => setD({ ...d, fix: { ...d.fix, [k]: num(e.target.value) } })} /></label>)}
    </div> },
    { t: L(lang, 'How much do you put aside?', 'Combien mettez-vous de côté ?', 'كم تدّخر؟'), s: L(lang, 'Pay yourself first, at the start of the month. 10% is good, 20% is excellent.', 'Payez-vous en premier, en début de mois. 10 % c’est bien, 20 % c’est excellent.', 'ادفع لنفسك أولًا. 10% جيد و20% ممتاز.'), ok: true, body: <div className="space-y-4">
      <div className="text-center"><p className="font-display text-[44px] font-extrabold leading-none tabular-nums" style={{ color: C.save }}>{money(d.goal?.monthly ?? 0, lang)}</p><p className="text-sm text-muted">{inc ? Math.round(((d.goal?.monthly ?? 0) / inc) * 100) : 0} % {L(lang, 'of income', 'des revenus', 'من الدخل')}</p></div>
      <input type="range" min={0} max={30} value={inc ? Math.round(((d.goal?.monthly ?? 0) / inc) * 100) : 0} onChange={(e) => setD({ ...d, goal: { n: d.goal?.n ?? '', target: d.goal?.target ?? 0, saved: d.goal?.saved ?? 0, monthly: Math.round((inc * +e.target.value) / 100) } })} className="w-full accent-[#D97A1E]" aria-label="%" />
      <div className="flex flex-wrap justify-center gap-1.5">{([['🛟', L(lang, 'Safety', 'Précaution', 'احتياط')], ['🕌', 'Aïd'], ['✈️', L(lang, 'Holidays', 'Vacances', 'عطلة')], ['🚗', L(lang, 'Car', 'Voiture', 'سيارة')], ['🏠', L(lang, 'Home', 'Logement', 'سكن')], ['🎓', L(lang, 'Studies', 'Études', 'دراسة')]] as [string, string][]).map(([e, n]) => <button key={n} className={`rounded-full px-3 py-1.5 text-sm font-bold ${d.goal?.n === `${e} ${n}` ? 'bg-forest text-white' : 'bg-cream'}`} onClick={() => setD({ ...d, goal: { n: `${e} ${n}`, target: d.goal?.target ?? 0, saved: d.goal?.saved ?? 0, monthly: d.goal?.monthly ?? 0 } })}>{e} {n}</button>)}</div>
      <Field label={L(lang, 'Target amount (optional)', 'Montant visé (facultatif)', 'المبلغ المستهدف')} v={show(d.goal?.target)} set={(v) => setD({ ...d, goal: { n: d.goal?.n ?? '', target: num(v), monthly: d.goal?.monthly ?? 0, saved: d.goal?.saved ?? 0 } })} />
    </div> },
    { t: L(lang, 'Envelopes (optional)', 'Enveloppes (facultatif)', 'الأظرفة (اختياري)'), s: L(lang, `After fixed charges you have ${money(left, lang)}. Split it, or let us suggest.`, `Après les charges fixes il vous reste ${money(left, lang)}. Répartissez-le, ou laissez-nous proposer.`, `بعد المصاريف الثابتة يبقى ${money(left, lang)}.`), ok: true, body: <div>
      <button className="btn btn-soft mb-3 w-full !min-h-11 !text-sm" onClick={suggest}><Lightbulb size={16} aria-hidden /> {L(lang, 'Suggest with the 50/30/20 rule', 'Proposer avec la règle 50/30/20', 'اقتراح بقاعدة 50/30/20')}</button>
      <div className="grid grid-cols-2 gap-2">{VAR.map((k) => <label key={k} className="rounded-2xl border border-line bg-surface p-2.5"><span className="block text-xs font-semibold text-muted">{CATS[k].e} {cn(k, lang)}{k === 'food' ? ' ⟵ KUZINTI' : ''}</span><input inputMode="decimal" className="mt-1 w-full bg-transparent font-display text-lg font-extrabold tabular-nums outline-none" placeholder="0" value={show(d.env[k])} onChange={(e) => setD({ ...d, env: { ...d.env, [k]: num(e.target.value) } })} /></label>)}</div>
    </div> },
  ]
  const go = (n: number) => { setDir(n > i ? 1 : -1); if (n === 3 && Object.keys(d.env).length <= 1) suggest(); setI(Math.max(0, Math.min(cards.length - 1, n))) }
  const finish = () => { const envs = Object.keys(d.env).length > 1 ? d.env : null; if (!envs) { suggestInto() } else onDone({ ...d, since: d.since || Date.now() }) }
  const c = cards[i]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Lock size={14} className="text-forest" aria-hidden /><p className="text-xs font-semibold text-muted">{L(lang, 'Private: stored only in your profile, never shared with the household.', 'Privé : enregistré dans votre profil uniquement, jamais partagé avec le foyer.', 'خاص: محفوظ في ملفك فقط.')}</p></div>
      <div className="flex gap-1.5">{cards.map((x, k) => <button key={k} className={`h-1.5 flex-1 rounded-full transition-all ${k <= i ? 'bg-forest' : 'bg-line'}`} onClick={() => go(k)} aria-label={x.t} />)}</div>
      <div className="relative">
        {i > 0 && <button className="absolute -start-2 top-6 z-0 hidden h-[80%] w-8 rounded-s-3xl bg-surface/70 shadow-soft sm:block" onClick={() => go(i - 1)} aria-label={cards[i - 1].t} />}
        <div key={i} className={`relative z-10 rounded-[28px] bg-surface p-5 shadow-[0_24px_60px_-34px_rgb(var(--shadow)/.6)] ${dir > 0 ? 'slide-in-r' : 'slide-in-l'}`}>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-terracotta">{i + 1} / {cards.length}</p>
          <h2 className="mt-1 font-serif text-[28px] font-semibold leading-tight">{c.t}</h2>
          <p className="mb-4 mt-1 text-sm text-muted">{c.s}</p>
          {c.body}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted"><span>{i > 0 ? `‹ ${cards[i - 1].t}` : ''}</span><span>{i < cards.length - 1 ? `${cards[i + 1].t} ›` : ''}</span></div>
      <div className="flex gap-2">
        {i > 0 ? <button className="btn btn-soft flex-1" onClick={() => go(i - 1)}><ArrowLeft size={18} aria-hidden /> {L(lang, 'Back', 'Retour', 'رجوع')}</button> : onCancel ? <button className="btn btn-soft flex-1" onClick={onCancel}>{L(lang, 'Cancel', 'Annuler', 'إلغاء')}</button> : null}
        {i < 2 ? <button className="btn btn-primary flex-[2]" disabled={!c.ok} style={{ opacity: c.ok ? 1 : 0.5 }} onClick={() => go(i + 1)}>{L(lang, 'Next', 'Suivant', 'التالي')} <ArrowRight size={18} aria-hidden /></button>
          : <button className="btn btn-primary flex-[2]" onClick={finish}><Check size={18} aria-hidden /> {L(lang, 'See my budget', 'Voir mon budget', 'عرض ميزانيتي')}</button>}
      </div>
      {i === 2 && <button className="w-full text-center text-sm font-semibold text-forest" onClick={() => go(3)}>{L(lang, 'Adjust my envelopes first ›', 'Ajuster mes enveloppes d’abord ›', 'ضبط الأظرفة أولاً ›')}</button>}
      {inc > 0 && <div className="flex items-center gap-1 rounded-2xl bg-cream/80 p-2 text-center text-[11px] tabular-nums">{([[L(lang, 'Income', 'Revenus', 'دخل'), inc, ''], [L(lang, 'Charges', 'Charges', 'مصاريف'), fix, '−'], [L(lang, 'Savings', 'Épargne', 'ادخار'), d.goal?.monthly ?? 0, '−']] as [string, number, string][]).map(([l, v, sg]) => <div key={l} className="flex-1"><p className="text-muted">{l}</p><b>{sg}{money(v, lang)}</b></div>)}<div className="flex-1 rounded-xl bg-forest py-1 text-white"><p className="opacity-80">👛 {L(lang, 'Pocket', 'Poche', 'جيب')}</p><b>{money(inc - fix - (d.goal?.monthly ?? 0), lang)}</b></div>
      </div>}
    </div>
  )
}
function Field({ label, v, set, big, hint }: { label: string; v: string; set: (v: string) => void; big?: boolean; hint?: string }) {
  return <label className="block"><span className="mb-1 block text-sm font-semibold">{label}</span><input inputMode="decimal" className={`input tabular-nums ${big ? '!min-h-14 font-display !text-2xl font-extrabold' : ''}`} placeholder="0" value={v} onChange={(e) => set(e.target.value)} />{hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}</label>
}

function Dashboard({ m, lang, onEdit, save, trips }: { m: MoneyData; lang: Lang; onEdit: () => void; save: (d: MoneyData) => void; trips: { t: number; total: number; store?: string }[] }) {
  const now = ym(Date.now()); const [mon, setMon] = useState(now); const first = Math.min(ym(m.since), now)
  const [add, setAdd] = useState(false); const [cat, setCat] = useState<string | null>(null)
  const inc = m.inc.reduce((a, x) => a + x.a, 0); const fix = Object.values(m.fix).reduce((a, x) => a + x, 0)
  const saveM = m.goal?.monthly ?? 0
  // Actual spending of a month: manual expenses + finished KUZINTI shopping trips (groceries, automatic).
  const spentIn = (mm: number) => { const s: Record<string, number> = {}; for (const e of m.exp) if (ym(e.t) === mm) s[e.c] = (s[e.c] ?? 0) + e.a; for (const tr of trips) if (ym(tr.t) === mm) s.food = (s.food ?? 0) + tr.total; return s }
  const sp = useMemo(() => spentIn(mon), [m, trips, mon]) // eslint-disable-line react-hooks/exhaustive-deps
  const varSpent = Object.values(sp).reduce((a, x) => a + x, 0)
  const envTot = Object.values(m.env).reduce((a, x) => a + x, 0)
  const outflow = fix + varSpent + saveM; const rest = inc - outflow
  const day = new Date().getDate(); const dim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const perDay = mon === now ? Math.max(0, inc - fix - saveM - varSpent) / Math.max(1, dim - day + 1) : 0
  const need = Object.entries(m.fix).filter(([k]) => CATS[k]?.k === 'need').reduce((a, [, v]) => a + v, 0) + Object.entries(m.env).filter(([k]) => CATS[k]?.k === 'need').reduce((a, [, v]) => a + v, 0)
  const want = Object.entries(m.fix).filter(([k]) => CATS[k]?.k === 'want').reduce((a, [, v]) => a + v, 0) + Object.entries(m.env).filter(([k]) => CATS[k]?.k === 'want').reduce((a, [, v]) => a + v, 0)
  const pct = (x: number) => (inc ? Math.round((x / inc) * 100) : 0)
  const months = Array.from({ length: Math.min(6, now - first + 1) }, (_, k) => now - (Math.min(6, now - first + 1) - 1) + k)
  const hist = months.map((mm) => ({ mm, v: fix + Object.values(spentIn(mm)).reduce((a, x) => a + x, 0) }))
  const debt = (m.fix.credit ?? 0) + (m.fix.rent ?? 0)
  // Expert reading: alerts (status) then concrete advice with amounts.
  const alerts: [string, string][] = []
  for (const k of VAR) { const b = m.env[k] ?? 0; const s = sp[k] ?? 0; if (b > 0 && s > b) alerts.push(['critical', L(lang, `${cn(k, lang)}: ${money(s - b, lang)} over the envelope`, `${cn(k, lang)} : ${money(s - b, lang)} au-dessus de l’enveloppe`, `${cn(k, lang)}: تجاوز ${money(s - b, lang)}`)]); else if (b > 0 && mon === now && s > b * 0.8 && day < dim * 0.7) alerts.push(['warning', L(lang, `${cn(k, lang)}: ${Math.round((s / b) * 100)}% used before day ${Math.round(dim * 0.7)}`, `${cn(k, lang)} : ${Math.round((s / b) * 100)} % utilisés avant le ${Math.round(dim * 0.7)} du mois`, `${cn(k, lang)}: ${Math.round((s / b) * 100)}%`)]) }
  if (inc && debt / inc > 0.4) alerts.push(['critical', L(lang, `Housing + loans take ${pct(debt)}% of income (banks cap around 40%)`, `Logement + crédits = ${pct(debt)} % des revenus (les banques plafonnent vers 40 %)`, `السكن والقروض ${pct(debt)}%`)])
  if (inc && fix + envTot + saveM > inc) alerts.push(['warning', L(lang, `Your plan exceeds income by ${money(fix + envTot + saveM - inc, lang)}`, `Votre plan dépasse les revenus de ${money(fix + envTot + saveM - inc, lang)}`, `خطتك تتجاوز المداخيل`)])
  const tips: [string, string][] = []
  if (inc && pct(need) > 50) tips.push([L(lang, 'Needs above 50%', 'Besoins au-dessus de 50 %', 'الحاجيات فوق 50%'), L(lang, `Essentials take ${pct(need)}%. Target ${money(inc * 0.5, lang)}: renegotiate internet/phone, compare insurance, and let KUZINTI pick the cheapest store (often 10 to 15% less on groceries).`, `Les essentiels prennent ${pct(need)} %. Cible : ${money(inc * 0.5, lang)}. Renégociez internet et téléphone, comparez les assurances, et laissez KUZINTI choisir le magasin le moins cher (souvent 10 à 15 % de moins sur les courses).`, `الحاجيات ${pct(need)}%.`)])
  if (inc && pct(want) > 30) tips.push([L(lang, 'Lifestyle above 30%', 'Envies au-dessus de 30 %', 'الكماليات فوق 30%'), L(lang, `Cut ${money(want - inc * 0.3, lang)} from outings, clothes or subscriptions to get back to 30%.`, `Réduisez de ${money(want - inc * 0.3, lang)} les sorties, vêtements ou abonnements pour revenir à 30 %.`, `خفّض ${money(want - inc * 0.3, lang)}.`)])
  if (inc && saveM < inc * 0.1) tips.push([L(lang, 'Save at least 10%', 'Épargnez au moins 10 %', 'ادّخر 10% على الأقل'), L(lang, `Set up a standing transfer of ${money(inc * 0.1, lang)} on payday, then aim for 20% (${money(inc * 0.2, lang)}).`, `Programmez un virement automatique de ${money(inc * 0.1, lang)} le jour de la paie, puis visez 20 % (${money(inc * 0.2, lang)}).`, `حوّل ${money(inc * 0.1, lang)} يوم الأجر.`)])
  const emergency = (fix + (m.env.food ?? 0)) * 3
  tips.push([L(lang, 'Emergency fund', 'Épargne de précaution', 'احتياطي الطوارئ'), L(lang, `Keep 3 months of essentials aside: about ${money(emergency, lang)}. Build it before any other goal.`, `Gardez 3 mois de dépenses essentielles de côté : environ ${money(emergency, lang)}. Constituez-la avant tout autre objectif.`, `احتفظ بـ ${money(emergency, lang)}.`)])
  if ((m.fix.credit ?? 0) > 0) tips.push([L(lang, 'Loans first', 'Les crédits d’abord', 'القروض أولًا'), L(lang, 'Pay off the most expensive consumer loan first (avalanche method); avoid new revolving credit.', 'Remboursez d’abord le crédit conso le plus cher (méthode avalanche) et évitez tout nouveau crédit renouvelable.', 'سدّد القرض الأغلى أولًا.')])
  if (m.goal?.target && m.goal.monthly) tips.push([L(lang, 'Your goal', 'Votre objectif', 'هدفك'), L(lang, `${m.goal.n || 'Goal'}: ${money(Math.max(0, m.goal.target - m.goal.saved), lang)} to go, about ${Math.ceil(Math.max(0, m.goal.target - m.goal.saved) / m.goal.monthly)} months at this pace.`, `${m.goal.n || 'Objectif'} : encore ${money(Math.max(0, m.goal.target - m.goal.saved), lang)}, soit environ ${Math.ceil(Math.max(0, m.goal.target - m.goal.saved) / m.goal.monthly)} mois à ce rythme.`, `${m.goal.n}`)])
  // Financial health score, 0-100, from five weighted, explainable criteria.
  const essentials = fix + (m.env.food ?? 0) + (m.env.health ?? 0)
  const lin = (x: number, good: number, bad: number) => Math.max(0, Math.min(1, (bad - x) / (bad - good)))
  const envs = VAR.filter((k) => (m.env[k] ?? 0) > 0); const kept = envs.filter((k) => (sp[k] ?? 0) <= (m.env[k] ?? 0)).length
  const crit: [string, number, number, string][] = inc ? [
    [L(lang, 'Savings rate', 'Taux d’épargne', 'نسبة الادخار'), 25 * Math.min(1, saveM / (inc * 0.2)), 25, `${pct(saveM)} % / 20 %`],
    [L(lang, 'Debt load', 'Endettement', 'المديونية'), 25 * lin(debt / inc, 0.3, 0.5), 25, `${pct(debt)} %`],
    [L(lang, 'Essentials', 'Dépenses essentielles', 'الحاجيات'), 20 * lin(need / inc, 0.5, 0.8), 20, `${pct(need)} %`],
    [L(lang, 'Safety cushion', 'Matelas de sécurité', 'الاحتياطي'), 15 * Math.min(1, (m.goal?.saved ?? 0) / Math.max(1, essentials * 3)), 15, `${((m.goal?.saved ?? 0) / Math.max(1, essentials)).toFixed(1)} ${L(lang, 'months', 'mois', 'أشهر')}`],
    [L(lang, 'Envelopes kept', 'Enveloppes tenues', 'الأظرفة المحترمة'), envs.length ? 15 * (kept / envs.length) : 15, 15, `${kept}/${envs.length}`],
  ] : []
  const score = Math.round(crit.reduce((a, c) => a + c[1], 0))
  const grade = score >= 80 ? [L(lang, 'Excellent', 'Excellente', 'ممتازة'), C.need] : score >= 60 ? [L(lang, 'Good', 'Bonne', 'جيدة'), C.want] : score >= 40 ? [L(lang, 'Fragile', 'Fragile', 'هشة'), C.save] : [L(lang, 'To fix', 'À redresser', 'تحتاج إصلاحًا'), 'rgb(var(--danger))']
  // Personal 6-month programme, built from the weakest points first. Progress is ticked by the owner.
  const startM = ym(m.since)
  const prog: [string, string, string][] = []
  prog.push(['track', L(lang, 'Take control', 'Reprendre le contrôle', 'استعادة السيطرة'), L(lang, `Record every expense for 30 days and set a standing transfer of ${money(Math.max(saveM, inc * 0.1), lang)} on payday.`, `Notez chaque dépense pendant 30 jours et programmez un virement automatique de ${money(Math.max(saveM, inc * 0.1), lang)} le jour de la paie.`, `سجّل كل مصروف لمدة 30 يومًا.`)])
  if (pct(need) > 50) prog.push(['needs', L(lang, 'Lighten fixed costs', 'Alléger les charges', 'تخفيف المصاريف'), L(lang, `Renegotiate internet, phones and insurance, and shop with KUZINTI’s cheapest store. Target: −${money(need - inc * 0.5, lang)} per month.`, `Renégociez internet, téléphones et assurances, et faites vos courses au magasin le moins cher proposé par KUZINTI. Objectif : −${money(need - inc * 0.5, lang)} par mois.`, `خفّض ${money(need - inc * 0.5, lang)}.`)])
  prog.push(['cushion1', L(lang, 'One month of safety', 'Un mois de sécurité', 'شهر من الأمان'), L(lang, `Reach ${money(essentials, lang)} on a separate savings account.`, `Atteignez ${money(essentials, lang)} sur un compte épargne séparé.`, `بلوغ ${money(essentials, lang)}.`)])
  if ((m.fix.credit ?? 0) > 0) prog.push(['debt', L(lang, 'Attack the loans', 'Attaquer les crédits', 'مواجهة القروض'), L(lang, `Put every extra dirham on the most expensive loan (${money(m.fix.credit!, lang)} a month today). No new consumer credit.`, `Mettez chaque dirham en plus sur le crédit le plus cher (${money(m.fix.credit!, lang)} par mois aujourd’hui). Aucun nouveau crédit conso.`, `سدّد القرض الأغلى.`)])
  if (pct(want) > 30) prog.push(['wants', L(lang, 'Wants back to 30%', 'Envies à 30 %', 'الكماليات إلى 30%'), L(lang, `Trim ${money(want - inc * 0.3, lang)} from outings, clothes and subscriptions.`, `Réduisez de ${money(want - inc * 0.3, lang)} les sorties, vêtements et abonnements.`, `خفّض ${money(want - inc * 0.3, lang)}.`)])
  prog.push(['cushion3', L(lang, 'Three months of safety', 'Trois mois de sécurité', 'ثلاثة أشهر من الأمان'), L(lang, `Grow the cushion to ${money(essentials * 3, lang)}.`, `Portez le matelas à ${money(essentials * 3, lang)}.`, `بلوغ ${money(essentials * 3, lang)}.`)])
  prog.push(['goal', m.goal?.n || L(lang, 'Your project', 'Votre projet', 'مشروعك'), m.goal?.target ? L(lang, `Put ${money(m.goal.monthly, lang)} a month towards ${money(m.goal.target, lang)}.`, `Versez ${money(m.goal.monthly, lang)} par mois pour atteindre ${money(m.goal.target, lang)}.`, `ادّخر ${money(m.goal.monthly, lang)} شهريًا.`) : L(lang, 'Choose a project (holidays, Aïd, car, home) and fund it monthly.', 'Choisissez un projet (vacances, Aïd, voiture, logement) et financez-le chaque mois.', 'اختر مشروعًا وموّله شهريًا.')])
  const steps = prog.slice(0, 6); const curStep = Math.min(steps.length - 1, Math.max(0, now - startM)); const doneN = steps.filter(([k]) => m.prog?.[k]).length
  const tick = (k: string) => save({ ...m, prog: { ...(m.prog ?? {}), [k]: !m.prog?.[k] } })
  // Strengths and weak points, each weak point with a concrete action and its monthly gain.
  const groc = m.env.food ?? 0
  const SW: { k: string; ok: boolean; t: string; why: string; act?: string; gain?: number }[] = inc ? [
    { k: 'save', ok: saveM >= inc * 0.15, t: L(lang, 'Savings', 'Épargne', 'الادخار'), why: L(lang, `${pct(saveM)}% of income put aside`, `${pct(saveM)} % des revenus mis de côté`, `${pct(saveM)}%`), act: L(lang, 'Automatic transfer on payday', 'Virement automatique le jour de la paie', 'تحويل تلقائي'), gain: Math.max(0, inc * 0.15 - saveM) },
    { k: 'debt', ok: debt / inc <= 0.33, t: L(lang, 'Housing and loans', 'Logement et crédits', 'السكن والقروض'), why: `${pct(debt)} % ${L(lang, 'of income', 'des revenus', 'من الدخل')}`, act: L(lang, 'Renegotiate the rate or pay off the dearest loan first', 'Renégocier le taux ou solder le crédit le plus cher', 'إعادة التفاوض'), gain: Math.max(0, debt - inc * 0.33) },
    { k: 'need', ok: need / inc <= 0.5, t: L(lang, 'Essentials', 'Dépenses essentielles', 'الحاجيات'), why: `${pct(need)} % / 50 %`, act: L(lang, 'Cheapest store with KUZINTI + phone/internet bundle', 'Magasin le moins cher avec KUZINTI + forfait téléphone/internet', 'أرخص متجر'), gain: Math.max(groc * 0.12, need - inc * 0.5) },
    { k: 'want', ok: want / inc <= 0.3, t: L(lang, 'Wants and leisure', 'Envies et loisirs', 'الكماليات'), why: `${pct(want)} % / 30 %`, act: L(lang, 'One paid outing in two becomes a free one', 'Une sortie payante sur deux devient gratuite', 'نزهة مجانية'), gain: Math.max(0, want - inc * 0.3) },
    { k: 'env', ok: !envs.length || kept === envs.length, t: L(lang, 'Envelopes', 'Enveloppes', 'الأظرفة'), why: `${kept}/${envs.length} ${L(lang, 'kept this month', 'tenues ce mois', 'محترمة')}`, act: L(lang, 'Check the envelope before each purchase', 'Regarder l’enveloppe avant chaque achat', 'راجع الظرف'), gain: VAR.reduce((a, k) => a + Math.max(0, (sp[k] ?? 0) - (m.env[k] ?? 0)), 0) },
  ] : []
  const strong = SW.filter((x) => x.ok); const weak = SW.filter((x) => !x.ok).sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))
  const potential = weak.reduce((a, x) => a + (x.gain ?? 0), 0)
  // Savings plan: the owner picks a monthly amount; we split it into 3 pockets and project it.
  const [rate, setRate] = useState(() => Math.round(Math.min(30, Math.max(5, inc ? (saveM / inc) * 100 : 10))))
  const amt = Math.round((inc * rate) / 100)
  const STYLES: [string, string, string, number, string][] = [
    ['safe', '🐢', L(lang, 'Gentle', 'Prudent', 'متأنٍّ'), 10, L(lang, 'Comfort first, a cushion that grows slowly', 'Le confort d’abord, un matelas qui grandit doucement', 'الراحة أولا')],
    ['bal', '⚖️', L(lang, 'Balanced', 'Équilibré', 'متوازن'), 20, L(lang, 'The 50/30/20 rule, the recommended one', 'La règle 50/30/20, celle qu’on conseille', 'قاعدة 50/30/20')],
    ['amb', '🚀', L(lang, 'Ambitious', 'Ambitieux', 'طموح'), 30, L(lang, 'A project fast: house, car, Hajj', 'Un projet vite : maison, voiture, Hajj', 'مشروع بسرعة')],
  ]
  const [scen, setScen] = useState<Record<string, boolean>>({})
  const outB = m.env.outings ?? Math.round(inc * 0.05); const foodB = m.env.food ?? 0
  const SCEN: [string, string, string, number][] = ([
    ['resto', '🍽️', L(lang, 'One restaurant less per week, cooked with KUZINTI instead', 'Un restaurant de moins par semaine, cuisiné avec KUZINTI', 'مطعم أقل أسبوعيا'), Math.round(Math.max(outB * 0.25, 120))],
    ['store', '🏪', L(lang, 'Groceries at the cheapest store (≈ −12 %)', 'Courses au magasin le moins cher (≈ −12 %)', 'أرخص متجر'), Math.round(foodB * 0.12)],
    ['phone', '📱', L(lang, 'Renegotiate phone and internet', 'Renégocier téléphone et internet', 'إعادة التفاوض على الهاتف'), Math.round(Math.max(60, (m.fix.phone ?? 0) * 0.25))],
    ['subs', '📺', L(lang, 'Cancel one unused subscription', 'Résilier un abonnement inutilisé', 'إلغاء اشتراك'), 70],
    ['walk', '🚶', L(lang, 'Two short trips a week on foot or by tram', 'Deux petits trajets par semaine à pied ou en tram', 'تنقلات مشيا'), 100],
  ] as [string, string, string, number][]).filter((x) => x[3] > 0)
  const scenGain = SCEN.filter(([k]) => scen[k]).reduce((a, x) => a + x[3], 0)
  const cushionLeft = Math.max(0, essentials * 3 - (m.goal?.saved ?? 0))
  const pockets: [string, string, number, string][] = cushionLeft > 0
    ? [['🛟', L(lang, 'Safety cushion', 'Matelas de sécurité', 'احتياطي'), 0.6, C.need], ['🎯', m.goal?.n || L(lang, 'Project', 'Projet', 'مشروع'), 0.25, C.want], ['🎉', L(lang, 'Aïd, holidays, gifts', 'Aïd, vacances, cadeaux', 'العيد والعطل'), 0.15, C.save]]
    : [['🎯', m.goal?.n || L(lang, 'Project', 'Projet', 'مشروع'), 0.55, C.want], ['📈', L(lang, 'Long-term savings', 'Épargne long terme', 'ادخار طويل'), 0.3, C.need], ['🎉', L(lang, 'Aïd, holidays, gifts', 'Aïd, vacances, cadeaux', 'العيد والعطل'), 0.15, C.save]]
  const proj = [3, 6, 12, 24].map((n) => [n, (m.goal?.saved ?? 0) + amt * n] as [number, number]); const pmax = proj[3][1] || 1
  const applyPlan = () => save({ ...m, goal: { n: m.goal?.n || L(lang, 'Savings', 'Épargne', 'ادخار'), target: m.goal?.target || Math.round(essentials * 3), saved: m.goal?.saved ?? 0, monthly: amt } })
  const delExp = (id: string) => save({ ...m, exp: m.exp.filter((e) => e.id !== id) })
  const list = m.exp.filter((e) => ym(e.t) === mon).sort((a, b) => b.t - a.t)

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <button className="grid h-10 w-10 place-items-center rounded-full bg-surface shadow-soft disabled:opacity-30" disabled={mon <= first} onClick={() => setMon(mon - 1)} aria-label={L(lang, 'Previous month', 'Mois précédent', 'الشهر السابق')}><ChevronLeft size={20} aria-hidden /></button>
        <p className="font-serif text-xl font-semibold capitalize">{monthName(mon, lang)}</p>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-surface shadow-soft disabled:opacity-30" disabled={mon >= now} onClick={() => setMon(mon + 1)} aria-label={L(lang, 'Next month', 'Mois suivant', 'الشهر التالي')}><ChevronRight size={20} aria-hidden /></button>
      </div>

      {/* Hero: my pocket, as a simple receipt */}
      <section className="relative overflow-hidden rounded-[28px] bg-forest p-5 text-white">
        <span className="zellige pointer-events-none absolute inset-0 opacity-[.06]" aria-hidden />
        <p className="relative text-[11px] font-bold uppercase tracking-[.18em] text-white/70">{L(lang, 'I still have', 'Il me reste', 'يتبقى لي')}</p>
        <p className={`relative font-display text-[46px] font-extrabold leading-none tabular-nums ${rest < 0 ? 'text-apricot' : ''}`}>{rest < 0 ? '−' : ''}{money(Math.abs(rest), lang)}</p>
        {mon === now && <p className="relative mt-1 text-sm text-white/80">{rest >= 0 ? L(lang, `that is ${money(perDay, lang)} a day until the end of the month`, `soit ${money(perDay, lang)} par jour jusqu’à la fin du mois`, `أي ${money(perDay, lang)} يوميًا`) : L(lang, 'Over budget: see the plan below.', 'Dépassement : voyez le plan juste en dessous.', 'تجاوز: انظر الخطة أدناه')}</p>}
        <ul className="relative mt-4 space-y-1.5 rounded-2xl bg-white/10 p-3 text-sm tabular-nums">
          {([['💼', L(lang, 'Income', 'Revenus', 'المداخيل'), inc, '+'], ['🏠', L(lang, 'Fixed charges (leave on their own)', 'Charges fixes (partent toutes seules)', 'مصاريف ثابتة'), fix, '−'], ['🐷', L(lang, 'Savings (paid to me first)', 'Épargne (je me paie en premier)', 'ادخار'), saveM, '−']] as [string, string, number, string][]).map(([e, l, v, sg]) => <li key={l} className="flex items-center gap-2"><span>{e}</span><span className="flex-1 text-white/85">{l}</span><b>{sg} {money(v, lang)}</b></li>)}
          <li className="flex items-center gap-2 border-t border-white/20 pt-1.5"><span>👛</span><span className="flex-1 font-bold">{L(lang, 'In my pocket this month', 'Dans ma poche ce mois', 'في جيبي هذا الشهر')}</span><b className="text-apricot">{money(inc - fix - saveM, lang)}</b></li>
          <li className="flex items-center gap-2"><span>🧾</span><span className="flex-1 text-white/85">{L(lang, 'Already spent', 'Déjà dépensé', 'صُرف')}</span><b>− {money(varSpent, lang)}</b></li>
        </ul>
      </section>
      <button className="btn btn-primary w-full !min-h-14 text-base" onClick={() => setAdd(true)}><Plus size={20} aria-hidden /> {L(lang, 'Add an expense', 'Ajouter une dépense', 'إضافة مصروف')}</button>
      {inc > 0 && mon === now && <section className="grid grid-cols-3 gap-2" aria-label={L(lang, 'How to use it', 'Comment en profiter', 'كيف أستفيد')}>
        {([['✍️', L(lang, 'Note each expense', 'Je note chaque dépense', 'أسجل كل مصروف'), L(lang, '5 seconds, right after paying', '5 secondes, juste après avoir payé', '5 ثوان بعد الدفع')], ['👀', L(lang, 'Check my day', 'Je regarde mon « par jour »', 'أراقب يومي'), `${money(perDay, lang)} ${L(lang, 'today', 'aujourd’hui', 'اليوم')}`], ['🐷', L(lang, 'Pick a style', 'Je choisis un style', 'أختار أسلوبا'), L(lang, 'Savings run on their own', 'L’épargne part toute seule', 'الادخار تلقائي')]] as [string, string, string][]).map(([e, h, b], i) => (
          <div key={h} className="rise rounded-[20px] bg-surface p-2.5 shadow-soft" style={{ animationDelay: `${i * 70}ms` }}><span className="float inline-block text-2xl" style={{ animationDelay: `${i * 0.4}s` }}>{e}</span><p className="mt-1 text-[12px] font-bold leading-tight">{i + 1}. {h}</p><p className="mt-0.5 text-[10.5px] leading-tight text-muted">{b}</p></div>))}
      </section>}
      {inc > 0 && <section aria-label={L(lang, 'Strengths and weak points', 'Points forts et points faibles', 'نقاط القوة والضعف')}>
        <div className="mb-3 flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold">{L(lang, 'My improvement plan', 'Mon plan d’amélioration', 'خطة التحسين')}</h2>{potential > 0 && <span className="rounded-full bg-leaf/30 px-2.5 py-1 text-xs font-bold text-forest tabular-nums">{L(lang, 'up to', 'jusqu’à', 'حتى')} +{money(potential, lang)}/{L(lang, 'mo', 'mois', 'شهر')}</span>}</div>
        {strong.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{strong.map((x) => <span key={x.k} className="inline-flex items-center gap-1.5 rounded-full bg-leaf/25 px-3 py-1.5 text-sm font-semibold text-forest"><Check size={15} aria-hidden /> {x.t} <span className="text-xs font-normal opacity-80">· {x.why}</span></span>)}</div>}
        {weak.length ? <div className="space-y-2">{weak.map((x, i) => <div key={x.k} className="flex items-stretch overflow-hidden rounded-[20px] bg-surface shadow-soft">
          <span className="w-1.5 shrink-0" style={{ background: i === 0 ? 'rgb(var(--danger))' : C.save }} />
          <div className="min-w-0 flex-1 p-3">{i === 0 && <span className="mb-1 inline-block rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-danger">{L(lang, 'Priority', 'Priorité', 'أولوية')}</span>}<p className="text-sm font-bold leading-tight">{x.t}</p><p className="text-xs text-muted">{x.why}</p><p className="mt-0.5 text-sm text-ink/80">→ {x.act}</p></div>
          {(x.gain ?? 0) > 0 && <div className="grid shrink-0 place-items-center px-3 text-end"><span><span className="block font-display text-lg font-extrabold tabular-nums text-forest">+{money(x.gain!, lang)}</span><span className="block text-[10px] text-muted">{L(lang, 'per month', 'par mois', 'شهريًا')}</span></span></div>}
        </div>)}</div> : <p className="rounded-2xl bg-leaf/20 p-3 text-sm font-semibold text-forest">🌟 {L(lang, 'No weak point: keep it up and raise your savings.', 'Aucun point faible : continuez et augmentez votre épargne.', 'لا نقاط ضعف')}</p>}
      </section>}

      {inc > 0 && <section aria-label={L(lang, 'Savings styles', 'Styles d’épargne', 'أساليب الادخار')}>
        <h2 className="font-serif text-[20px] font-semibold">{L(lang, 'My savings style', 'Mon style d’épargne', 'أسلوب ادخاري')}</h2>
        <p className="mb-3 text-sm text-muted">{L(lang, 'Three ways to save. Tap one to see what it changes for you.', 'Trois façons d’épargner. Touchez-en une pour voir ce que ça change pour vous.', 'ثلاث طرق للادخار.')}</p>
        <div className="grid grid-cols-3 gap-2">{STYLES.map(([k, e, n, r, d]) => { const on = rate === r; const a = Math.round((inc * r) / 100); return (
          <button key={k} className={`rounded-[20px] p-2.5 text-start transition-all duration-300 active:scale-95 ${on ? 'bg-forest text-white shadow-lift' : 'bg-surface shadow-soft'}`} onClick={() => setRate(r)} aria-pressed={on}>
            <span className={`inline-block text-2xl ${on ? 'pop' : ''}`}>{e}</span><b className="block text-[13.5px] leading-tight">{n}</b>
            <span className={`block text-[11px] ${on ? 'text-white/80' : 'text-muted'}`}>{r} % · {money(a, lang)}</span>
            <span className={`mt-1 block text-[10.5px] leading-tight ${on ? 'text-white/85' : 'text-muted'}`}>{d}</span></button>) })}</div>
        <div key={rate} className="fade-up mt-3 grid grid-cols-3 gap-2 rounded-[20px] bg-cream/80 p-3 text-center tabular-nums">
          <div><p className="text-[10.5px] font-bold uppercase text-muted">{L(lang, 'Saved / month', 'Épargné / mois', 'شهريا')}</p><b className="text-[15px]" style={{ color: C.save }}>{money(amt, lang)}</b></div>
          <div><p className="text-[10.5px] font-bold uppercase text-muted">{L(lang, 'To live / day', 'Pour vivre / jour', 'للعيش يوميا')}</p><b className="text-[15px] text-forest">{money(Math.max(0, inc - fix - amt) / 30, lang)}</b></div>
          <div><p className="text-[10.5px] font-bold uppercase text-muted">{L(lang, 'In 1 year', 'Dans 1 an', 'بعد سنة')}</p><b className="text-[15px] text-ink">{money((m.goal?.saved ?? 0) + amt * 12 + scenGain * 12, lang)}</b></div>
        </div>
        <h3 className="mb-2 mt-4 text-sm font-extrabold">🔮 {L(lang, 'What if…', 'Et si…', 'ماذا لو…')} <span className="font-normal text-muted">{L(lang, 'tick a scenario', 'cochez un scénario', 'اختر سيناريو')}</span></h3>
        <div className="space-y-2">{SCEN.map(([k, e, n, g]) => { const on = !!scen[k]; return (
          <button key={k} className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-start transition-all duration-300 active:scale-[.98] ${on ? 'bg-leaf/30 ring-2 ring-forest/40' : 'bg-surface shadow-soft'}`} onClick={() => setScen({ ...scen, [k]: !on })} aria-pressed={on}>
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xl ${on ? 'bg-forest/10' : 'bg-cream'}`}>{e}</span><span className="min-w-0 flex-1 text-[13px] font-semibold leading-tight">{n}</span>
            <b className="shrink-0 text-sm tabular-nums text-forest">+{money(g, lang)}<span className="text-[10px] font-normal text-muted">/{L(lang, 'mo', 'mois', 'شهر')}</span></b></button>) })}</div>
        {scenGain > 0 && <p className="fade-up mt-3 rounded-2xl bg-forest p-3 text-sm font-semibold text-white">✨ {L(lang, `With these changes you save ${money(amt + scenGain, lang)} a month, or ${money((amt + scenGain) * 12, lang)} in a year.`, `Avec ces changements vous épargnez ${money(amt + scenGain, lang)} par mois, soit ${money((amt + scenGain) * 12, lang)} en un an.`, `توفر ${money(amt + scenGain, lang)} شهريا.`)}{m.goal?.target ? ' ' + L(lang, `Goal reached in ${Math.ceil(Math.max(0, m.goal.target - m.goal.saved) / Math.max(1, amt + scenGain))} months instead of ${Math.ceil(Math.max(0, m.goal.target - m.goal.saved) / Math.max(1, amt))}.`, `Objectif atteint en ${Math.ceil(Math.max(0, m.goal.target - m.goal.saved) / Math.max(1, amt + scenGain))} mois au lieu de ${Math.ceil(Math.max(0, m.goal.target - m.goal.saved) / Math.max(1, amt))}.`, '') : ''}</p>}
      </section>}

      {inc > 0 && <section className="rounded-[24px] bg-surface p-4 shadow-soft">
        <div className="flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold">{L(lang, 'Savings plan', 'Plan d’épargne', 'خطة الادخار')}</h2><b className="font-display text-xl tabular-nums" style={{ color: C.save }}>{money(amt, lang)}<span className="text-xs font-semibold text-muted">/{L(lang, 'mo', 'mois', 'شهر')}</span></b></div>
        <div className="mt-2 flex items-center gap-3"><span className="w-10 text-xs font-bold tabular-nums text-muted">{rate} %</span><input type="range" min={5} max={30} value={rate} onChange={(e) => setRate(+e.target.value)} className="flex-1 accent-[#D97A1E]" aria-label={L(lang, 'Share of income saved', 'Part des revenus épargnée', 'نسبة الادخار')} /></div>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full">{pockets.map(([e, n, w, c]) => <span key={n} style={{ width: `${w * 100}%`, background: c }} title={`${e} ${n}`} />)}</div>
        <ul className="mt-2 space-y-1 text-sm">{pockets.map(([e, n, w, c]) => <li key={n} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /><span className="flex-1">{e} {n}</span><b className="tabular-nums">{money(amt * w, lang)}</b></li>)}</ul>
        <div className="mt-4 grid grid-cols-4 items-end gap-2" style={{ height: 110 }}>{proj.map(([n, v]) => <div key={n} className="flex h-full flex-col items-center justify-end gap-1"><span className="text-[10px] font-bold tabular-nums">{money(v, lang)}</span><span className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${Math.max(6, (v / pmax) * 70)}%`, background: C.save, opacity: 0.45 + (n / 24) * 0.55 }} /><span className="text-[10px] text-muted">{n} {L(lang, 'mo', 'mois', 'ش')}</span></div>)}</div>
        <p className="mt-2 text-xs text-muted">{cushionLeft > 0 ? L(lang, `Safety cushion reached in about ${Math.ceil(cushionLeft / Math.max(1, amt * 0.6))} months.`, `Matelas de sécurité atteint dans environ ${Math.ceil(cushionLeft / Math.max(1, amt * 0.6))} mois.`, `الاحتياطي خلال ${Math.ceil(cushionLeft / Math.max(1, amt * 0.6))} أشهر`) : L(lang, 'Your safety cushion is complete.', 'Votre matelas de sécurité est complet.', 'احتياطيك مكتمل')} {L(lang, 'Without interest.', 'Sans intérêts.', '')}</p>
        <button className="btn btn-warm mt-3 w-full" onClick={applyPlan} disabled={amt === saveM}>{amt === saveM ? `✓ ${L(lang, 'Plan in place', 'Plan en place', 'الخطة مفعلة')}` : L(lang, `Apply: save ${money(amt, lang)} a month`, `Appliquer : épargner ${money(amt, lang)} par mois`, 'تطبيق')}</button>
      </section>}

      {inc > 0 && <section className="rounded-[24px] bg-surface p-4 shadow-soft">
        <div className="flex items-center gap-4">
          <Gauge v={score} color={grade[1]} />
          <div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted">{L(lang, 'Financial health', 'Santé financière', 'الصحة المالية')}</p><p className="font-serif text-[26px] font-semibold leading-tight">{grade[0]}</p><p className="text-xs text-muted">{L(lang, 'Score out of 100, updated live', 'Note sur 100, mise à jour en direct', 'من 100')}</p></div>
        </div>
        <ul className="mt-3 space-y-1.5">{crit.map(([l, v, max, info]) => <li key={l} className="text-sm"><div className="flex items-center gap-2"><span className="flex-1">{l} <span className="text-xs text-muted">· {info}</span></span><b className="tabular-nums">{Math.round(v)}/{max}</b></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${(v / max) * 100}%`, background: v / max >= 0.7 ? C.need : v / max >= 0.4 ? C.save : 'rgb(var(--danger))' }} /></div></li>)}</ul>
      </section>}

      {inc > 0 && <section>
        <div className="mb-3 flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold">{L(lang, 'Your 6-month programme', 'Votre programme sur 6 mois', 'برنامجك لستة أشهر')}</h2><span className="text-xs font-bold text-forest">{doneN}/{steps.length}</span></div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2" data-noswipe>{steps.map(([k, h, b], i) => { const done = !!m.prog?.[k]; const isNow = i === curStep; return (
          <div key={k} className={`w-[82%] max-w-[320px] shrink-0 snap-center rounded-[24px] p-4 transition ${isNow ? 'bg-forest text-white shadow-lg' : 'bg-surface shadow-soft'} ${done && !isNow ? 'opacity-70' : ''}`}>
            <p className={`text-[11px] font-bold uppercase tracking-[.16em] ${isNow ? 'text-apricot' : 'text-muted'}`}>{L(lang, 'Month', 'Mois', 'الشهر')} {i + 1} · <span className="capitalize">{monthName(startM + i, lang)}</span></p>
            <p className="mt-1 font-serif text-[20px] font-semibold leading-tight">{h}</p>
            <p className={`mt-1 text-sm leading-relaxed ${isNow ? 'text-white/85' : 'text-ink/75'}`}>{b}</p>
            <button className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition active:scale-95 ${done ? (isNow ? 'bg-white text-forest' : 'bg-leaf/40 text-forest') : isNow ? 'bg-white/15 text-white' : 'bg-cream text-ink'}`} onClick={() => tick(k)} aria-pressed={done}><Check size={15} aria-hidden /> {done ? L(lang, 'Done', 'Fait', 'تم') : L(lang, 'Mark as done', 'Marquer fait', 'تم الإنجاز')}</button>
          </div>) })}</div>
      </section>}


      {alerts.length > 0 && <section className="space-y-2" aria-label={L(lang, 'Alerts', 'Alertes', 'تنبيهات')}>{alerts.map(([lvl, txt]) => <p key={txt} className={`flex items-start gap-2 rounded-2xl p-3 text-sm font-semibold ${lvl === 'critical' ? 'bg-danger/10 text-danger' : 'bg-apricot/25 text-ink'}`}><AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden /><span><span className="sr-only">{lvl === 'critical' ? 'Critique' : 'Attention'} : </span>{txt}</span></p>)}</section>}

      {/* 50 / 30 / 20 */}
      <section className="rounded-[24px] bg-surface p-4 shadow-soft">
        <h2 className="font-serif text-[20px] font-semibold">{L(lang, 'How your income is split', 'La répartition de vos revenus', 'توزيع مداخيلك')}</h2>
        <p className="text-xs text-muted">{L(lang, 'Planned, against the 50/30/20 rule', 'Prévu, face à la règle 50/30/20', 'المخطط مقابل قاعدة 50/30/20')}</p>
        <div className="mt-3 flex items-center gap-4">
          <Donut parts={[[need, C.need, L(lang, 'Needs', 'Besoins', 'الحاجيات')], [want, C.want, L(lang, 'Wants', 'Envies', 'الكماليات')], [saveM, C.save, L(lang, 'Savings', 'Épargne', 'الادخار')]]} total={Math.max(inc, need + want + saveM)} label={`${pct(saveM)} %`} sub={L(lang, 'saved', 'épargné', 'مدّخر')} lang={lang} />
          <ul className="min-w-0 flex-1 space-y-2 text-sm">{([[L(lang, 'Needs', 'Besoins', 'الحاجيات'), need, C.need, 50], [L(lang, 'Wants', 'Envies', 'الكماليات'), want, C.want, 30], [L(lang, 'Savings', 'Épargne', 'الادخار'), saveM, C.save, 20]] as [string, number, string, number][]).map(([l, v, c, target]) => {
            const p = pct(v); const ok = l === L(lang, 'Savings', 'Épargne', 'الادخار') ? p >= target : p <= target
            return <li key={l}><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c }} aria-hidden /><span className="flex-1 font-semibold">{l}</span><b className="tabular-nums">{p} %</b></div><p className="ms-[18px] text-xs text-muted">{money(v, lang)} · {L(lang, 'target', 'cible', 'الهدف')} {target} % {ok ? '✓' : '⚠︎'}</p></li>
          })}</ul>
        </div>
      </section>

      {/* Envelopes: budget vs actual */}
      <section>
        <div className="mb-3 flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold">{L(lang, 'Envelopes', 'Enveloppes', 'الأظرفة')}</h2><span className="text-xs text-muted tabular-nums">{money(varSpent, lang)} / {money(envTot, lang)}</span></div>
        <div className="space-y-1">{VAR.filter((k) => (m.env[k] ?? 0) > 0 || (sp[k] ?? 0) > 0).map((k) => {
          const b = m.env[k] ?? 0; const s = sp[k] ?? 0; const over = b > 0 && s > b; const p = b ? Math.min(100, (s / b) * 100) : 100
          return <button key={k} className="w-full rounded-2xl p-2.5 text-start active:bg-cream" onClick={() => { setCat(k); setAdd(true) }} title={`${cn(k, lang)} : ${money(s, lang)} / ${money(b, lang)}`}>
            <div className="flex items-center gap-2 text-sm"><span className="text-lg" aria-hidden>{CATS[k].e}</span><span className="flex-1 font-semibold">{cn(k, lang)}{k === 'food' && <span className="ms-1 text-[10px] font-bold text-forest">· auto</span>}</span><span className={`tabular-nums ${over ? 'font-bold text-danger' : 'text-muted'}`}>{money(s, lang)} / {money(b, lang)}</span></div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: over ? 'rgb(var(--danger))' : CATS[k].k === 'need' ? C.need : C.want }} /></div>
          </button>
        })}</div>
      </section>

      {/* Evolution over months (single series, one axis) */}
      {hist.length > 1 && <section className="rounded-[24px] bg-surface p-4 shadow-soft">
        <h2 className="flex items-center gap-2 font-serif text-[20px] font-semibold"><TrendingUp size={18} className="text-forest" aria-hidden />{L(lang, 'Spending by month', 'Dépenses par mois', 'المصاريف الشهرية')}</h2>
        <p className="text-xs text-muted">{L(lang, 'Fixed charges + recorded spending. Dashed line: income.', 'Charges fixes + dépenses enregistrées. Pointillés : revenus.', 'الخط المتقطع: المداخيل.')}</p>
        <Bars data={hist.map((h) => ({ k: h.mm, label: monthName(h.mm, lang).slice(0, 3), v: h.v, on: h.mm === mon }))} ref0={inc} lang={lang} onPick={setMon} />
      </section>}

      {/* Expert advice */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-serif text-[20px] font-semibold"><Lightbulb size={18} className="text-terracotta" aria-hidden />{L(lang, 'Advice', 'Conseils d’expert', 'نصائح')}</h2>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1" data-noswipe>{tips.map(([h, b]) => <div key={h} className="w-[260px] shrink-0 snap-start rounded-[22px] bg-cream p-4"><p className="font-display font-extrabold">{h}</p><p className="mt-1 text-sm leading-relaxed text-ink/80">{b}</p></div>)}</div>
      </section>

      {m.goal?.target ? <section className="rounded-[24px] bg-surface p-4 shadow-soft">
        <div className="flex items-center gap-2"><Target size={18} className="text-terracotta" aria-hidden /><h2 className="flex-1 font-serif text-[20px] font-semibold">{m.goal.n || L(lang, 'Savings goal', 'Objectif d’épargne', 'هدف الادخار')}</h2><b className="tabular-nums">{Math.round((m.goal.saved / m.goal.target) * 100)} %</b></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (m.goal.saved / m.goal.target) * 100)}%`, background: C.save }} /></div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted"><span>{money(m.goal.saved, lang)} / {money(m.goal.target, lang)}</span><button className="rounded-full bg-cream px-3 py-1.5 font-bold text-forest" onClick={() => save({ ...m, goal: { ...m.goal!, saved: m.goal!.saved + (m.goal!.monthly || 0) } })}>+ {money(m.goal.monthly, lang)} {L(lang, 'this month', 'ce mois', 'هذا الشهر')}</button></div>
      </section> : null}

      {list.length > 0 && <section><h2 className="mb-2 font-serif text-[20px] font-semibold">{L(lang, 'Expenses this month', 'Dépenses du mois', 'مصاريف الشهر')}</h2>
        <div className="divide-y divide-line/70 rounded-[22px] bg-surface shadow-soft">{list.map((e) => <div key={e.id} className="flex items-center gap-3 px-4 py-2.5"><span className="text-xl" aria-hidden>{CATS[e.c]?.e ?? '🧾'}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{e.n || cn(e.c, lang)}</span><span className="text-xs text-muted">{new Date(e.t).toLocaleDateString(lang === 'ar' ? 'ar-MA-u-nu-latn' : lang, { day: 'numeric', month: 'short' })}</span></span><b className="tabular-nums">{money(e.a, lang)}</b><button className="p-1 text-muted" onClick={() => delExp(e.id)} aria-label={L(lang, 'Delete', 'Supprimer', 'حذف')}><Trash2 size={16} aria-hidden /></button></div>)}</div>
      </section>}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-4 text-sm"><span className="inline-flex items-center gap-1.5 text-xs text-muted"><ShieldCheck size={14} className="text-forest" aria-hidden />{L(lang, 'Private to you · groceries come from your KUZINTI trips', 'Privé · les courses viennent de vos courses KUZINTI', 'خاص بك')}</span><button className="font-semibold text-forest" onClick={onEdit}>{L(lang, 'Edit income & charges', 'Modifier revenus et charges', 'تعديل')}</button></div>

      <AddExpense open={add} cat0={cat} onClose={() => { setAdd(false); setCat(null) }} onAdd={(c, a, n) => save({ ...m, exp: [...m.exp, { id: uid(), t: mon === now ? Date.now() : new Date(Math.floor(mon / 12), mon % 12, 15).getTime(), c, a, n }] })} lang={lang} />
    </div>
  )
}

function Gauge({ v, color }: { v: number; color: string }) {
  const R = 40, C2 = Math.PI * R
  return (
    <div className="relative shrink-0" style={{ width: 100, height: 60 }}>
      <svg width="100" height="60" viewBox="0 0 100 60" role="img" aria-label={`${v} / 100`}><path d="M10 52 A40 40 0 0 1 90 52" fill="none" stroke="rgb(var(--cream))" strokeWidth="10" strokeLinecap="round" /><path d="M10 52 A40 40 0 0 1 90 52" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(v / 100) * C2} ${C2}`} style={{ transition: 'stroke-dasharray .8s var(--ease)' }} /></svg>
      <b className="absolute inset-x-0 bottom-0 text-center font-display text-2xl font-extrabold tabular-nums">{v}</b>
    </div>
  )
}
function Donut({ parts, total, label, sub, lang }: { parts: [number, string, string][]; total: number; label: string; sub: string; lang: Lang }) {
  const R = 46, W = 14, C2 = 2 * Math.PI * R; let off = 0
  const [hov, setHov] = useState<number | null>(null)
  return (
    <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90" role="img" aria-label={parts.map(([v, , l]) => `${l} ${money(v, lang)}`).join(', ')}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgb(var(--cream))" strokeWidth={W} />
        {parts.map(([v, c, l], i) => { const len = total ? (v / total) * C2 : 0; const seg = <circle key={l} cx="60" cy="60" r={R} fill="none" stroke={c} strokeWidth={hov === i ? W + 4 : W} strokeDasharray={`${Math.max(0, len - 2)} ${C2}`} strokeDashoffset={-off} style={{ transition: 'stroke-width .15s' }} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onClick={() => setHov(hov === i ? null : i)}><title>{`${l} : ${money(v, lang)}`}</title></circle>; off += len; return seg })}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div>{hov !== null ? <><b className="block text-sm tabular-nums">{money(parts[hov][0], lang)}</b><span className="text-[10px] text-muted">{parts[hov][2]}</span></> : <><b className="block font-display text-lg font-extrabold tabular-nums">{label}</b><span className="text-[10px] text-muted">{sub}</span></>}</div></div>
    </div>
  )
}

function Bars({ data, ref0, lang, onPick }: { data: { k: number; label: string; v: number; on: boolean }[]; ref0: number; lang: Lang; onPick: (k: number) => void }) {
  const max = Math.max(ref0, ...data.map((d) => d.v), 1); const H = 120
  const [hov, setHov] = useState<number | null>(null)
  return (
    <div className="relative mt-3" style={{ height: H + 24 }}>
      {ref0 > 0 && <div className="absolute inset-x-0 border-t-2 border-dashed border-muted/50" style={{ top: H - (ref0 / max) * H }} aria-hidden><span className="absolute -top-4 end-0 text-[10px] text-muted">{money(ref0, lang)}</span></div>}
      <div className="absolute inset-x-0 top-0 flex items-end gap-2" style={{ height: H }}>
        {data.map((d, i) => <button key={d.k} className="relative flex h-full flex-1 items-end justify-center" onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onClick={() => onPick(d.k)} aria-label={`${d.label} ${money(d.v, lang)}`}>
          {(hov === i || d.on) && <span className="absolute z-10 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[10px] font-bold text-white tabular-nums" style={{ bottom: (d.v / max) * H + 6 }}>{money(d.v, lang)}</span>}
          <span className="w-full max-w-[34px] rounded-t-[4px] transition-all duration-700" style={{ height: `${(d.v / max) * 100}%`, background: d.v > ref0 && ref0 > 0 ? 'rgb(var(--danger))' : C.need, opacity: d.on ? 1 : 0.55 }} />
        </button>)}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex gap-2 border-t border-line pt-1">{data.map((d) => <span key={d.k} className={`flex-1 text-center text-[10px] capitalize ${d.on ? 'font-bold text-ink' : 'text-muted'}`}>{d.label}</span>)}</div>
    </div>
  )
}

function AddExpense({ open, cat0, onClose, onAdd, lang }: { open: boolean; cat0: string | null; onClose: () => void; onAdd: (c: string, a: number, n: string) => void; lang: Lang }) {
  const [v, setV] = useState(''); const [c, setC] = useState<string | null>(null); const [n, setN] = useState('')
  const cc = c ?? cat0 ?? 'misc'
  const ok = parseFloat(v.replace(',', '.')) > 0
  const submit = () => { if (!ok) return; onAdd(cc, parseFloat(v.replace(',', '.')) / curRate(), n.trim()); setV(''); setN(''); setC(null); onClose() }
  return (
    <Sheet open={open} onClose={onClose} title={L(lang, 'New expense', 'Nouvelle dépense', 'مصروف جديد')}>
      <input autoFocus inputMode="decimal" className="w-full bg-transparent text-center font-display text-[44px] font-extrabold tabular-nums outline-none" placeholder="0" value={v} onChange={(e) => setV(e.target.value)} aria-label={L(lang, 'Amount', 'Montant', 'المبلغ')} />
      <div className="mt-2 grid grid-cols-4 gap-2">{VAR.concat(['subs']).map((k) => <button key={k} className={`rounded-2xl border-2 p-2 text-center transition active:scale-95 ${cc === k ? 'border-forest bg-leaf/20' : 'border-line'}`} onClick={() => setC(k)} aria-pressed={cc === k}><span className="block text-2xl">{CATS[k].e}</span><span className="block truncate text-[10px] font-semibold">{cn(k, lang)}</span></button>)}</div>
      <input className="input mt-3" placeholder={L(lang, 'Note (optional)', 'Note (facultatif)', 'ملاحظة')} value={n} onChange={(e) => setN(e.target.value)} />
      <button className="btn btn-primary mt-3 w-full !min-h-14" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }} onClick={submit}><Check size={20} aria-hidden /> {L(lang, 'Add', 'Ajouter', 'إضافة')}</button>
    </Sheet>
  )
}
