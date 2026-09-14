-- Locagest : co-détention au niveau du bien + invitations
-- À exécuter dans l'éditeur SQL de Supabase.

-- Adresse du locataire pour les baux / quittances.
alter table public.rentals add column if not exists tenant_street_number text;
alter table public.rentals add column if not exists tenant_street_name text;
alter table public.rentals add column if not exists tenant_city text;
alter table public.rentals add column if not exists tenant_postal_code text;
alter table public.rentals add column if not exists tenant_phone text;
alter table public.rentals add column if not exists is_active boolean not null default true;
alter table public.properties
  add column if not exists ownership_type text
    check (ownership_type is null or ownership_type in ('personne_morale', 'entreprise'));

alter table public.properties
  add column if not exists siret text;

update public.properties
set ownership_type = coalesce(ownership_type, 'personne_morale')
where ownership_type is null;

-- ========== Tables ==========
create table if not exists public.property_coowners (
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (property_id, user_id)
);

create index if not exists property_coowners_user_id_idx
  on public.property_coowners (user_id);

create table if not exists public.property_invites (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  email text not null,
  token uuid not null unique default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists property_invites_email_idx
  on public.property_invites (email);

create index if not exists property_invites_property_id_idx
  on public.property_invites (property_id);

create unique index if not exists property_invites_pending_unique
  on public.property_invites (property_id, email)
  where status = 'pending';

-- Migration : créateur = co-détenteur
insert into public.property_coowners (property_id, user_id)
select p.id, p.user_id
from public.properties p
where p.user_id is not null
on conflict do nothing;

-- Type depuis profil créateur si dispo
update public.properties p
set ownership_type = coalesce(
  (
    select case
      when op.account_type in ('personne_morale', 'entreprise') then op.account_type
      else 'personne_morale'
    end
    from public.owner_profiles op
    where op.id = p.user_id
  ),
  'personne_morale'
)
where p.ownership_type is null or p.ownership_type = 'personne_morale';

-- ========== Helpers RLS ==========
create or replace function public.is_property_coowner(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.property_coowners c
    where c.property_id = p_id
      and c.user_id = auth.uid()
  );
$$;

create or replace function public.can_access_property(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.properties p
    where p.id = p_id and p.user_id = auth.uid()
  )
  or public.is_property_coowner(p_id);
$$;

revoke all on function public.is_property_coowner(uuid) from public;
revoke all on function public.can_access_property(uuid) from public;
grant execute on function public.is_property_coowner(uuid) to authenticated;
grant execute on function public.can_access_property(uuid) to authenticated;

-- Lecture publique d'une invitation par token (page /invitation)
create or replace function public.get_invite_by_token(p_token uuid)
returns table (
  id uuid,
  property_id uuid,
  email text,
  status text,
  property_label text,
  ownership_type text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.id,
    i.property_id,
    i.email,
    i.status,
    trim(both from concat_ws(' ', p.street_number, p.street_name, p.city)) as property_label,
    p.ownership_type
  from public.property_invites i
  join public.properties p on p.id = i.property_id
  where i.token = p_token
  limit 1;
$$;

create or replace function public.accept_property_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.property_invites%rowtype;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select * into v_invite
  from public.property_invites
  where token = p_token
  for update;

  if not found then
    raise exception 'Invitation introuvable';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invitation déjà traitée';
  end if;

  select lower(coalesce(u.email, '')) into v_email
  from auth.users u
  where u.id = auth.uid();

  if v_email is distinct from lower(v_invite.email) then
    raise exception 'Cette invitation est destinée à un autre e-mail';
  end if;

  insert into public.property_coowners (property_id, user_id)
  values (v_invite.property_id, auth.uid())
  on conflict do nothing;

  update public.property_invites
  set status = 'accepted', accepted_at = now()
  where id = v_invite.id;

  return v_invite.property_id;
end;
$$;

revoke all on function public.get_invite_by_token(uuid) from public;
revoke all on function public.accept_property_invite(uuid) from public;
grant execute on function public.get_invite_by_token(uuid) to anon, authenticated;
grant execute on function public.accept_property_invite(uuid) to authenticated;

-- ========== RLS tables ==========
alter table public.property_coowners enable row level security;
alter table public.property_invites enable row level security;

drop policy if exists "property_coowners_select" on public.property_coowners;
drop policy if exists "property_coowners_insert" on public.property_coowners;
drop policy if exists "property_coowners_delete" on public.property_coowners;

create policy "property_coowners_select"
  on public.property_coowners for select to authenticated
  using (public.can_access_property(property_id));

create policy "property_coowners_insert"
  on public.property_coowners for insert to authenticated
  with check (public.can_access_property(property_id) or user_id = auth.uid());

create policy "property_coowners_delete"
  on public.property_coowners for delete to authenticated
  using (public.can_access_property(property_id));

drop policy if exists "property_invites_select" on public.property_invites;
drop policy if exists "property_invites_insert" on public.property_invites;
drop policy if exists "property_invites_update" on public.property_invites;

create policy "property_invites_select"
  on public.property_invites for select to authenticated
  using (
    public.can_access_property(property_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "property_invites_insert"
  on public.property_invites for insert to authenticated
  with check (public.can_access_property(property_id) and invited_by = auth.uid());

create policy "property_invites_update"
  on public.property_invites for update to authenticated
  using (
    public.can_access_property(property_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- ========== Properties / rentals / documents / costs ==========
drop policy if exists "properties_select_own" on public.properties;
drop policy if exists "properties_insert_own" on public.properties;
drop policy if exists "properties_update_own" on public.properties;
drop policy if exists "properties_delete_own" on public.properties;

create policy "properties_select_own"
  on public.properties for select to authenticated
  using (user_id = auth.uid() or public.is_property_coowner(id));

create policy "properties_insert_own"
  on public.properties for insert to authenticated
  with check (user_id = auth.uid());

create policy "properties_update_own"
  on public.properties for update to authenticated
  using (user_id = auth.uid() or public.is_property_coowner(id))
  with check (user_id = auth.uid() or public.is_property_coowner(id));

create policy "properties_delete_own"
  on public.properties for delete to authenticated
  using (user_id = auth.uid() or public.is_property_coowner(id));

drop policy if exists "rentals_select_own" on public.rentals;
drop policy if exists "rentals_insert_own" on public.rentals;
drop policy if exists "rentals_update_own" on public.rentals;
drop policy if exists "rentals_delete_own" on public.rentals;

create policy "rentals_select_own"
  on public.rentals for select to authenticated
  using (public.can_access_property(property_id));

create policy "rentals_insert_own"
  on public.rentals for insert to authenticated
  with check (public.can_access_property(property_id));

create policy "rentals_update_own"
  on public.rentals for update to authenticated
  using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "rentals_delete_own"
  on public.rentals for delete to authenticated
  using (public.can_access_property(property_id));

drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;

create policy "documents_select_own"
  on public.documents for select to authenticated
  using (public.can_access_property(property_id));

create policy "documents_insert_own"
  on public.documents for insert to authenticated
  with check (public.can_access_property(property_id));

create policy "documents_update_own"
  on public.documents for update to authenticated
  using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "documents_delete_own"
  on public.documents for delete to authenticated
  using (public.can_access_property(property_id));

drop policy if exists "property_owner_costs_select_own" on public.property_owner_costs;
drop policy if exists "property_owner_costs_insert_own" on public.property_owner_costs;
drop policy if exists "property_owner_costs_update_own" on public.property_owner_costs;
drop policy if exists "property_owner_costs_delete_own" on public.property_owner_costs;
drop policy if exists "property_owner_costs_anon_all" on public.property_owner_costs;
drop policy if exists "property_owner_costs_authenticated_all" on public.property_owner_costs;

create policy "property_owner_costs_select_own"
  on public.property_owner_costs for select to authenticated
  using (public.can_access_property(property_id));

create policy "property_owner_costs_insert_own"
  on public.property_owner_costs for insert to authenticated
  with check (public.can_access_property(property_id));

create policy "property_owner_costs_update_own"
  on public.property_owner_costs for update to authenticated
  using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "property_owner_costs_delete_own"
  on public.property_owner_costs for delete to authenticated
  using (public.can_access_property(property_id));

-- Profils des co-détenteurs visibles entre eux (pour baux / quittances)
drop policy if exists "owner_profiles_select_coowners" on public.owner_profiles;
create policy "owner_profiles_select_coowners"
  on public.owner_profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.property_coowners me
      join public.property_coowners other on other.property_id = me.property_id
      where me.user_id = auth.uid()
        and other.user_id = owner_profiles.id
    )
  );
