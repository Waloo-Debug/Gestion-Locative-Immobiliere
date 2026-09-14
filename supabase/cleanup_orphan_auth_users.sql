-- Nettoyage des comptes orphelins (sans mot de passe utilisable)
-- À exécuter dans Supabase → SQL Editor
-- Emails ciblés : guylian78320@gmail.com, guylian27600@gmail.com
--
-- ATTENTION : supprime aussi les biens / locations / documents rattachés à ces users.

begin;

-- 1) Identifier les users Auth
create temporary table tmp_orphan_users as
select id, email
from auth.users
where lower(email) in (
  'guylian78320@gmail.com',
  'guylian27600@gmail.com'
);

-- Contrôle avant suppression (résultat visible dans le SQL Editor)
select * from tmp_orphan_users;

-- 2) Invitations adressées à ces e-mails (même si created by quelqu’un d’autre)
delete from public.property_invites
where lower(email) in (
  'guylian78320@gmail.com',
  'guylian27600@gmail.com'
);

-- 3) Biens dont ils sont propriétaires
-- (rentals / documents / costs / coowners / invites liés au bien : cascade)
delete from public.properties
where user_id in (select id from tmp_orphan_users);

-- 4) Co-détention résiduelle sur des biens d’autres personnes
delete from public.property_coowners
where user_id in (select id from tmp_orphan_users);

-- 5) Profils applicatifs
delete from public.owner_profiles
where id in (select id from tmp_orphan_users);

-- 6) Comptes Auth (libère les e-mails pour une nouvelle inscription)
delete from auth.users
where id in (select id from tmp_orphan_users);

commit;

-- Vérification
select id, email from auth.users
where lower(email) in (
  'guylian78320@gmail.com',
  'guylian27600@gmail.com'
);
-- → doit renvoyer 0 ligne
