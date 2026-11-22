# KUZINTI — Plan your meals. Shop smarter. Live better.

Working proof of concept of the core journey: sign up → household + partner invite → recipes → weekly planner → deterministic ingredient engine with pantry deduction → shared live shopping list with in-store mode. Morocco first (MAD), FR / EN / AR with RTL.

## Run
```
npm install
npm run dev          # local
npm test             # ingredient engine tests
npm run build        # static build (Vercel-ready)
npm run build:single # one self-contained HTML file (demo link)
```

## What is real in this POC
- **Ingredient engine** (`src/lib/engine.ts`): per-ingredient unit conversions (bunch, glass, pinch, tbsp, clove…), scaling by servings, merging across recipes, pantry subtraction, rounding to purchase sizes. Missing conversions throw instead of guessing. Unit tests included.
- **Household + live sync**: demo mode stores data in the browser. Open a second tab, create another account and join with the invite code: checks and plan changes appear live (storage events).
- Game layer: XP, levels, streaks, weekly ring, toasts, confetti on completing a list.
- 30 recipes with realistic quantities. Prices are **estimates**, labelled as such. No live supermarket prices yet.
- Rule-based "Suggest my week" (diet, budget, variety). Not AI yet.

## Going multi-user (Supabase + Vercel)
1. Create a Supabase project, run `supabase/schema.sql` (tables + row-level security per household).
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel, then replace `src/lib/store.tsx` persistence with Supabase Auth + Realtime (the store API is already the seam).
3. Import the repo in Vercel (framework: Vite, output `dist`).

## Visuals
Food tiles are illustrations. Higgsfield or licensed photos slot in at `FoodTile` in `src/ui.tsx` (add an `img` per recipe).

## Not built yet
Supermarket price comparison, admin area, AI assistant, push notifications, custom recipes, duplicate-week.
