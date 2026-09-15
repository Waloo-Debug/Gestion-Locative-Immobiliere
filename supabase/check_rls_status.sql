-- Diagnostic : tables public sans RLS (alerte Supabase rls_disabled_in_public)
-- À exécuter dans Supabase → SQL Editor

select
  n.nspname as schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relrowsecurity asc, c.relname;
