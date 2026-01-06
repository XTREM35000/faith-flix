#!/bin/bash
# 🚀 GUIDE D'EXÉCUTION : Migration des Images Hero Banner vers Supabase

## Phase 1: Préparation (5 min)

### 1.1 Vérifier les variables d'environnement
```bash
# Vérifier que .env.local (ou .env) contient:
grep VITE_SUPABASE_URL .env
grep VITE_SUPABASE_ANON_KEY .env
# Résultat attendu:
# VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
# VITE_SUPABASE_ANON_KEY=[YOUR_KEY]
```

### 1.2 Installer dépendances de migration
```bash
npm install --save-dev @supabase/supabase-js glob fs-extra dotenv
```

### 1.3 Vérifier le bucket 'gallery' dans Supabase
- Aller à: https://supabase.com/dashboard → Votre Projet → Storage
- Vérifier que le bucket `gallery` existe et est **PUBLIC**
- Si manquant, le créer: "Create a new bucket" → Name: `gallery` → Public

---

## Phase 2: Migration des Images (10-15 min)

### 2.1 Exécuter le script de migration
```bash
# À partir de la racine du projet:
node scripts/migrate-hero-images.mjs
```

**Résultat attendu:**
```
🚀 Début de la migration des images du Hero Banner...
   Bucket: gallery
   Source: c:\axe\faith-flix\public\images

📂 [X] fichier(s) image(s) détecté(s):
  📤 Upload: bapteme.png...
    ✅ Succès: https://[PROJECT].supabase.co/storage/v1/object/public/gallery/hero-images/...
  📤 Upload: celebration.png...
    ✅ Succès: ...
  ... [autres fichiers]

📊 Résumé de la migration:
   Total:    23
   Uploadés: 23 ✅
   Échoués:  0 ❌

📄 Mapping sauvegardé à: c:\axe\faith-flix\migration-hero-images-mapping.json

✨ Migration réussie! Tous les fichiers ont été uploadés.
```

### 2.2 Vérifier le mapping généré
```bash
# Ouvrir le fichier de mapping
cat migration-hero-images-mapping.json
```

**Structure du fichier:**
```json
{
  "timestamp": "2026-01-06T...",
  "bucket": "gallery",
  "supabaseUrl": "https://[PROJECT].supabase.co",
  "images": [
    {
      "localPath": "/images/bapteme.png",
      "storageKey": "hero-images/1234567890_bapteme.png",
      "publicUrl": "https://[PROJECT].supabase.co/storage/v1/object/public/gallery/hero-images/..."
    },
    ...
  ],
  "summary": { "total": 23, "uploaded": 23, "failed": 0 }
}
```

### 2.3 Test : Vérifier que les URLs sont accessibles
```bash
# Prendre une URL du mapping et tester:
curl -I "https://[PROJECT].supabase.co/storage/v1/object/public/gallery/hero-images/..."

# Résultat attendu:
# HTTP/2 200
# Content-Type: image/png
# Cache-Control: public, max-age=3600
```

---

## Phase 3: Mise à Jour de la Base de Données (5 min)

### 3.1 [OPTIONNEL] Ajouter colonne image_storage_path
Si vous souhaitez stocker les clés de stockage directement (plutôt que les URLs):

**Dans Supabase SQL Editor:**
```sql
-- Ajouter colonne pour clé de stockage
ALTER TABLE public.page_hero_banners 
ADD COLUMN IF NOT EXISTS image_storage_path TEXT DEFAULT NULL;

-- Exemple : si vous aviez déjà des images locales, 
-- vous pouvez mapper automatiquement:
-- UPDATE public.page_hero_banners 
-- SET image_storage_path = 'hero-images/[timestamp]_bapteme.png'
-- WHERE image_url LIKE '%/images/bapteme.png';
```

**Note:** Ce pas est optionnel. Le refactoring frontend fonctionne aussi en conservant `image_url`.

---

## Phase 4: Tests Locaux (10 min)

### 4.1 Lancer l'app en mode développement
```bash
npm run dev
```

### 4.2 Tester chaque page Hero
Visiter dans le navigateur :

```
http://localhost:5173/videos         ← Check /images/prieres.png → Supabase
http://localhost:5173/galerie        ← Check /images/ceremonie.png → Supabase
http://localhost:5173/homilies       ← Check /images/gallery/homelies.png → Supabase
http://localhost:5173/donations      ← Check /images/donate.png → Supabase
http://localhost:5173/dashboard      ← Check /images/videos/celebration.png → Supabase
```

