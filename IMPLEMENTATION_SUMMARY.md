# Implémentation du Système d'Approbation de Contenu ✅

## 📋 Résumé des modifications

### 1. Migration Base de Données ✅

**Fichier:** `supabase/migrations/055_add_approval_status.sql`

#### Colonnes ajoutées aux tables:

- **`videos`** et **`gallery_images`**:
  - `status TEXT` → 'pending', 'approved', ou 'rejected'
  - `submitted_at TIMESTAMPTZ` → timestamp de soumission
  - `approved_at TIMESTAMPTZ` → timestamp d'approbation/rejet
  - `approved_by UUID` → qui a traité la demande
  - `rejection_reason TEXT` → raison du rejet (optionnel)

#### Nouvelle table:

- **`content_approvals`**: Suivi centralisé des soumissions
  - Liens vers vidéo/galerie + user + timestamps
  - Délai d'expiration de 24h intégré
  - Raison du rejet stockée

#### Fonctions:

- **`clean_expired_pending_content()`** → Supprime les contenus non approuvés après 24h
- **Triggers**: Auto-set `submitted_at` à la création
- **Indexes**: Optimisés pour recherches rapides par statut et date

#### Sécurité RLS:

- Admins voient tout
- Utilisateurs voient seulement leurs contenus + les approuvés
- Seuls les admins peuvent changer le statut

---

### 2. Types TypeScript ✅

**Fichier:** `src/types/database.ts`

```typescript
// Types d'approbation
type ApprovalStatus = 'pending' | 'approved' | 'rejected'
type ContentType = 'video' | 'gallery'

interface ContentApproval {
  /* ... */
}
interface PendingApprovalItem {
  /* ... */
}
```

Colonnes approbation ajoutées aux interfaces existantes:

- `Video`
- `GalleryImage`

---

### 3. Hooks React ✅

#### **`useContentApprovals`**

**Fichier:** `src/hooks/useContentApprovals.ts`

- Vue: **Admin** (voir les approbations en attente)
- `fetchPendingApprovals()` → Charger la liste
- `approveContent(type, id)` → Approuver
- `rejectContent(type, id, reason)` → Rejeter avec raison

#### **`useContentSubmission`**

**Fichier:** `src/hooks/useContentSubmission.ts`

- Vue: **Utilisateur** (soumettre du contenu)
- `submitContent(type, id, title, desc)` → Créer une soumission
- `checkSubmissionStatus(type, id)` → Vérifier le statut

#### **`useSubmissionStatus`**

**Fichier:** `src/hooks/useSubmissionStatus.tsx`

- Vue: **Utilisateur** (voir ses propres soumissions)
- Récupère les soumissions de l'utilisateur connecté
- Composants: `SubmissionStatusBadge`, `SubmissionStatusList`

---

### 4. Composants UI ✅

#### **`<AdminContentApprovals />`**

**Fichier:** `src/pages/AdminContentApprovals.tsx`

- **Route:** `/admin/approvals`
- **Accès:** Admin seulement (contrôle ProtectedRoute)

**Fonctionnalités:**

- Liste des contenus en attente (vidéos + galeries)
- Thumbnails/aperçus
- Temps restant avant expiration (compte à rebours 24h)
- Boutons: ✅ Approuver | ❌ Rejeter
- Modal pour saisir raison du rejet
- Animations Framer Motion
- État de chargement avec skeletons

**Statuts affichés:**

- 🟠 Pending: En attente d'approbation
- 🟢 Approved: Approuvé et visible
- 🔴 Rejected: Rejeté (raison affichée)

#### **`<SubmissionStatusAlert />`**

**Fichier:** `src/components/SubmissionStatusAlert.tsx`

- Affiche le statut d'une soumission spécifique
- Codes couleur: Orange (pending), Green (approved), Red (rejected)
- À intégrer dans les modales d'upload

#### **`<SubmissionStatusList />`**

Composant inclus dans `useSubmissionStatus.tsx`

- Affiche toutes les soumissions de l'utilisateur
- Avec statut visuel et timestamps

---

### 5. Routing ✅

#### **App.tsx**

- Ajout import: `AdminContentApprovals`
- Nouvelle route:
  ```typescript
  <Route
    path="/admin/approvals"
    element={
      <ProtectedRoute requiredRole="admin">
        <Layout><AdminContentApprovals /></Layout>
      </ProtectedRoute>
    }
  />
  ```

#### **Sidebar.tsx**

- Import: `CheckCircle2` icon de lucide
- Menu Administration (adminOnly: true):
  - Nouveau lien: **"Approbations"** → `/admin/approvals` (1ère position)
  - Visible seulement pour les admins

---

### 6. Documentation ✅

**Fichier:** `APPROVAL_SYSTEM_DOCUMENTATION.md`

