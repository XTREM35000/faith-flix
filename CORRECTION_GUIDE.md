# 🔧 Guide de Correction - Erreurs 406 et Données Vides

## 📋 Corrections Effectuées

### ✅ **1. Code - Amélioration de `useHomepageContent.ts`**

- Ajout de `.limit(1)` et meilleure gestion des erreurs 406
- Logging détaillé pour diagnostiquer les problèmes d'authentification
- Gestion gracieuse des cas où `homepage_content` n'existe pas

**Résultat**: L'erreur 406 affichera maintenant un warning mais ne bloquera plus l'app

---

### ✅ **2. Code - Amélioration de `useGalleryImages.ts`**

- Ajout d'une propriété `isEmpty` pour détecter si la galerie est vide
- Logging amélioré avec emojis pour meilleur suivi
- Messages d'avertissement détaillés si aucune image n'est trouvée

**Résultat**: Meilleur débogage et gestion d'état plus claire

---

### ✅ **3. Code - Amélioration de `GalleryGrid.tsx`**

- Affichage d'un message élégant "Aucune photo disponible" si vide
- Amélioration du texte des boutons
- Import de l'icône `ImageOff` pour le message vide
- Meilleure gestion de l'état de chargement

**Résultat**: UX améliorée avec message explicite si la galerie est vide

---

## 🗄️ Migrations SQL Créées

### **Fichier: `004_fix_homepage_content_and_gallery.sql`**

À exécuter dans Supabase Editor SQL pour:

1. **Nettoyer `homepage_content`** - Insérer contenu par défaut
2. **Remplir `gallery_images`** - Ajouter 4 images de test
3. **Créer les index** - Optimiser les performances
4. **Vérifier les politiques RLS** - S'assurer que tout fonctionne

### **Fichier: `999_diagnostic_queries.sql`**

Script de diagnostic pour exécuter manuellement:

- Vérifier le contenu des tables
- Vérifier les politiques RLS
- Vérifier la structure des colonnes
- Diagnostiquer les problèmes de données

---

## 🚀 INSTRUCTIONS D'EXÉCUTION

### **ÉTAPE 1: Exécuter le Script de Diagnostic**

```sql
-- 1. Allez dans Supabase Dashboard → SQL Editor
-- 2. Créez une nouvelle requête
-- 3. Copiez le contenu de: supabase/migrations/999_diagnostic_queries.sql
-- 4. Exécutez et vérifiez les résultats

-- Cherchez particulièrement:
-- - COUNT(*) pour homepage_content (doit être > 0 si vous avez les données)
-- - COUNT(*) pour gallery_images (doit être > 0 pour voir les images)
```

### **ÉTAPE 2: Exécuter le Script de Correction (SI NÉCESSAIRE)**

```sql
-- SI les résultats du diagnostic montrent des données vides:
-- 1. Copiez le contenu de: supabase/migrations/004_fix_homepage_content_and_gallery.sql
-- 2. Exécutez-le dans Supabase SQL Editor

-- ⚠️ NOTE: Assurez-vous que auth.uid() retourne un UUID valide
-- Sinon, remplacez auth.uid() par un UUID existant de la table profiles
```

### **ÉTAPE 3: Vérifier les Politiques RLS**

```sql
-- Les politiques doivent être:
-- homepage_content:
--   - "Homepage content is viewable" → SELECT si is_active = true
--   - "Admins can manage homepage" → ALL si admin
--
-- gallery_images:
--   - Doit permettre SELECT si is_public = true
```

### **ÉTAPE 4: Tester dans le Navigateur**

1. **Recharger la page d'accueil** → Pas d'erreur 406
2. **Vérifier la console** → Messages de log détaillés
3. **Accéder à `/galerie`** → Voir les images ou message "vide"

---

## 🐛 Débogage Avancé

### **Si vous avez toujours l'erreur 406 sur `homepage_content`:**

```sql
-- Vérifier si la table a des données
SELECT * FROM homepage_content LIMIT 1;

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'homepage_content';

-- Essayer une requête simple
SELECT COUNT(*) FROM homepage_content;
```

**Solutions**:

1. Vérifier que vous êtes authentifié (avoir un `auth.uid()`)
2. Vérifier que `is_active = true` pour les enregistrements
3. Créer manuellement un enregistrement avec la console Supabase

### **Si la galerie est vide:**

```sql
-- Insérer une image de test rapidement
INSERT INTO gallery_images (
  title,
  image_url,
  user_id,
  is_public
) VALUES (
  'Photo de test',
  'https://via.placeholder.com/600x400?text=Test',
  (SELECT id FROM profiles LIMIT 1),
  true
) RETURNING id, title;
```

### **Si vous voyez des erreurs de Type TypeScript:**

```bash
# Recompiler le projet
npm run build

# Ou en mode dev
npm run dev
```

---

## 📊 Résumé des Changements

| Fichier                 | Modification                      | Impact                   |
| ----------------------- | --------------------------------- | ------------------------ |
| `useHomepageContent.ts` | Meilleure gestion des erreurs 406 | ✅ Pas de crash          |
| `useGalleryImages.ts`   | Ajout de `isEmpty` + logging      | ✅ Meilleur débogage     |
| `GalleryGrid.tsx`       | Message vide élégant              | ✅ UX améliorée          |
| `004_fix_...sql`        | Données de test + index           | ✅ Performance + contenu |
| `999_diagnostic...sql`  | Script de diagnostic              | ✅ Débogage facile       |

---

## ✅ CHECKLIST DE VÉRIFICATION

- [ ] Exécuter le script diagnostic et vérifier les counts
- [ ] Si vide, exécuter le script de correction
- [ ] Recharger la page d'accueil (pas d'erreur 406)
- [ ] Console: Voir les logs "📸 Images chargées: X valides"
- [ ] Page galerie: Voir les images ou message "Aucune photo"
- [ ] Pas d'erreurs rouges dans la console
- [ ] Browser DevTools → Network: vérifier les status codes

---

## 💡 Prochaines Étapes Recommandées

1. **Ajouter plus d'images** via le dashboard Supabase ou API
2. **Ajouter un formulaire d'upload** pour que les admins ajoutent des images
3. **Configurer les webhooks** Supabase pour revalidation du cache
4. **Mettre en place des analytics** pour suivre les vues

---

**Créé**: 2 janvier 2026
**Version**: 1.0
**Status**: ✅ Prêt à être exécuté