**Pour chaque page :**
1. Ouvrir DevTools → Network tab
2. Rechercher l'image (`img` qui charge la bannière)
3. Vérifier:
   - ✅ Status: 200
   - ✅ URL contient `supabase.co/storage/v1/object/public/gallery/hero-images/`
   - ✅ Temps de chargement < 1s
   - ✅ Image s'affiche correctement

### 4.3 Test : Éditer une image hero (admin)
1. Aller sur `/dashboard` (ou une page admin)
2. Cliquer le bouton "Éditer" (✏️) en haut à droite du hero banner
3. Uploader une nouvelle image
4. Vérifier dans DevTools que l'URL retournée par `HeroBgEditor` est Supabase (`https://...supabase.co/...`)
5. Vérifier qu'elle est sauvegardée dans la DB : requête SQL:
   ```sql
   SELECT path, image_url FROM public.page_hero_banners 
   WHERE path = '/dashboard' LIMIT 1;
   ```

---

## Phase 5: Vérification de Performance (LCP)

### 5.1 Lighthouse Report
```bash
# Ouvrir une page hero dans Chrome
# DevTools → Lighthouse → Analyze page load

# Résultats attendus après optimisation:
# - LCP: < 2.5 sec
# - CLS: < 0.1
# - FID: < 100ms
```

### 5.2 Vérifier preload (DevTools → Network)
Rechercher dans `<head>` la ligne :
```html
<link rel="preload" as="image" href="https://...supabase.co/.../hero-images/..." />
```

Si visible dans le Network tab avec priorité "High", c'est bon.

---

## Phase 6: Nettoyage (5 min) — OPTIONNEL

### 6.1 [FUTUR] Supprimer les images locales non utilisées
Une fois confirmé que toutes les images Supabase fonctionnent:

```bash
# Archiver (ne pas supprimer tout de suite, pour rollback possible)
mv public/images public/images.backup.2026-01-06

# Ou supprimer sélectivement si vous êtes confiant
# rm public/images/bapteme.png public/images/prieres.png ...
```

### 6.2 Archiver le fichier de mapping
```bash
# Conserver la trace de la migration
mkdir -p docs/migrations
cp migration-hero-images-mapping.json docs/migrations/
git add docs/migrations/migration-hero-images-mapping.json
```

---

## 🛑 Troubleshooting

### Problem: "ERREUR: VITE_SUPABASE_URL ... manquants"
**Solution:**
- Vérifier que `.env` ou `.env.local` existe
- Vérifier les noms exacts: `VITE_SUPABASE_URL` (pas `SUPABASE_URL`)
- Relancer le script

### Problem: "403 Forbidden" lors de l'upload
**Solution:**
- Vérifier que le bucket `gallery` est PUBLIC (pas private)
- Vérifier que `VITE_SUPABASE_ANON_KEY` a les permissions de upload
- Vérifier RLS policies sur Supabase

### Problem: "404 Not Found" pour une image uploadée
**Solution:**
- Vérifier que la clé dans l'URL correspond au `storageKey` du mapping
- Tester manuellement dans Supabase Dashboard → Storage → gallery

### Problem: Image ne s'affiche pas après refactor
**Solution:**
- Vérifier que `src/lib/images.ts` est importé correctement
- Vérifier que `getHeroImageUrl()` retourne une URL valide (console DevTools)
- Fallback `/images/...` devrait toujours marcher en dernier recours

---

## ✅ Checklist de Validation Finale

- [ ] Script migration exécuté sans erreurs
- [ ] Fichier `migration-hero-images-mapping.json` généré
- [ ] Toutes les URLs du mapping retournent 200 (curl test)
- [ ] App démarre sans erreurs TypeScript
- [ ] Page `/videos` affiche image hero correctement
- [ ] Page `/galerie` affiche image hero correctement
- [ ] Page `/dashboard` (admin) permet modifier l'image hero
- [ ] Nouvelle image uploadée est visible en Supabase Storage
- [ ] Lighthouse LCP < 2.5s sur une page hero
- [ ] Pas d'erreurs console dans DevTools
- [ ] Pas de références `/images/...` en dur dans le code (sauf fallbacks)

---

## 📞 Rollback en cas de Problème

Si vous devez revenir en arrière :

```bash
# 1. Revert du code
git checkout src/components/HeroBanner.tsx
git checkout src/lib/images.ts

# 2. Restaurer images locales (si vous les aviez supprimées)
mv public/images.backup.2026-01-06 public/images

# 3. (Optionnel) Réinitialiser la BD
# DELETE FROM page_hero_banners; 
# (mais attention, cela supprimera les configurations existantes)
```

---

**Fin du guide. Bonne migration! 🚀**
