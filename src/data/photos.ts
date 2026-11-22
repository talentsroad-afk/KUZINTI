import type { Recipe } from './recipes'

/** Real photos from Wikimedia Commons (free licences, author and licence shown with the photo), picked one by one and checked by eye against the dish.
 *  A dish with no entry keeps its drawn tile, so a photo never shows the wrong food. [commons path, author, licence] */
export interface Photo { path: string; by: string; lic: string }
const D: Record<string, [string, string, string]> = {
  'tajine-poulet': ['8/8a/Moroccan_food-Chicken_tagine_with_preserved_lemons_and_olives-01.jpg', 'Foodista', 'CC BY 2.0'],
  'couscous-7': ['8/82/Moroccan_cuisine-Couscous_with_vegetables.jpg', 'gatos.rojos', 'CC BY 2.0'],
  'harira': ['0/0d/Harira..JPG', 'Miansari66', 'CC0'],
  'bissara': ['o:6/67/Thamarakt%2C_pur%C3%A9e_de_pois_cass%C3%A9s_%C3%A0_servir_avec_un_bon_filet_d%27huile_d%27olive..jpg', 'EKez', 'CC BY-SA 3.0'],
  'zaalouk': ['4/45/Zaalouk_03.jpg', 'Arnaud 25', 'CC0'],
  'msemen': ['8/8e/Smen_msemmen.jpg', 'Lucyin', 'CC BY-SA 3.0'],
  'shakshuka': ['1/18/Shakshuka_by_Calliopejen1.jpg', 'Calliopejen1', 'CC BY-SA 3.0'],
  'omelette': ['a/a7/Tomato_Cheese_Omelette.jpg', 'Sumit Surai', 'CC BY-SA 4.0'],
  'soupe-lentilles': ['6/6e/Homemade_Lentil_Soup_-_Lavash_2025-02-10.jpg', 'Andy Li', 'CC0'],
  'riz-poulet': ['9/96/Lemon_and_saffron_roasted_chicken_on_pilaf_rice_with_sesame_yoghurt_and_peach_relish_-_Cafe_Mint_AUD24.90_main_%283697197879%29.jpg', 'Alpha from Melbourne, Australia', 'CC BY-SA 2.0'],
  'tajine-legumes': ['e/ea/Vegetable_Tagine.jpg', 'Turajski', 'CC BY-SA 4.0'],
  'brochettes': ['o:e/ee/Dak-kkochi.jpg', '부스트 Bost', 'CC BY 4.0'],
  'couscous-grille': ['6/67/Liat_Portal_for_Foodie_Disorder_-_Algerian_Couscous_with_Vegetables.jpg', 'HaJunkiyada', 'CC BY-SA 4.0'],
  'veloute-potiron': ['9/9f/Autumn_Soup_%28Unsplash%29_cropped.jpg', 'Cala cala_maffia', 'CC0'],
  'mechouia': ['f/fe/%D8%B3%D9%84%D8%A7%D8%B7%D8%A9_%D9%85%D8%B4%D9%88%D9%8A%D8%A9%D8%8C_%D9%85%D8%B9_%D8%A7%D9%84%D8%B2%D9%8A%D8%AA%D9%88%D9%86_%D8%A7%D9%84%D8%A7%D8%AE%D8%B6%D8%B1%D8%8C_%D8%AA%D9%88%D9%86%D8%B3_2020.jpg', 'Habib M’henni', 'CC BY-SA 4.0'],
  'salade-lentilles': ['9/9f/Lentil_salad_%2829308018298%29.jpg', 'Joey Doll', 'CC BY 2.0'],
  'rfissa': ['5/5f/Rfissa_marocaine.jpg', 'Mokhtaroo', 'CC BY-SA 3.0'],
  'pastilla': ['5/51/Pastilla_au_poulet.jpg', 'drea from Vancouver, Canada', 'CC BY-SA 2.0'],
  'mrouzia': ['e/e9/IB_tajine_02.jpg', 'Iron Bishop', 'CC BY-SA 3.0'],
  'tajine-poisson': ['4/45/Tajine_marocain.jpg', 'Bawdeep2010', 'CC BY-SA 4.0'],
}
export function photoOf(r: Recipe): Photo | null {
  const d = D[r.id]
  return d ? { path: d[0], by: d[1], lic: d[2] } : null
}
export const photoSrc = (p: Photo, w = 640) => {
  if (p.path.startsWith('o:')) return `https://upload.wikimedia.org/wikipedia/commons/${p.path.slice(2)}`
  const f = p.path.slice(p.path.lastIndexOf('/') + 1)
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${p.path}/${w <= 600 ? 500 : 960}px-${f}`
}
