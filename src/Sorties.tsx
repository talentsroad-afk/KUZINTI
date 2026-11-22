import { useState } from 'react'
import { useApp } from './lib/store'
import { money } from './lib/i18n'

// Real places, approximate price per person in MAD (0 = free), duration in hours. Prices are indicative only.
type Kind = 'famille' | 'couple' | 'sport' | 'culture' | 'nature'
interface Act { id: string; e: string; n: string; d: string; p: number; h: number; k: Kind[] }
const A = (id: string, e: string, n: string, d: string, p: number, h: number, k: string): Act => ({ id, e, n, d, p, h, k: k.split(' ') as Kind[] })
export const CITIES: Record<string, Act[]> = {
  Casablanca: [
    A('hassan2', '🕌', 'Visite de la Mosquée Hassan II', 'Visite guidée de l’intérieur, face à l’océan', 130, 2, 'culture famille'),
    A('corniche', '🌊', 'Balade sur la Corniche d’Aïn Diab', 'Marche au coucher du soleil, glace en route', 0, 2, 'couple famille nature'),
    A('habous', '🛍️', 'Quartier des Habous', 'Souks, librairies et pâtisseries traditionnelles', 0, 2, 'culture couple'),
    A('ligue', '🌳', 'Parc de la Ligue Arabe', 'Grand parc rénové, jeux pour enfants', 0, 2, 'famille nature'),
    A('aquarium', '🐠', 'Aquarium du Morocco Mall', 'Aquarium géant et balade au centre', 100, 2, 'famille'),
    A('sindibad', '🎢', 'Parc Sindibad', 'Parc d’attractions et zoo', 150, 4, 'famille'),
    A('slaoui', '🖼️', 'Musée Abderrahman Slaoui', 'Affiches, bijoux et art marocain', 30, 1, 'culture'),
    A('villa-arts', '🎨', 'Villa des Arts', 'Expositions d’art contemporain', 0, 1, 'culture couple'),
    A('surf-casa', '🏄', 'Cours de surf à Aïn Diab', 'Cours de 2 h avec planche et combinaison', 250, 2, 'sport'),
    A('anfa-run', '🏃', 'Footing au Parc d’Anfa', 'Boucle verte, idéale le matin', 0, 1, 'sport nature'),
  ],
  Rabat: [
    A('hassan-tour', '🗼', 'Tour Hassan et Mausolée Mohammed V', 'Monument emblématique, accès libre', 0, 1, 'culture famille'),
    A('oudayas', '🏰', 'Kasbah des Oudayas', 'Ruelles bleues, jardin andalou et thé face à la mer', 0, 2, 'culture couple'),
    A('chellah', '🏛️', 'Site du Chellah', 'Ruines romaines et mérinides, cigognes', 70, 2, 'culture nature'),
    A('mmvi', '🖼️', 'Musée Mohammed VI d’art moderne', 'Art marocain moderne et contemporain', 20, 2, 'culture'),
    A('jardin-essais', '🌿', 'Jardin d’Essais Botaniques', 'Jardin historique au calme', 10, 2, 'nature famille couple'),
    A('zoo-rabat', '🦁', 'Zoo national de Rabat', 'Animaux d’Afrique dans de grands espaces', 50, 3, 'famille'),
    A('bouregreg', '⛵', 'Balade en barque sur le Bouregreg', 'Traversée Rabat–Salé et marina', 20, 1, 'couple famille'),
    A('medina-rabat', '🛍️', 'Médina de Rabat', 'Souks, rue des Consuls', 0, 2, 'culture'),
    A('surf-rabat', '🏄', 'Surf plage de Rabat', 'Cours débutant', 200, 2, 'sport'),
    A('maamora', '🌲', 'Forêt de la Maâmora', 'Pique-nique et vélo sous les chênes-lièges', 0, 3, 'nature famille sport'),
  ],
  Marrakech: [
    A('majorelle', '🌵', 'Jardin Majorelle', 'Jardin bleu et musée berbère (réserver)', 150, 2, 'culture couple nature'),
    A('jemaa', '🎪', 'Place Jemaa el-Fna', 'Conteurs, musique et stands le soir', 0, 2, 'famille couple culture'),
    A('bahia', '🏯', 'Palais Bahia', 'Zellige, cèdre et jardins', 100, 1, 'culture'),
    A('benyoussef', '🕌', 'Médersa Ben Youssef', 'Chef-d’œuvre de l’architecture mérinide', 50, 1, 'culture'),
    A('menara', '🌳', 'Jardins de la Ménara', 'Bassin et oliveraie avec vue sur l’Atlas', 0, 1, 'nature famille'),
    A('hammam-mk', '🧖', 'Hammam traditionnel', 'Gommage et savon noir', 150, 2, 'couple'),
    A('agafay', '🐪', 'Désert d’Agafay', 'Balade à dos de chameau au coucher du soleil', 400, 4, 'couple famille nature'),
    A('ourika', '🏞️', 'Vallée de l’Ourika', 'Cascades de Setti Fatma, déjeuner au bord de l’eau', 200, 6, 'nature sport famille'),
    A('cuisine-mk', '👩‍🍳', 'Cours de cuisine marocaine', 'Marché + tajine préparé ensemble', 500, 4, 'couple culture'),
    A('souks-mk', '🧺', 'Souks de la médina', 'Épices, cuir et artisanat', 0, 2, 'culture couple'),
  ],
  'Fès': [
    A('fes-bali', '🏘️', 'Médina de Fès el-Bali', 'Plus grande médina piétonne au monde', 0, 3, 'culture famille'),
    A('chouara', '🎨', 'Tanneries Chouara', 'Vue depuis les terrasses (petit pourboire)', 20, 1, 'culture'),
    A('bouinania', '🕌', 'Médersa Bou Inania', 'Bois sculpté et zellige du XIVᵉ siècle', 20, 1, 'culture'),
    A('jnan-sbil', '🌳', 'Jardin Jnan Sbil', 'Jardin andalou au cœur de la ville', 0, 1, 'nature famille couple'),
    A('borj-nord', '🌄', 'Borj Nord au coucher du soleil', 'Panorama sur toute la médina', 0, 1, 'couple nature'),
    A('nejjarine', '🪵', 'Musée Nejjarine', 'Arts et métiers du bois', 20, 1, 'culture'),
    A('hammam-fes', '🧖', 'Hammam traditionnel', 'Gommage et détente', 100, 2, 'couple'),
    A('ifrane', '🦌', 'Journée à Ifrane', 'Forêt de cèdres et singes magots', 100, 6, 'nature famille'),
    A('harazem', '💧', 'Sources de Sidi Harazem', 'Pique-nique près des sources', 0, 3, 'nature famille'),
    A('rando-fes', '🥾', 'Randonnée autour de Zalagh', 'Montée avec vue sur Fès', 0, 3, 'sport nature'),
  ],
  Tanger: [
    A('spartel', '🗺️', 'Cap Spartel', 'Phare où se rencontrent Atlantique et Méditerranée', 0, 1, 'nature couple famille'),
    A('hercule', '🕳️', 'Grottes d’Hercule', 'Grotte mythique ouverte sur l’océan', 60, 1, 'culture famille'),
    A('kasbah-tng', '🏰', 'Kasbah et musée de la Kasbah', 'Palais Dar el-Makhzen', 20, 2, 'culture'),
    A('hafa', '☕', 'Café Hafa', 'Thé à la menthe en terrasses face au détroit', 30, 1, 'couple'),
    A('achakar', '🏖️', 'Plage d’Achakar', 'Grande plage sauvage', 0, 3, 'famille nature sport'),
    A('perdicaris', '🌲', 'Forêt de Perdicaris (Rmilat)', 'Balade et vue sur l’Espagne', 0, 2, 'nature famille sport'),
    A('medina-tng', '🛍️', 'Médina et Petit Socco', 'Ruelles et cafés historiques', 0, 2, 'culture couple'),
    A('asilah', '🎨', 'Journée à Asilah', 'Médina blanche et fresques, à 45 min', 100, 6, 'culture couple famille'),
    A('rif', '🎬', 'Cinémathèque du Rif', 'Film au Grand Socco', 30, 2, 'couple culture'),
    A('velo-tng', '🚴', 'Vélo sur la corniche de Malabata', 'Piste le long de la baie', 50, 2, 'sport'),
  ],
}
type Mode = 'day' | 'week' | 'month'
type Slot = [string, string, number] // key, label, max hours
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr', o).format(d)
function slotsFor(mode: Mode): Slot[] {
  const now = new Date()
  if (mode === 'day') return [['am', 'Matin', 4], ['pm', 'Après-midi', 6], ['ev', 'Soir', 2]]
  if (mode === 'week') return Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() + i); const we = d.getDay() === 0 || d.getDay() === 6; return [`w${i}`, `${fmt(d, { weekday: 'long', day: 'numeric' })}${we ? '' : ' · soirée'}`, we ? 6 : 2] as Slot })
  const out: Slot[] = []; const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  for (const d = new Date(now); d <= end; d.setDate(d.getDate() + 1)) if (d.getDay() === 0 || d.getDay() === 6) out.push([`m${d.getDate()}`, fmt(d, { weekday: 'long', day: 'numeric', month: 'short' }), 6])
  return out
}
const KINDS: [Kind, string][] = [['famille', '👨‍👩‍👧 Famille'], ['couple', '💑 Couple'], ['sport', '⚽ Sport'], ['culture', '🏛️ Culture'], ['nature', '🌿 Nature']]

