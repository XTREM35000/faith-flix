# 🚀 Prochaines étapes - Quick Start

## Phase 1: Déploiement immédiat ⏰ ~30 min

### 1. Exécuter la migration

```bash
# Via Supabase Dashboard > SQL Editor
# Copier-coller et exécuter: supabase/migrations/055_add_approval_status.sql
```

### 2. Vérifier l'installation

```bash
# Vérifier les colonnes
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('videos', 'gallery_images')
AND column_name LIKE 'status%';
```

### 3. Tester le flux

```bash
# Créer une vidéo test
INSERT INTO videos (title, user_id, video_storage_path, status)
VALUES ('Test', 'user-id', 'test.mp4', 'pending');

# Vérifier dans la page admin
# http://localhost:5173/admin/approvals
```

✅ **Résultat:** Système opérationnel en admin

---

## Phase 2: Intégration dans les formulaires ⏰ ~1h

### Fichiers à modifier:

#### A. `src/components/VideoModalForm.tsx`

```typescript
// 1. Ajouter imports
import useContentSubmission from '@/hooks/useContentSubmission'
import SubmissionStatusAlert from '@/components/SubmissionStatusAlert'

// 2. Dans le composant
const { submitContent, checkSubmissionStatus } = useContentSubmission()
const [submission, setSubmission] = useState(null)

// 3. Dans handleVideoUpload (après uploadVideoFile)
await submitContent('video', video.id, formData.title, formData.description)
const { submission } = await checkSubmissionStatus('video', video.id)
setSubmission(submission)

// 4. Ajouter avant le formulaire
<SubmissionStatusAlert submission={submission} />
```

#### B. `src/pages/GalleryPage.tsx` ou `src/components/GalleryUpload.tsx`

```typescript
// Même approche que VideoModalForm
// Utiliser 'gallery' au lieu de 'video'
```

#### C. `src/pages/VideosPage.tsx` et `src/pages/GalleryPage.tsx`

```typescript
// Modifier le select pour ne charger que les approuvés:
.eq('status', 'approved')  // ← Ajouter cette ligne
```

✅ **Résultat:** Utilisateurs voient "En attente" après upload

---

## Phase 3: Notifications aux utilisateurs ⏰ ~30 min

### Fichier: `src/lib/supabase/notifications.ts`

```typescript
// Ajouter ces 2 fonctions (voir INTEGRATION_GUIDE.md)
export const notifyContentApproved = async (...)
export const notifyContentRejected = async (...)
```

### Dans `src/pages/AdminContentApprovals.tsx`

```typescript
// Importer les fonctions
import { notifyContentApproved, notifyContentRejected } from '@/lib/supabase/notifications'

// Dans handleApprove
await notifyContentApproved(item.user_id, item.content_type, item.content_id, item.title)

// Dans handleReject
await notifyContentRejected(item.user_id, item.content_type, item.title, rejectReason)
```

✅ **Résultat:** Utilisateurs reçoivent notifications

---

## Phase 4: Nettoyage automatique ⏰ ~15 min (optionnel)

### Option A: Supabase Edge Function (recommandé)

```bash
# Créer le fichier
supabase functions new cleanup-expired-content

# Ajouter le code (voir SETUP_APPROVAL_SYSTEM.md)

# Déployer
supabase functions deploy cleanup-expired-content
```

### Option B: PostgreSQL pg_cron

```sql
-- Via Supabase SQL Editor
SELECT cron.schedule(
  'cleanup-expired-content',
  '0 * * * *',
  'SELECT clean_expired_pending_content()'
);
```

✅ **Résultat:** Contenus supprimés automatiquement après 24h

---

## Phase 5: Dashboard Admin ⏰ ~20 min

### Fichier: `src/pages/AdminDashboard.tsx`

```typescript
import useContentApprovals from '@/hooks/useContentApprovals'

export default function AdminDashboard() {
  const { pendingItems } = useContentApprovals()

  return (
    <>
      {/* Widget */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3>⏳ Approbations en attente</h3>
        <p className="text-3xl font-bold">{pendingItems.length}</p>
        <button onClick={() => navigate('/admin/approvals')}>
          Examiner
        </button>
      </div>

      {/* Liste rapide */}
      <div className="space-y-2">
        {pendingItems.slice(0, 5).map((item) => (
          <div key={item.id} className="flex justify-between p-3 bg-muted rounded">
            <span>{item.content_type === 'video' ? '🎬' : '🖼️'} {item.title}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(item.submitted_at).toLocaleString('fr-FR')}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
```

✅ **Résultat:** Admin voit nombre et liste en attente

---

## ✅ Ordre d'exécution recommandé

```
1. Migration SQL (5 min)
   ↓
2. Test manuel admin (10 min)
   ↓
3. Intégration VideoModalForm (20 min)
   ↓
4. Intégration GalleryUpload (15 min)
   ↓
5. Filter videos/galeries approuvées (10 min)
   ↓
6. Notifications (15 min)
   ↓
7. Nettoyage automatique (15 min) [OPTIONNEL]
   ↓
8. Dashboard admin (10 min)
   ↓
9. Tests e2e complets (30 min)
   ↓
10. ✅ Déploiement en production!
```

