-- Fami 0.20: Push-Abonnements und Zustellprotokoll
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_family_enabled_idx
on public.push_subscriptions(family_id, enabled);

create table if not exists public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  event_id text not null,
  reminder_at timestamptz not null,
  delivered_at timestamptz,
  status text not null default 'pending',
  error text,
  unique(subscription_id, event_id, reminder_at)
);

alter table public.push_subscriptions enable row level security;
alter table public.push_deliveries enable row level security;

drop policy if exists "users read own push subscriptions" on public.push_subscriptions;
create policy "users read own push subscriptions" on public.push_subscriptions
for select to authenticated using (user_id = auth.uid() and public.is_family_member(family_id));

drop policy if exists "users add own push subscriptions" on public.push_subscriptions;
create policy "users add own push subscriptions" on public.push_subscriptions
for insert to authenticated with check (user_id = auth.uid() and public.is_family_member(family_id));

drop policy if exists "users update own push subscriptions" on public.push_subscriptions;
create policy "users update own push subscriptions" on public.push_subscriptions
for update to authenticated using (user_id = auth.uid() and public.is_family_member(family_id))
with check (user_id = auth.uid() and public.is_family_member(family_id));

drop policy if exists "users delete own push subscriptions" on public.push_subscriptions;
create policy "users delete own push subscriptions" on public.push_subscriptions
for delete to authenticated using (user_id = auth.uid() and public.is_family_member(family_id));
