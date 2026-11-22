import type { Recipe } from './recipes'

/** Free Unsplash License photos (unsplash.com/license), hotlinked from the Unsplash CDN as the license and API guidelines allow.
 *  One photo per dish family: they illustrate the kind of dish, they are not a photo of this exact recipe.
 *  Dishes with no matching family keep the drawn tile, so no photo ever shows the wrong food. */
export interface Photo { u: string; by: string }
const P = (id: string, by: string): Photo => ({ u: `https://images.unsplash.com/photo-${id}`, by })
export const PHOTOS: Record<string, Photo> = {
  tagine: P('1517315314851-5d0c36a36e02', 'Annie Spratt'),
  couscous: P('1626901148200-0e934140a02b', 'Anto Meneghini'),
  soup: P('1547592166-23ac45744acd', 'Ella Olsson'),
  tea: P('1567708415681-d1d249e182eb', 'Massimo Adami'),
  bread: P('1610635967007-34ebbd66f64d', 'Shashi Chaturvedula'),
  fish: P('1600699899970-b1c9fadd8f9e', 'Alex Teixeira'),
  pasta: P('1516685018646-549198525c1b', 'Vinn Koonyosying'),
  salad: P('1576749872435-ff88a71c1ae2', 'Sebastian Coman'),
  grill: P('1705359573325-f2006d5e459f', 'Mihir Sabnis'),
  rice: P('1582576163090-09d3b6f8a969', 'Daniela'),
  table: P('1517314626714-ac1b9a16515e', 'Annie Spratt'),
}
const RULES: [RegExp, string][] = [
  [/tajine|tagine|mrouzia|kefta-tom|mqualli|tanjia/, 'tagine'],
  [/couscous|seffa|rfissa|tfaya/, 'couscous'],
  [/salad|salade|zaalouk|taktouka|tabbo/, 'salad'],
  [/harira|soup|soupe|bissara|chorba|velout|lentil|loubia|addas|minestr|ramen|miso/, 'soup'],
  [/atay|\btea\b|thé/, 'tea'],
  [/msemen|baghrir|harcha|meloui|batbout|bread|khobz|rghaif|crepe|crêpe/, 'bread'],
  [/pasta|spaghet|penne|lasagn|tagliat|carbonara|bolognese|pâtes/, 'pasta'],
  [/fish|poisson|sardin|hout|saumon|salmon|\bcod\b|merlu|dorade|tuna|thon/, 'fish'],
  [/brochette|kebab|skewer|grill|mechoui|chawarma|shawarma|tandoori|yakitori/, 'grill'],
  [/rice|riz|paella|biryani|pilaf|pilav|curry|donburi/, 'rice'],
]
export function photoOf(r: Recipe): Photo | null {
  const hay = `${r.id} ${r.n[0]} ${r.n[1]}`.toLowerCase()
  for (const [re, k] of RULES) if (re.test(hay)) return PHOTOS[k]
  return null
}
export const photoSrc = (p: Photo, w = 900) => `${p.u}?auto=format&fit=crop&w=${w}&q=70`
