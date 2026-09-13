-- Adresse du locataire pour les baux / quittances.
-- À exécuter dans l'éditeur SQL de Supabase.

alter table public.rentals add column if not exists tenant_street_number text;
alter table public.rentals add column if not exists tenant_street_name text;
alter table public.rentals add column if not exists tenant_city text;
alter table public.rentals add column if not exists tenant_postal_code text;
