-- Fix gallery_images: ajouter paroisse_id (utilisé côté app) + policies de lecture pour authenticated

-- 1) Colonne paroisse_id (si l'app filtre par paroisse)
alter table public.gallery_images
  add column if not exists paroisse_id uuid;

-- Best-effort FK si la table paroisses existe
do $$
begin
  if to_regclass('public.paroisses') is not null then
    begin
      alter table public.gallery_images
        add constraint gallery_images_paroisse_id_fkey
        foreign key (paroisse_id) references public.paroisses(id) on delete set null;
    exception when duplicate_object then
      -- ignore
    end;
  end if;
end $$;

create index if not exists idx_gallery_images_paroisse_created_at
  on public.gallery_images (paroisse_id, created_at desc);

-- 2) RLS: permettre aux users authentifiés de lire (sinon la galerie est vide une fois connecté,
-- surtout si certaines images sont non publiques / en attente).
alter table public.gallery_images enable row level security;

-- Ajout d’une policy SELECT authenticated (sans supprimer la policy publique existante)
drop policy if exists "Authenticated users can view gallery images" on public.gallery_images;
create policy "Authenticated users can view gallery images"
on public.gallery_images
for select
to authenticated
using (true);

-- 3) DELETE: super_admin peut supprimer n’importe quelle image (en plus du propriétaire)
drop policy if exists "Super admin can delete any gallery image" on public.gallery_images;
create policy "Super admin can delete any gallery image"
on public.gallery_images
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
  )
);

