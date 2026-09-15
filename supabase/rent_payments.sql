-- Loyers à confirmer + rappels détenteurs + notifications in-app
-- À exécuter dans Supabase → SQL Editor

-- Jour de virement / début des rappels (par locataire)
alter table public.rentals
  add column if not exists rent_due_day integer;

update public.rentals
set rent_due_day = 5
where rent_due_day is null;

alter table public.rentals
  alter column rent_due_day set default 5;

alter table public.rentals
  drop constraint if exists rentals_rent_due_day_check;

alter table public.rentals
  add constraint rentals_rent_due_day_check
  check (rent_due_day is null or (rent_due_day >= 1 and rent_due_day <= 28));

-- Canal de rappel (par détenteur)
alter table public.owner_profiles
  add column if not exists reminder_channel text;

update public.owner_profiles
set reminder_channel = 'email'
where reminder_channel is null;

alter table public.owner_profiles
  alter column reminder_channel set default 'email';

alter table public.owner_profiles
  drop constraint if exists owner_profiles_reminder_channel_check;

alter table public.owner_profiles
  add constraint owner_profiles_reminder_channel_check
  check (reminder_channel in ('email', 'in_app', 'none'));

-- Paiements de loyer par période
create table if not exists public.rent_payments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  rental_id uuid not null references public.rentals (id) on delete cascade,
  period text not null,
  status text not null default 'pending',
  paid_at timestamptz,
  paid_by uuid references auth.users (id) on delete set null,
  last_reminded_on date,
  quittance_document_id uuid references public.documents (id) on delete set null,
  quittance_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (rental_id, period),
  constraint rent_payments_period_check check (period ~ '^\d{4}-\d{2}$'),
  constraint rent_payments_status_check check (status in ('pending', 'paid'))
);

create index if not exists rent_payments_property_id_idx on public.rent_payments (property_id);
create index if not exists rent_payments_status_period_idx on public.rent_payments (status, period);

alter table public.rent_payments enable row level security;

drop policy if exists "rent_payments_select" on public.rent_payments;
drop policy if exists "rent_payments_insert" on public.rent_payments;
drop policy if exists "rent_payments_update" on public.rent_payments;
drop policy if exists "rent_payments_delete" on public.rent_payments;

create policy "rent_payments_select"
  on public.rent_payments for select to authenticated
  using (public.can_access_property(property_id));

create policy "rent_payments_insert"
  on public.rent_payments for insert to authenticated
  with check (public.can_access_property(property_id));

create policy "rent_payments_update"
  on public.rent_payments for update to authenticated
  using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "rent_payments_delete"
  on public.rent_payments for delete to authenticated
  using (public.can_access_property(property_id));

-- Notifications in-app (détenteurs)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid references public.properties (id) on delete cascade,
  rent_payment_id uuid references public.rent_payments (id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_insert_own" on public.notifications;
drop policy if exists "notifications_delete_own" on public.notifications;

create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_insert_own"
  on public.notifications for insert to authenticated
  with check (user_id = auth.uid());

create policy "notifications_delete_own"
  on public.notifications for delete to authenticated
  using (user_id = auth.uid());
