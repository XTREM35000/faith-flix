# 🗂️ Commandes de mise en place du système d'approbation

## Phase 1: Exécuter la migration SQL

### Depuis Supabase Dashboard:

1. Aller à: **SQL Editor** → **New Query**
2. Copier-coller le contenu de: `supabase/migrations/055_add_approval_status.sql`
3. Exécuter la requête

### Ou via Supabase CLI:

```bash
supabase migration up
```

---

## Phase 2: Vérifier l'installation

### Vérifier les colonnes ajoutées:

```sql
-- Vérifier les colonnes de vidéos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'videos'
AND column_name IN ('status', 'submitted_at', 'approved_at', 'approved_by', 'rejection_reason');

-- Vérifier les colonnes de galerie
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'gallery_images'
AND column_name IN ('status', 'submitted_at', 'approved_at', 'approved_by', 'rejection_reason');

-- Vérifier la nouvelle table
SELECT * FROM information_schema.tables WHERE table_name = 'content_approvals';
```

### Vérifier les indexes:

```sql
SELECT indexname FROM pg_indexes
WHERE tablename IN ('videos', 'gallery_images', 'content_approvals');
```

### Vérifier les triggers:

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('videos', 'gallery_images');
```

### Vérifier les RLS policies:

```sql
SELECT * FROM pg_policies
WHERE tablename IN ('videos', 'gallery_images');
```

---

## Phase 3: Tester le système manuellement

### Test 1: Insérer une vidéo en 'pending'

```sql
INSERT INTO videos (
  title,
  user_id,
  video_storage_path,
  status
) VALUES (
  'Test Vidéo',
  (SELECT id FROM auth.users LIMIT 1),
  'test_video.mp4',
  'pending'
)
RETURNING id, status, submitted_at;
```

### Test 2: Vérifier content_approvals

```sql
SELECT * FROM content_approvals ORDER BY created_at DESC LIMIT 1;
```

### Test 3: Approuver une vidéo

```sql
UPDATE videos
SET status = 'approved', approved_at = NOW()
WHERE status = 'pending'
LIMIT 1
RETURNING id, status, approved_at;
```

### Test 4: Rejeter une vidéo

```sql
UPDATE videos
SET status = 'rejected',
    approved_at = NOW(),
    rejection_reason = 'Contenu inapproprié'
WHERE status = 'pending'
LIMIT 1
RETURNING id, status, rejection_reason;
```

### Test 5: Nettoyer les contenus expirés

```sql
-- Voir ce qui sera supprimé
SELECT COUNT(*) as pending_expired
FROM videos
WHERE status = 'pending'
AND submitted_at < NOW() - INTERVAL '24 hours';

SELECT COUNT(*) as pending_expired
FROM gallery_images
WHERE status = 'pending'
AND submitted_at < NOW() - INTERVAL '24 hours';

