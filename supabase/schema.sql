-- KUZINTI schema sketch (run in Supabase SQL editor). Household-scoped RLS: nobody reads another household's data.
create table households (id uuid primary key default gen_random_uuid(), name text not null, invite_code text unique not null, created_at timestamptz default now());
create table members (household_id uuid references households on delete cascade, user_id uuid references auth.users on delete cascade, role text check (role in ('owner','member')) not null, primary key (household_id, user_id));
create table pantry (household_id uuid references households on delete cascade, ingredient_id text, qty numeric not null, primary key (household_id, ingredient_id));
create table meal_plan (household_id uuid references households on delete cascade, week date, day int, slot text, recipe_id text, servings int, primary key (household_id, week, day, slot));
create table shopping_checks (household_id uuid references households on delete cascade, ingredient_id text, checked boolean, by uuid, at timestamptz default now(), primary key (household_id, ingredient_id));
create table activity (id bigint generated always as identity primary key, household_id uuid references households on delete cascade, who uuid, msg text, at timestamptz default now());
alter table households enable row level security; alter table members enable row level security; alter table pantry enable row level security; alter table meal_plan enable row level security; alter table shopping_checks enable row level security; alter table activity enable row level security;
create function is_member(h uuid) returns boolean language sql security definer as $$ select exists(select 1 from members where household_id = h and user_id = auth.uid()) $$;
create policy own on members for select using (user_id = auth.uid());
create policy hh on households for select using (is_member(id));
create policy p1 on pantry for all using (is_member(household_id)) with check (is_member(household_id));
create policy p2 on meal_plan for all using (is_member(household_id)) with check (is_member(household_id));
create policy p3 on shopping_checks for all using (is_member(household_id)) with check (is_member(household_id));
create policy p4 on activity for all using (is_member(household_id)) with check (is_member(household_id));
