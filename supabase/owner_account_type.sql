-- Ajoute le type de compte bailleur + SIRET (entreprises).
-- À exécuter dans l'éditeur SQL de Supabase.

alter table public.owner_profiles
  add column if not exists account_type text
    check (account_type is null or account_type in ('personne_morale', 'entreprise'));

alter table public.owner_profiles
  add column if not exists siret text;

comment on column public.owner_profiles.account_type is
  'personne_morale | entreprise — un même e-mail de contact peut avoir un compte de chaque type';

comment on column public.owner_profiles.siret is
  'SIRET (14 chiffres), obligatoire si account_type = entreprise';