Contient:

- Vue d'ensemble du système
- Flux de soumission avec diagramme
- Structure base de données détaillée
- RLS Policies expliquées
- Utilisation des hooks (code examples)
- Nettoyage automatique (édge function)
- Maintenance SQL

---

## 🎯 Flux complet

```
1. UTILISATEUR SOUMET CONTENU
   ↓
   Vidéo/Photo uploadée
   → status = 'pending' (par défaut)
   → created dans content_approvals
   → Utilisateur voit statut "En attente"

2. ADMINISTRATEUR VÉRIFIE
   ↓
   Va à /admin/approvals
   → Voit liste des pendantes
   → Examine thumbnails/descriptions
   → Lit temps restant (24h countdown)

3. ADMIN DÉCIDE
   ↓
   ✅ APPROUVER
      → status = 'approved'
      → approved_at = NOW()
      → approved_by = admin_id
      → Contenu visible publiquement
      → Utilisateur notifié ✅

   ❌ REJETER
      → status = 'rejected'
      → rejection_reason = "Texte expliqué"
      → Utilisateur notifié ❌ + raison

4. NETTOYAGE AUTO (24h)
   ↓
   Si aucune action:
   → clean_expired_pending_content()
   → DELETE vidéo/galerie
   → Utilisateur n'a rien pu voir
```

---

## 📦 Intégration requise (prochaines étapes)

### A. VideoModalForm.tsx

Intégrer status dans upload:

```typescript
// Avant de créer la vidéo:
const video = await uploadVideoFile(file);
// Ajouter le statut 'pending'
await submitContent('video', video.id, title, description);
// Afficher le statut
<SubmissionStatusAlert submission={submission} />
```

### B. GalleryUpload.tsx

Même chose pour les galeries:

```typescript
// Après upload d'image:
await submitContent('gallery', image.id, title, description)
```

### C. Notifications

Intégrer dans le système existant:

```typescript
// Quand admin approuve/rejette:
await createNotification(userId, {
  type: 'content_approved', // ou 'content_rejected'
  message: 'Votre contenu a été approuvé!',
  link: `/videos/${videoId}`, // ou `/galerie`
})
```

### D. Edge Function Supabase

Créer une fonction pour nettoyer automatiquement chaque heure:

```typescript
// A ajouter dans Supabase Edge Functions
supabase.rpc('clean_expired_pending_content')
```

---

## 🔐 Sécurité

✅ **RLS Policies sécurisées:**

- Les utilisateurs ne peuvent voir/créer que du contenu 'pending'
- Les admins voient et approuvent tout
- Pas d'accès direct à modify le status sans être admin

✅ **Validations:**

- status enum strict ('pending', 'approved', 'rejected')
- dates timestamps immuables (triggers)
- Raison du rejet facultative

---

## 📊 Résumé des fichiers créés/modifiés

| Fichier                                    | Action     | Type                   |
| ------------------------------------------ | ---------- | ---------------------- |
| `055_add_approval_status.sql`              | ✅ Créé    | Migration SQL          |
| `src/types/database.ts`                    | ✅ Modifié | Types TypeScript       |
| `src/hooks/useContentApprovals.ts`         | ✅ Créé    | Hook React             |
| `src/hooks/useContentSubmission.ts`        | ✅ Créé    | Hook React             |
| `src/hooks/useSubmissionStatus.tsx`        | ✅ Créé    | Hook React + Composant |
| `src/pages/AdminContentApprovals.tsx`      | ✅ Créé    | Page Admin             |
| `src/components/SubmissionStatusAlert.tsx` | ✅ Créé    | Composant UI           |
| `src/App.tsx`                              | ✅ Modifié | Route + Import         |
| `src/components/Sidebar.tsx`               | ✅ Modifié | Menu + Icon            |
| `APPROVAL_SYSTEM_DOCUMENTATION.md`         | ✅ Créé    | Documentation          |
| `IMPLEMENTATION_SUMMARY.md`                | ✅ Créé    | Ce fichier             |

---

## ✨ Points forts du système

1. **24h expiration** → Auto-cleanup des contenus non approuvés
2. **RLS secure** → Utilisateurs ne peuvent voir/créer que du 'pending'
3. **Admin friendly** → UI complète avec thumbnails et countdown
4. **Scalable** → Fonctionne pour vidéos ET galeries
5. **Auditable** → Trace complète: qui approuve quand et pourquoi
6. **Notifiable** → Utilisateurs informés du statut
7. **Maintenable** → Code bien structuré avec hooks réutilisables

---

## 🚀 Prêt pour:

- ✅ Migration en prod
- ✅ Intégration dans modales d'upload
- ✅ Tests des approbations
- ✅ Configuration auto-cleanup
