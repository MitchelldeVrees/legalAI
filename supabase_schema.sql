create extension if not exists "pgcrypto";

create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size text,
  jurisdiction text,
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text,
  created_at timestamptz not null default now()
);

alter table public.firms enable row level security;
alter table public.accounts enable row level security;

drop policy if exists "public insert firms" on public.firms;
drop policy if exists "public insert accounts" on public.accounts;
drop policy if exists "public select firms" on public.firms;
drop policy if exists "public select accounts" on public.accounts;
drop policy if exists "public delete firms" on public.firms;
drop policy if exists "public delete accounts" on public.accounts;

create policy "public insert firms"
  on public.firms
  for insert
  to anon, authenticated
  with check (true);

create policy "public insert accounts"
  on public.accounts
  for insert
  to anon, authenticated
  with check (true);

create policy "public select firms"
  on public.firms
  for select
  to anon, authenticated
  using (true);

create policy "public select accounts"
  on public.accounts
  for select
  to anon, authenticated
  using (true);

grant insert, select on public.firms to anon, authenticated;
grant insert, select on public.accounts to anon, authenticated;

create policy "public delete firms"
  on public.firms
  for delete
  to anon, authenticated
  using (true);

create policy "public delete accounts"
  on public.accounts
  for delete
  to anon, authenticated
  using (true);

grant delete on public.firms to anon, authenticated;
grant delete on public.accounts to anon, authenticated;
