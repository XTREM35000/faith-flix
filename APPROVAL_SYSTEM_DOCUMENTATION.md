# Système d'Approbation de Contenu (Vidéos & Photos)

## Vue d'ensemble

Ce système permet de contrôler les vidéos et photos ajoutées par les utilisateurs. Tous les contenus soumis doivent être approuvés par un administrateur ou un modérateur. Si un contenu n'est pas approuvé dans les 24 heures, il est automatiquement supprimé.

## Flux de soumission

```
Utilisateur soumet contenu (vidéo/photo)
              ↓
Contenu créé avec status = 'pending'
              ↓
Entrée créée dans content_approvals
              ↓
Admin accède à /admin/approvals
              ↓
Admin approuve ou rejette
              ↓
Utilisateur notifié (via système de notifications)
```

## Structure de la base de données

### Table: `videos` (colonnes ajoutées)

```sql
- status TEXT: 'pending' | 'approved' | 'rejected'
- submitted_at TIMESTAMPTZ: date de soumission
- approved_at TIMESTAMPTZ: date d'approbation/rejet
- approved_by UUID: l'admin qui a approuvé
- rejection_reason TEXT: raison du rejet (optionnel)
```

### Table: `gallery_images` (colonnes ajoutées)

```sql
- status TEXT: 'pending' | 'approved' | 'rejected'
- submitted_at TIMESTAMPTZ: date de soumission
- approved_at TIMESTAMPTZ: date d'approbation/rejet
- approved_by UUID: l'admin qui a approuvé
- rejection_reason TEXT: raison du rejet (optionnel)
```

### Table: `content_approvals` (nouvelle)

```sql
CREATE TABLE content_approvals (
  id UUID PRIMARY KEY,
  content_type TEXT ('video' | 'gallery'),
  content_id UUID,
  user_id UUID REFERENCES auth.users,
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ (submitted_at + 24h),
  status TEXT ('pending' | 'approved' | 'rejected'),
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
);
```

## Nettoyage automatique

### Fonction: `clean_expired_pending_content()`

- Supprime les vidéos avec `status = 'pending'` et `submitted_at < NOW() - 24 heures`
- Supprime les galeries avec `status = 'pending'` et `submitted_at < NOW() - 24 heures`
- Nettoie les entrées de `content_approvals` avec `expires_at < NOW()`
- **À exécuter**: Chaque heure via une tâche cron Supabase Edge Function

```sql
-- Pour tester manuellement:
SELECT clean_expired_pending_content();
```

## Hooks React

### `useContentApprovals()`

Utilisé par les administrateurs pour voir et gérer les approbations.

```typescript
const { pendingItems, loading, error, approveContent, rejectContent, refetch } =
  useContentApprovals()
```

**Méthodes:**

- `approveContent(contentType, contentId)` - Approuver un contenu
- `rejectContent(contentType, contentId, reason)` - Rejeter avec raison
- `refetch()` - Rafraîchir la liste

### `useContentSubmission()`

Utilisé par les utilisateurs lors de la création de contenu.

```typescript
const { submitContent, checkSubmissionStatus, isSubmitting, error } = useContentSubmission()
```

**Méthodes:**

- `submitContent(type, id, title, description)` - Créer une soumission
- `checkSubmissionStatus(type, id)` - Vérifier le statut d'une soumission

### `useSubmissionStatus()`

Affiche le statut des soumissions de l'utilisateur actuel.

```typescript
const { submissions, loading, error } = useSubmissionStatus()
```

## Composants

### `<AdminContentApprovals />`

Page d'administration complète pour gérer les approbations.

- Localisation: `/admin/approvals`
- Affiche les contenus en attente avec thumbnails
- Temps restant avant expiration
- Boutons d'approbation/rejet
- Formulaire pour raison du rejet

### `<SubmissionStatusAlert />`

Affiche le statut d'une soumission (pending/approved/rejected).

- À intégrer dans les modales d'upload

### `<SubmissionStatusBadge />`

Badge visuel du statut (pending/approved/rejected).

### `<SubmissionStatusList />`

Liste complète des soumissions de l'utilisateur avec statuts.

## RLS Policies

### Vidéos

```sql
- "Admin can view all videos" → Les admins voir tout
- "User can view own pending videos" → Les users voir leurs propres en attente + les approuvés
- "User can insert videos as pending" → Les users créer avec status='pending'
- "Admin can update video status" → Les admins mettre à jour le statut
```

### Galerie

```sql
- "Admin can view all gallery images" → Les admins voir tout
- "User can view own pending gallery images" → Les users voir leurs propres en attente + les approuvés
- "User can insert gallery images as pending" → Les users créer avec status='pending'
- "Admin can update gallery image status" → Les admins mettre à jour le statut
```

## Utilisation dans les modales d'upload

### Lors de la création de vidéo/photo:

1. Créer le contenu avec `status = 'pending'` (par défaut)
2. Appeler `submitContent()` pour créer une entrée d'approbation
3. Afficher `<SubmissionStatusAlert />` avec le statut

### Exemple:

```typescript
const { submitContent } = useContentSubmission()

const handleUpload = async (file: File, title: string, description: string) => {
  // 1. Uploader le fichier et créer le record
  const video = await uploadVideo(file)

  // 2. Soumettre pour approbation
  await submitContent('video', video.id, title, description)

  // 3. Afficher le statut
  showNotification('Votre vidéo a été soumise pour approbation!')
}
```

## Route de navigation

Nouvelle route ajoutée au Sidebar (groupe Administration):

```
Administration > Approbations → /admin/approvals
```

## Migration SQL

La migration `055_add_approval_status.sql` contient:

- ALTER TABLE pour ajouter les colonnes aux vidéos et galeries
- CREATE TABLE pour `content_approvals`
- CREATE INDEXES pour les recherches optimisées
- CREATE FUNCTION pour le nettoyage automatique
- RLS POLICIES pour la sécurité des données
- TRIGGERS pour gérer les timestamps

## Notifications aux utilisateurs

Les utilisateurs reçoivent une notification quand:

1. ✅ Leur contenu a été **approuvé**
2. ❌ Leur contenu a été **rejeté** (avec raison)
3. ⏰ Leur contenu est en attente (optionnel)

À implémenter dans le système de notifications existant.

## Maintenance

### Vérifier les approbations en attente:

```sql
SELECT * FROM content_approvals WHERE status = 'pending' ORDER BY expires_at ASC;
```

### Voir les contenus expirés (non approuvés après 24h):

```sql
SELECT * FROM videos WHERE status = 'pending' AND submitted_at < NOW() - INTERVAL '24 hours';
SELECT * FROM gallery_images WHERE status = 'pending' AND submitted_at < NOW() - INTERVAL '24 hours';
```

### Nettoyer manuellement:

```sql
SELECT clean_expired_pending_content();
```

## Prochaines étapes

1. ✅ Migration base de données (055_add_approval_status.sql)
2. ✅ Hooks React (useContentApprovals, useContentSubmission, useSubmissionStatus)
3. ✅ Page d'administration (/admin/approvals)
4. ✅ Composants UI (AdminContentApprovals, SubmissionStatusAlert, etc.)
5. ✅ Route dans App.tsx et Sidebar
6. ⏳ Intégrer dans VideoModalForm et GalleryUpload
7. ⏳ Implémenter le nettoyage automatique (Edge Function Supabase)
8. ⏳ Système de notifications pour les approbations/rejets
9. ⏳ Tests et validation
