import { Lightbulb } from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useApp } from './lib/store'
import { money, type Lang } from './lib/i18n'
import { useBasket } from './Flow'
import { Sheet } from './ui'

export type Tab = 'home' | 'recipes' | 'week' | 'list' | 'stores' | 'profile' | 'sorties'
const L = (lang: Lang, fr: string, en: string) => (lang === 'en' ? en : fr)
const ls = { get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } } }

/** What each screen is for, why, and what comes next. Shared by the hint bar and the assistant. */
export function pageInfo(tab: Tab, lang: Lang): { name: string; what: string; why: string } {
  const P: Record<Tab, [string, string, string, string, string, string]> = {
    home: ['Accueil', 'Home', 'Choisis ta cuisine et tes objectifs, puis touche « Composer ma semaine ».', 'Pick a cuisine and goals, then tap “Plan my week”.', 'KUZINTI prépare 7 jours de repas complets dans ton budget.', 'KUZINTI builds 7 days of complete meals within your budget.'],
    recipes: ['Recettes', 'Recipes', 'Cherche un plat, ❤️ pour le garder, « + Aujourd’hui » pour l’ajouter.', 'Search a dish, ❤️ to save it, “+ Today” to add it.', 'Tes favoris reviennent plus souvent dans tes semaines.', 'Your favorites help you plan faster.'],
    week: ['Ma semaine', 'My week', 'Touche un plat pour le changer. Jour / Semaine / Mois change la vue.', 'Tap a dish to swap it. Day / Week / Month changes the view.', 'La liste de courses se recalcule toute seule à chaque changement.', 'The shopping list updates itself after every change.'],
    list: ['Courses', 'Shopping', 'Coche chaque produit en magasin. Touche la quantité/prix pour saisir le vrai prix payé.', 'Tick each item in the store. Tap qty/price to enter what you really paid.', 'Ton budget Dépensé / Reste se met à jour en direct, aussi chez ton partenaire.', 'Your Spent / Left budget updates live, for your partner too.'],
    stores: ['Magasins', 'Stores', 'Compare le total de ta liste dans chaque magasin, puis choisis-en un.', 'Compare your list total in each store, then pick one.', 'Les prix sont un indice estimé : saisis les vrais prix en faisant tes courses.', 'Prices are an estimated index: enter real prices while shopping.'],
    sorties: ['Sorties', 'Outings', 'Choisis Jour, Semaine ou Mois, avec qui tu sors et ton budget, puis « Composer ».', 'Pick Day, Week or Month, who you go out with and a budget, then “Compose”.', 'Des activités réelles dans ta ville, partagées avec ton foyer. Prix indicatifs.', 'Real activities in your city, shared with your household. Indicative prices.'],
    profile: ['Profil', 'Profile', 'Ton code foyer pour inviter quelqu’un, ton garde-manger et ton activité.', 'Your household code to invite someone, your pantry and activity.', 'Partage le code : vous verrez la même semaine et la même liste.', 'Share the code: you will both see the same week and list.'],
  }
  const p = P[tab]; return lang === 'en' ? { name: p[1], what: p[3], why: p[5] } : { name: p[0], what: p[2], why: p[4] }
}

/** One-line "what / why" bar under the header, dismissible per screen. */
export function Hint({ tab }: { tab: Tab }) {
  const { lang } = useApp(); const k = 'kz-hint-' + tab
  const [hidden, setHidden] = useState(() => ls.get(k) === '1')
  useEffect(() => setHidden(ls.get(k) === '1'), [k])
  if (hidden) return null
  const i = pageInfo(tab, lang)
  return (
    <div className="fade-up mb-3 flex items-start gap-2 rounded-2xl bg-leaf/20 px-3 py-2 text-[13px] leading-snug" role="note">
      <Lightbulb size={16} className="mt-0.5 shrink-0 text-forest" aria-hidden /><span className="flex-1"><b>{i.what}</b> <span className="text-muted">{i.why}</span></span>
      <button className="px-1 text-muted" aria-label={L(lang, 'Masquer l’aide', 'Hide tip')} onClick={() => { ls.set(k, '1'); setHidden(true) }}>✕</button>
    </div>
  )
}

