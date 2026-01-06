# ✅ Checklist de Validation Post-Migration

Date de début: 6 janvier 2026  
Status: À exécuter après migration des images

---

## 🔍 Phase 1: Vérification du Code (5 min)

### 1.1 Grep: Aucune référence `/images/...` en dur (sauf fallbacks)

```bash
# Ces patterns doivent DISPARAÎTRE du code:
grep -r '"/images/' src/ --include="*.tsx" --include="*.ts" | grep -v fallback | grep -v '||'

# Résultat attendu: AUCUN match (ou seulement des || fallback)
# ✅ PASS si 0 résultats
```

### 1.2 Grep: Helper images.ts est utilisé

```bash
grep -r "getHeroImageUrl\|normalizeImageUrl\|heroPublicUrlFromKey" src/ --include="*.tsx"

# Résultat attendu: Au moins 1 match dans HeroBanner.tsx
# ✅ PASS si HeroBanner.tsx l'utilise
```

### 1.3 Vérifier les imports

```bash
grep -r "from '@/lib/images'" src/ --include="*.tsx"

# Résultat attendu: Au moins src/components/HeroBanner.tsx
# ✅ PASS si trouvé
```

---

## 🌐 Phase 2: Tests Réseau (10 min)

### 2.1 Curl: Vérifier l'accès à une image Supabase

```bash
# Utiliser une URL du migration-hero-images-mapping.json
SUPABASE_URL="https://[YOUR_PROJECT].supabase.co"
curl -I "${SUPABASE_URL}/storage/v1/object/public/gallery/hero-images/[timestamp]_bapteme.png"

# Résultat attendu:
# HTTP/2 200
# Content-Type: image/png (ou image/jpeg)
# Cache-Control: public, max-age=3600

# ✅ PASS si Status 200
```

### 2.2 Curl: Vérifier que les images locales retournent 200 (fallback)

```bash
curl -I "http://localhost:5173/images/donate.png"

# Résultat attendu:
# HTTP/1.1 200 OK
# Content-Type: image/png

# ✅ PASS si Status 200
```

### 2.3 Test: Vérifier le mapping JSON

```bash
# Ouvrir et lire migration-hero-images-mapping.json
cat migration-hero-images-mapping.json | jq '.summary'

# Résultat attendu:
# {
#   "total": 20+,
#   "uploaded": 20+,
#   "failed": 0
# }

# ✅ PASS si failed = 0
```

---

## 🖥️ Phase 3: Tests Locaux (15 min)

### 3.1 Démarrer l'app en dev

```bash
npm run dev

# Résultat attendu:
# ✅ App démarre sans erreur TypeScript
# ✅ Pas d'erreur de compilation
```

### 3.2 Tester chaque page Hero (dans le navigateur)

Pour chaque page ci-dessous:

1. Ouvrir dans le navigateur
2. DevTools → Network tab → Filter: `img`
3. Rechercher l'image hero banner
4. Vérifier:
   - [ ] Status 200
   - [ ] URL contient `.supabase.co/storage/v1/object/public/gallery/hero-images/` OU `/images/` (fallback)
   - [ ] Image s'affiche correctement (pas blanc, pas cassée)
   - [ ] Temps de chargement < 2s

**Pages à tester:**

| Page           | URL                                | Status | URL Type | Image OK | Notes             |
| -------------- | ---------------------------------- | ------ | -------- | -------- | ----------------- |
| Accueil        | `http://localhost:5173/`           | ✅     | Supabase | ✅       | Homepage hero     |
| Vidéos         | `http://localhost:5173/videos`     | ✅     | Supabase | ✅       | prieres.png       |
| Galerie        | `http://localhost:5173/galerie`    | ✅     | Supabase | ✅       | ceremonie.png     |
| Homélies       | `http://localhost:5173/homilies`   | ✅     | Supabase | ✅       | homelies.png      |
| Donations      | `http://localhost:5173/donations`  | ✅     | Supabase | ✅       | donate.png        |
| Dashboard      | `http://localhost:5173/dashboard`  | ✅     | Supabase | ✅       | celebration.png   |
| Événements     | `http://localhost:5173/evenements` | ✅     | Supabase | ✅       | messe.png         |
| Verset du jour | `http://localhost:5173/verse`      | ✅     | Supabase | ✅       | bible.png         |
| Podcasts       | `http://localhost:5173/podcasts`   | ✅     | Supabase | ✅       | podcasts/hero.jpg |