-- Exécuter le nettoyage
SELECT clean_expired_pending_content();
```

---

## Phase 4: Configuration du nettoyage automatique

### Option A: Via cron Supabase (recommandé)

Créer une Edge Function qui s'exécute toutes les heures:

**Fichier:** `supabase/functions/cleanup-expired-content/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Exécuter la fonction de nettoyage
    const { data, error } = await supabase.rpc('clean_expired_pending_content')

    if (error) throw error

    console.log(`Cleaned up ${data?.[0]?.deleted_count || 0} expired items`)

    return new Response(
      JSON.stringify({
        success: true,
        cleaned: data?.[0]?.deleted_count || 0,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

Puis ajouter dans `supabase.json`:

```json
{
  "functions": {
    "cleanup-expired-content": {
      "enabled": true,
      "cron": "0 * * * *" // Toutes les heures
    }
  }
}
```

### Option B: Via PostgreSQL pg_cron (alternative)

```sql
-- Installer l'extension pg_cron (si pas déjà fait)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer un job pour exécuter toutes les heures
SELECT cron.schedule(
  'cleanup-expired-content',
  '0 * * * *',  -- Toutes les heures
  'SELECT clean_expired_pending_content()'
);

-- Voir les jobs:
SELECT * FROM cron.job;

-- Supprimer un job si besoin:
SELECT cron.unschedule('cleanup-expired-content');
```

---

## Phase 5: Configurer les notifications (optionnel)

Ajouter dans `src/lib/supabase/notifications.ts`:

```typescript
export const notifyContentApproved = async (
  userId: string,
  contentType: 'video' | 'gallery',
  contentId: string,
  contentTitle: string,
) => {
  return supabase.from('notifications').insert({
    user_id: userId,
    type: 'content_approved',
    title: `${contentType === 'video' ? '🎬' : '🖼️'} Contenu approuvé`,
    message: `Votre ${contentType === 'video' ? 'vidéo' : 'image'} "${contentTitle}" a été approuvée!`,
    link: contentType === 'video' ? `/videos/${contentId}` : `/galerie`,
  })
}

export const notifyContentRejected = async (
  userId: string,
  contentType: 'video' | 'gallery',
  contentTitle: string,
  reason: string,
) => {
  return supabase.from('notifications').insert({
    user_id: userId,
    type: 'content_rejected',
    title: `${contentType === 'video' ? '🎬' : '🖼️'} Contenu rejeté`,
    message: `Votre ${contentType === 'video' ? 'vidéo' : 'image'} "${contentTitle}" a été rejetée. Raison: ${reason}`,
    link: `/profile?tab=submissions`,
  })
}
```

---

## Phase 6: Intégrer dans les formulaires d'upload

### VideoModalForm.tsx:

```typescript
import useContentSubmission from '@/hooks/useContentSubmission'
import SubmissionStatusAlert from '@/components/SubmissionStatusAlert'

export default function VideoModalForm() {
  const { submitContent, checkSubmissionStatus } = useContentSubmission()
  const [submission, setSubmission] = useState(null)

  const handleVideoUpload = async (file: File, title: string, desc: string) => {
    // Uploader la vidéo
    const video = await uploadVideoFile(file)

    // Soumettre pour approbation
    await submitContent('video', video.id, title, desc)

    // Charger le statut
    const { submission } = await checkSubmissionStatus('video', video.id)
    setSubmission(submission)
  }

  return (
    <>
      <SubmissionStatusAlert submission={submission} />
      {/* ... form ... */}
    </>
  )
}
```

### GalleryUpload.tsx:

Même approche pour les galeries.

---

## Phase 7: Tests finaux

### Test de flux complet:

1. ✅ Créer une vidéo (doit avoir status 'pending')
2. ✅ Voir l'entrée dans content_approvals
3. ✅ Aller à /admin/approvals (doit être listée)
4. ✅ Approuver la vidéo
5. ✅ Vérifier que status = 'approved'
6. ✅ Voir la vidéo en page publique

### Test du rejet:

1. ✅ Créer une autre vidéo
2. ✅ Aller à /admin/approvals
3. ✅ Rejeter avec raison
4. ✅ Vérifier status = 'rejected'
5. ✅ Vérifier la raison est stockée

### Test de l'expiration (24h):

```sql
-- Créer une vidéo avec submitted_at il y a 25h
INSERT INTO videos (title, user_id, video_storage_path, status, submitted_at)
VALUES (
  'Old pending video',
  (SELECT id FROM auth.users LIMIT 1),
  'old_video.mp4',
  'pending',
  NOW() - INTERVAL '25 hours'
);

-- Exécuter le nettoyage
SELECT clean_expired_pending_content();

-- Vérifier que la vidéo est supprimée
SELECT COUNT(*) FROM videos WHERE title = 'Old pending video';  -- Doit retourner 0
```

---

## Checklist de validation

- [ ] Migration SQL exécutée avec succès
- [ ] Colonnes présentes dans videos
- [ ] Colonnes présentes dans gallery_images
- [ ] Table content_approvals créée
- [ ] Indexes créés
- [ ] Triggers fonctionnels
- [ ] RLS policies appliquées
- [ ] Page /admin/approvals accessible
- [ ] Vidéo en 'pending' visible dans page admin
- [ ] Approuvation fonctionne
- [ ] Rejet fonctionne avec raison
- [ ] Nettoyage automatique configuré
- [ ] Utilisateurs voient le statut de leurs soumissions
- [ ] Les contenus rejetés restent dans la DB (mais non visibles)

---

## En cas de problème

### Réinitialiser la table content_approvals:

```sql
TRUNCATE TABLE content_approvals;
```

### Réinitialiser les statuts (à ne faire qu'en dev):

```sql
UPDATE videos SET status = 'approved';
UPDATE gallery_images SET status = 'approved';
TRUNCATE TABLE content_approvals;
```

### Vérifier les logs d'erreur RLS:

```sql
SELECT * FROM pg_stat_statements
WHERE query LIKE '%content_approvals%'
ORDER BY calls DESC;
```

---

## Support & Questions

Si des erreurs RLS persistent:

1. Vérifier que l'utilisateur est connecté (auth.uid())
2. Vérifier la table `admin_users`
3. Vérifier les permissions du rôle authenticated

Si le nettoyage ne fonctionne pas:

1. Vérifier que pg_cron est chargée
2. Vérifier les logs des edge functions
3. Tester manuellement: `SELECT clean_expired_pending_content();`
