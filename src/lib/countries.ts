import type { Aisle } from '../data/catalog'
/** Countries KUZINTI supports. `rate` turns the MAD base price into a local shelf price (price level, not FX),
 *  so a basket costs what it would really cost there. Store price indexes are a labelled demo. */
export interface Country { id: string; f: string; n: [string, string, string]; cur: string; sym: string; rate: number; dec: number; cuisine: string; zone: Zone; stores: string; cities?: string[] }
export type Zone = 'maghreb' | 'europe' | 'nord' | 'amerique' | 'afrique' | 'orient'
export const ZONES: [Zone, string, string, string][] = [['maghreb', 'Maghreb', 'Maghreb', 'المغرب العربي'], ['europe', 'Europe', 'Europe', 'أوروبا'], ['nord', 'Pays nordiques', 'Nordic countries', 'دول الشمال'], ['amerique', 'Amérique', 'Americas', 'أمريكا'], ['afrique', 'Afrique', 'Africa', 'أفريقيا'], ['orient', 'Moyen-Orient', 'Middle East', 'الشرق الأوسط']]
// stores: "Name:kind" — kind d = discount, h = hypermarket, s = supermarket, p = premium, m = open market, n = neighbourhood shop
export const COUNTRIES: Country[] = [
  { id: 'MA', f: '🇲🇦', n: ['Morocco', 'Maroc', 'المغرب'], cur: 'MAD', sym: 'MAD', rate: 1, dec: 2, cuisine: 'ma', zone: 'maghreb', stores: '' },
  { id: 'DZ', f: '🇩🇿', n: ['Algeria', 'Algérie', 'الجزائر'], cur: 'DZD', sym: 'DA', rate: 14, dec: 0, cuisine: 'ma', zone: 'maghreb', stores: 'Uno:h|Ardis:h|Numidis:s|Supérette:n|Souk:m' },
  { id: 'TN', f: '🇹🇳', n: ['Tunisia', 'Tunisie', 'تونس'], cur: 'TND', sym: 'DT', rate: 0.32, dec: 2, cuisine: 'ma', zone: 'maghreb', stores: 'Carrefour:h|Monoprix:s|Géant:h|Aziza:d|Magasin Général:s|Souk:m' },
  { id: 'FR', f: '🇫🇷', n: ['France', 'France', 'فرنسا'], cur: 'EUR', sym: '€', rate: 0.16, dec: 2, cuisine: 'fr', zone: 'europe', stores: '' },
  { id: 'BE', f: '🇧🇪', n: ['Belgium', 'Belgique', 'بلجيكا'], cur: 'EUR', sym: '€', rate: 0.17, dec: 2, cuisine: 'fr', zone: 'europe', stores: 'Colruyt:d|Delhaize:s|Carrefour:h|Aldi:d|Lidl:d|Marché:m', cities: ['Bruxelles'] },
  { id: 'CH', f: '🇨🇭', n: ['Switzerland', 'Suisse', 'سويسرا'], cur: 'CHF', sym: 'CHF', rate: 0.26, dec: 2, cuisine: 'fr', zone: 'europe', stores: 'Migros:s|Coop:s|Denner:d|Aldi:d|Lidl:d|Marché:m', cities: ['Genève'] },
  { id: 'ES', f: '🇪🇸', n: ['Spain', 'Espagne', 'إسبانيا'], cur: 'EUR', sym: '€', rate: 0.14, dec: 2, cuisine: 'es', zone: 'europe', stores: 'Mercadona:s|Carrefour:h|Lidl:d|Dia:d|Alcampo:h|Mercado:m', cities: ['Madrid', 'Barcelone'] },
  { id: 'IT', f: '🇮🇹', n: ['Italy', 'Italie', 'إيطاليا'], cur: 'EUR', sym: '€', rate: 0.15, dec: 2, cuisine: 'it', zone: 'europe', stores: 'Esselunga:s|Conad:s|Coop:s|Lidl:d|Carrefour:h|Mercato:m', cities: ['Rome'] },
  { id: 'DE', f: '🇩🇪', n: ['Germany', 'Allemagne', 'ألمانيا'], cur: 'EUR', sym: '€', rate: 0.15, dec: 2, cuisine: 'mix', zone: 'europe', stores: 'Aldi:d|Lidl:d|Rewe:s|Edeka:s|Kaufland:h|Markt:m', cities: ['Berlin'] },
  { id: 'NL', f: '🇳🇱', n: ['Netherlands', 'Pays-Bas', 'هولندا'], cur: 'EUR', sym: '€', rate: 0.17, dec: 2, cuisine: 'mix', zone: 'europe', stores: 'Albert Heijn:s|Jumbo:s|Lidl:d|Aldi:d|Plus:s|Markt:m', cities: ['Amsterdam'] },
  { id: 'PT', f: '🇵🇹', n: ['Portugal', 'Portugal', 'البرتغال'], cur: 'EUR', sym: '€', rate: 0.13, dec: 2, cuisine: 'med', zone: 'europe', stores: 'Continente:h|Pingo Doce:s|Lidl:d|Auchan:h|Intermarché:s|Mercado:m', cities: ['Lisbonne'] },
  { id: 'GB', f: '🇬🇧', n: ['United Kingdom', 'Royaume-Uni', 'المملكة المتحدة'], cur: 'GBP', sym: '£', rate: 0.14, dec: 2, cuisine: 'mix', zone: 'europe', stores: 'Tesco:h|Sainsbury’s:s|Asda:h|Aldi:d|Lidl:d|Market:m', cities: ['Londres'] },
  { id: 'SE', f: '🇸🇪', n: ['Sweden', 'Suède', 'السويد'], cur: 'SEK', sym: 'kr', rate: 2.4, dec: 0, cuisine: 'mix', zone: 'nord', stores: 'Willys:d|Lidl:d|ICA:s|Coop:s|Hemköp:s|Saluhall:m', cities: ['Stockholm'] },
  { id: 'NO', f: '🇳🇴', n: ['Norway', 'Norvège', 'النرويج'], cur: 'NOK', sym: 'kr', rate: 2.8, dec: 0, cuisine: 'mix', zone: 'nord', stores: 'Rema 1000:d|Kiwi:d|Coop Extra:d|Meny:s|Bunnpris:n', cities: ['Oslo'] },
  { id: 'DK', f: '🇩🇰', n: ['Denmark', 'Danemark', 'الدنمارك'], cur: 'DKK', sym: 'kr', rate: 1.6, dec: 0, cuisine: 'mix', zone: 'nord', stores: 'Netto:d|Lidl:d|Rema 1000:d|Føtex:s|Bilka:h|Irma:p', cities: ['Copenhague'] },
  { id: 'FI', f: '🇫🇮', n: ['Finland', 'Finlande', 'فنلندا'], cur: 'EUR', sym: '€', rate: 0.19, dec: 2, cuisine: 'mix', zone: 'nord', stores: 'Lidl:d|Prisma:h|K-Citymarket:h|S-Market:s|Alepa:n|Kauppatori:m', cities: ['Helsinki'] },
  { id: 'TR', f: '🇹🇷', n: ['Türkiye', 'Turquie', 'تركيا'], cur: 'TRY', sym: '₺', rate: 3.6, dec: 0, cuisine: 'tr', zone: 'europe', stores: 'Migros:s|BIM:d|A101:d|ŞOK:d|CarrefourSA:h|Pazar:m', cities: ['Istanbul'] },
  { id: 'CA', f: '🇨🇦', n: ['Canada', 'Canada', 'كندا'], cur: 'CAD', sym: '$ CA', rate: 0.24, dec: 2, cuisine: 'mix', zone: 'amerique', stores: 'Maxi:d|Metro:s|IGA:s|Walmart:h|Costco:h|Marché:m', cities: ['Montréal'] },
  { id: 'US', f: '🇺🇸', n: ['United States', 'États-Unis', 'الولايات المتحدة'], cur: 'USD', sym: '$', rate: 0.2, dec: 2, cuisine: 'mix', zone: 'amerique', stores: 'Walmart:h|Costco:h|Kroger:s|Aldi:d|Whole Foods:p|Farmers market:m', cities: ['New York'] },
  { id: 'SN', f: '🇸🇳', n: ['Senegal', 'Sénégal', 'السنغال'], cur: 'XOF', sym: 'FCFA', rate: 60, dec: 0, cuisine: 'mix', zone: 'afrique', stores: 'Auchan:h|Carrefour:h|Casino:s|Boutique:n|Marché:m', cities: ['Dakar'] },
  { id: 'CI', f: '🇨🇮', n: ['Côte d’Ivoire', 'Côte d’Ivoire', 'ساحل العاج'], cur: 'XOF', sym: 'FCFA', rate: 62, dec: 0, cuisine: 'mix', zone: 'afrique', stores: 'Carrefour:h|Prosuma:s|Leader Price:d|Boutique:n|Marché:m', cities: ['Abidjan'] },
  { id: 'EG', f: '🇪🇬', n: ['Egypt', 'Égypte', 'مصر'], cur: 'EGP', sym: 'E£', rate: 4.2, dec: 0, cuisine: 'med', zone: 'orient', stores: 'Carrefour:h|Hyper One:h|Spinneys:p|Kheir Zaman:d|Souk:m', cities: ['Le Caire'] },
  { id: 'AE', f: '🇦🇪', n: ['United Arab Emirates', 'Émirats arabes unis', 'الإمارات'], cur: 'AED', sym: 'AED', rate: 0.55, dec: 2, cuisine: 'med', zone: 'orient', stores: 'Carrefour:h|Lulu:h|Union Coop:s|Spinneys:p|Choithrams:s', cities: ['Dubaï'] },
  { id: 'SA', f: '🇸🇦', n: ['Saudi Arabia', 'Arabie saoudite', 'السعودية'], cur: 'SAR', sym: 'SAR', rate: 0.5, dec: 2, cuisine: 'med', zone: 'orient', stores: 'Panda:h|Othaim:d|Danube:p|Tamimi:s|Lulu:h', cities: ['Riyad'] },
]
export const countryOf = (id: string) => COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0]
export const cname = (c: Country, lang: string) => c.n[lang === 'en' ? 0 : lang === 'ar' ? 2 : 1]
const KIND: Record<string, Record<Aisle, number>> = {
  d: { produce: 0.95, meat: 0.96, dairy: 0.9, grocery: 0.87, bakery: 0.95, spices: 0.9 },
  h: { produce: 1.0, meat: 0.97, dairy: 0.97, grocery: 0.95, bakery: 1.0, spices: 0.97 },
  s: { produce: 1.04, meat: 1.03, dairy: 1.01, grocery: 1.02, bakery: 1.02, spices: 1.03 },
  p: { produce: 1.15, meat: 1.12, dairy: 1.1, grocery: 1.12, bakery: 1.1, spices: 1.12 },
  m: { produce: 0.84, meat: 0.94, dairy: 1.06, grocery: 1.05, bakery: 0.93, spices: 0.82 },
  n: { produce: 1.03, meat: 1.08, dairy: 1.04, grocery: 1.06, bakery: 0.92, spices: 1.08 },
}
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '')
/** Stores of a country built from its "Name:kind" list; a tiny per-store nudge keeps two stores of a kind apart. */
export const storesOf = (c: Country) => c.stores.split('|').filter(Boolean).map((x, i) => {
  const [name, k] = x.split(':'); const base = KIND[k] ?? KIND.s; const nudge = 1 + ((i * 7) % 5 - 2) / 100
  return { id: `${c.id.toLowerCase()}-${slug(name)}`, name, kind: k, m: Object.fromEntries(Object.entries(base).map(([a, v]) => [a, Math.round(v * nudge * 100) / 100])) as Record<Aisle, number> }
})
/** Brand-ish colours for chains found in several countries; markets and corner shops get the warm KUZINTI look. */
export const CHAIN: Record<string, [string, string]> = {
  lidl: ['#0050aa', '#fff200'], aldi: ['#00205b', '#fff'], carrefour: ['#fff', '#1d5fa8'], auchan: ['#fff', '#e2001a'], monoprix: ['#111', '#fff'], intermarche: ['#e30613', '#fff'],
  migros: ['#ff6600', '#fff'], coop: ['#e2001a', '#fff'], denner: ['#e30613', '#fff'], colruyt: ['#f39200', '#fff'], delhaize: ['#c8102e', '#fff'], mercadona: ['#00843d', '#fff'],
  dia: ['#e30613', '#fff'], alcampo: ['#fff', '#e2001a'], esselunga: ['#0062b1', '#fff'], conad: ['#e30613', '#fff'], rewe: ['#cc071e', '#fff'], edeka: ['#ffd400', '#1d3f8f'],
  kaufland: ['#e2001a', '#fff'], albertheijn: ['#00a0e2', '#fff'], jumbo: ['#ffd400', '#111'], plus: ['#e30613', '#fff'], continente: ['#e30613', '#fff'], pingodoce: ['#00843d', '#fff'],
  tesco: ['#00539f', '#fff'], sainsburys: ['#f06c00', '#fff'], asda: ['#78be20', '#fff'], bim: ['#d33a2c', '#fff'], a101: ['#00a0e2', '#fff'], sok: ['#ffd400', '#1d3f8f'],
  carrefoursa: ['#1d5fa8', '#fff'], walmart: ['#0071ce', '#ffc220'], costco: ['#e31837', '#fff'], kroger: ['#134b97', '#fff'], wholefoods: ['#00674b', '#fff'], maxi: ['#ffd400', '#e30613'],
  metro: ['#e30613', '#fff'], iga: ['#e30613', '#fff'], casino: ['#00843d', '#fff'], leaderprice: ['#e30613', '#ffd400'], prosuma: ['#1d3f8f', '#fff'], uno: ['#e30613', '#fff'],
  ardis: ['#00843d', '#fff'], numidis: ['#1d5fa8', '#fff'], geant: ['#00843d', '#fff'], aziza: ['#e30613', '#fff'], magasingeneral: ['#1d3f8f', '#fff'], hyperone: ['#e30613', '#fff'],
  spinneys: ['#00674b', '#fff'], kheirzaman: ['#f39200', '#fff'], lulu: ['#00843d', '#fff'], unioncoop: ['#1d5fa8', '#fff'], choithrams: ['#e30613', '#fff'], panda: ['#00843d', '#fff'],
  willys: ['#e30613', '#fff'], ica: ['#e3000f', '#fff'], hemkop: ['#e30613', '#fff'], rema1000: ['#003087', '#fff'], kiwi: ['#7ab51d', '#fff'], coopextra: ['#e30613', '#ffd400'], meny: ['#c8102e', '#fff'], bunnpris: ['#e30613', '#fff'], netto: ['#ffd400', '#111'], fotex: ['#00205b', '#fff'], bilka: ['#00a0e2', '#fff'], irma: ['#00a0e2', '#fff'], prisma: ['#00843d', '#fff'], kcitymarket: ['#ff6600', '#fff'], smarket: ['#e30613', '#fff'], alepa: ['#e30613', '#fff'],
  othaim: ['#f39200', '#fff'], danube: ['#1d3f8f', '#fff'], tamimi: ['#c8102e', '#fff'],
}
export const chainKey = slug
