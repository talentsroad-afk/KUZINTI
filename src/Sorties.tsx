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
type Fmt = 'full' | 'half' | 'eve' | 'night'
const FMT: [Fmt, string, string, number][] = [['full', '☀️ Journée entière', '10h → 21h', 3], ['half', '🌤️ Demi-journée', '14h → 19h', 2], ['eve', '🌇 Fin de journée', '17h → 20h', 1], ['night', '🌙 Soirée', '19h → 23h', 1]]
// Where to eat and how to move, per city (real, well-known spots; prices indicative per person).
const FOOD: Record<string, { lunch: [string, number][]; cafe: [string, number][]; dinner: [string, number][]; move: string }> = {
  Casablanca: { lunch: [['Grillades du Marché Central', 80], ['Snack au quartier Maârif', 60], ['Poissons au port (Le Port de Pêche)', 120]], cafe: [['Café de la Corniche face à l’océan', 30], ['Pâtisserie Bennis aux Habous', 25]], dinner: [['Rick’s Café (dîner)', 350], ['Restaurant à La Corniche', 200], ['Tajine en médina', 90]], move: 'Tramway T1/T2 (8 MAD) ou petit taxi rouge (15–30 MAD).' },
  Rabat: { lunch: [['Poissons à la marina du Bouregreg', 120], ['Snack de l’avenue Mohammed V', 60]], cafe: [['Café Maure des Oudayas', 25], ['Salon de thé de l’Agdal', 30]], dinner: [['Dîner sur la marina du Bouregreg', 200], ['Tajine en médina', 90]], move: 'Tramway Rabat–Salé (6 MAD) ou petit taxi bleu (10–25 MAD).' },
  Marrakech: { lunch: [['Méchoui de la rue Mechouia', 90], ['Terrasse d’un riad en médina', 120]], cafe: [['Café des Épices (place Rahba Kedima)', 35], ['Terrasse sur Jemaa el-Fna', 30]], dinner: [['Stands de Jemaa el-Fna', 70], ['Tanjia en médina', 100], ['Dîner dans un riad', 300]], move: 'À pied en médina, petit taxi beige (20–40 MAD) en dehors.' },
  'Fès': { lunch: [['Bissara et brochettes à Bab Boujloud', 50], ['Restaurant traditionnel de la médina', 120]], cafe: [['Terrasse de Bab Boujloud', 20], ['Café Clock', 40]], dinner: [['Pastilla en médina', 150], ['Restaurant en ville nouvelle', 120]], move: 'Petit taxi rouge (10–25 MAD), puis à pied en médina (prendre un guide officiel).' },
  Tanger: { lunch: [['Poissons au port', 100], ['Snack du Grand Socco', 50]], cafe: [['Café Hafa', 30], ['Gran Café de Paris', 30]], dinner: [['Restaurant de la Kasbah', 180], ['Poissons sur la corniche', 150]], move: 'Petit taxi bleu (10–30 MAD). Cap Spartel et Achakar : grand taxi ou voiture.' },
}
const TIP: Record<Kind, string> = { famille: 'Prévois de l’eau, des en-cas et une casquette pour les enfants.', couple: 'Vise l’heure du coucher du soleil pour les vues et les photos.', sport: 'Pars tôt, prends de l’eau et des chaussures adaptées.', culture: 'Évite le vendredi midi et prévois de la monnaie pour l’entrée.', nature: 'Vérifie la météo et pars avec une petite veste.' }
type Step = { t: string; e: string; n: string; d: string; p: number; id?: string }
type Day = { fmt: Fmt; acts: string[] }
const fmtD = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr', o).format(d)
function daysFor(mode: Mode): [string, string, Fmt][] {
  const now = new Date(); const we = (d: Date) => d.getDay() === 0 || d.getDay() === 6
  if (mode === 'day') return [['d0', 'Aujourd’hui', we(now) ? 'full' : 'eve']]
  if (mode === 'week') return Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() + i); return [`w${i}`, fmtD(d, { weekday: 'long', day: 'numeric' }), we(d) ? 'full' : 'eve'] })
  const out: [string, string, Fmt][] = []; const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  for (const d = new Date(now); d <= end; d.setDate(d.getDate() + 1)) if (we(d)) out.push([`m${d.getDate()}`, fmtD(d, { weekday: 'long', day: 'numeric', month: 'short' }), 'full'])
  return out
}
const maxH: Record<Fmt, number> = { full: 6, half: 4, eve: 2, night: 2 }
const pick = <T,>(x: T[]) => x[Math.floor(Math.random() * x.length)]
function pickActs(acts: Act[], kinds: Kind[], fmt: Fmt, left: number, people: number, avoid: Set<string>) {
  const ok = acts.filter((a) => (!kinds.length || a.k.some((k) => kinds.includes(k))) && a.h <= maxH[fmt])
  const n = FMT.find((f) => f[0] === fmt)![3]; const out: string[] = []
  for (let i = 0; i < n; i++) {
    const c = ok.filter((a) => !out.includes(a.id) && a.p * people <= left)
    const a = pick(c.filter((x) => !avoid.has(x.id))) ?? pick(c) ?? pick(acts.filter((x) => x.p === 0 && !out.includes(x.id)))
    if (a) { out.push(a.id); left -= a.p * people }
  }
  return out
}
/** Turns a day's activities into a concrete hour-by-hour program with meals, café and transport. */
function program(city: string, acts: Act[], day: Day): Step[] {
  const F = FOOD[city]; const A = day.acts.map((id) => acts.find((a) => a.id === id)!).filter(Boolean)
  const act = (t: string, a: Act): Step => ({ t, e: a.e, n: a.n, d: a.d, p: a.p, id: a.id })
  const meal = (t: string, e: string, x: [string, number]): Step => ({ t, e, n: x[0], d: 'Pause repas', p: x[1] })
  const [l, c, d] = [F.lunch[0], F.cafe[0], F.dinner[0]]
  if (day.fmt === 'full') return [A[0] && act('10:00', A[0]), meal('13:00', '🍽️', l), A[1] && act('15:00', A[1]), A[2] && act('17:30', A[2]), meal('20:00', '🌙', F.dinner[F.dinner.length - 1])].filter(Boolean) as Step[]
  if (day.fmt === 'half') return [A[0] && act('14:00', A[0]), meal('16:30', '☕', c), A[1] && act('17:15', A[1])].filter(Boolean) as Step[]
  if (day.fmt === 'eve') return [A[0] && act('17:00', A[0]), meal('19:00', '☕', F.cafe[F.cafe.length - 1])].filter(Boolean) as Step[]
  return [A[0] && act('19:00', A[0]), meal('20:30', '🌙', d)].filter(Boolean) as Step[]
}
const KINDS: [Kind, string][] = [['famille', '👨‍👩‍👧 Famille'], ['couple', '💑 Couple'], ['sport', '⚽ Sport'], ['culture', '🏛️ Culture'], ['nature', '🌿 Nature']]