type Act = [string, () => void]
/** Contextual assistant: reads real app state (plan, budget, list, store, household) and proposes the next actions. No canned chatbot. */
export function Assistant({ open, onClose, tab, next, more, undo, onTour, go }: { open: boolean; onClose: () => void; tab: Tab; next: Act; more: Act[]; undo: Act | null; onTour: () => void; go: (t: Tab) => void }) {
  const { lang, me, house, toast } = useApp()
  const { total, spent, items, store } = useBasket()
  const [q, setQ] = useState<string | null>(null)
  const h = house!; const budget = me!.budget
  const meals = Object.keys(h.plan).length; const done = items.filter((x) => h.checked[x.key]).length
  const i = pageInfo(tab, lang)
  const state: [string, string][] = [
    ['🗓️', meals ? L(lang, `${meals} repas planifiés`, `${meals} meals planned`) : L(lang, 'Aucune semaine composée', 'No week planned yet')],
    [total > budget ? '⚠️' : '💰', total > budget ? L(lang, `Liste ${money(total, lang)} : ${money(total - budget, lang)} au-dessus du budget`, `List ${money(total, lang)}: ${money(total - budget, lang)} over budget`) : L(lang, `Liste ${money(total, lang)} sur ${money(budget, lang)}`, `List ${money(total, lang)} of ${money(budget, lang)}`)],
    ['🛒', L(lang, `${done}/${items.length} produits cochés · ${money(spent, lang)} dépensés`, `${done}/${items.length} items ticked · ${money(spent, lang)} spent`)],
    ['🏬', store ? store.name : L(lang, 'Aucun magasin choisi', 'No store chosen')],
    ['👥', L(lang, `Foyer ${h.code} · ${h.members.length} membre(s)`, `Household ${h.code} · ${h.members.length} member(s)`)],
  ]
  const QA: [string, string, () => string, Act?][] = [
    ['left', L(lang, 'Combien il me reste ?', 'How much is left?'), () => L(lang, `Budget ${money(budget, lang)}. Liste prévue ${money(total, lang)}, déjà dépensé ${money(spent, lang)}. Il te reste ${money(budget - spent, lang)} à dépenser, et ${money(budget - total, lang)} de marge si tu achètes toute la liste.`, `Budget ${money(budget, lang)}. Planned ${money(total, lang)}, spent ${money(spent, lang)}. ${money(budget - spent, lang)} left to spend, ${money(budget - total, lang)} margin for the full list.`)],
    ['invite', L(lang, 'Comment inviter mon partenaire ?', 'How do I invite my partner?'), () => L(lang, `Donne-lui le code ${h.code}. Il crée son compte, puis à l’étape « Foyer » il entre ce code et touche « Rejoindre ». Vous verrez la même semaine et la même liste, en direct.`, `Give them code ${h.code}. They sign up, enter it at the “Household” step and tap “Join”. You will share the same week and list, live.`), [L(lang, 'Copier le code', 'Copy code'), () => { navigator.clipboard?.writeText(h.code).catch(() => {}); toast('✓ ' + h.code) }]],
    ['swap', L(lang, 'Comment changer un plat ?', 'How do I swap a dish?'), () => L(lang, 'Dans « Ma semaine », touche le plat puis choisis une alternative (moins cher, plus léger, rapide…) ou « Surprends-moi ». La liste se recalcule toute seule.', 'In “My week”, tap the dish and pick an alternative (cheaper, lighter, quicker…) or “Surprise me”. The list updates itself.'), [L(lang, 'Ouvrir ma semaine', 'Open my week'), () => { go('week'); onClose() }]],
    ['price', L(lang, 'D’où viennent les prix ?', 'Where do prices come from?'), () => L(lang, 'Ce sont des estimations moyennes, ajustées par magasin. En faisant tes courses, touche le prix d’un produit pour saisir le vrai prix : ton budget se met à jour.', 'They are average estimates, adjusted per store. While shopping, tap a price to enter the real one: your budget updates.')],
    ['mistake', L(lang, 'Je me suis trompé', 'I made a mistake'), () => undo ? L(lang, `Tu peux annuler ta dernière action : « ${undo[0]} ».`, `You can undo your last action: “${undo[0]}”.`) : L(lang, 'Rien à annuler pour l’instant. Pour un plat : « Changer ». Pour une quantité : touche-la dans Courses et ajuste avec − / +.', 'Nothing to undo right now. For a dish: “Change”. For a quantity: tap it in Shopping and use − / +.'), undo ? [L(lang, 'Annuler', 'Undo'), () => { undo[1](); onClose() }] : undefined],
  ]
  const cur = QA.find((x) => x[0] === q)
  return (
    <Sheet open={open} onClose={() => { setQ(null); onClose() }} title={`✨ ${L(lang, 'Assistant', 'Assistant')}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{L(lang, 'Tu es ici', 'You are here')} · {i.name}</p>
      <p className="mt-1 text-sm">{i.what}</p>
      <button className="btn btn-primary mt-3 w-full !min-h-12" onClick={() => { next[1](); onClose() }}>➜ {next[0]}</button>
      {more.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{more.map(([n, f]) => <button key={n} className="chip" onClick={() => { f(); onClose() }}>{n}</button>)}</div>}
      <div className="mt-4 space-y-1.5 rounded-2xl bg-cream p-3 text-sm">{state.map(([e, s]) => <p key={s} className="flex gap-2"><span aria-hidden>{e}</span><span>{s}</span></p>)}</div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">{L(lang, 'Questions fréquentes', 'Quick questions')}</p>
      <div className="mt-2 flex flex-wrap gap-2">{QA.map(([k, label]) => <button key={k} className={`chip ${q === k ? '!bg-forest !text-white' : ''}`} aria-pressed={q === k} onClick={() => setQ(q === k ? null : k)}>{label}</button>)}</div>
      {cur && <div className="fade-up mt-3 rounded-2xl border border-line p-3 text-sm" aria-live="polite"><p>{cur[2]()}</p>{cur[3] && <button className="btn btn-soft mt-2 w-full" onClick={cur[3][1]}>{cur[3][0]}</button>}</div>}
      <button className="mt-4 w-full py-2 text-sm font-semibold text-forest underline" onClick={() => { onClose(); onTour() }}>🧭 {L(lang, 'Revoir la visite guidée', 'Replay the guided tour')}</button>
    </Sheet>
  )
}

/** Short spotlight tour over real UI elements marked with data-tour. Skippable, replayable. */
const TOUR: [string, string, string, string, string][] = [
  ['steps', 'Ton parcours', 'Your journey', 'Ces 5 étapes montrent où tu en es : Composer → Semaine → Magasin → Courses → Fini. Touche une étape pour y aller.', 'These 5 steps show where you are. Tap a step to jump there.'],
  ['budget', 'Ton budget', 'Your budget', 'Le total de ta liste face à ton budget. Touche-le pour changer le budget, le nombre de personnes ou les repas.', 'Your list total vs budget. Tap it to change budget, people or meals.'],
  ['tabs', 'Les 5 espaces', 'The 5 spaces', 'Accueil, Semaine, Courses, Sorties, Profil. Touche l’onglet actif pour remonter en haut. Les recettes s’ouvrent depuis Semaine.', 'Home, Week, Shopping, Outings, Profile. Tap the active tab to scroll to top.'],
  ['assist', 'Ton assistant', 'Your assistant', 'Il sait où tu es et te propose la prochaine action. Touche ✨ dès que tu hésites.', 'It knows where you are and suggests the next action. Tap ✨ whenever unsure.'],
]
export const tourDone = () => ls.get('kz-tour') === '1'
export function Tour({ run, onEnd }: { run: boolean; onEnd: () => void }) {
  const { lang } = useApp(); const [i, setI] = useState(0); const [r, setR] = useState<DOMRect | null>(null)
  useEffect(() => { if (run) setI(0) }, [run])
  useLayoutEffect(() => {
    if (!run) return
    const el = document.querySelector(`[data-tour="${TOUR[i][0]}"]`); const upd = () => setR(el ? el.getBoundingClientRect() : null)
    upd(); addEventListener('resize', upd); return () => removeEventListener('resize', upd)
  }, [run, i])
  if (!run) return null
  const end = () => { ls.set('kz-tour', '1'); onEnd() }
  const s = TOUR[i]; const below = !r || r.top < innerHeight / 2
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={lang === 'en' ? s[2] : s[1]}>
      <div className={r ? "absolute" : "absolute inset-0"} onClick={end} style={r ? { boxShadow: `0 0 0 9999px rgb(0 0 0 / .55)`, left: r.left - 6, top: r.top - 6, width: r.width + 12, height: r.height + 12, borderRadius: 18, transition: 'all .3s ease' } : { background: 'rgb(0 0 0 / .55)' }} />
      <div className="fade-up absolute inset-x-4 mx-auto max-w-sm rounded-3xl bg-surface p-4 shadow-lg" style={below ? { top: (r ? r.bottom : 80) + 16 } : { bottom: innerHeight - (r ? r.top : innerHeight) + 16 }}>
        <p className="text-[11px] font-bold uppercase text-muted">{i + 1} / {TOUR.length}</p>
        <p className="font-display text-lg font-extrabold">{lang === 'en' ? s[2] : s[1]}</p>
        <p className="mt-1 text-sm">{lang === 'en' ? s[4] : s[3]}</p>
        <div className="mt-3 flex gap-2"><button className="btn btn-soft flex-1" onClick={end}>{L(lang, 'Passer', 'Skip')}</button>
          <button className="btn btn-primary flex-1" autoFocus onClick={() => (i < TOUR.length - 1 ? setI(i + 1) : end())}>{i < TOUR.length - 1 ? L(lang, 'Suivant', 'Next') : L(lang, 'C’est parti !', 'Let’s go!')}</button></div>
      </div>
    </div>
  )
}
