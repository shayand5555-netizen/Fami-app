-- Fami Online-Beta: einmal vollständig im Supabase SQL Editor ausführen.
create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','adult','member')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table if not exists public.family_state (
  family_id uuid primary key references public.families(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.family_files (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  entity text not null,
  name text not null,
  mime_type text,
  size bigint not null default 0,
  storage_path text not null unique,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.is_family_member(target_family uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where family_id = target_family and user_id = auth.uid()
  );
$$;

create or replace function public.create_family(family_name text)
returns table(id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_family public.families;
begin
  if auth.uid() is null then raise exception 'Anmeldung erforderlich'; end if;
  insert into public.families(name, invite_code, created_by)
  values (
    trim(family_name),
    upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8)),
    auth.uid()
  ) returning * into new_family;
  insert into public.family_members(family_id, user_id, role)
  values (new_family.id, auth.uid(), 'owner');
  insert into public.family_state(family_id, payload, updated_by)
  values (new_family.id, '{}'::jsonb, auth.uid());
  return query select new_family.id, new_family.name, new_family.invite_code;
end;
$$;

create or replace function public.join_family(code text)
returns table(id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  found_family public.families;
begin
  if auth.uid() is null then raise exception 'Anmeldung erforderlich'; end if;
  select * into found_family from public.families
  where families.invite_code = upper(trim(code));
  if found_family.id is null then raise exception 'Einladungscode nicht gefunden'; end if;
  insert into public.family_members(family_id, user_id, role)
  values (found_family.id, auth.uid(), 'member')
  on conflict do nothing;
  return query select found_family.id, found_family.name, found_family.invite_code;
end;
$$;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_state enable row level security;
alter table public.family_files enable row level security;

drop policy if exists "family members read families" on public.families;
create policy "family members read families" on public.families
for select to authenticated using (public.is_family_member(id));

drop policy if exists "family members read memberships" on public.family_members;
create policy "family members read memberships" on public.family_members
for select to authenticated using (public.is_family_member(family_id));

drop policy if exists "family members read state" on public.family_state;
create policy "family members read state" on public.family_state
for select to authenticated using (public.is_family_member(family_id));
drop policy if exists "family members insert state" on public.family_state;
create policy "family members insert state" on public.family_state
for insert to authenticated with check (public.is_family_member(family_id));
drop policy if exists "family members update state" on public.family_state;
create policy "family members update state" on public.family_state
for update to authenticated using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

drop policy if exists "family members read files" on public.family_files;
create policy "family members read files" on public.family_files
for select to authenticated using (public.is_family_member(family_id));
drop policy if exists "family members add files" on public.family_files;
create policy "family members add files" on public.family_files
for insert to authenticated with check (public.is_family_member(family_id));
drop policy if exists "family members delete files" on public.family_files;
create policy "family members delete files" on public.family_files
for delete to authenticated using (public.is_family_member(family_id));

insert into storage.buckets (id, name, public)
values ('family-files', 'family-files', false)
on conflict (id) do update set public = false;

drop policy if exists "family members download storage" on storage.objects;
create policy "family members download storage" on storage.objects
for select to authenticated using (
  bucket_id = 'family-files'
  and public.is_family_member(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "family members upload storage" on storage.objects;
create policy "family members upload storage" on storage.objects
for insert to authenticated with check (
  bucket_id = 'family-files'
  and public.is_family_member(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "family members delete storage" on storage.objects;
create policy "family members delete storage" on storage.objects
for delete to authenticated using (
  bucket_id = 'family-files'
  and public.is_family_member(((storage.foldername(name))[1])::uuid)
);

do $$ begin
  alter publication supabase_realtime add table public.family_state;
exception when duplicate_object then null;
end $$;

grant execute on function public.create_family(text) to authenticated;
grant execute on function public.join_family(text) to authenticated;
grant execute on function public.is_family_member(uuid) to authenticated;
