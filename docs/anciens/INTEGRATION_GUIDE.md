# 🔗 Guide d'intégration dans les pages existantes

## 1️⃣ Intégration dans VideoModalForm.tsx

### Avant (sans approbation):

```typescript
const handleVideoUpload = async (file: File) => {
  const uploadedFile = await uploadVideoFile(file)
  // ... créer le record directement
}
```

### Après (avec approbation):

```typescript
import useContentSubmission from '@/hooks/useContentSubmission'
import SubmissionStatusAlert from '@/components/SubmissionStatusAlert'

export default function VideoModalForm() {
  const { submitContent, checkSubmissionStatus } = useContentSubmission()
  const [submission, setSubmission] = useState<ContentApproval | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)

  // ✅ Charger le statut si la vidéo existe déjà
  useEffect(() => {
    if (selectedVideoId) {
      setIsLoadingStatus(true)
      checkSubmissionStatus('video', selectedVideoId).then(({ submission }) => {
        setSubmission(submission)
        setIsLoadingStatus(false)
      })
    }
  }, [selectedVideoId])

  const handleVideoUpload = async (file: File) => {
    try {
      // 1. Uploader le fichier
      const uploadedFile = await uploadVideoFile(file)

      // 2. Créer le record vidéo (status = 'pending' par défaut)
      const videoRecord = await createVideoRecord({
        title: formData.title,
        description: formData.description,
        video_storage_path: uploadedFile.key,
        // ... autres champs
      })

      // 3. Soumettre pour approbation
      const result = await submitContent(
        'video',
        videoRecord.id,
        formData.title,
        formData.description
      )

      if (result.success) {
        // 4. Mettre à jour le statut UI
        await checkSubmissionStatus('video', videoRecord.id)
          .then(({ submission }) => {
            setSubmission(submission)
          })

        showNotification('✅ Votre vidéo a été soumise pour approbation!')
      } else {
        showError('❌ Erreur lors de la soumission')
      }
    } catch (error) {
      showError('Erreur lors de l\'upload')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent>
        {/* Afficher le statut si existe */}
        <SubmissionStatusAlert submission={submission} />

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <Input
            label="Titre"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {/* Upload vidéo */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              📹 Choisir une vidéo
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleVideoUpload(e.target.files[0])
                }
              }}
              className="hidden"
            />
          </div>

          <Button type="submit">Soumettre</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 2️⃣ Intégration dans GalleryImageModal.tsx

```typescript
import useContentSubmission from '@/hooks/useContentSubmission'
import SubmissionStatusAlert from '@/components/SubmissionStatusAlert'

