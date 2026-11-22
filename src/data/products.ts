// Everyday products a household adds by hand. Prices are indicative MAD averages, editable at the store.
export interface Product { id: string; e: string; fr: string; en: string; ar: string; p: number; u: string; a: string }
const RAW = `
🍎|Pommes|Apples|تفاح|18|kg|produce
🍌|Bananes|Bananas|موز|16|kg|produce
🍊|Oranges|Oranges|برتقال|7|kg|produce
🍊|Mandarines|Clementines|ليمون مندرين|10|kg|produce
🍇|Raisin|Grapes|عنب|20|kg|produce
🍓|Fraises|Strawberries|فراولة|20|kg|produce
🍉|Pastèque|Watermelon|دلاح|5|kg|produce
🍈|Melon|Melon|بطيخ|8|kg|produce
🍐|Poires|Pears|إجاص|18|kg|produce
🍑|Pêches|Peaches|خوخ|18|kg|produce
🍑|Abricots|Apricots|مشمش|18|kg|produce
🥝|Kiwis|Kiwis|كيوي|30|kg|produce
🥑|Avocats|Avocados|أفوكا|25|kg|produce
🍋|Citrons|Lemons|حامض|10|kg|produce
🌴|Dattes Mejhoul|Medjool dates|تمر مجهول|90|kg|produce
🫐|Figues|Figs|كرموس|25|kg|produce
🥭|Mangue|Mango|مانجو|35|kg|produce
🍍|Ananas|Pineapple|أناناس|25|pc|produce
🍅|Tomates|Tomatoes|طماطم|6|kg|produce
🧅|Oignons|Onions|بصل|5|kg|produce
🥔|Pommes de terre|Potatoes|بطاطس|5|kg|produce
🥕|Carottes|Carrots|جزر|5|kg|produce
🥒|Concombres|Cucumbers|خيار|6|kg|produce
🥬|Laitue|Lettuce|خس|5|pc|produce
🥬|Chou|Cabbage|كرنب|6|pc|produce
🥦|Brocoli|Broccoli|بروكولي|15|kg|produce
🥦|Chou-fleur|Cauliflower|شيفلور|8|pc|produce
🥬|Épinards|Spinach|سبانخ|10|kg|produce
🫛|Petits pois|Peas|جلبانة|12|kg|produce
🫛|Haricots verts|Green beans|لوبيا خضراء|12|kg|produce
🥕|Navets|Turnips|لفت|6|kg|produce
🟣|Betteraves|Beetroot|بربة|6|kg|produce
🍄|Champignons|Mushrooms|فطر|30|kg|produce
🌽|Maïs|Corn|ذرة|5|pc|produce
🍠|Patates douces|Sweet potatoes|بطاطا حلوة|10|kg|produce
🫑|Poivrons|Peppers|فلفل|8|kg|produce
🍆|Aubergines|Eggplants|باذنجان|6|kg|produce
🥒|Courgettes|Zucchini|كوسة|6|kg|produce
🎃|Courge|Pumpkin|قرع|6|kg|produce
🧄|Ail|Garlic|ثوم|30|kg|produce
🫚|Gingembre frais|Fresh ginger|سكنجبير طري|40|kg|produce
🌿|Menthe|Mint|نعناع|2|bunch|produce
🌿|Coriandre|Coriander|قزبر|2|bunch|produce
🌿|Persil|Parsley|معدنوس|2|bunch|produce
🌿|Céleri|Celery|كرافس|4|bunch|produce
🍗|Poulet entier|Whole chicken|دجاج كامل|40|pc|meat
🍗|Blancs de poulet|Chicken breast|صدر الدجاج|60|kg|meat
🍗|Cuisses de poulet|Chicken legs|أفخاذ الدجاج|35|kg|meat
🥩|Viande de bœuf|Beef|لحم البقر|95|kg|meat
🥩|Viande hachée|Minced beef|لحم مفروم|90|kg|meat
🍖|Agneau|Lamb|لحم الغنم|110|kg|meat
🌭|Merguez|Merguez|مرقاز|80|kg|meat
🦃|Dinde|Turkey|ديك رومي|55|kg|meat
🐟|Sardines fraîches|Fresh sardines|سردين|15|kg|meat
🐟|Merlan|Whiting|ميرلان|45|kg|meat
🐟|Dorade|Sea bream|دوراد|70|kg|meat
🐟|Saumon|Salmon|سلمون|180|kg|meat
🦐|Crevettes|Shrimps|قمرون|120|kg|meat
🦑|Calamars|Squid|كلامار|80|kg|meat
🥚|Œufs (30)|Eggs (30)|بيض (30)|40|pc|dairy
🥛|Lait (1 L)|Milk (1 L)|حليب|7|pc|dairy
🥛|Lben|Lben|لبن|5|pc|dairy
🥛|Raïbi|Raïbi|رايبي|3|pc|dairy
🥛|Yaourts (x4)|Yogurts (x4)|ياغورت|10|pc|dairy
🧀|Fromage en portions|Cheese portions|جبن|18|pc|dairy
🧀|Fromage frais|Fresh cheese|جبن طري|15|pc|dairy
🧀|Edam|Edam|جبن إدام|90|kg|dairy
🧀|Mozzarella|Mozzarella|موزاريلا|25|pc|dairy
🧈|Beurre (250 g)|Butter (250 g)|زبدة|25|pc|dairy
🍦|Crème fraîche|Cream|كريمة|12|pc|dairy
🥖|Pain|Bread|خبز|1.5|pc|bakery
🥖|Baguette|Baguette|باكيت|2|pc|bakery
🫓|Msemen|Msemen|مسمن|2|pc|bakery
🫓|Harcha|Harcha|حرشة|2|pc|bakery
🍞|Pain de mie|Sliced bread|خبز توست|12|pc|bakery
🥐|Croissants|Croissants|كرواسون|3|pc|bakery
🍪|Biscuits|Biscuits|بسكويت|8|pc|grocery
🥣|Céréales|Breakfast cereal|حبوب الفطور|35|pc|grocery
🍫|Chocolat|Chocolate|شوكولاتة|15|pc|grocery
🫙|Confiture|Jam|مربى|18|pc|grocery
🍯|Miel|Honey|عسل|120|kg|grocery
🥜|Beurre de cacahuète|Peanut butter|زبدة الفول السوداني|35|pc|grocery
🫙|Amlou|Amlou|أملو|60|pc|grocery
☕|Café moulu|Ground coffee|قهوة مطحونة|40|pc|grocery
🍵|Thé vert|Green tea|أتاي|20|pc|grocery
🧃|Jus d’orange|Orange juice|عصير البرتقال|15|pc|grocery
💧|Eau minérale (6 x 1,5 L)|Water (6 x 1.5 L)|ماء معدني|30|pc|grocery
🥤|Soda|Soft drink|مشروب غازي|10|pc|grocery
🫗|Huile de table (5 L)|Cooking oil (5 L)|زيت المائدة|90|pc|grocery
🫒|Huile d’olive (1 L)|Olive oil (1 L)|زيت الزيتون|70|pc|grocery
🫙|Vinaigre|Vinegar|خل|8|pc|grocery
🥫|Concentré de tomate|Tomato paste|مركز الطماطم|6|pc|grocery
🥫|Thon en boîte|Canned tuna|تون معلب|12|pc|grocery
🥫|Sardines en boîte|Canned sardines|سردين معلب|6|pc|grocery
🥫|Pois chiches en boîte|Canned chickpeas|حمص معلب|8|pc|grocery
🥫|Maïs en boîte|Canned corn|ذرة معلبة|10|pc|grocery
🫒|Olives|Olives|زيتون|25|kg|grocery
🍝|Spaghetti|Spaghetti|سباغيتي|7|pc|grocery
🍝|Pâtes courtes|Pasta|معكرونة|7|pc|grocery
🍜|Vermicelles|Vermicelli|شعرية|6|pc|grocery
🍚|Riz|Rice|أرز|14|kg|grocery
🌾|Semoule|Semolina|سميدة|10|kg|grocery
🥣|Couscous|Couscous|كسكس|12|kg|grocery
🌾|Farine|Flour|دقيق|8|kg|grocery
🌾|Flocons d’avoine|Oat flakes|شوفان|20|pc|grocery
🫘|Lentilles|Lentils|عدس|18|kg|grocery
🫘|Haricots blancs|White beans|لوبيا|20|kg|grocery
🫘|Fèves sèches|Dried fava beans|فول يابس|16|kg|grocery
🍬|Sucre|Sugar|سكر|7|kg|grocery
🧊|Pain de sucre|Sugar cone|قالب السكر|14|pc|grocery
🧂|Sel|Salt|ملح|2|pc|spices
🧂|Cumin|Cumin|كمون|10|pc|spices
🌶️|Paprika|Paprika|فلفل أحمر|8|pc|spices
🧂|Curcuma|Turmeric|خرقوم|8|pc|spices
🧂|Poivre noir|Black pepper|إبزار|10|pc|spices
🧂|Ras el hanout|Ras el hanout|رأس الحانوت|15|pc|spices
🧂|Cannelle|Cinnamon|قرفة|10|pc|spices
🧂|Gingembre en poudre|Ground ginger|سكنجبير|8|pc|spices
🧂|Safran|Saffron|زعفران|40|pc|spices
🧂|Levure boulangère|Baker's yeast|خميرة|2|pc|spices
🌰|Amandes|Almonds|لوز|120|kg|grocery
🥜|Cacahuètes|Peanuts|كاوكاو|40|kg|grocery
🌰|Noix|Walnuts|ڭرڭاع|110|kg|grocery
🍇|Raisins secs|Raisins|زبيب|50|kg|grocery
🌰|Sésame|Sesame|جلجلان|40|kg|grocery
🧊|Légumes surgelés|Frozen vegetables|خضر مجمدة|20|pc|grocery
🍟|Frites surgelées|Frozen fries|بطاطس مقلية مجمدة|25|pc|grocery
🍨|Glace|Ice cream|مثلجات|30|pc|grocery
🍼|Lait bébé|Baby milk|حليب الرضع|120|pc|grocery
🥣|Petits pots bébé|Baby food|أغذية الأطفال|12|pc|grocery
🐱|Croquettes chat|Cat food|طعام القطط|60|pc|grocery
`
export const PRODUCTS: Product[] = RAW.trim().split('\n').map((l, i) => { const [e, fr, en, ar, p, u, a] = l.split('|'); return { id: 'p' + i, e, fr, en, ar, p: +p, u, a } })
export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
