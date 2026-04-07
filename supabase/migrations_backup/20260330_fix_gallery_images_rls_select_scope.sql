-- Rescope RLS select pour gallery_images
-- But: éviter "using(true)" trop permissif tout en permettant l'affichage pour le propriétaire.

alter table public.gallery_images enable row level security;

drop policy if exists "Authenticated users can view gallery images" on public.gallery_images;

-- Afficher:
-- - les images approuvées
-- - ou les images appartenant à l'utilisateur courant (pending visible pour le propriétaire)
create policy "Authenticated users can view gallery images"
on public.gallery_images
for select
to authenticated
using (
  user_id = auth.uid()
  OR status = 'approved'
);