export default function GalleryImageModal() {
  const { submitContent, checkSubmissionStatus } = useContentSubmission()
  const [submission, setSubmission] = useState<ContentApproval | null>(null)

  const handleImageUpload = async (file: File) => {
    try {
      // 1. Uploader l'image
      const uploadedImage = await uploadFile(file, 'gallery')

      // 2. Créer le record galerie (status = 'pending' par défaut)
      const imageRecord = await createGalleryImage({
        title: formData.title,
        description: formData.description,
        image_url: uploadedImage.url,
        // ... autres champs
      })

      // 3. Soumettre pour approbation
      const result = await submitContent(
        'gallery',
        imageRecord.id,
        formData.title,
        formData.description
      )

      if (result.success) {
        await checkSubmissionStatus('gallery', imageRecord.id)
          .then(({ submission }) => {
            setSubmission(submission)
          })

        showNotification('✅ Votre image a été soumise pour approbation!')
      }
    } catch (error) {
      showError('Erreur lors de l\'upload')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent>
        <SubmissionStatusAlert submission={submission} />

        {/* Formulaire similaire */}
        <form onSubmit={handleSubmit}>
          {/* ... */}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 3️⃣ Ajout d'une section "Mes soumissions" dans le profil

**Fichier:** `src/pages/ProfilePage.tsx` ou `src/components/ProfileTabs.tsx`

```typescript
import { SubmissionStatusList } from '@/hooks/useSubmissionStatus'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('info')

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">Mes infos</TabsTrigger>
          <TabsTrigger value="submissions">📋 Mes soumissions</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Mes contenus soumis</h2>
            <p className="text-muted-foreground mb-4">
              Suivi de vos vidéos et images en attente d'approbation.
            </p>
            <SubmissionStatusList />
          </div>
        </TabsContent>

        {/* Autres tabs... */}
      </Tabs>
    </div>
  )
}
```

---

## 4️⃣ Notification d'approbation dans AdminContentApprovals.tsx

```typescript
import { notifyContentApproved, notifyContentRejected } from '@/lib/supabase/notifications'

const handleApprove = async (item: ContentApproval) => {
  setIsProcessing(true)
  const result = await approveContent(item.content_type, item.content_id)

  if (result.success) {
    // Notifier l'utilisateur
    await notifyContentApproved(
      item.user_id,
      item.content_type,
      item.content_id,
      item.title || 'Sans titre',
    )

    setSelectedItem(null)
    showNotification('✅ Contenu approuvé et utilisateur notifié!')
  }
  setIsProcessing(false)
}

const handleReject = async () => {
  if (!selectedItem) return
  setIsProcessing(true)
  const result = await rejectContent(
    selectedItem.content_type,
    selectedItem.content_id,
    rejectReason,
  )

  if (result.success) {
    // Notifier l'utilisateur
    await notifyContentRejected(
      selectedItem.user_id,
      selectedItem.content_type,
      selectedItem.title || 'Sans titre',
      rejectReason || 'Non spécifiée',
    )

    setSelectedItem(null)
    setShowRejectDialog(false)
    setRejectReason('')
    showNotification('❌ Contenu rejeté et utilisateur notifié!')
  }
  setIsProcessing(false)
}
```

---

## 5️⃣ Affichage des vidéos/galeries

### VideosPage.tsx / GalleryPage.tsx

**Important:** Ne charger que les contenus `status = 'approved'`

```typescript
// ❌ AVANT (charge tout)
const { videos, loading } = useVideos(100)

// ✅ APRÈS (charge seulement les approuvés)
const usePublicVideos = (limit: number = 100) => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('status', 'approved') // ✅ Filtrer par statut
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        setVideos(data || [])
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [limit])

  return { videos, loading }
}

// Utiliser dans VideosPage:
const { videos, loading } = usePublicVideos(100)
```

---

## 6️⃣ Dashboard admin avec statuts

**Fichier:** `src/pages/AdminDashboard.tsx`

```typescript
import useContentApprovals from '@/hooks/useContentApprovals'

export default function AdminDashboard() {
  const { pendingItems, loading } = useContentApprovals()

  return (
    <div className="space-y-6">
      {/* Widget: Approbations en attente */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-orange-900">
              ⏳ Approbations en attente
            </h3>
            <p className="text-3xl font-bold text-orange-700 mt-2">
              {pendingItems.length}
            </p>
          </div>
          <button
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            onClick={() => navigate('/admin/approvals')}
          >
            Examiner
          </button>
        </div>
      </div>

      {/* Liste rapide des 5 derniers en attente */}
      {pendingItems.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Dernières soumissions</h3>
          <div className="space-y-2">
            {pendingItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded">
                <span className="text-sm">
                  {item.content_type === 'video' ? '🎬' : '🖼️'} {item.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.submitted_at).toLocaleString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 7️⃣ Intégration dans le système de notifications existant

**Fichier:** `src/lib/supabase/notifications.ts`

```typescript
export const notifyContentApproved = async (
  userId: string,
  contentType: 'video' | 'gallery',
  contentId: string,
  contentTitle: string,
) => {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: 'content_approved',
    title: `${contentType === 'video' ? '🎬' : '🖼️'} Contenu approuvé!`,
    message: `Votre ${contentType === 'video' ? 'vidéo' : 'image'} "${contentTitle}" a été approuvée et est maintenant visible.`,
    link: contentType === 'video' ? `/videos/${contentId}` : `/galerie`,
    is_read: false,
    metadata: {
      content_type: contentType,
      content_id: contentId,
    },
  })

  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export const notifyContentRejected = async (
  userId: string,
  contentType: 'video' | 'gallery',
  contentTitle: string,
  reason: string,
) => {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: 'content_rejected',
    title: `${contentType === 'video' ? '🎬' : '🖼️'} Contenu rejeté`,
    message: `Votre ${contentType === 'video' ? 'vidéo' : 'image'} "${contentTitle}" a été rejetée.${reason ? ` Raison: ${reason}` : ''}`,
    link: `/profile?tab=submissions`,
    is_read: false,
    metadata: {
      content_type: contentType,
      reason: reason,
    },
  })

  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}
```

---

## ✅ Checklist d'intégration

- [ ] VideoModalForm.tsx intégré
- [ ] GalleryImageModal.tsx intégré
- [ ] Section "Mes soumissions" dans profil
- [ ] Notifications d'approbation/rejet implémentées
- [ ] VideosPage charge seulement status='approved'
- [ ] GalleryPage charge seulement status='approved'
- [ ] Widget "Approbations en attente" dans AdminDashboard
- [ ] Tests manuels complets
- [ ] Vérification des RLS policies avec les utilisateurs normaux

---

## 🧪 Plan de test pour les utilisateurs

### Scénario 1: Upload d'une vidéo

1. ✅ Membre non-admin va à /videos
2. ✅ Clique sur "Ajouter une vidéo"
3. ✅ Remplit le formulaire
4. ✅ Upload la vidéo
5. ✅ Voit le message "En attente d'approbation"
6. ✅ La vidéo n'apparaît pas sur /videos
7. ✅ Admin approuve via /admin/approvals
8. ✅ Membre reçoit notification
9. ✅ Vidéo apparaît sur /videos

### Scénario 2: Rejet avec raison

1. ✅ Même process jusqu'à l'upload
2. ✅ Admin rejette avec raison "Qualité insuffisante"
3. ✅ Membre reçoit notification avec raison
4. ✅ Membre va dans "Mes soumissions"
5. ✅ Voit le statut "Rejeté" + raison
6. ✅ Peut réessayer

### Scénario 3: Expiration après 24h

1. ✅ Upload à H0
2. ✅ Admin ne fait rien
3. ✅ À H24+1, vidéo est supprimée
4. ✅ Record reste dans content_approvals
5. ✅ Utilisateur peut réessayer
