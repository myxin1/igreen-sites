create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  premium_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_entitlements enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        updated_at = now();

  insert into public.user_entitlements (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists entitlements_touch_updated_at on public.user_entitlements;
create trigger entitlements_touch_updated_at
  before update on public.user_entitlements
  for each row execute procedure public.touch_updated_at();

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "entitlements_select_own" on public.user_entitlements;
create policy "entitlements_select_own"
  on public.user_entitlements
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

revoke insert, update, delete on public.user_entitlements from anon, authenticated;

-- Template for every user-owned table you add in the future:
-- create table public.user_favorites (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid not null references auth.users(id) on delete cascade,
--   session_id text not null,
--   created_at timestamptz not null default now()
-- );
-- alter table public.user_favorites enable row level security;
-- create policy "favorites_select_own"
--   on public.user_favorites
--   for select
--   to authenticated
--   using ((select auth.uid()) = user_id);
-- create policy "favorites_insert_own"
--   on public.user_favorites
--   for insert
--   to authenticated
--   with check ((select auth.uid()) = user_id);
-- create policy "favorites_delete_own"
--   on public.user_favorites
--   for delete
--   to authenticated
--   using ((select auth.uid()) = user_id);
