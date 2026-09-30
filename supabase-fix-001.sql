-- Reparatur 001: Einladungscode ohne gen_random_bytes erzeugen.
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
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    auth.uid()
  ) returning * into new_family;
  insert into public.family_members(family_id, user_id, role)
  values (new_family.id, auth.uid(), 'owner');
  insert into public.family_state(family_id, payload, updated_by)
  values (new_family.id, '{}'::jsonb, auth.uid());
  return query select new_family.id, new_family.name, new_family.invite_code;
end;
$$;

grant execute on function public.create_family(text) to authenticated;