function compose(acts: Act[], slots: Slot[], kinds: Kind[], budget: number, people: number, keep: Record<string, string> = {}) {
  const ok = acts.filter((a) => !kinds.length || a.k.some((k) => kinds.includes(k)))
  const out: Record<string, string> = { ...keep }; let spent = Object.values(out).reduce((s, id) => s + (acts.find((a) => a.id === id)?.p ?? 0) * people, 0)
  const shuffle = <T,>(x: T[]) => [...x].sort(() => Math.random() - 0.5)
  for (const [k, , maxH] of slots) {
    if (out[k]) continue
    const used = new Set(Object.values(out)); const fits = (a: Act) => a.h <= maxH && spent + a.p * people <= budget
    const pick = shuffle(ok.filter((a) => fits(a) && !used.has(a.id)))[0] ?? shuffle(ok.filter(fits))[0] ?? shuffle(acts.filter((a) => a.p === 0 && a.h <= maxH))[0] ?? shuffle(acts.filter((a) => a.p === 0))[0]
    if (pick) { out[k] = pick.id; spent += pick.p * people }
  }
  return out
}

/** Outings: one tap composes real activities for a day, a week or the month's weekends in your city that fit the budget and who you go out with. */
export function SortiesTab() {
  const { me, house, upHouse, patchMe, award } = useApp()
  const city = CITIES[me!.city] ? me!.city : 'Casablanca'; const acts = CITIES[city]
  const people = me!.size
  const [kinds, setKinds] = useState<Kind[]>([]); const [budget, setBudget] = useState(300); const [mode, setMode] = useState<Mode>('week')
  const slots = slotsFor(mode)
  type O = { outings?: Partial<Record<Mode, Record<string, string>>> }
  const we = (house as unknown as O).outings?.[mode] ?? {}
  const setWe = (w: Record<string, string>, log: string, all = false) => upHouse((h) => { const x = h as unknown as O; x.outings = all ? {} : { ...(x.outings ?? {}), [mode]: w } }, log)
  const total = slots.map(([k]) => we[k]).filter(Boolean).reduce((s: number, id) => s + (acts.find((a) => a.id === id)?.p ?? 0) * people, 0)
  const go = () => { setWe(compose(acts, slots, kinds, budget, people), `🎈 sorties ${city}`); award(10, '🎈') }
  const swap = (slot: string) => { const rest = { ...we }; delete rest[slot]; const next = compose(acts.filter((a) => a.id !== we[slot]), slots, kinds, budget, people, rest); setWe({ ...we, [slot]: next[slot] ?? we[slot] }, '↻ sortie') }
  return (
    <div className="space-y-3">
      <div className="card space-y-3 p-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">{Object.keys(CITIES).map((c) => <button key={c} className="chip shrink-0" aria-pressed={c === city} onClick={() => { patchMe({ city: c }); setWe({}, `📍 ${c}`, true) }}>📍 {c}</button>)}</div>
        <div className="flex rounded-full bg-cream p-1">{([['day', 'Jour'], ['week', 'Semaine'], ['month', 'Mois']] as [Mode, string][]).map(([m, l]) => <button key={m} className={`flex-1 rounded-full py-2 text-sm font-bold ${mode === m ? 'bg-forest text-white' : 'text-muted'}`} onClick={() => setMode(m)}>{l}</button>)}</div>
        <div className="flex flex-wrap gap-2">{KINDS.map(([k, l]) => <button key={k} className="chip" aria-pressed={kinds.includes(k)} onClick={() => setKinds(kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k])}>{l}</button>)}</div>
        <div className="flex items-center gap-3"><span className="text-sm font-semibold">Budget {mode === 'day' ? 'du jour' : mode === 'week' ? 'semaine' : 'du mois'}</span><input type="range" min={0} max={2000} step={50} value={budget} onChange={(e) => setBudget(+e.target.value)} className="flex-1 accent-[#245B43]" aria-label="Budget sorties" /><b className="w-24 whitespace-nowrap text-end tabular-nums">{money(budget, 'fr')}</b></div>
        <button className="btn btn-primary w-full !min-h-14 text-base" onClick={go}>🎈 {mode === 'day' ? 'Composer ma journée' : mode === 'week' ? 'Composer ma semaine de sorties' : 'Composer mes week-ends du mois'}</button>
        <p className="text-center text-[11px] text-muted">Pour {people} personne(s) · prix indicatifs par personne, à vérifier sur place</p>
      </div>
      {!Object.keys(we).length ? (
        <div className="card space-y-2 p-6 text-center"><p className="text-4xl">🗺️</p><p className="font-display text-lg font-extrabold">Rien de prévu pour l’instant</p><p className="text-sm text-muted">Choisis Jour, Semaine ou Mois, avec qui tu sors et ton budget, puis touche « Composer » : des activités réelles à {city}, adaptées à ton budget et au temps dont tu disposes.</p></div>
      ) : (<>
        <div className="card divide-y divide-line/70">
          {slots.map(([k, label]) => { const a = acts.find((x) => x.id === we[k]); if (!a) return null; return (
            <div key={k} className="flex gap-3 px-4 py-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cream text-2xl">{a.e}</span>
              <div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-wide text-muted first-letter:uppercase">{label}</p><p className="font-semibold leading-tight">{a.n}</p><p className="text-xs text-muted">{a.d} · ⏱ {a.h} h · {a.p ? `≈ ${money(a.p * people, 'fr')}` : 'Gratuit'}</p>
                <button className="mt-1.5 rounded-full bg-forest px-3 py-1 text-xs font-bold text-white" onClick={() => swap(k)}>↻ Changer</button></div>
            </div>) })}
        </div>
        <div className="card flex items-center justify-between p-4"><span className="font-semibold">Total estimé</span><span className={`font-display text-xl font-extrabold tabular-nums ${total > budget ? 'text-danger' : 'text-forest'}`}>{money(total, 'fr')} <span className="text-xs font-semibold text-muted">/ {money(budget, 'fr')}</span></span></div>
      </>)}
    </div>
  )
}
