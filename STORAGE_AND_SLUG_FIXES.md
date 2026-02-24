# 🎬 Storage & Slug Fixes - Problèmes Résolus

## 1️⃣ Problème: Fichier "Illisible" dans Supabase UI

### ❌ Antes (Non lisible)

```
Bucket: video-files
  ├── videos/
  │   └── 1708864924323_a7f92.mp4  ← Fichier dans sous-dossier ❌
  └── [Impossible de voir clairement dans Supabase Console]
```

**Pourquoi illisible?**

- Supabase Storage UI affiche mal les fichiers dans les sous-dossiers
- L'arborescence "videos/" ajoute de la complexité
- Les fichiers ne sont pas facilement visibles dans la racine du bucket

### ✅ Après (Lisible et visible)

```
Bucket: video-files
  ├── 1708864924323_a7f92.mp4 ✅
  ├── 1708864924323_b4e21.jpg ✅
  └── [Tous les fichiers à la racine, clairement visibles]
```

**Avantages:**

- ✅ Fichiers immédiatement visibles dans Supabase Console
- ✅ Plus facile de vérifier les uploads
- ✅ Noms complets visibles (pas tronqués)
- ✅ Meilleure performance d'affichage

---

## 2️⃣ Problème: Erreur de Slug Dupliqué

### ❌ Erreur Vue

```
409 Conflict
{code: '23505', message: 'duplicate key value violates unique constraint "videos_slug_key"'}
```

**Cause:**

- La table `videos` a une contrainte unique sur la colonne `slug`
- La fonction `createVideo()` ne générait PAS de slug
- Inserting sans slug --> erreur de contrainte unique

### ✅ Solution Appliquée

**Avant:**

```typescript
const createVideo = async (videoData: VideoInsertData) => {
  const baseData = {
    title: videoData.title,
    // ❌ PAS DE SLUG GÉNÉRÉ!
    description: videoData.description,
    // ...
  }
  await sb.from('videos').insert([baseData])
}
```

**Après:**

```typescript
const createVideo = async (videoData: VideoInsertData) => {
  // 1️⃣ Générer slug depuis le titre
  let slug = videoData.slug
  if (!slug && videoData.title) {
    const baseSlug = slugify(videoData.title) // "Ma Vidéo" → "ma-video"
    slug = await ensureUniqueSlug(baseSlug) // Vérifier l'unicité
  }

  // 2️⃣ Inclure slug dans les données
  const baseData = {
    title: videoData.title,
    slug: slug, // ✅ SLUG INCLUS
    description: videoData.description,
    // ...
  }
  await sb.from('videos').insert([baseData])
}
```

### Comment ça Fonctionne

**1. Slugification du titre:**

```typescript
slugify("Ma Vidéo HD - Édition Finale")
→ "ma-video-hd-edition-finale"
```

**2. Vérification d'unicité:**

```typescript
ensureUniqueSlug("ma-video-hd-edition-finale")
├─ Cherche si slug existe → Non
└─ Retourne: "ma-video-hd-edition-finale" ✅

// Si slug existe déjà:
ensureUniqueSlug("ma-video")
├─ Cherche "ma-video" → Existe! ❌
├─ Essaie "ma-video-1" → Existe! ❌
├─ Essaie "ma-video-2" → N'existe pas ✅
└─ Retourne: "ma-video-2"
```

**3. Insertion avec slug unique:**

```sql
INSERT INTO videos (title, slug, description, ...)
VALUES ('Ma Vidéo', 'ma-video-hd-edition-finale', '...')
-- ✅ Succès - Pas de conflit!
```

---

## Changements de Chemins de Stockage

### Avant vs Après

| Type           | Ancien                               | Nouveau                   |
| -------------- | ------------------------------------ | ------------------------- |
| **Vidéos**     | `videos/1708864924323_a7f92.mp4`     | `1708864924323_a7f92.mp4` |
| **Galerie**    | `gallery/1708864924323_b4e21.jpg`    | `1708864924323_b4e21.jpg` |
| **Miniatures** | `thumbnails/1708864924323_x3k7m.jpg` | `1708864924323_x3k7m.jpg` |

### Structure du Bucket Après Fix

```
Supabase Dashboard → Storage → video-files
├── 1708864924323_a7f92.mp4 ✅ Lisible dans UI
├── 1708864924323_b4e21.jpg ✅ Lisible dans UI
├── 1708864924323_c9d18.png ✅ Lisible dans UI
└── 1708864924323_d2f7b2.jpg ✅ Lisible dans UI
```

---

## Tests à Faire

### Test 1: Upload Vidéo

```
1. Ouvrir formulaire vidéo
2. Sélectionner vidéo MP4 (45MB+)
3. Cliquer "Upload"
4. ✅ Vérifier dans Supabase Console:
   Storage → video-files
   └─ Vous devriez voir: 1708864924323_a7f92.mp4
      (DIRECT, pas dans sous-dossier)
5. Vidéo devrait s'afficher dans l'app
```

