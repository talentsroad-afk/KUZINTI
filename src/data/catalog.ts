export type Unit = 'g' | 'ml' | 'pc' | 'bunch' | 'glass' | 'pinch' | 'tbsp' | 'tsp' | 'clove'
export type Base = 'g' | 'ml' | 'pc'
export type Aisle = 'produce' | 'meat' | 'dairy' | 'grocery' | 'bakery' | 'spices'
export interface Ing {
  id: string
  n: [string, string, string] // en, fr, ar
  base: Base
  aisle: Aisle
  p: number // estimated price in MAD per base unit (estimate, not a live price)
  conv: Partial<Record<Unit, number>> // how much of the base unit one "unit" is
  k: number // kcal per base unit (approximate, for the health indicator)
}
const spice = { tsp: 2.5, tbsp: 7.5, pinch: 0.5 }
const herb = { bunch: 50 }
const I = (id: string, en: string, fr: string, ar: string, base: Base, aisle: Aisle, p: number, conv: Ing['conv'] = {}): Ing => ({ id, n: [en, fr, ar], base, aisle, p, conv, k: 0 })

export const CATALOG: Ing[] = [
  I('chicken', 'Chicken', 'Poulet', 'دجاج', 'g', 'meat', 0.035),
  I('beef', 'Minced beef', 'Viande hachée', 'لحم مفروم', 'g', 'meat', 0.1),
  I('lamb', 'Lamb', 'Agneau', 'لحم الغنم', 'g', 'meat', 0.13),
  I('sardine', 'Sardines', 'Sardines', 'سردين', 'g', 'meat', 0.03),
  I('tuna', 'Canned tuna', 'Thon en boîte', 'تونة معلبة', 'pc', 'grocery', 9),
  I('egg', 'Eggs', 'Œufs', 'بيض', 'pc', 'dairy', 1.5),
  I('onion', 'Onion', 'Oignon', 'بصل', 'g', 'produce', 0.005, { pc: 150 }),
  I('tomato', 'Tomatoes', 'Tomates', 'طماطم', 'g', 'produce', 0.006),
  I('potato', 'Potatoes', 'Pommes de terre', 'بطاطس', 'g', 'produce', 0.005),
  I('carrot', 'Carrots', 'Carottes', 'جزر', 'g', 'produce', 0.005),
  I('zucchini', 'Zucchini', 'Courgettes', 'كوسة', 'g', 'produce', 0.007),
  I('eggplant', 'Eggplant', 'Aubergines', 'باذنجان', 'g', 'produce', 0.007),
  I('pumpkin', 'Pumpkin', 'Potiron', 'قرع', 'g', 'produce', 0.004),
  I('pepper', 'Bell peppers', 'Poivrons', 'فلفل', 'g', 'produce', 0.01),
  I('garlic', 'Garlic', 'Ail', 'ثوم', 'g', 'produce', 0.04, { clove: 4 }),
  I('lemon', 'Lemons', 'Citrons', 'ليمون', 'pc', 'produce', 1),
  I('plemon', 'Preserved lemon', 'Citron confit', 'ليمون مخلل', 'pc', 'grocery', 3),
  I('olives', 'Olives', 'Olives', 'زيتون', 'g', 'grocery', 0.03),
  I('banana', 'Bananas', 'Bananes', 'موز', 'pc', 'produce', 1),
  I('coriander', 'Coriander', 'Coriandre', 'كزبر', 'g', 'produce', 0.06, herb),
  I('parsley', 'Parsley', 'Persil', 'معدنوس', 'g', 'produce', 0.06, herb),
  I('mint', 'Mint', 'Menthe', 'نعناع', 'g', 'produce', 0.06, { bunch: 40 }),
  I('oil', 'Olive oil', "Huile d'olive", 'زيت الزيتون', 'ml', 'grocery', 0.035, { tbsp: 15, tsp: 5, glass: 200 }),
  I('flour', 'Flour', 'Farine', 'دقيق', 'g', 'grocery', 0.008, { tbsp: 10 }),
  I('semolina', 'Semolina', 'Semoule', 'سميد', 'g', 'grocery', 0.01),
  I('couscous', 'Couscous', 'Couscous', 'كسكس', 'g', 'grocery', 0.014),
  I('rice', 'Rice', 'Riz', 'أرز', 'g', 'grocery', 0.014),
  I('pasta', 'Pasta', 'Pâtes', 'معكرونة', 'g', 'grocery', 0.014),
  I('lentils', 'Lentils', 'Lentilles', 'عدس', 'g', 'grocery', 0.02),
  I('chickpeas', 'Chickpeas (dry)', 'Pois chiches secs', 'حمص يابس', 'g', 'grocery', 0.018),
  I('fava', 'Dried fava beans', 'Fèves sèches', 'فول يابس', 'g', 'grocery', 0.015),
  I('oats', 'Oats', 'Flocons d’avoine', 'شوفان', 'g', 'grocery', 0.012),
  I('bread', 'Khobz bread', 'Pain (khobz)', 'خبز', 'pc', 'bakery', 1.2),
  I('milk', 'Milk', 'Lait', 'حليب', 'ml', 'dairy', 0.01),
  I('butter', 'Butter', 'Beurre', 'زبدة', 'g', 'dairy', 0.09),
  I('yogurt', 'Yogurt', 'Yaourt', 'زبادي', 'pc', 'dairy', 2.5),
  I('cheese', 'Cheese', 'Fromage', 'جبن', 'g', 'dairy', 0.07),
  I('honey', 'Honey', 'Miel', 'عسل', 'g', 'grocery', 0.06, { tbsp: 20 }),
  I('sugar', 'Sugar', 'Sucre', 'سكر', 'g', 'grocery', 0.008, { tbsp: 12 }),
  I('almonds', 'Almonds', 'Amandes', 'لوز', 'g', 'grocery', 0.12),
  I('dates', 'Dates', 'Dattes', 'تمر', 'g', 'grocery', 0.05),
  I('tea', 'Green tea', 'Thé vert', 'شاي أخضر', 'g', 'grocery', 0.25, { tsp: 3, tbsp: 8 }),
  I('coffee', 'Coffee', 'Café', 'قهوة', 'g', 'grocery', 0.15),
  I('orange', 'Oranges', 'Oranges', 'برتقال', 'pc', 'produce', 1.2),
  I('apple', 'Apples', 'Pommes', 'تفاح', 'pc', 'produce', 1.2),
  I('fish', 'White fish', 'Poisson blanc', 'سمك أبيض', 'g', 'meat', 0.04),
  I('vermicelli', 'Vermicelli', 'Vermicelle', 'شعرية', 'g', 'grocery', 0.014),
  I('warqa', 'Warqa pastry sheets', 'Feuilles de warqa', 'ورقة البسطيلة', 'pc', 'bakery', 1),
  I('sesame', 'Sesame seeds', 'Graines de sésame', 'سمسم', 'g', 'grocery', 0.06),
  I('whitebeans', 'Dried white beans', 'Haricots blancs secs', 'لوبيا يابسة', 'g', 'grocery', 0.02),
  I('raisins', 'Raisins', 'Raisins secs', 'زبيب', 'g', 'grocery', 0.04),
  I('prunes', 'Prunes', 'Pruneaux', 'برقوق مجفف', 'g', 'grocery', 0.05),
  I('soy', 'Soy sauce', 'Sauce soja', 'صلصة الصويا', 'ml', 'grocery', 0.06, { tbsp: 15 }),
  I('salt', 'Salt', 'Sel', 'ملح', 'g', 'spices', 0.005, { pinch: 1, tsp: 6 }),
  I('cumin', 'Cumin', 'Cumin', 'كمون', 'g', 'spices', 0.12, spice),
  I('paprika', 'Paprika', 'Paprika', 'فلفل أحمر حلو', 'g', 'spices', 0.12, spice),
  I('turmeric', 'Turmeric', 'Curcuma', 'كركم', 'g', 'spices', 0.12, spice),
  I('ginger', 'Ground ginger', 'Gingembre moulu', 'زنجبيل', 'g', 'spices', 0.12, spice),
  I('cinnamon', 'Cinnamon', 'Cannelle', 'قرفة', 'g', 'spices', 0.12, spice),
]
const KC: Record<string, number> = { chicken: 1.65, beef: 2.5, lamb: 2.9, sardine: 2.1, tuna: 150, egg: 72, onion: 0.4, tomato: 0.18, potato: 0.77, carrot: 0.41, zucchini: 0.17, eggplant: 0.25, pumpkin: 0.26, pepper: 0.27, garlic: 1.5, lemon: 20, plemon: 15, olives: 1.5, banana: 105, coriander: 0.23, parsley: 0.36, mint: 0.44, oil: 8, flour: 3.6, semolina: 3.6, couscous: 3.6, rice: 3.6, pasta: 3.6, lentils: 3.5, chickpeas: 3.6, fava: 3.4, oats: 3.7, bread: 150, milk: 0.5, butter: 7.2, yogurt: 60, cheese: 3.5, honey: 3, sugar: 4, almonds: 5.8, dates: 2.8, cumin: 2.8, paprika: 2.8, turmeric: 2.8, ginger: 2.8, cinnamon: 2.8, tea: 0, coffee: 1, orange: 60, apple: 80, fish: 0.9, vermicelli: 3.6, warqa: 40, sesame: 5.7, whitebeans: 3.4, raisins: 3, prunes: 2.4, soy: 0.6, salt: 0 }
for (const i of CATALOG) i.k = KC[i.id] ?? 0
export const ING: Record<string, Ing> = Object.fromEntries(CATALOG.map((i) => [i.id, i]))
export const STAPLES: Record<string, number> = { salt: 500, cumin: 100, paprika: 100, turmeric: 100, ginger: 100, cinnamon: 100, oil: 500, sugar: 500, flour: 500 }