/** Outings space: compose a day, a week or the month's weekends of real activities, each with a ready-to-follow program. */
export function SortiesTab() {
  const { me, house, upHouse, patchMe, award } = useApp()
  const city = CITIES[me!.city] ? me!.city : 'Casablanca'; const acts = CITIES[city]; const people = me!.size
  const [kinds, setKinds] = useState<Kind[]>([]); const [budget, setBudget] = useState(400); const [mode, setMode] = useState<Mode>('day')
  const [fmt, setFmt] = useState<Fmt | 'auto'>('auto'); const [open, setOpen] = useState<string | null>('d0')
  type O = { outings2?: Partial<Record<Mode, Record<string, Day>>> }
  const plan = (house as unknown as O).outings2?.[mode] ?? {}
  const save = (w: Record<string, Day>, log: string, all = false) => upHouse((h) => { const x = h as unknown as O; x.outings2 = all ? {} : { ...(x.outings2 ?? {}), [mode]: w } }, log)
  const days = daysFor(mode)
  const cost = (d: Day) => program(city, acts, d).reduce((s, x) => s + x.p * people, 0)
  const total = days.reduce((s, [k]) => s + (plan[k] ? cost(plan[k]) : 0), 0)
  const compose = () => {
    const out: Record<string, Day> = {}; const used = new Set<string>(); let left = budget
    for (const [k, , def] of days) { const f = fmt === 'auto' ? def : fmt; const per = left / Math.max(1, days.length - Object.keys(out).length); const a = pickActs(acts, kinds, f, Math.max(0, per - 100 * people), people, used); a.forEach((x) => used.add(x)); out[k] = { fmt: f, acts: a }; left -= cost(out[k]) }
    save(out, `🎈 sorties ${city}`); setOpen(days[0][0]); award(10, '🎈')
  }
  const swap = (k: string, i: number) => { const d = plan[k]; const alt = pickActs(acts.filter((a) => !d.acts.includes(a.id)), kinds, d.fmt, budget, people, new Set())[0]; if (!alt) return; const acts2 = [...d.acts]; acts2[i] = alt; save({ ...plan, [k]: { ...d, acts: acts2 } }, '↻ activité') }
  const setDayFmt = (k: string, f: Fmt) => save({ ...plan, [k]: { fmt: f, acts: pickActs(acts, kinds, f, budget, people, new Set()) } }, 'format')
  return (
    <div className="stagger space-y-3">
      <div className="card space-y-3 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">1 · Où ?</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">{Object.keys(CITIES).map((c) => <button key={c} className="chip shrink-0" aria-pressed={c === city} onClick={() => { patchMe({ city: c }); save({}, `📍 ${c}`, true) }}>📍 {c}</button>)}</div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted">2 · Quand ?</p>
        <div className="flex rounded-full bg-cream p-1">{([['day', '📅 Jour'], ['week', '🗓️ Semaine'], ['month', '📆 Mois']] as [Mode, string][]).map(([m, l]) => <button key={m} className={`flex-1 rounded-full py-2 text-sm font-bold ${mode === m ? 'bg-forest text-white' : 'text-muted'}`} onClick={() => { setMode(m); setOpen(daysFor(m)[0][0]) }}>{l}</button>)}</div>
        <div className="grid grid-cols-2 gap-2">{([['auto', '✨ Automatique', 'soirée en semaine, journée le week-end'], ...FMT.map((f) => [f[0], f[1], f[2]])] as [string, string, string][]).map(([k, l, h]) => <button key={k} className={`rounded-2xl border p-2 text-start ${fmt === k ? 'border-forest bg-leaf/20' : 'border-line bg-surface'} ${k === 'auto' ? 'col-span-2' : ''}`} onClick={() => setFmt(k as Fmt | 'auto')} aria-pressed={fmt === k}><span className="block text-sm font-bold">{l}</span><span className="block text-[11px] text-muted">{h}</span></button>)}</div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted">3 · Avec qui ?</p>
        <div className="flex flex-wrap gap-2">{KINDS.map(([k, l]) => <button key={k} className="chip" aria-pressed={kinds.includes(k)} onClick={() => setKinds(kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k])}>{l}</button>)}</div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted">4 · Combien ?</p>
        <div className="flex items-center gap-3"><input type="range" min={0} max={3000} step={50} value={budget} onChange={(e) => setBudget(+e.target.value)} className="flex-1 accent-[#245B43]" aria-label="Budget sorties" /><b className="w-24 whitespace-nowrap text-end tabular-nums">{money(budget, 'fr')}</b></div>
        <button className="btn btn-primary w-full !min-h-14 text-base" onClick={compose}>🎈 Composer {mode === 'day' ? 'ma journée' : mode === 'week' ? 'ma semaine' : 'mes week-ends'}</button>
        <p className="text-center text-[11px] text-muted">Pour {people} personne(s) · prix indicatifs, à vérifier sur place</p>
      </div>
      {!days.some(([k]) => plan[k]) ? (
        <div className="card space-y-2 p-6 text-center"><p className="float text-5xl">🗺️</p><p className="font-display text-lg font-extrabold">Rien de prévu pour l’instant</p><p className="text-sm text-muted">Réponds aux 4 questions ci-dessus puis touche « Composer » : tu reçois un vrai programme heure par heure à {city}, avec où manger et comment y aller.</p></div>
      ) : (<>
        <div className="card flex items-center justify-between p-4"><span className="font-semibold">💰 Total estimé</span><span className={`font-display text-xl font-extrabold tabular-nums ${total > budget ? 'text-danger' : 'text-forest'}`}>{money(total, 'fr')} <span className="text-xs font-semibold text-muted">/ {money(budget, 'fr')}</span></span></div>
        {days.map(([k, label]) => { const d = plan[k]; if (!d) return null; const pr = program(city, acts, d); const isOpen = open === k; const f = FMT.find((x) => x[0] === d.fmt)!
          const kindsHere = [...new Set(d.acts.flatMap((id) => acts.find((a) => a.id === id)?.k ?? []))] as Kind[]
          return (
          <div key={k} className="card overflow-hidden">
            <button className="flex w-full items-center gap-3 px-4 py-3 text-start" onClick={() => setOpen(isOpen ? null : k)} aria-expanded={isOpen}>
              <span className="min-w-0 flex-1"><span className="block font-display text-[17px] font-extrabold first-letter:uppercase">{label}</span><span className="text-xs text-muted">{f[1]} · {f[2]} · ≈ {money(cost(d), 'fr')}</span></span>
              {!isOpen && <span className="text-xl">{pr.filter((x) => x.id).map((x) => x.e).join('')}</span>}<span className={`text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
            </button>
            {isOpen && <div className="fade-up border-t border-line/70 px-4 pb-4 pt-3">
              <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">{FMT.map(([fk, fl]) => <button key={fk} className={`chip shrink-0 !min-h-8 !text-xs ${d.fmt === fk ? '!bg-forest !text-white' : ''}`} onClick={() => setDayFmt(k, fk)}>{fl}</button>)}</div>
              <ol className="relative space-y-3 border-s-2 border-leaf/50 ps-4">
                {pr.map((x, i) => <li key={i} className="relative"><span className="absolute -start-[1.45rem] top-1 grid h-5 w-5 place-items-center rounded-full bg-surface text-[11px] ring-2 ring-leaf">{x.e}</span>
                  <p className="text-[11px] font-bold text-forest">{x.t}</p><p className="font-semibold leading-tight">{x.n}</p><p className="text-xs text-muted">{x.d} · {x.p ? `≈ ${money(x.p * people, 'fr')}` : 'Gratuit'}</p>
                  {x.id && <button className="mt-1 rounded-full bg-cream px-3 py-1 text-xs font-bold active:scale-95" onClick={() => swap(k, d.acts.indexOf(x.id!))}>↻ Changer cette activité</button>}</li>)}
              </ol>
              <div className="mt-3 space-y-1 rounded-2xl bg-cream p-3 text-xs"><p>🚕 <b>Y aller :</b> {FOOD[city].move}</p>{kindsHere.slice(0, 2).map((kk) => <p key={kk}>💡 <b>Conseil :</b> {TIP[kk]}</p>)}</div>
            </div>}
          </div>) })}
      </>)}
    </div>
  )
}
