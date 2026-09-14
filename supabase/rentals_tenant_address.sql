-- Colonnes locataires pour baux / quittances + statut actif.
-- À exécuter dans l'éditeur SQL de Supabase.

alter table public.rentals add column if not exists tenant_street_number text;
alter table public.rentals add column if not exists tenant_street_name text;
alter table public.rentals add column if not exists tenant_city text;
alter table public.rentals add column if not exists tenant_postal_code text;
alter table public.rentals add column if not exists tenant_phone text;
alter table public.rentals add column if not exists is_active boolean not null default true;

update public.rentals set is_active = true where is_active is null;
