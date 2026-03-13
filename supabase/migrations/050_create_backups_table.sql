-- =====================================================
-- MIGRATION: Création de la table backups
-- Permet de stocker des sauvegardes complètes de configuration
-- =====================================================

create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  data jsonb not null,
  size bigint,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.backups enable row level security;

drop policy if exists "Backups readable by super_admin" on public.backups;
drop policy if exists "Backups manageable by super_admin" on public.backups;

-- Lecture : seulement les super_admin
create policy "Backups readable by super_admin"
  on public.backups
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('super_admin')
    )
  );

-- Écriture / suppression : seulement les super_admin
create policy "Backups manageable by super_admin"
  on public.backups
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('super_admin')
    )
  );