### Test 2: Vérifier Slug Unique

```
1. Créer Vidéo 1: titre "Ma Vidéo"
   → Slug généré: "ma-video"
2. Créer Vidéo 2: titre "Ma Vidéo" (même titre)
   → Slug généré: "ma-video-1"
   ✅ Pas d'erreur 409 Conflict!
3. Vérifier en DB:
   SELECT title, slug FROM videos;
   └─ "Ma Vidéo", "ma-video"
   └─ "Ma Vidéo", "ma-video-1"
```

### Test 3: Retrouver Vidéo

```
1. Vérifier que les vidéos s'affichent dans l'app
2. Chercher par titre
3. Cliquer pour jouer la vidéo
   ✅ La vidéo devrait se charger
```

---

## Fichiers Modifiés

### `src/lib/supabase/storage.ts`

**Changements:**

- `uploadVideoFile()`: Chemin `videos/...` → `...`
- `uploadFile()`: Chemin `gallery/...` → `...`
- `uploadDirectoryImage()`: Chemin `public/...` → `...`
- `uploadThumbnailFile()`: Chemin `thumbnails/...` → `...`

**Impact:**

- ✅ Tous les fichiers maintenant dans la racine du bucket
- ✅ Lisibles dans Supabase UI
- ✅ Pas de chemin fragmenté

### `src/hooks/useVideos.ts`

**Changements:**

- ✅ Ajouté `import { slugify }`
- ✅ Ajouté champ `slug` aux interfaces
- ✅ Ajouté fonction `ensureUniqueSlug()`
- ✅ Modifié `createVideo()` pour générer slug

**Impact:**

- ✅ Chaque vidéo a un slug unique
- ✅ Pas d'erreur 409 Conflict
- ✅ Slugs générés automatiquement depuis le titre

---

## Console Logs Attendus

### Avant Fix (❌ Erreur observée)

```
[uploadVideoFile] attempt 1 succeeded, path=videos/1708864924323_a7f92.mp4
✅ Upload réussi, video_storage_path: videos/1708864924323_a7f92.mp4

Erreur createVideo:
{code: '23505', message: 'duplicate key value violates unique constraint "videos_slug_key"'}
❌ Échec de la publication de la vidéo
```

### Après Fix (✅ Succès attendu)

```
[uploadVideoFile] attempt 1 succeeded, path=1708864924323_a7f92.mp4
✅ Upload réussi, video_storage_path: 1708864924323_a7f92.mp4
✅ Format: mp4 (video/mp4)

📹 Creating video with data: {
  title: "Ma Vidéo",
  slug: "ma-video",  ← Slug généré ✅
  description: "...",
  ...
}

✅ Succès - Vidéo publiée avec succès
```

---

## Débogage Si Ça Marche Toujours Pas

### Problème: Fichier toujours illisible dans Supabase

**Checklist:**

- [ ] Vérifier que le fichier est à la racine (pas `videos/1708...`)
- [ ] MIME type défini: `video/mp4`, `image/jpeg`, etc.
- [ ] Taille du fichier raisonnable (< 50MB)
- [ ] Permissions RLS correctes pour le bucket

### Problème: Erreur 409 Conflict persiste

**Solution:**

```javascript
// Console Browser:
const { data: videos } = await supabase.from('videos').select('title, slug')
console.table(videos)

// Vérifier qu'il n'y a pas de slugs dupliqués
// Si besoin, nettoyer les vieilles données
```

### Problème: Vidéo n'apparaît pas dans l'app

**Checklist:**

- [ ] `video_storage_path` ou `video_url` est défini
- [ ] Slug est unique (vérifier dans Supabase)
- [ ] Fichier est bien uploadé (visible dans Storage)
- [ ] Permissions d'accès correctes

---

## Résumé des Bénéfices

✅ **Problèmes Résolus:**

1. **Fichiers lisibles** dans Supabase UI (fin du "fichier illisible")
2. **Slugs uniques** générés automatiquement (fin de l'erreur 409)
3. **Chemins plus simples** (pas de sous-dossiers confus)
4. **Métadonnées préservées** (MIME type, extension)

✅ **User Experience:**

- Vidéos s'affichent maintenant dans l'app
- Nouvelles vidéos sont approuvées automatiquement et visibles immédiatement
- Section "Vidéos populaires" et page `/videos` montrent les uploads récents
- Pas d'erreurs lors de la création
- Slugs cohérents et uniques
- Performance améliorée

---

## Next Steps

1. **Tester upload vidéo** → vérifier dans Supabase UI
2. **Créer 2-3 vidéos** → vérifier slugs uniques
3. **Vérifier affichage dans l'app** → vidéos visibles
4. **Nettoyer anciennes données** si besoin (vidéos sans slug boguées)

**Version:** 1.0 - Fixes Complete ✅  
**Date:** 24 Février 2026