**Total: ~2h (ou 1h45 si passer le nettoyage auto)**

---

## 🧪 Tests essentiels à faire

### Test 1: Upload vidéo

```
✅ Aller à /videos → Ajouter vidéo
✅ Voir "En attente d'approbation"
✅ Vidéo N'APPARAÎT PAS sur /videos
✅ Admin voit dans /admin/approvals
```

### Test 2: Approbation

```
✅ Admin approuve
✅ Vidéo apparaît sur /videos
✅ Utilisateur reçoit notification
```

### Test 3: Rejet

```
✅ Upload nouvelle vidéo
✅ Admin rejette avec raison
✅ Utilisateur reçoit notification avec raison
✅ Utilisateur voit raison dans /profile (Mes soumissions)
```

### Test 4: Expiration 24h

```
✅ Créer vidéo test
✅ Modifier submitted_at à 25h ago
✅ Exécuter clean_expired_pending_content()
✅ Vérifier vidéo est supprimée
```

---

## 📝 Files de checklist

### ✅ Done

- [x] Migration 055_add_approval_status.sql
- [x] Types TypeScript (database.ts)
- [x] Hooks: useContentApprovals, useContentSubmission, useSubmissionStatus
- [x] Pages: AdminContentApprovals
- [x] Composants: SubmissionStatusAlert, Badge, List
- [x] Route /admin/approvals + Sidebar
- [x] Documentation complète

### ⏳ Todo

- [ ] Intégrer dans VideoModalForm.tsx
- [ ] Intégrer dans GalleryUpload.tsx
- [ ] Filtrer SELECT videos/galeries (WHERE status='approved')
- [ ] Notifications d'approbation/rejet
- [ ] Nettoyage automatique (Edge Function ou pg_cron)
- [ ] Widget AdminDashboard
- [ ] Onglet "Mes soumissions" dans ProfilePage
- [ ] Tests e2e complets
- [ ] Documentation utilisateur final
- [ ] Déploiement production

---

## 🔗 Fichiers de référence

```
Documentation:
├─ APPROVAL_SYSTEM_DOCUMENTATION.md     (Guide complet)
├─ SETUP_APPROVAL_SYSTEM.md             (SQL commands)
├─ INTEGRATION_GUIDE.md                 (Code examples)
├─ APPROVAL_SYSTEM_DIAGRAMS.md          (Visuels)
└─ QUICK_START_CHECKLIST.md             (Ce fichier)

Code:
├─ supabase/migrations/055_add_approval_status.sql
├─ src/types/database.ts
├─ src/hooks/useContentApprovals.ts
├─ src/hooks/useContentSubmission.ts
├─ src/hooks/useSubmissionStatus.tsx
├─ src/pages/AdminContentApprovals.tsx
├─ src/components/SubmissionStatusAlert.tsx
├─ src/App.tsx (+ route)
└─ src/components/Sidebar.tsx (+ menu item)
```

---

## 💬 Questions fréquentes

### Q: Combien de temps avant suppression?

**R:** 24h (configurable dans la migration, paramètre `INTERVAL '24 hours'`)

### Q: Utilisateur peut réessayer après rejet?

**R:** Oui! Ils peuvent upload à nouveau. L'ancien record reste pour l'audit.

### Q: Les admins voient les rejetés?

**R:** Non, seuls les 'pending' et 'approved' sont visibles. Les rejetés restent en DB pour audit.

### Q: Peut-on modifier le contenu après rejet?

**R:** Utiliser la vidéo/image existante et ré-soumettre, ou créer une nouvelle soumission.

### Q: Notification obligatoire?

**R:** Non, optionnel. Mais fortement recommandé pour UX.

### Q: Peut-on voir historique des approbations?

**R:** Oui! Table `content_approvals` garde trace. Ajouter une page "Historique" si besoin.

---

## 🆘 Support

Si une erreur RLS:

1. Vérifier que l'utilisateur est authentifié
2. Vérifier la table `admin_users` pour les droits admin
3. Vérifier les policies avec: `SELECT * FROM pg_policies;`

Si nettoyage ne marche pas:

1. Tester manuellement: `SELECT clean_expired_pending_content();`
2. Vérifier que pg_cron est chargée (Option B)
3. Vérifier les logs de l'Edge Function (Option A)

---

## 📞 Prochaine étape?

Dites-moi si vous voulez que je:

- [ ] Intègre directement dans VideoModalForm et GalleryUpload
- [ ] Configure le nettoyage automatique (Edge Function)
- [ ] Ajoute les notifications complètes
- [ ] Crée des tests e2e avec Cypress/Playwright
- [ ] Génère la documentation utilisateur finale

Je suis prêt! 🚀
