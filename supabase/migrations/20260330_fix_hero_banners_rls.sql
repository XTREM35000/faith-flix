-- RLS pour public.page_hero_banners
-- Objectif: bloquer les insertions/updates sauf aux users super_admin.

alter table public.page_hero_banners enable row level security;

-- Ne pas casser la lecture publique existante (homepage, pages publiques, etc.)
-- On ne touche pas à "public_select" si elle existe.

-- Polices existantes trop permissives (issues de 020_create_page_hero_banners.sql)
drop policy if exists "authenticated_insert" on public.page_hero_banners;
drop policy if exists "authenticated_update" on public.page_hero_banners;
drop policy if exists "authenticated_delete" on public.page_hero_banners;

-- INSERT (super_admin uniquement)
create policy "Super admin can insert hero banners"
on public.page_hero_banners
for insert
to authenticated
with check (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'super_admin'
  )
);

-- SELECT (garde public_select existante; policy authentifiée supplémentaire OK)
create policy "Authenticated users can view hero banners"
on public.page_hero_banners
for select
to authenticated
using (true);

-- UPDATE (super_admin uniquement)
create policy "Super admin can update hero banners"
on public.page_hero_banners
for update
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'super_admin'
  )
)
with check (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'super_admin'
  )
);

-- DELETE (par sécurité, super_admin uniquement)
create policy "Super admin can delete hero banners"
on public.page_hero_banners
for delete
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'super_admin'
  )
);