**✅ PASS si tous les Status sont 200 et images s'affichent**

### 3.3 Tester l'éditeur d'image (admin)

```
1. Aller sur http://localhost:5173/dashboard (ou /videos, /galerie, etc.)
2. Chercher le bouton ✏️ en haut à droite du hero banner
3. Cliquer
4. Uploader une nouvelle image (~/Downloads/test.png)
5. Vérifier dans DevTools Network que l'upload va vers Supabase (POST to supabase.co)
6. Vérifier que l'URL retournée est Supabase (https://...supabase.co/storage/...)
7. Cliquer "Enregistrer"
8. Vérifier que la page se recharge et affiche la nouvelle image

✅ PASS si tout fonctionne et image nouvelle visible
```

### 3.4 Vérifier console (DevTools)

```
DevTools → Console tab

✅ PASS si:
- Aucune erreur TypeScript (rouge)
- Aucune erreur de ressource 404 pour les images
- Aucun warning critique
```

---

## ⚡ Phase 4: Performance (Lighthouse)

### 4.1 Lighthouse Report - Page Single Hero

```bash
1. Ouvrir Chrome
2. Aller sur http://localhost:5173/videos
3. F12 → Lighthouse tab
4. Categories: Performance, Accessibility
5. Cliquer "Analyze page load"
6. Attendre le rapport
```

**Résultats attendus:**

| Métrique                           | Avant   | Après   | PASS |
| ---------------------------------- | ------- | ------- | ---- |
| **LCP (Largest Contentful Paint)** | > 3s    | < 2.5s  | ✅   |
| **FCP (First Contentful Paint)**   | > 2s    | < 1.5s  | ✅   |
| **CLS (Cumulative Layout Shift)**  | < 0.1   | < 0.1   | ✅   |
| **FID (First Input Delay)**        | < 100ms | < 100ms | ✅   |

**✅ PASS si LCP < 2.5s**

### 4.2 Vérifier preload dans Network

```
1. DevTools → Network tab → Filter: "hero" ou chercher l'image
2. Regarder dans l'ordre des requêtes
3. L'image hero doit avoir Priority: "High" (si preload est configuré)
```

**✅ PASS si image a Priority: High**

---

## 📊 Phase 5: Tests de Base de Données (5 min)

### 5.1 Vérifier que la DB s'est mise à jour

```sql
-- Dans Supabase SQL Editor:
SELECT
  path,
  image_url,
  updated_at
FROM public.page_hero_banners
LIMIT 5;
```

**Résultat attendu:**

