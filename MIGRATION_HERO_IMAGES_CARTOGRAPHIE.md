# 📋 Cartographie des Conflits d'Images du Hero Banner

Date: 6 janvier 2026  
Bucket Supabase: `gallery`  
Composant cible: `HeroBanner.tsx`

## 1. Images Locales Utilisées dans le Code

| Chemin Local                           | Utilisé dans | Fichier Source                     | Ligne | Fallback |
| -------------------------------------- | ------------ | ---------------------------------- | ----- | -------- |
| `/images/bible.png`                    | HeroBanner   | `src/pages/Verse.tsx`              | 355   | Oui ✅   |
| `/images/prieres.png`                  | HeroBanner   | `src/pages/VideosPage.tsx`         | 106   | Oui ✅   |
| `/images/bapteme.png`                  | HeroBanner   | `src/pages/ProfilePage.tsx`        | 205   | Oui ✅   |
| `/images/prayer.png`                   | HeroBanner   | `src/pages/Prayers.tsx`            | 676   | Oui ✅   |
| `/images/podcasts/hero.jpg`            | HeroBanner   | `src/pages/Podcasts.tsx`           | 215   | Oui ✅   |
| `/images/gallery/homelies.png`         | HeroBanner   | `src/pages/Homilies.tsx`           | 136   | Oui ✅   |
| `/images/gallery/prieres.png`          | HeroBanner   | `src/pages/Live.tsx`               | 114   | Oui ✅   |
| `/images/ceremonie.png`                | HeroBanner   | `src/pages/GalleryPage.tsx`        | 59    | Oui ✅   |
| `/images/messe.png`                    | HeroBanner   | `src/pages/EventsPage.tsx`         | 73    | Oui ✅   |
| `/images/donations.png`                | HeroBanner   | `src/pages/Receipts.tsx`           | 201   | Oui ✅   |
| `/images/bapteme.png`                  | HeroBanner   | `src/pages/DonationsHistory.tsx`   | 194   | Oui ✅   |
| `/images/donate.png`                   | HeroBanner   | `src/pages/Donate.tsx`             | 610   | Oui ✅   |
| `/images/gallery.png`                  | HeroBanner   | `src/pages/Documents.tsx`          | 266   | Oui ✅   |
| `/images/events/bapteme.png`           | HeroBanner   | `src/pages/DashboardAnalytics.tsx` | 66    | Oui ✅   |
| `/images/videos/celebration.png`       | HeroBanner   | `src/pages/Dashboard.tsx`          | 65    | Oui ✅   |
| `/images/bapteme.png`                  | HeroBanner   | `src/pages/AdminDashboard.tsx`     | 17    | Oui ✅   |
| `/images/announcements.png`            | HeroBanner   | `src/pages/AnnouncementsPage.tsx`  | 615   | Oui ✅   |
| `/images/gallery/homelies.png`         | HeroBanner   | `src/pages/Notifications.tsx`      | 359   | Oui ✅   |
| `/images/prieres.png`                  | HeroBanner   | `src/pages/MembersPage.tsx`        | 128   | Oui ✅   |
| `/images/videos/default-thumbnail.jpg` | Misc         | `src/pages/Dashboard.tsx`          | 170   | Oui ✅   |
| `/images/videos/default-thumbnail.jpg` | Misc         | `src/pages/DashboardAnalytics.tsx` | 170   | Oui ✅   |

## 2. Fichiers Trouvés dans `/public/images/`

### Root images

- `bapteme.png` ✅ Utilisé (18 références)
- `celebration.png` ✅ Utilisé
- `ceremonie.png` ✅ Utilisé
- `ecran01.png`
- `ecran01 - Copie.png`
- `hero.jpeg`
- `hero.png`
- `hero1.png`
- `hero3.png`
- `hero5.png`
- `messe.png` ✅ Utilisé
- `noel.png`
- `prieres.png` ✅ Utilisé

### Sous-dossiers

- `events/` → (vérifier contenu)
- `gallery/` → `homelies.png` ✅ Utilisé, `prieres.png` ✅ Utilisé
- `homelies/` → (vérifier contenu)
- `messes/` → (vérifier contenu)
- `test/` → (contenu test, peut être ignoré)
- `videos/` → `celebration.png` ✅ Utilisé, `default-thumbnail.jpg` ✅ Utilisé
- `podcasts/` → `hero.jpg` (fichier manquant ⚠️, cf. `/images/podcasts/hero.jpg`)

## 3. Sources Multiples Identifiées

### Pattern: `backgroundImage={hero?.image_url || "/images/fallback.png"}`

**Problème**: Mix DB + local

