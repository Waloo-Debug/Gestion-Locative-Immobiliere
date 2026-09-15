-- Élargit le check document_type pour diagnostics + états des lieux
-- À exécuter dans Supabase → SQL Editor

alter table public.documents
  drop constraint if exists documents_document_type_check;

alter table public.documents
  add constraint documents_document_type_check
  check (
    document_type in (
      'Bail',
      'Quittance',
      'Diagnostic',
      'EtatDesLieuxEntree',
      'EtatDesLieuxSortie'
    )
  );