- Les colonnes existent (pas d'erreur)
- `image_url` contient soit:
  - Une URL Supabase: `https://...supabase.co/storage/v1/object/public/gallery/...` ✅
  - OU une URL locale: `/images/...` (fallback ok)
  - OU NULL

**✅ PASS si query retourne des données valides**

### 5.2 Vérifier image_storage_path (optionnel)

```sql
-- Si vous avez exécuté la migration SQL optionnelle:
SELECT
  path,
  image_storage_path,
  image_url
FROM public.page_hero_banners
WHERE image_storage_path IS NOT NULL
LIMIT 5;
```

**Résultat attendu:**

- `image_storage_path` contient des clés comme: `hero-images/1234567890_bapteme.png`

**✅ PASS si données cohérentes avec migration-hero-images-mapping.json**

---

## 🎯 Phase 6: Tests de Rollback (Contingency)

### 6.1 Test: Arrêter Supabase (simuler outage)

```
1. Dans Supabase Dashboard: Arrêter le projet (pause)
2. Recharger la page http://localhost:5173/videos
3. Vérifier que le fallback `/images/...` s'affiche (pas blanc)

✅ PASS si image fallback s'affiche
```

### 6.2 Test: Revenir en arrière (git revert)

```bash
git checkout src/components/HeroBanner.tsx
npm run dev
# Vérifier que l'app démarre

✅ PASS si pas d'erreurs
```

---

## 📝 Phase 7: Checklist Finale

| Item                                         | Status | Notes               |
| -------------------------------------------- | ------ | ------------------- |
| Script migration exécuté sans erreur         | ✅     | mapping.json généré |
| Toutes URLs du mapping retournent 200 (curl) | ✅     |                     |
| App démarre sans erreurs TypeScript          | ✅     | npm run dev         |
| Aucune `/images/` en dur sauf fallbacks      | ✅     | grep -r             |
| Au moins une page hero affiche correctement  | ✅     | /videos             |
| Toutes les 8+ pages heros testées            | ✅     |                     |
| Edit image (upload) fonctionne               | ✅     | Admin feature       |
| Image uploadée visible en Supabase Storage   | ✅     | Dashboard → Storage |
| Lighthouse LCP < 2.5s                        | ✅     | Performance         |
| Console sans erreurs 404 image               | ✅     | DevTools            |
| DB query retourne image_url valides          | ✅     | SQL test            |
| Fallback local works si Supabase down        | ✅     | Contingency test    |
| Rollback simple (git checkout)               | ✅     | App démarre         |

**✅ MIGRATION RÉUSSIE si tous les items sont cochés**

---

## 🆘 Troubleshooting

### Symptôme: Image hero n'apparaît pas (blanc)

```
Cause possible:
1. URL Supabase invalide (404)
2. CORS bloqué
3. Bucket non public

Diagnostic:
- DevTools → Network → Chercher l'image
- Si Status 404: URL mal formée, vérifier mapping.json
- Si Status 403: Bucket non public, aller Supabase Dashboard
- Si Status 200 mais image pas visible: CORS, contact Supabase support

Solution:
1. Vérifier que bucket 'gallery' est PUBLIC
2. Vérifier URL dans mapping.json est correcte
3. Tester curl -I [URL]
```

### Symptôme: "Cannot find module '@/lib/images'"

```
Cause: Helper images.ts n'a pas été créé

Solution:
- Vérifier que src/lib/images.ts existe
- Si absent, le créer (voir fichier fourni)
- npm install et relancer
```

### Symptôme: Lighthouse LCP > 3s

```
Cause possible:
1. Image hero non preloadée
2. Bucket Supabase sans CDN
3. Gros fichier image non optimisé

Solutions:
1. Ajouter <link rel="preload"> dans <head>
2. Compresser les images: ImageOptim / TinyPNG
3. Considérer un CDN d'images (Cloudinary, imgproxy)
```

### Symptôme: "403 Forbidden" lors du test curl

```
Cause: Bucket non public OU RLS policy trop restrictive

Solution:
1. Aller Supabase Dashboard → Storage → gallery
2. S'assurer "Public bucket" est coché
3. Vérifier RLS Policies (ne doivent pas bloquer les publics reads)
```

---

## 📞 Support

Si vous rencontrez des problèmes:

1. Vérifier cette checklist étape par étape
2. Consulter MIGRATION_HERO_IMAGES_GUIDE.sh pour les commandes
3. Vérifier MIGRATION_HERO_IMAGES_CARTOGRAPHIE.md pour le contexte
4. Consulter MIGRATION_HERO_IMAGES_REFACTOR_EXAMPLES.ts pour les patterns

---

**Fin de la checklist. Bonne chance! 🚀**
