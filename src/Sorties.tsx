import { useState } from 'react'
import { useApp } from './lib/store'
import { moneyIn } from './lib/i18n'

// Real places, approximate price per person in MAD (0 = free), duration in hours. Prices are indicative only.
import { WORLD_CITIES, WORLD_COUNTRY_CITIES, WORLD_FOOD, type Act, type Kind } from './data/outings'
import { COUNTRIES, cname, countryOf } from './lib/countries'
const A = (id: string, e: string, n: string, d: string, p: number, h: number, k: string, a?: string, tl?: string): Act => ({ id, e, n, d, p, h, k: k.split(' ') as Kind[], a, tl: tl?.split('|') })
const CITIES0: Record<string, Act[]> = {
  Casablanca: [
    A('hassan2', '🕌', 'Mosquée Hassan II', 'Visite guidée de l’intérieur, face à l’océan', 130, 2, 'culture famille', 'Bd Sidi Mohammed Ben Abdallah', 'Arrivée par l’esplanade|Visite guidée (salle de prière, hammams)|Photos sur le parvis face à la mer'),
    A('corniche', '🌊', 'Corniche d’Aïn Diab', 'Marche au coucher du soleil, glace en route', 0, 2, 'couple famille nature', 'Bd de la Corniche, Aïn Diab', 'Départ au phare d’El Hank|Marche jusqu’à Aïn Diab|Glace et coucher de soleil'),
    A('habous', '🛍️', 'Quartier des Habous', 'Souks, librairies, pâtisseries traditionnelles', 0, 2, 'culture couple', 'Nouvelle médina, Habous', 'Place du Mahkama|Souk des olives et librairies|Cornes de gazelle chez Bennis'),
    A('ligue', '🌳', 'Parc de la Ligue Arabe', 'Grand parc rénové, jeux pour enfants', 0, 2, 'famille nature', 'Bd Moulay Youssef, centre-ville', 'Entrée côté Cathédrale du Sacré-Cœur|Aires de jeux|Pause au kiosque'),
    A('aquarium', '🐠', 'Aquarium du Morocco Mall', 'Aquarium géant et balade au centre', 100, 2, 'famille', 'Morocco Mall, Bd de l’Océan Atlantique', 'Aquarium géant|Fontaine musicale|Balade dans le mall'),
    A('sindibad', '🎢', 'Parc Sindibad', 'Parc d’attractions et zoo', 150, 4, 'famille', 'Route d’Azemmour, Aïn Diab', 'Zoo le matin|Attractions|Goûter au parc'),
    A('slaoui', '🖼️', 'Musée Abderrahman Slaoui', 'Affiches, bijoux et art marocain', 30, 1, 'culture', '12 rue du Parc, Gauthier', 'Collection d’affiches|Bijoux et orfèvrerie|Thé sur le toit'),
    A('villa-arts', '🎨', 'Villa des Arts', 'Expositions d’art contemporain', 0, 1, 'culture couple', '30 bd Brahim Roudani, Maârif', 'Exposition temporaire|Jardin Art déco'),
    A('surf-casa', '🏄', 'Cours de surf à Aïn Diab', 'Cours de 2 h avec planche et combinaison', 250, 2, 'sport', 'Plage d’Aïn Diab (écoles de surf)', 'Échauffement sur le sable|Cours dans les vagues|Douche et jus frais'),
    A('anfa-run', '🏃', 'Footing au Parc d’Anfa', 'Boucle verte, idéale le matin', 0, 1, 'sport nature', 'Anfa Park, Casa-Anfa', 'Boucle de 5 km|Étirements au lac'),
    A('ancienne-medina', '🏘️', 'Ancienne médina et Sqala', 'Remparts, bastion portugais et café du jardin', 0, 2, 'culture famille couple', 'Bd des Almohades, Ancienne médina', 'Bab Marrakech|Ruelles et artisans|Thé au café de la Sqala'),
    A('art-deco', '🏛️', 'Balade Art déco du centre-ville', 'Immeubles des années 1930 autour de Mohammed V', 0, 2, 'culture couple', 'Bd Mohammed V et place des Nations Unies', 'Marché Central|Immeubles Art déco|Place Mohammed V'),
    A('cathedrale', '⛪', 'Ancienne cathédrale du Sacré-Cœur', 'Architecture blanche Art déco, expositions', 0, 1, 'culture', 'Rue d’Alger, centre-ville', 'Façade et vitraux|Exposition du moment'),
    A('marche-central', '🦞', 'Marché Central', 'Poissons, fleurs et grillades sur place', 0, 1, 'culture couple', 'Bd Mohammed V, centre-ville', 'Étals de poissons et fleurs|Choisis ton poisson, grillé sur place'),
    A('twin-center', '🏙️', 'Shopping au Twin Center et Maârif', 'Boutiques et cafés du quartier Maârif', 0, 2, 'couple', 'Bd Zerktouni, Maârif', 'Twin Center|Rues commerçantes du Maârif|Café en terrasse'),
    A('anfa-place', '🛍️', 'Anfa Place et la plage', 'Centre face à la mer, promenade', 0, 2, 'famille couple', 'Bd de la Corniche, Anfa', 'Boutiques|Promenade sur la digue'),
    A('tamaris', '🏖️', 'Plage de Tamaris', 'Grande plage au sud de Casablanca', 0, 4, 'famille nature sport', 'Tamaris, route de Dar Bouazza', 'Arrivée le matin|Baignade et beach-volley|Déjeuner poisson au bord de mer'),
    A('dar-bouazza', '🌅', 'Dar Bouazza et ses criques', 'Criques et cafés de surfeurs', 0, 3, 'couple nature', 'Dar Bouazza (25 min du centre)', 'Balade sur les rochers|Café face aux vagues|Coucher de soleil'),
    A('bouskoura', '🌲', 'Forêt de Bouskoura', 'Vélo, randonnée et pique-nique', 0, 3, 'nature sport famille', 'Forêt de Bouskoura, sortie autoroute', 'Parcours VTT ou marche|Pique-nique|Aire de jeux'),
    A('mohammedia', '⛵', 'Journée à Mohammedia', 'Plage, port de plaisance et poisson', 50, 6, 'famille couple nature', 'Mohammedia (train 20 min, ~25 MAD)', 'Train depuis Casa-Port|Plage des Sablettes|Déjeuner au port'),
    A('technopark-escalade', '🧗', 'Escalade en salle', 'Murs d’escalade pour débutants', 120, 2, 'sport', 'Salles d’escalade de Casablanca (Sidi Maârouf)', 'Initiation et matériel|Voies débutant|Défi entre amis'),
    A('karting', '🏎️', 'Karting', 'Sessions de karting en piste', 200, 1, 'sport famille', 'Circuits de karting de Casablanca (Bouskoura)', 'Briefing sécurité|2 sessions chronométrées|Podium'),
    A('cinema', '🎬', 'Cinéma Mégarama', 'Derniers films, grand écran', 70, 2, 'couple famille', 'Mégarama, Bd de la Corniche', 'Popcorn|Séance|Balade sur la Corniche après'),
    A('hammam-casa', '🧖', 'Hammam et spa', 'Gommage traditionnel et détente', 150, 2, 'couple', 'Hammams du Maârif et de Gauthier', 'Bain de vapeur|Gommage au savon noir|Thé à la menthe'),
    A('cuisine-casa', '👩‍🍳', 'Atelier de cuisine marocaine', 'Prépare un tajine avec une cheffe', 400, 3, 'couple culture famille', 'Ateliers à Gauthier et Maârif', 'Courses au marché|Préparation du tajine|Repas partagé'),
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
  Agadir: [
    A('oufella', '🏰', 'Kasbah d’Agadir Oufella', 'Vue sur toute la baie, montée en téléphérique', 100, 2, 'culture famille couple'),
    A('souk-had', '🧺', 'Souk El Had', 'Grand marché aux épices, fruits et artisanat', 0, 2, 'culture famille'),
    A('marina-agadir', '⛵', 'Marina et promenade', 'Balade face aux bateaux, glaces', 0, 2, 'couple famille'),
    A('plage-agadir', '🏖️', 'Plage d’Agadir', 'Grande plage urbaine et corniche', 0, 3, 'famille nature sport'),
    A('crocoparc', '🐊', 'Crocoparc', 'Parc botanique et crocodiles du Nil', 80, 2, 'famille nature'),
    A('paradise-valley', '🏞️', 'Vallée du Paradis', 'Bassins naturels dans l’Atlas (1 h de route)', 0, 6, 'nature sport famille'),
    A('taghazout', '🏄', 'Surf à Taghazout', 'Cours de 2 h, planche et combinaison', 300, 3, 'sport couple'),
  ],
  Chefchaouen: [
    A('medina-bleue', '💙', 'Médina bleue', 'Ruelles peintes en bleu, artisans', 0, 2, 'culture couple famille'),
    A('kasbah-chaouen', '🏰', 'Place Outa el Hammam et Kasbah', 'Jardin et musée dans la kasbah', 60, 1, 'culture'),
    A('ras-el-ma', '💧', 'Source Ras el Ma', 'Cascade et lavoirs à l’entrée de la médina', 0, 1, 'nature famille'),
    A('mosquee-espagnole', '🌄', 'Mosquée espagnole au coucher du soleil', 'Petite montée, vue sur la ville bleue', 0, 2, 'couple nature sport'),
    A('akchour', '🏞️', 'Cascades d’Akchour', 'Randonnée et pont de Dieu (45 min de route)', 0, 6, 'nature sport famille'),
  ],
  Paris: [
    A('louvre', '🖼️', 'Musée du Louvre', 'La Joconde, les antiques et la cour Napoléon (réserver)', 140, 3, 'culture couple famille'),
    A('eiffel', '🗼', 'Tour Eiffel', 'Montée au 2ᵉ étage ou au sommet (réserver)', 180, 2, 'famille couple'),
    A('orsay', '🎨', 'Musée d’Orsay', 'Impressionnistes dans une ancienne gare', 100, 2, 'culture couple'),
    A('montmartre', '⛪', 'Montmartre et le Sacré-Cœur', 'Place du Tertre et vue sur Paris', 0, 2, 'culture couple famille'),
    A('luxembourg', '🌳', 'Jardin du Luxembourg', 'Bassin, voiliers et chaises vertes', 0, 2, 'nature famille couple'),
    A('canal-martin', '🚶', 'Canal Saint-Martin', 'Écluses et passerelles, pique-nique', 0, 2, 'couple nature'),
    A('pompidou', '🏛️', 'Centre Pompidou', 'Art moderne et vue depuis le toit', 95, 2, 'culture'),
    A('buttes-chaumont', '🌿', 'Parc des Buttes-Chaumont', 'Falaises, lac et belvédère', 0, 2, 'nature sport famille'),
    A('seine-bateau', '⛴️', 'Croisière sur la Seine', 'Une heure entre les ponts et les monuments', 105, 1, 'couple famille'),
    A('cite-sciences', '🔬', 'Cité des sciences', 'Expositions interactives pour les enfants', 80, 3, 'famille culture'),
    A('jardin-plantes', '🦕', 'Jardin des Plantes et Grande Galerie', 'Squelettes, évolution et serres', 80, 2, 'famille nature culture'),
    A('versailles', '👑', 'Château de Versailles', 'Galerie des Glaces et jardins (RER C)', 130, 6, 'culture famille couple'),
  ],
  Lyon: [
    A('fourviere', '⛪', 'Basilique de Fourvière', 'Vue sur toute la ville, montée en funiculaire', 0, 2, 'culture couple famille'),
    A('vieux-lyon', '🏘️', 'Vieux Lyon et ses traboules', 'Passages Renaissance entre les rues', 0, 2, 'culture couple'),
    A('tete-or', '🦒', 'Parc de la Tête d’Or', 'Lac, zoo gratuit et roseraie', 0, 3, 'famille nature sport'),
    A('confluences', '🌍', 'Musée des Confluences', 'Sciences et sociétés, architecture futuriste', 56, 2, 'culture famille'),
    A('beaux-arts-lyon', '🖼️', 'Musée des Beaux-Arts', 'Collections dans une ancienne abbaye', 50, 2, 'culture'),
    A('croix-rousse', '🧵', 'Pentes de la Croix-Rousse', 'Quartier des canuts et fresques', 0, 2, 'culture couple sport'),
    A('berges-rhone', '🚴', 'Berges du Rhône à vélo', 'Piste cyclable le long du fleuve', 30, 2, 'sport nature couple'),
  ],
  Marseille: [
    A('bonne-mere', '⛪', 'Notre-Dame de la Garde', 'La « Bonne Mère » et la vue sur la mer', 0, 2, 'culture famille couple'),
    A('vieux-port', '⚓', 'Vieux-Port', 'Marché aux poissons du matin et ombrière', 0, 1, 'culture famille couple'),
    A('mucem', '🏛️', 'MuCEM et fort Saint-Jean', 'Civilisations de la Méditerranée', 70, 2, 'culture couple'),
    A('panier', '🏘️', 'Quartier du Panier', 'Ruelles colorées et Vieille Charité', 0, 2, 'culture couple'),
    A('calanques', '🥾', 'Calanque de Sormiou', 'Randonnée et baignade dans les calanques', 0, 4, 'nature sport couple'),
    A('frioul', '⛴️', 'Îles du Frioul', 'Navette depuis le Vieux-Port, criques', 70, 4, 'nature famille couple'),
    A('catalans', '🏖️', 'Plage des Catalans et corniche Kennedy', 'Baignade et balade face aux îles', 0, 3, 'famille nature'),
  ],
}
export const COUNTRY_CITIES: Record<string, string[]> = { ...WORLD_COUNTRY_CITIES, MA: ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Chefchaouen'], FR: ['Paris', 'Lyon', 'Marseille'] }
type Mode = 'day' | 'eve' | 'we' | 'week'
// Everyday leisure found in every city (indicative prices, MAD base): added where the city list has no such activity.
const FUN: [string, string, string, string, number, number, string][] = [
  ['cinema', '🎬', 'Cinéma', 'Le film du moment en salle (multiplexe du centre)', 60, 2, 'loisirs couple famille'], ['bowling', '🎳', 'Bowling', 'Deux parties entre amis ou en famille', 70, 2, 'loisirs famille couple'],
  ['escape', '🔐', 'Escape game', '60 minutes pour sortir, en équipe', 160, 1, 'loisirs famille couple'], ['karting', '🏎️', 'Karting', 'Sessions de 10 minutes', 150, 1, 'loisirs sport'],
  ['laser', '🔫', 'Laser game', 'Parties de 20 minutes', 90, 1, 'loisirs sport famille'], ['piscine', '🏊', 'Piscine', 'Baignade et toboggans', 40, 2, 'loisirs sport famille'],
  ['spa', '🧖', 'Hammam ou spa', 'Gommage et détente', 200, 2, 'loisirs couple'], ['patinoire', '⛸️', 'Patinoire', 'Patins compris', 60, 2, 'loisirs famille couple'],
]
export const CITIES: Record<string, Act[]> = Object.fromEntries(Object.entries({ ...CITIES0, ...WORLD_CITIES }).map(([c, acts]) => [c, [...acts, ...FUN.filter(([, e]) => !acts.some((a) => a.e === e)).map(([id, e, n, d, p, h, k]) => ({ id: `${id}-${c}`, e, n, d, p, h, k: k.split(' ') as Kind[] }))]]))
type Fmt = 'full' | 'half' | 'eve' | 'night'
const FMT: [Fmt, string, string, number][] = [['full', '☀️ Journée entière', '10h → 21h', 3], ['half', '🌤️ Demi-journée', '14h → 19h', 2], ['eve', '🌇 Fin de journée', '17h → 20h', 1], ['night', '🌙 Soirée', '19h → 23h', 1]]
// Where to eat and how to move, per city (real, well-known spots; prices indicative per person).
const FOOD0: Record<string, { lunch: [string, number][]; cafe: [string, number][]; dinner: [string, number][]; move: string }> = {
  Casablanca: { lunch: [['Grillades du Marché Central', 80], ['Snack au quartier Maârif', 60], ['Poissons au port (Le Port de Pêche)', 120]], cafe: [['Café de la Corniche face à l’océan', 30], ['Pâtisserie Bennis aux Habous', 25]], dinner: [['Rick’s Café (dîner)', 350], ['Restaurant à La Corniche', 200], ['Tajine en médina', 90]], move: 'Tramway T1/T2 (8 MAD) ou petit taxi rouge (15–30 MAD).' },
  Rabat: { lunch: [['Poissons à la marina du Bouregreg', 120], ['Snack de l’avenue Mohammed V', 60]], cafe: [['Café Maure des Oudayas', 25], ['Salon de thé de l’Agdal', 30]], dinner: [['Dîner sur la marina du Bouregreg', 200], ['Tajine en médina', 90]], move: 'Tramway Rabat–Salé (6 MAD) ou petit taxi bleu (10–25 MAD).' },
  Marrakech: { lunch: [['Méchoui de la rue Mechouia', 90], ['Terrasse d’un riad en médina', 120]], cafe: [['Café des Épices (place Rahba Kedima)', 35], ['Terrasse sur Jemaa el-Fna', 30]], dinner: [['Stands de Jemaa el-Fna', 70], ['Tanjia en médina', 100], ['Dîner dans un riad', 300]], move: 'À pied en médina, petit taxi beige (20–40 MAD) en dehors.' },
  'Fès': { lunch: [['Bissara et brochettes à Bab Boujloud', 50], ['Restaurant traditionnel de la médina', 120]], cafe: [['Terrasse de Bab Boujloud', 20], ['Café Clock', 40]], dinner: [['Pastilla en médina', 150], ['Restaurant en ville nouvelle', 120]], move: 'Petit taxi rouge (10–25 MAD), puis à pied en médina (prendre un guide officiel).' },
  Tanger: { lunch: [['Poissons au port', 100], ['Snack du Grand Socco', 50]], cafe: [['Café Hafa', 30], ['Gran Café de Paris', 30]], dinner: [['Restaurant de la Kasbah', 180], ['Poissons sur la corniche', 150]], move: 'Petit taxi bleu (10–30 MAD). Cap Spartel et Achakar : grand taxi ou voiture.' },
  Agadir: { lunch: [['Poissons grillés au port de pêche', 90], ['Snack de la corniche', 60]], cafe: [['Café de la marina', 30], ['Salon de thé du centre', 25]], dinner: [['Tajine sur la corniche', 120], ['Poissons à la marina', 180]], move: 'Petit taxi orange (10–30 MAD) ; bus Alsa en ville.' },
  Chefchaouen: { lunch: [['Tajine sur la place Outa el Hammam', 80], ['Bissara et pain chaud en médina', 30]], cafe: [['Terrasse avec vue sur la ville bleue', 25], ['Café près de Ras el Ma', 20]], dinner: [['Restaurant en terrasse de la médina', 110], ['Fromage de chèvre et tajine local', 90]], move: 'La médina se fait à pied ; petit taxi pour Akchour (ou grand taxi partagé).' },
  Paris: { lunch: [['Bistrot de quartier, formule du midi', 130], ['Marché des Enfants Rouges', 90]], cafe: [['Café en terrasse', 30], ['Boulangerie, viennoiseries', 20]], dinner: [['Brasserie parisienne', 220], ['Crêperie', 120]], move: 'Métro et RER (ticket ~2,50 €) ; Vélib’ pour les trajets courts.' },
  Lyon: { lunch: [['Bouchon lyonnais', 150], ['Halles Paul Bocuse', 120]], cafe: [['Café sur les quais', 25], ['Pâtisserie, tarte aux pralines', 30]], dinner: [['Bouchon du Vieux Lyon', 180], ['Pizzeria de la presqu’île', 110]], move: 'Métro, tram et funiculaire (ticket ~2 €) ; Vélo’v en libre-service.' },
  Marseille: { lunch: [['Panisse et poissons au Vieux-Port', 110], ['Snack du Panier', 70]], cafe: [['Café du Vieux-Port', 25], ['Navettes (biscuits) du four des Navettes', 20]], dinner: [['Bouillabaisse ou soupe de poissons', 250], ['Pizza au feu de bois', 110]], move: 'Métro, tram et navettes maritimes (ticket ~2 €).' },
}
const FOOD = { ...FOOD0, ...WORLD_FOOD }
const TIP: Record<Kind, string> = { loisirs: 'Réserve en ligne : souvent moins cher et sans file d’attente.', famille: 'Prévois de l’eau, des en-cas et une casquette pour les enfants.', couple: 'Vise l’heure du coucher du soleil pour les vues et les photos.', sport: 'Pars tôt, prends de l’eau et des chaussures adaptées.', culture: 'Évite le vendredi midi et prévois de la monnaie pour l’entrée.', nature: 'Vérifie la météo et pars avec une petite veste.' }
type Step = { t: string; e: string; n: string; d: string; p: number; id?: string }
type Day = { fmt: Fmt; acts: string[] }
const fmtD = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr', o).format(d)
function daysFor(mode: Mode): [string, string, Fmt][] {
  const now = new Date(); const we = (d: Date) => d.getDay() === 0 || d.getDay() === 6
  if (mode === 'day') return [['d0', 'Aujourd’hui', 'full']]
  if (mode === 'eve') return [['e0', 'Ce soir', 'night']]
  if (mode === 'we') { const out: [string, string, Fmt][] = []; for (let i = 0; i < 7 && out.length < 2; i++) { const d = new Date(now); d.setDate(now.getDate() + i); if (we(d)) out.push([`s${i}`, fmtD(d, { weekday: 'long', day: 'numeric' }), 'full']) } return out }
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() + i); return [`w${i}`, fmtD(d, { weekday: 'long', day: 'numeric' }), we(d) ? 'full' : 'night'] })
}
const maxH: Record<Fmt, number> = { full: 6, half: 4, eve: 2, night: 2 }
const pick = <T,>(x: T[]) => x[Math.floor(Math.random() * x.length)]
// Approximate coordinates (Greater Casablanca) so a day follows a sensible route.
const GEO: Record<string, [number, number]> = { hassan2: [33.608, -7.632], corniche: [33.594, -7.668], habous: [33.578, -7.603], ligue: [33.588, -7.624], aquarium: [33.576, -7.706], sindibad: [33.585, -7.690], slaoui: [33.591, -7.627], 'villa-arts': [33.585, -7.636], 'surf-casa': [33.590, -7.680], 'anfa-run': [33.565, -7.656], 'ancienne-medina': [33.602, -7.618], 'art-deco': [33.595, -7.616], cathedrale: [33.590, -7.622], 'marche-central': [33.597, -7.613], 'twin-center': [33.584, -7.633], 'anfa-place': [33.598, -7.651], tamaris: [33.528, -7.818], 'dar-bouazza': [33.520, -7.830], bouskoura: [33.465, -7.640], mohammedia: [33.687, -7.383], 'technopark-escalade': [33.510, -7.650], karting: [33.470, -7.630], cinema: [33.595, -7.665], 'hammam-casa': [33.586, -7.632], 'cuisine-casa': [33.588, -7.630] }
export type Move = 'walk' | 'taxi' | 'car'
export const MOVES: [Move, string, number, number][] = [['walk', '🚶 À pied', 2.5, 5], ['taxi', '🚕 Taxi / tram', 12, 20], ['car', '🚗 Voiture', 60, 35]] // max hop km, speed km/h
export const km = (a: string, b: string) => { const p = GEO[a], q = GEO[b]; if (!p || !q) return 0; const dx = (p[1] - q[1]) * 92.5, dy = (p[0] - q[0]) * 111; return Math.hypot(dx, dy) * 1.3 }
function pickActs(acts: Act[], kinds: Kind[], fmt: Fmt, left: number, people: number, avoid: Set<string>, mv: Move = 'taxi', from?: string) {
  const hop = MOVES.find((m) => m[0] === mv)![2]
  const ok = acts.filter((a) => (!kinds.length || a.k.some((k) => kinds.includes(k))) && a.h <= maxH[fmt])
  const n = FMT.find((f) => f[0] === fmt)![3]; const out: string[] = []
  for (let i = 0; i < n; i++) {
    const prev = out[out.length - 1] ?? from
    const c = ok.filter((a) => !out.includes(a.id) && a.p * people <= left && (!prev || km(prev, a.id) <= hop))
    const near = (x: Act[]) => prev ? pick([...x].sort((u, v) => km(prev, u.id) - km(prev, v.id)).slice(0, 3)) : pick(x)
    const a = near(c.filter((x) => !avoid.has(x.id))) ?? near(c) ?? pick(acts.filter((x) => x.p === 0 && !out.includes(x.id)))
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
const KTONE: Record<Kind, [string]> = { loisirs: ['linear-gradient(135deg,#5b4bb0,#352a75)'], famille: ['linear-gradient(135deg,#d9822b,#b85c1e)'], couple: ['linear-gradient(135deg,#b4475c,#7d2c47)'], sport: ['linear-gradient(135deg,#2f6fa8,#1d4a7a)'], culture: ['linear-gradient(135deg,#a6532f,#6e3420)'], nature: ['linear-gradient(135deg,#2f7a52,#1a4a35)'] }
const KINDS: [Kind, string][] = [['loisirs', '🎬 Loisirs'], ['famille', '👨‍👩‍👧 Famille'], ['couple', '💑 Couple'], ['sport', '⚽ Sport'], ['culture', '🏛️ Culture'], ['nature', '🌿 Nature']]

/** Outings space: compose a day, a week or the month's weekends of real activities, each with a ready-to-follow program. */
export function SortiesTab() {
  const { me, house, upHouse, patchMe, award } = useApp()
  const ccOf = (c: string) => Object.keys(COUNTRY_CITIES).find((k) => COUNTRY_CITIES[k].includes(c))
  const [cc, setCc] = useState(() => ccOf(me!.city) ?? (COUNTRY_CITIES[me!.country] ? me!.country : 'MA')); const [pickC, setPickC] = useState(false)
  const list = COUNTRY_CITIES[cc] ?? COUNTRY_CITIES.MA; const city = list.includes(me!.city) ? me!.city : list[0]; const ovr = (house as unknown as { outPrice?: Record<string, number> }).outPrice ?? {}; const acts = CITIES[city].map((a) => (ovr[a.id] !== undefined ? { ...a, p: ovr[a.id], p0: a.p } : { ...a, p0: a.p })); const people = me!.size
  const M$ = (n: number) => moneyIn(n, cc, 'fr'); const CR = countryOf(cc).rate
  const [editP, setEditP] = useState<string | null>(null)
  const setPrice = (id: string, v: number | undefined) => upHouse((h) => { const x = h as unknown as { outPrice?: Record<string, number> }; const o = { ...(x.outPrice ?? {}) }; if (v === undefined) delete o[id]; else o[id] = v; x.outPrice = o })
  const [kinds, setKinds] = useState<Kind[]>([]); const [budget, setBudget] = useState(400); const [mode, setMode] = useState<Mode>('day')
  const [mv, setMv] = useState<Move>('taxi'); const fmt = 'auto' as Fmt | 'auto'; const [open, setOpen] = useState<string | null>('d0')
  type O = { outings2?: Partial<Record<Mode, Record<string, Day>>> }
  const plan = (house as unknown as O).outings2?.[mode] ?? {}
  const save = (w: Record<string, Day>, log: string, all = false) => upHouse((h) => { const x = h as unknown as O; x.outings2 = all ? {} : { ...(x.outings2 ?? {}), [mode]: w } }, log)
  const days = daysFor(mode)
  // Cost of a day = activities + meals (per person) + trips between activities (per taxi of 4, or fuel), all live.
  const parts = (d: Day) => { const pr = program(city, acts, d); const a = pr.filter((x) => x.id).reduce((s, x) => s + x.p * people, 0); const m = pr.filter((x) => !x.id).reduce((s, x) => s + x.p * people, 0)
    const hops = d.acts.slice(1).map((id, i) => km(d.acts[i], id)); const tr = hops.reduce((s, k) => s + (mv === 'walk' ? 0 : mv === 'car' ? k * 1.2 : Math.ceil(people / 4) * (12 + 4 * k)), 0)
    return { a, m, tr: Math.round(tr), all: a + m + Math.round(tr) } }
  const cost = (d: Day) => parts(d).all
  const sum = days.reduce((s, [k]) => { if (!plan[k]) return s; const q = parts(plan[k]); return { a: s.a + q.a, m: s.m + q.m, tr: s.tr + q.tr } }, { a: 0, m: 0, tr: 0 })
  const total = sum.a + sum.m + sum.tr
  const compose = () => {
    const out: Record<string, Day> = {}; const used = new Set<string>(); let left = budget
    for (const [k, , def] of days) { const f = fmt === 'auto' ? def : fmt; const per = left / Math.max(1, days.length - Object.keys(out).length); const meals = parts({ fmt: f, acts: [] }).m; const a = pickActs(acts, kinds, f, Math.max(0, per - meals - 30), people, used, mv); a.forEach((x) => used.add(x)); out[k] = { fmt: f, acts: a }; left -= cost(out[k]) }
    save(out, `🎈 sorties ${city}`); setOpen(days[0][0]); award(10, '🎈')
  }
  const swap = (k: string, i: number) => { const d = plan[k]; const alt = pickActs(acts.filter((a) => !d.acts.includes(a.id)), kinds, d.fmt, budget, people, new Set(), mv, d.acts[i - 1] ?? d.acts[i + 1])[0]; if (!alt) return; const acts2 = [...d.acts]; acts2[i] = alt; save({ ...plan, [k]: { ...d, acts: acts2 } }, '↻ activité') }
  const setDayFmt = (k: string, f: Fmt) => save({ ...plan, [k]: { fmt: f, acts: pickActs(acts, kinds, f, budget, people, new Set(), mv) } }, 'format')
  const story = (d: Day) => KTONE[(acts.find((a) => a.id === d.acts[0])?.k[0]) ?? 'culture']
  // Bon plan: a free or cheaper activity of the same kind that could replace the priciest one of the day.
  const deal = (d: Day) => { const pr = d.acts.map((id) => acts.find((a) => a.id === id)!).filter(Boolean); const top = [...pr].sort((a, b) => b.p - a.p)[0]; if (!top || top.p === 0) return null
    const alt = acts.filter((a) => !d.acts.includes(a.id) && a.p < top.p * 0.5 && a.h <= maxH[d.fmt] && a.k.some((k) => top.k.includes(k))).sort((a, b) => a.p - b.p)[0]
    return alt ? { top, alt, save: (top.p - alt.p) * people } : null }
  const takeDeal = (k: string, d: Day, x: { top: Act; alt: Act }) => save({ ...plan, [k]: { ...d, acts: d.acts.map((id) => (id === x.top.id ? x.alt.id : id)) } }, '💡 bon plan')
  const ctryName = { MA: 'Maroc', FR: 'France' }[me!.country]
  return (
    <div className="stagger space-y-3">
      <div className="card space-y-3 p-4">
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
          <button className={`flex shrink-0 items-center gap-1 rounded-2xl px-3 py-2 text-sm font-bold ${pickC ? 'bg-ink text-white' : 'bg-surface shadow-soft'}`} onClick={() => setPickC(!pickC)} aria-expanded={pickC} aria-label="Pays"><span className="text-lg leading-none">{countryOf(cc).f}</span> ▾</button>
          {list.map((c) => <button key={c} className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-bold transition active:scale-95 ${c === city ? 'bg-forest text-white shadow-lift' : 'bg-cream text-ink'}`} onClick={() => { patchMe({ city: c }); save({}, `📍 ${c}`, true) }}>{c}</button>)}</div>
        {pickC && <div className="fade-up -mx-1 grid grid-cols-5 gap-1.5 rounded-2xl bg-cream/70 p-2">{COUNTRIES.filter((c) => COUNTRY_CITIES[c.id]).map((c) => <button key={c.id} className={`flex flex-col items-center rounded-xl py-1.5 text-[10px] font-bold ${c.id === cc ? 'bg-forest text-white' : 'bg-surface'}`} onClick={() => { setCc(c.id); setPickC(false); patchMe({ city: COUNTRY_CITIES[c.id][0] }); save({}, `${c.f} ${COUNTRY_CITIES[c.id][0]}`, true) }}><span className="text-xl leading-none">{c.f}</span><span className="w-full truncate px-0.5 text-center">{cname(c, 'fr')}</span></button>)}</div>}
        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Quand ?</p>
        <div className="grid grid-cols-4 gap-2">{([['day', '☀️', 'Journée', 'linear-gradient(140deg,#ffcf8a,#ee9b45)'], ['eve', '🌙', 'Soirée', 'linear-gradient(140deg,#8b7be0,#3d2f8f)'], ['we', '🏖️', 'Week-end', 'linear-gradient(140deg,#8fd3ff,#3d8fd6)'], ['week', '🗓️', '7 jours', 'linear-gradient(140deg,#7fc79a,#245B43)']] as [Mode, string, string, string][]).map(([m, e, l, g]) => <button key={m} className={`crit relative flex flex-col items-center gap-1 overflow-hidden rounded-[18px] py-2.5 text-[12px] font-bold transition-all duration-300 active:scale-95 ${mode === m ? 'text-white shadow-lift' : 'bg-cream/80 text-ink'}`} style={mode === m ? { background: g } : undefined} onClick={() => { setMode(m); setOpen(daysFor(m)[0][0]) }} aria-pressed={mode === m}><span className={`text-[22px] leading-none ${mode === m ? 'pop' : ''}`}>{e}</span>{l}</button>)}</div>
        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Envie de… <span className="normal-case tracking-normal text-muted/80">(plusieurs choix possibles)</span></p>
        <div className="grid grid-cols-3 gap-2">{KINDS.map(([k, l]) => { const on = kinds.includes(k); const [e, ...w] = l.split(' '); return <button key={k} className={`crit flex items-center gap-2 rounded-[16px] p-2 text-start text-[12.5px] font-bold transition-all duration-300 active:scale-95 ${on ? 'text-white shadow-lift' : 'bg-cream/80 text-ink'}`} style={on ? { background: KTONE[k][0] } : undefined} onClick={() => setKinds(on ? kinds.filter((x) => x !== k) : [...kinds, k])} aria-pressed={on}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-lg ${on ? 'pop bg-white/20' : 'bg-surface'}`}>{e}</span><span className="truncate">{w.join(' ')}</span></button> })}</div>
        <button className="btn btn-primary w-full !min-h-14 text-base" onClick={compose}>✨ {days.some(([k]) => plan[k]) ? 'Proposer autre chose' : mode === 'day' ? 'Ma journée idéale' : mode === 'eve' ? 'Ma soirée' : mode === 'we' ? 'Mon week-end' : 'Mes 7 jours'}</button>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-1 text-xs font-semibold text-muted"><span>Transport et budget · {MOVES.find(([m]) => m === mv)?.[1]} · {M$(budget)}</span><span className="transition-transform group-open:rotate-90">›</span></summary>
          <div className="mt-3 space-y-3 rounded-2xl bg-cream/70 p-3">
        <div className="flex gap-2">{MOVES.map(([m, l]) => <button key={m} className="chip flex-1 justify-center" aria-pressed={mv === m} onClick={() => setMv(m)}>{l}</button>)}</div>
        <div className="flex items-center gap-3"><span className="text-xs font-bold text-muted">Budget</span><input type="range" min={0} max={3000} step={50} value={budget} onChange={(e) => setBudget(+e.target.value)} className="flex-1 accent-[#245B43]" aria-label="Budget sorties" /><b className="w-20 whitespace-nowrap text-end tabular-nums">{M$(budget)}</b></div>
          </div>
        </details>
      </div>
      {!days.some(([k]) => plan[k]) ? (
        <div className="card overflow-hidden"><div className="relative grid h-28 place-items-center bg-gradient-to-br from-forest to-[#1a4a35] text-5xl"><div className="zellige absolute inset-0 opacity-20" aria-hidden /><span className="float relative">🗺️</span></div><div className="space-y-1 p-5 text-center"><p className="font-display text-lg font-extrabold">Une idée de sortie à {city} ?</p><p className="text-sm text-muted">Un seul bouton : vous recevez un programme heure par heure, où manger, comment y aller et le bon plan pour payer moins.</p></div></div>
      ) : (<>
        <div className="card flex items-center gap-4 p-4">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${total > budget ? 'rgb(var(--danger))' : 'rgb(var(--forest))'} ${Math.min(100, (total / Math.max(1, budget)) * 100)}%, rgb(var(--cream)) 0)` }}><span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-[11px] font-extrabold tabular-nums">{Math.round((total / Math.max(1, budget)) * 100)}%</span></div>
          <div className="min-w-0 flex-1"><p className="text-xs text-muted">Total estimé · {people} pers.</p><p className={`font-display text-2xl font-extrabold tabular-nums ${total > budget ? 'text-danger' : 'text-forest'}`}>{M$(total)}</p><p className="text-[11px] text-muted">🎟️ {M$(sum.a)} · 🍽️ {M$(sum.m)} · 🚕 {M$(sum.tr)}</p></div>
        </div>
        {days.map(([k, label]) => { const d = plan[k]; if (!d) return null; const pr = program(city, acts, d); const isOpen = open === k; const f = FMT.find((x) => x[0] === d.fmt)!; const tone = story(d); const dl = deal(d)
          const kindsHere = [...new Set(d.acts.flatMap((id) => acts.find((a) => a.id === id)?.k ?? []))] as Kind[]
          return (
          <div key={k} className="card overflow-hidden">
            <button className="relative block w-full overflow-hidden text-start text-white" style={{ background: tone[0] }} onClick={() => setOpen(isOpen ? null : k)} aria-expanded={isOpen}>
              <div className="zellige absolute inset-0 opacity-30" aria-hidden />
              <div className="relative flex items-end gap-3 p-4">
                <div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{f[1].split(' ').slice(1).join(' ')} · {f[2]}</p><p className="font-serif text-2xl font-semibold leading-tight first-letter:uppercase">{label}</p>
                  <p className="mt-1 truncate text-sm opacity-90">{pr.filter((x) => x.id).map((x) => x.n).join(' · ')}</p></div>
                <div className="shrink-0 text-end"><p className="text-3xl leading-none tracking-tighter">{pr.filter((x) => x.id).map((x) => x.e).join('')}</p><p className="mt-2 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold tabular-nums backdrop-blur">≈ {M$(cost(d))}</p></div>
              </div>
            </button>
            {dl && <div className="flex items-center gap-3 border-b border-line/70 bg-apricot/15 px-4 py-2.5"><span className="text-xl">💡</span><p className="min-w-0 flex-1 text-xs"><b>Bon plan :</b> {dl.alt.e} {dl.alt.n} au lieu de {dl.top.n.toLowerCase()}, <b className="text-forest">−{M$(dl.save)}</b></p><button className="shrink-0 rounded-full bg-forest px-3 py-1.5 text-xs font-bold text-white active:scale-95" onClick={() => takeDeal(k, d, dl)}>Prendre</button></div>}
            {isOpen && <div className="fade-up px-4 pb-4 pt-3">
              {d.acts.length > 1 && <a className="mb-3 flex items-center gap-2 rounded-2xl bg-forest/10 px-3 py-2 text-xs font-bold text-forest active:scale-[.98]" target="_blank" rel="noreferrer" href={'https://www.google.com/maps/dir/' + d.acts.map((id) => acts.find((a) => a.id === id)).filter(Boolean).map((a) => encodeURIComponent(`${a!.n}, ${a!.a ?? ''} ${city}`)).join('/')}>🗺️ <span className="flex-1">Voir tout le parcours sur la carte</span><span>{d.acts.length} étapes ›</span></a>}
              <ol className="space-y-2">
                {pr.map((x, i) => { const ac = x.id ? acts.find((q) => q.id === x.id) : undefined; const ai = x.id ? d.acts.indexOf(x.id) : -1; const dist = ai > 0 ? km(d.acts[ai - 1], x.id!) : 0; const M = MOVES.find((m) => m[0] === mv)!
                  return <li key={i}>
                  {dist > 0 && <p className="mb-1 ms-14 inline-block rounded-full bg-leaf/25 px-2 py-0.5 text-[10px] font-bold text-forest">{M[1].split(' ')[0]} {Math.max(5, Math.round((dist / M[3]) * 60))} min · {dist.toFixed(1).replace('.', ',')} km</p>}
                  <div className={`flex gap-3 rounded-2xl p-2.5 ${x.id ? 'bg-cream/70' : ''}`}>
                    <div className="flex w-11 shrink-0 flex-col items-center"><span className="text-[11px] font-extrabold tabular-nums text-forest">{x.t}</span><span className={`mt-1 grid h-9 w-9 place-items-center rounded-xl text-xl ${x.id ? 'bg-surface shadow-soft' : ''}`}>{x.e}</span></div>
                    <div className="min-w-0 flex-1"><p className="font-semibold leading-tight">{x.n}</p><p className="text-xs text-muted">{x.d}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">{x.id ? <button className={`rounded-full px-2 py-0.5 font-bold active:scale-95 ${x.p ? 'bg-surface' : 'bg-leaf/30 text-forest'}`} onClick={() => setEditP(editP === x.id ? null : x.id!)} aria-expanded={editP === x.id}>{x.p ? `≈ ${M$(x.p * people)}` : 'Gratuit'} ✎</button> : <span className="rounded-full bg-surface px-2 py-0.5 font-bold">≈ {M$(x.p * people)}</span>}
                        {ac?.a && <a className="rounded-full bg-surface px-2 py-0.5 font-bold text-forest" href={`https://www.google.com/maps/search/${encodeURIComponent(ac.n + ' ' + ac.a + ' ' + city)}`} target="_blank" rel="noreferrer">📍 Itinéraire</a>}
                        {x.id && <button className="rounded-full bg-surface px-2 py-0.5 font-bold active:scale-95" onClick={() => swap(k, ai)}>↻ Autre idée</button>}</div>
                      {ac?.a && <p className="mt-1 flex items-start gap-1 text-[11px] font-semibold text-ink/80"><span aria-hidden>📍</span><span>{ac.a}, {city}</span></p>}
                      {ac?.tl && <p className="mt-1 text-[11px] text-ink/70">{ac.tl.join(' → ')}</p>}
                      {ac && editP === ac.id && (() => { const avg = (ac as Act & { p0: number }).p0; const mx = Math.max(50, avg * 3) * CR; return <div className="fade-up mt-2 rounded-2xl bg-surface p-2.5 shadow-soft">
                        <div className="flex items-baseline justify-between text-[11px]"><span className="font-bold">Mon prix par personne</span><b className="font-display text-base tabular-nums text-forest">{M$(ac.p)}</b></div>
                        <input type="range" min={0} max={Math.round(mx)} step={Math.max(1, Math.round(mx / 60))} value={Math.round(ac.p * CR)} onChange={(e) => setPrice(ac.id, +e.target.value / CR)} className="mt-1 w-full accent-[#245B43]" aria-label="Prix par personne" />
                        <div className="flex items-center justify-between text-[10.5px] text-muted"><span>Gratuit</span><span className="rounded-full bg-cream px-2 py-0.5 font-bold text-ink">Moyenne ≈ {avg ? M$(avg) : 'gratuit'}</span><span>{M$(mx / CR)}</span></div>
                        <div className="mt-1.5 flex gap-1.5">{[0, avg * 0.5, avg, avg * 1.5].filter((v, i, a) => a.indexOf(v) === i).map((v, i) => <button key={i} className="flex-1 rounded-full bg-cream py-1 text-[11px] font-bold active:scale-95" onClick={() => setPrice(ac.id, v)}>{['Gratuit', 'Petit prix', 'Moyen', 'Confort'][i]}</button>)}</div>
                        {ac.p !== avg && <button className="mt-1.5 w-full text-[11px] font-bold text-forest" onClick={() => setPrice(ac.id, undefined)}>↺ Revenir au prix moyen</button>}
                      </div> })()}</div>
                  </div></li> })}
              </ol>
              <div className="mt-3 flex gap-1.5 overflow-x-auto">{([['full', '☀️ Journée'], ['half', '🌤️ Après-midi'], ['night', '🌙 Soirée']] as [Fmt, string][]).map(([fk, fl]) => <button key={fk} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${d.fmt === fk ? 'bg-forest text-white' : 'bg-cream text-muted'}`} onClick={() => setDayFmt(k, fk)}>{fl}</button>)}</div>
              <div className="mt-3 space-y-1 rounded-2xl bg-cream p-3 text-xs"><p>🚕 {FOOD[city].move}</p>{kindsHere.slice(0, 1).map((kk) => <p key={kk}>💡 {TIP[kk]}</p>)}</div>
            </div>}
          </div>) })}
        <p className="text-center text-[11px] text-muted">Pour {people} personne(s) · prix indicatifs{ctryName ? '' : ' en équivalent local'}, à vérifier sur place</p>
      </>)}
    </div>
  )
}
