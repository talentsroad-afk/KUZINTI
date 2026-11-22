// Household (non-food) essentials. Prices are estimates in MAD per unit, not live prices.
export interface HomeItem { id: string; e: string; n: [string, string, string]; p: number }
export const HOME: HomeItem[] = [
  { id: 'dishsoap', e: '🧴', n: ['Dish soap', 'Liquide vaisselle', 'سائل الأواني'], p: 12 },
  { id: 'sponges', e: '🧽', n: ['Sponges', 'Éponges', 'إسفنجات'], p: 8 },
  { id: 'detergent', e: '🧺', n: ['Laundry detergent', 'Lessive', 'مسحوق الغسيل'], p: 45 },
  { id: 'softener', e: '🌸', n: ['Fabric softener', 'Adoucissant', 'منعم الأقمشة'], p: 25 },
  { id: 'toiletpaper', e: '🧻', n: ['Toilet paper', 'Papier toilette', 'ورق التواليت'], p: 30 },
  { id: 'papertowel', e: '🧾', n: ['Paper towels', 'Essuie-tout', 'مناديل المطبخ'], p: 20 },
  { id: 'tissues', e: '🤧', n: ['Tissues', 'Mouchoirs', 'مناديل ورقية'], p: 10 },
  { id: 'bleach', e: '🧪', n: ['Bleach', 'Eau de Javel', 'ماء جافيل'], p: 8 },
  { id: 'floorclean', e: '🧹', n: ['Floor cleaner', 'Nettoyant sol', 'منظف الأرضية'], p: 18 },
  { id: 'bags', e: '🗑️', n: ['Garbage bags', 'Sacs poubelle', 'أكياس النفايات'], p: 12 },
  { id: 'foil', e: '📦', n: ['Foil & film', 'Alu et film', 'ألمنيوم وغشاء'], p: 15 },
  { id: 'handsoap', e: '🧼', n: ['Hand soap', 'Savon mains', 'صابون اليدين'], p: 15 },
  { id: 'shower', e: '🚿', n: ['Shower gel', 'Gel douche', 'جل الاستحمام'], p: 22 },
  { id: 'shampoo', e: '💆', n: ['Shampoo', 'Shampooing', 'شامبو'], p: 28 },
  { id: 'toothpaste', e: '🪥', n: ['Toothpaste', 'Dentifrice', 'معجون الأسنان'], p: 15 },
  { id: 'deodorant', e: '🌿', n: ['Deodorant', 'Déodorant', 'مزيل العرق'], p: 25 },
]
export const HOME_BY: Record<string, HomeItem> = Object.fromEntries(HOME.map((h) => [h.id, h]))
