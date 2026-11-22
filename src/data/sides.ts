// Accompaniments that turn a dish into a complete meal. Quantities are per person, in the ingredient's base unit.
export interface Side { id: string; e: string; n: [string, string, string]; ing: string[]; opt?: boolean }
export const SIDES: Side[] = [
  { id: 'x-the', e: '🍵', n: ['Mint tea', 'Thé à la menthe', 'أتاي بالنعناع'], ing: ['tea:3', 'mint:10', 'sugar:12'] },
  { id: 'x-cafe', e: '☕', n: ['Coffee with milk', 'Café au lait', 'قهوة بالحليب'], ing: ['coffee:8', 'milk:150'] },
  { id: 'x-jus', e: '🍊', n: ['Fresh orange juice', 'Jus d’orange frais', 'عصير برتقال'], ing: ['orange:2'], opt: true },
  { id: 'x-khobz', e: '🥖', n: ['Bread', 'Pain (khobz)', 'خبز'], ing: ['bread:0.5'] },
  { id: 'x-huilemiel', e: '🍯', n: ['Olive oil & honey', 'Huile d’olive & miel', 'زيت وعسل'], ing: ['oil:10', 'honey:15'] },
  { id: 'x-amlou', e: '🥜', n: ['Amlou', 'Amlou', 'أملو'], ing: ['almonds:25', 'honey:10', 'oil:8'] },
  { id: 'x-fromage', e: '🧀', n: ['Cheese & olives', 'Fromage & olives', 'جبن وزيتون'], ing: ['cheese:30', 'olives:25'], opt: true },
  { id: 'x-oeuf', e: '🥚', n: ['Boiled egg', 'Œuf dur', 'بيضة مسلوقة'], ing: ['egg:1'], opt: true },
  { id: 'x-yaourt', e: '🥛', n: ['Yogurt', 'Yaourt', 'زبادي'], ing: ['yogurt:1'], opt: true },
  { id: 'x-fruit', e: '🍎', n: ['Seasonal fruit', 'Fruit de saison', 'فاكهة الموسم'], ing: ['apple:1'], opt: true },
  { id: 'x-orange', e: '🍊', n: ['Orange', 'Orange', 'برتقالة'], ing: ['orange:1'], opt: true },
  { id: 'x-dattes', e: '🌴', n: ['Dates', 'Dattes', 'تمر'], ing: ['dates:30'] },
  { id: 'x-salade', e: '🥗', n: ['Moroccan salad', 'Salade marocaine', 'سلطة مغربية'], ing: ['tomato:100', 'onion:20', 'parsley:5', 'oil:5'], opt: true },
  { id: 'x-carottes', e: '🥕', n: ['Cumin carrots', 'Carottes au cumin', 'جزر بالكمون'], ing: ['carrot:120', 'cumin:0.5', 'oil:5'], opt: true },
  { id: 'x-zaalouk', e: '🍆', n: ['Zaalouk', 'Zaalouk', 'زعلوك'], ing: ['eggplant:150', 'tomato:80', 'garlic:2', 'oil:8'], opt: true },
  { id: 'x-riz', e: '🍚', n: ['Rice', 'Riz', 'أرز'], ing: ['rice:75'] },
]
export const SIDE: Record<string, Side> = Object.fromEntries(SIDES.map((s) => [s.id, s]))
// Dishes that are already a full meal: no bread or salad added.
export const COMPLETE = new Set(['couscous-7', 'couscous-tfaya', 'couscous-grille', 'seffa', 'rfissa', 'pastilla', 'riz-poulet', 'paella', 'risotto', 'pates-tomate', 'pates-thon', 'curry-poulet', 'dal', 'teriyaki', 'riz-saute', 'sandwich-kefta', 'quiche'])
export const SOUPS = new Set(['harira', 'soupe-lentilles', 'chorba', 'soupe-legumes', 'veloute-potiron', 'bissara'])
export const PASTRY_BF = new Set(['msemen', 'baghrir', 'harcha', 'rghaif', 'sfenj'])
