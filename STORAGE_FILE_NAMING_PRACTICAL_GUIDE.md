# 📁 Storage File Naming - Guide Pratique

## Avant vs Après

### Avant ❌ (Ancien système)

```
Fichier uploadé: "Ma Vidéo HD - Édition Finale.mp4" (45MB)
↓ Après sanitization
Chemin de stockage: video-files/1708864924323_Ma-Vidéo-HD---dition-Finale.mp4
Problème: Très long (74 caractères!), difficile à lire dans Supabase UI
```

### Après ✅ (Nouveau système)

```
Fichier uploadé: "Ma Vidéo HD - Édition Finale.mp4" (45MB)
↓ Traitement intelligent
Chemin court: videos/1708864924323_a7f92.mp4 (30 caractères)
Nom original: Stocké dans la base de données avec le titre
Extrait: .mp4
Type MIME: video/mp4 (préservé explicitement)
Résultat: Facile à trouver dans Supabase Storage! 🎉
```

---

## Ce que vous verrez dans Supabase Console

### Structure du Bucket

```
Supabase Dashboard → Storage → video-files
├── videos/
│   ├── 1708864924323_a7f92.mp4 ← Votre vidéo (chemin court)
│   ├── 1708864924324_b4e21.mp4 ← Autre vidéo
│   └── 1708864924325_c9d18.mp4 ← Une autre vidéo
│
├── thumbnails/
│   ├── 1708864924323_x3k7m.jpg ← Miniature
│   └── 1708864924324_y8n2p.jpg ← Autre miniature
│
└── [Aucun fichier avec nom long dans la racine!] ✅
```

**Avant** (ancien système):

```
Supabase Dashboard → Storage → video-files
├── video-files/1708864924323_Ma-Vidéo-HD---Édition-Finale.mp4 ← TRÈS LONG! ❌
├── video-files/1708864924324_Autre-Vidéo-Importante-2025.mp4 ← Trop long! ❌
└── [Impossible de tout voir en un coup d'œil]
```

---

## Exemple Complet du Workflow

### 1️⃣ Upload de Vidéo

```
Utilisateur sélectionne: "Ma vidéo HD - Édition Finale.mp4" (45MB)
                         └─ Nom original gardé en mémoire
```

### 2️⃣ Traitement Interne

```typescript
// Dans uploadVideoFile():
getFileExtension("Ma vidéo HD - Édition Finale.mp4")
→ "mp4"

mimeType = "video/mp4"

// Génération d'une clé unique COURTE
timestamp = 1708864924323 (maintenant en ms)
random_id = "a7f92c" (6 caractères aléatoires)
storage_path = "videos/1708864924323_a7f92.mp4" ← ✅ COURT ET UNIQUE
```

### 3️⃣ Upload vers Supabase

```
supabase.storage
  .from("video-files")  ← Bucket name
  .upload("videos/1708864924323_a7f92.mp4", file, {
    contentType: "video/mp4",  ← MIME type préservé
    cacheControl: "3600"
  })
```

### 4️⃣ Retour des données

```typescript
uploadVideoFile() retourne:
{
  key: "videos/1708864924323_a7f92.mp4",  ← Chemin court stocké en DB
  publicUrl: "https://cdn.supabase.co/storage/v1/object/public/video-files/videos/1708864924323_a7f92.mp4",
  originalName: "Ma vidéo HD - Édition Finale.mp4",  ← Original préservé
  mimeType: "video/mp4",  ← Explicitement set
  extension: "mp4"  ← Extrapped automatiquement
}
```

### 5️⃣ Sauvegarde en Base de Données

```sql
INSERT INTO videos (title, description, video_storage_path, ...)
VALUES ('Ma vidéo HD - Édition Finale', '...', 'videos/1708864924323_a7f92.mp4', ...);

-- Résultat:
-- title: "Ma vidéo HD - Édition Finale"  ← Nom complet ✅
-- video_storage_path: "videos/1708864924323_a7f92.mp4"  ← Chemin court ✅
```

### 6️⃣ Affichage dans UI