- La colonne `page_hero_banners.image_url` stocke soit :
  - Une URL Supabase publique (ex: `https://xyz.supabase.co/storage/v1/object/public/gallery/...`)
  - Soit laissée vide, triggerant le fallback `/images/...`
- Les images locales ne sont pas uploadées vers Supabase

### Pattern: `HeroBgEditor` (éditeur modal)

**Problème**: Retourne `publicUrl` OU `objectURL` (fallback local)

- `uploadFile(file)` → Supabase → `publicUrl` ✅
- `uploadDirectoryImage(file, bucket)` → Supabase → `publicUrl` ✅
- Fallback: `URL.createObjectURL(file)` → Objet local ❌ (non persistant)

## 4. Impact sur les Performances (LCP)

| Issue                                                            | Sévérité   | Impact                          |
| ---------------------------------------------------------------- | ---------- | ------------------------------- |
| Images locales `/images/` ne sont pas pré-compressées/optimisées | 🔴 Haute   | Gros fichiers, pas de WebP/AVIF |
| Images Supabase sans CDN                                         | 🟡 Moyenne | Latence réseau variable         |
| Pas de `preload` pour LCP (HeroBanner)                           | 🔴 Haute   | LCP > 2.5s probable             |
| Pas de `width`/`height` explicites                               | 🟡 Moyenne | Layout shift pendant chargement |
| Images non lazy-loadées (images secondaires)                     | 🟡 Moyenne | Charge au-delà du viewport      |

## 5. Plan de Correction

### Phase 1: Upload des images locales

- Exécuter script `scripts/migrate-hero-images.mjs`
- Génère `migration-hero-images-mapping.json`
- Uploader toutes les images vers `gallery/hero-images/{...}`

### Phase 2: Mettre à jour `page_hero_banners`

SQL (post-upload, après validation du mapping) :

```sql
-- Ajouter colonne image_storage_path (stocke la clé, pas l'URL)
ALTER TABLE public.page_hero_banners
ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

-- Exemples de migration (généré du mapping):
UPDATE public.page_hero_banners
SET image_storage_path = 'hero-images/[timestamp]_bapteme.png'
WHERE image_url LIKE '%/images/bapteme.png';
```

### Phase 3: Refactor Frontend

- Ajouter helper `src/lib/images.ts` → `heroPublicUrlFromKey()`
- Normaliser `HeroBanner.tsx` pour construire URL depuis `image_storage_path`
- Ajouter `preload` pour LCP dans Layout/Page
- Garder fallbacks `/images/...` pour compatibilité transitoire

### Phase 4: Tests & Validation

- Grep: vérifier qu'il n'y a plus d'URL `/images/...` en dur
- Curl: tester que chaque URL Supabase retourne 200
- Lighthouse: vérifier LCP < 2.5s
- Tests manuels: chaque page with/without DB hero

## 6. Fichiers à Modifier (Ordre de Priorité)

1. **src/lib/images.ts** (nouveau) → Helper centralisant la normalisation d'URL
2. **src/components/HeroBanner.tsx** → Intégrer helper, ajouter preload
3. **src/hooks/usePageHero.ts** → Optionnel: supporter `image_storage_path`
4. **src/components/HeroBgEditor.tsx** → Optionnel: documenter que `publicUrl` est obligatoire
5. **src/components/HomepageHero.tsx** → Secondaire (utilise aussi `image_url`)

## 7. Mapping JSON Output

Après exécution du script, vérifier `migration-hero-images-mapping.json` :

```json
{
  "timestamp": "2026-01-06T...",
  "bucket": "gallery",
  "supabaseUrl": "https://xyz.supabase.co",
  "images": [
    {
      "localPath": "/images/bapteme.png",
      "storageKey": "hero-images/1234567890_bapteme.png",
      "publicUrl": "https://xyz.supabase.co/storage/v1/object/public/gallery/hero-images/1234567890_bapteme.png"
    },
    ...
  ],
  "summary": {
    "total": 23,
    "uploaded": 23,
    "failed": 0
  }
}
```

## 8. Note: Fichiers Manquants ⚠️

- `/images/podcasts/hero.jpg` → Utilisé dans `src/pages/Podcasts.tsx:215` mais n'existe pas dans `/public/images/`
  - Action: Créer/uploader ce fichier manuellement OU remplacer par un autre fallback

---

**Prochaines étapes:**

1. ✅ Audit: Complété
2. ⏳ Exécuter script migration
3. ⏳ Valider mapping.json
4. ⏳ Refactor `HeroBanner.tsx` + ajouter helper
5. ⏳ Tests & validation post-migration
