-- KUZINTI test setup: one shared document per household, reachable only with its code.
create table if not exists public.kz_houses (
  code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.kz_houses enable row level security; -- no policies: no direct table access

create or replace function public.kz_get(p_code text) returns jsonb
language sql security definer set search_path = public as $$
  select data from kz_houses where code = upper(p_code)
$$;

create or replace function public.kz_put(p_code text, p_data jsonb) returns void
language sql security definer set search_path = public as $$
  insert into kz_houses (code, data, updated_at) values (upper(p_code), p_data, now())
  on conflict (code) do update set data = excluded.data, updated_at = now()
$$;

revoke all on function public.kz_get(text), public.kz_put(text, jsonb) from public;
grant execute on function public.kz_get(text), public.kz_put(text, jsonb) to anon, authenticated;