```
Dashboard Vidéos
├─ Titre: "Ma vidéo HD - Édition Finale" ← De la DB
├─ Statut: "Uploadée"
├─ Chemin: videos/1708864924323_a7f92.mp4 ← Court et clair ✅
├─ Date: 24 Février 2025 14:42:04
└─ Durée: 2:34 min
```

---

## Avantages Pratiques

### ✅ Pour les Développeurs

- Chemins beaucoup plus courts et faciles à manipuler
- MIME types correctement préservés → Meilleur streaming
- Métadonnées enrichies pour débogage
- Pas de caractères spéciaux dans les chemins

### ✅ Pour les Administrateurs (Supabase Console)

- Voir tous les fichiers sans scrollbar horizontal
- Noms de fichiers complets visibles (before était tronqué)
- Facile de trier par timestamp
- URLs de partage propres et courtes

### ✅ Pour les Utilisateurs Finaux

- Vidéos se chargent plus vite (chemin plus court = moins d'erreurs réseau)
- Noms originaux affichés partout (titre de vidéo)
- Pas d'artefacts de caractères spéciaux

---

## Trouver vos fichiers dans Supabase

### Méthode 1: Par Timestamp

```
// Toutes les vidéos uploadées le même jour
videos/1708864924323_*.mp4 ← Même timestamp = même batch
videos/1708864924323_a7f92.mp4
videos/1708864924323_b4e21.mp4

// Date du timestamp 1708864924323 = 24 Février 2025
```

### Méthode 2: Par Bucket

```
Bucket: video-files
├── videos/ ← Toutes les vidéos uploadées ici
├── thumbnails/ ← Non, c'est dans STORAGE_BUCKETS.VIDEOS
└── public/ ← Non, c'est dans STORAGE_BUCKETS.DIRECTORY_IMAGES
```

### Méthode 3: Via SQL

```sql
-- Trouver une vidéo
SELECT title, video_storage_path, created_at
FROM videos
WHERE title LIKE 'Ma vidéo%'
ORDER BY created_at DESC
LIMIT 1;

-- Résultat:
-- title: "Ma vidéo HD - Édition Finale"
-- video_storage_path: "videos/1708864924323_a7f92.mp4" ← Chemin court ✅
-- created_at: 2025-02-24T14:42:04Z
```

---

## Browser Console Logs

### Avant Upload

```
rien
```

### Pendant Upload

```
[uploadVideoFile] uploading Ma-vidéo-HD-Édition-Finale.mp4
  (mp4, video/mp4)
  → videos/1708864924323_a7f92.mp4 (45.23MB)

⏳ 1-5 minutes depending on file size...
```

### Après Succès ✅

```
[uploadVideoFile] attempt 1 succeeded, path=videos/1708864924323_a7f92.mp4
[uploadVideoFile] retrieving public URL for path=videos/1708864924323_a7f92.mp4
[uploadVideoFile] upload complete - publicUrl=https://cdn.supabase...

✅ Upload réussi, video_storage_path: videos/1708864924323_a7f92.mp4
✅ Format: mp4 (video/mp4)
✅ Succès - Vidéo téléversée (45.23MB)
```

### En cas d'Erreur ❌

```
[uploadVideoFile] attempt 1 failed, retrying...
  Error: timeout after 300s

[uploadVideoFile] attempt 2 failed
  Error: Network error

❌ Upload échoué: upload timeout after 300s

💡 Si vous voyez ça: votre connexion est trop lente pour 100MB+
```

---

## Comparaison des Formats

### Video Uploads

| Format    | Ancien                                                    | Nouveau                          |
| --------- | --------------------------------------------------------- | -------------------------------- |
| Exemple   | `video-files/1708864924323_Ma-Vidéo-HD-Edition-Final.mp4` | `videos/1708864924323_a7f92.mp4` |
| Longueur  | 75 chars                                                  | 33 chars                         |
| MIME      | Non préservé                                              | ✅ `video/mp4`                   |
| Trouvable | ❌ Tronqué dans UI                                        | ✅ Complet en UI                 |

### Gallery Images

| Format   | Ancien                                                    | Nouveau                           |
| -------- | --------------------------------------------------------- | --------------------------------- |
| Exemple  | `uploads/1708864924323_My-Beautiful-Image-From-Paris.jpg` | `gallery/1708864924323_b4e21.jpg` |
| Longueur | 58 chars                                                  | 33 chars                          |
| MIME     | Non préservé                                              | ✅ `image/jpeg`                   |

### Thumbnails

| Format   | Ancien                         | Nouveau                              |
| -------- | ------------------------------ | ------------------------------------ |
| Exemple  | `thumbnails/1708864924323.jpg` | `thumbnails/1708864924323_x3k7m.jpg` |
| Longueur | 33 chars                       | 35 chars                             |
| Avantage | N/A                            | ✅ Consistant avec autres uploads    |

---

## Checkliste Post-Upload

Vérifiez ceci après upload d'une vidéo:

- [ ] Console logs montrent: `[uploadVideoFile] ... succeeded`
- [ ] Notification verte: "✅ Vidéo téléversée (XXmB)"
- [ ] Formulaire affiche chemin: `videos/1708864924323_a7f92.mp4`
- [ ] Supabase Storage montre fichier court: `videos/1708864924323_a7f92.mp4`
- [ ] Nom original préservé dans DB: "Ma vidéo HD - Édition Finale"
- [ ] Type MIME correct: `video/mp4`
- [ ] URL publique fonctionne et les vidéos se jouent ✅

---

## Débogage

### Problème: Fichier non trouvé après upload

**Solution:**

```javascript
// Console:
const result = await uploadVideoFile(file)
console.log('Chemin stockage:', result.key) // Copier ce chemin
console.log('URL publique:', result.publicUrl)

// Aller dans Supabase Console
// Storage → video-files → Chercher le chemin
```

### Problème: MIME type incorrect

**Vérifier:**

```javascript
const file = new File([], 'video.mp4', { type: 'video/mp4' })
//                                              ^^^^^^^^^^^^ Important!
const result = await uploadVideoFile(file)
console.log('MIME type:', result.mimeType) // Doit être video/mp4
```

### Problème: Extension perdue

**Ne devrait pas arriver, mais vérifier:**

```javascript
const result = await uploadVideoFile(file)
console.log('Extension:', result.extension) // Doit être "mp4"
console.log('Chemin:', result.key) // Doit avoir .mp4 à la fin
```

---

## Technical Reference

### Source Code Locations

- Upload logic: [src/lib/supabase/storage.ts](src/lib/supabase/storage.ts) (lines 24-110)
- Helper functions: [src/lib/supabase/storage.ts](src/lib/supabase/storage.ts) (lines 16-21)
- Form handler: [src/components/VideoModalForm.tsx](src/components/VideoModalForm.tsx) (lines 180-220)

### Key Functions

```typescript
// Extract extension safely
getFileExtension("video.mp4") → "mp4"

// Upload with metadata preservation
uploadVideoFile(file) → {
  key: string,           // Short storage path
  publicUrl: string,     // Full public URL
  originalName: string,  // Original filename
  mimeType: string,      // MIME type
  extension: string      // File extension
}
```

---

## FAQ

**Q: Pourquoi vous avez changé le système de noms?**
A: Les anciens noms étaient trop longs (74+ caractères), causant des problèmes d'affichage dans Supabase et des chemins d'URL fragiles. Les nouveaux noms (30 chars) sont plus robustes.

**Q: Mes anciennes vidéos vont-elles disparaître?**
A: Non! Les anciens chemins comme `video-files/1708864924323_Old-Name.mp4` fonctionnent toujours. Seules les nouvelles uploads utilisent le format court.

**Q: Où est stocké le nom original?**
A: Dans votre base de données (colonne `title` ou `filename`). Le chemin de stockage ne contient qu'une clé unique courte.

**Q: Comment je retrouve une vidéo?**
A: Via le titre dans votre DB. Le titre original est préservé et l'utilisateur cherche par titre, pas par chemin de fichier.

**Q: Ça va ralentir les uploads?**
A: Non, c'est plus rapide! Les chemins courts = moins de données à traiter.

---

**Last Updated:** 24 Février 2025  
**Version:** 1.0 - Storage Optimization Complete ✅
