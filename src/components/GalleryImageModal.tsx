import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Search, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import UnifiedFormModal from '@/components/ui/unified-form-modal';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile, testStorageConnection } from '@/lib/supabase/storage';
import { useNotification } from './ui/notification-system';
import { useContentSubmission } from '@/hooks/useContentSubmission';
import { useParoisse } from '@/contexts/ParoisseContext';
import SubmissionStatusAlert from './SubmissionStatusAlert';
import type { GalleryImage, ContentApproval } from '@/types/database';

interface GalleryImageModalProps {
  open: boolean;
  onClose: () => void;
  onImageAdded?: (image: GalleryImage) => void;
}

interface FormData {
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  isPublic: boolean;
}

type TabType = 'search' | 'upload' | 'url' | 'details';

const GalleryImageModal: React.FC<GalleryImageModalProps> = ({ open, onClose, onImageAdded }) => {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    imageUrl: '',
    thumbnailUrl: '',
    description: '',
    isPublic: true,
  });

  const [searchInput, setSearchInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submission, setSubmission] = useState<ContentApproval | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notifySuccess, notifyError } = useNotification();
  const { submitContent } = useContentSubmission();
  const { paroisse } = useParoisse();

  // Gérer les changements du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.currentTarget;
    const inputElement = e.currentTarget as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? inputElement.checked : value,
    }));
  };

  // Gérer les URLs d'image
  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: url,
      thumbnailUrl: url,
    }));
    setImagePreview(url);
    if (formData.title) {
      setActiveTab('details');
    }
  };

  // Gérer l'upload de fichier
  const handleFileUpload = async (file: File) => {
    console.log('[GalleryImageModal] handleFileUpload called', { name: file.name, size: file.size, type: file.type });
    try {
      setLoading(true);
      setError(null);
      // Vérifier que l'utilisateur est connecté avant d'uploader
      const { data: { user } } = await supabase.auth.getUser();
      console.debug('Gallery upload: current user id =', user?.id);
      if (!user) {
        const msg = 'Vous devez être connecté pour téléverser un fichier';
        setError(msg);
        notifyError('Erreur', msg);
        setLoading(false);
        return;
      }

      // upload via helper (uses bucket from env VITE_BUCKET_GALLERY or 'gallery')
      const uploaded = await uploadFile(file);
      if (!uploaded) {
        const msg = 'Erreur lors de l\'upload: aucune réponse du storage';
        console.error(msg);
        throw new Error(msg);
      }

      console.debug('Upload result:', uploaded);
      if (uploaded.publicUrl) {
        handleImageUrlChange(uploaded.publicUrl);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'upload';
      setError(errorMsg);
      notifyError('Erreur', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Chercher des images avec Placeholder API
  const handleImageSearch = async (query: string) => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const placeholderUrl = `https://via.placeholder.com/800x600?text=${encodeURIComponent(query)}`;
      handleImageUrlChange(placeholderUrl);
      setSearchInput('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la recherche';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Valider le formulaire
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return false;
    }
    if (!formData.imageUrl.trim()) {
      setError('L\'URL de l\'image est requise');
      return false;
    }
    return true;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Récupérer l'utilisateur courant
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Vous devez être connecté pour ajouter une image');
      }

      // Préparer les données
      const imageData = {
        title: formData.title,
        image_url: formData.imageUrl,
        thumbnail_url: formData.thumbnailUrl || formData.imageUrl,
        user_id: user.id,
        paroisse_id: paroisse?.id ?? null,
        is_public: formData.isPublic,
        metadata: {
          description: formData.description,
        },
        created_at: new Date().toISOString(),
      };

      // Insérer dans la base de données
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: insertError } = await (supabase as any)
        .from('gallery_images')
        .insert([imageData as never])
        .select('*')
        .single();

      if (insertError) {
        console.error('Gallery insert error:', insertError);
        throw insertError;
      }

      setSuccess(true);
      notifySuccess('Succès', 'Image soumise pour approbation');
      
      // Soumettre l'image pour approbation
      if (data) {
        const submissionRecord = await submitContent('gallery', data.id, formData.title, formData.description);
        setSubmission(submissionRecord);
      }
      
      // Appeler le callback
      if (onImageAdded && data) {
        onImageAdded(data as unknown as GalleryImage);
      }

      // Réinitialiser le formulaire
      setTimeout(() => {
        setFormData({
          title: '',
          imageUrl: '',
          thumbnailUrl: '',
          description: '',
          isPublic: true,
        });
        setImagePreview('');
        setSuccess(false);
        setActiveTab('search');
        onClose();
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'image';
      setError(errorMsg);
      notifyError('Erreur', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Contenu des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Chercher une image
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Ex: Église, Célébration, Messe..."
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyPress={(e) => e.key === 'Enter' && handleImageSearch(searchInput)}
                />
                <button
                  type="button"
                  onClick={() => handleImageSearch(searchInput)}
                  disabled={loading || !searchInput.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Utilisez des mots-clés pour générer des images de placeholder
              </p>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Télécharger une image
              </label>
              <div
                onClick={() => {
                  console.log('[GalleryImageModal] upload area clicked');
                  fileInputRef.current?.click();
                }}
                className="cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center hover:border-primary hover:bg-muted transition-colors"
              >
                <Upload className="mx-auto w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Cliquez pour sélectionner un fichier
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF - Max 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  console.log('[GalleryImageModal] file input changed', { fileName: file?.name, size: file?.size });
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
            </div>
          </div>
        );

      case 'url':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Entrer une URL d'image
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => {
                  handleImageUrlChange(e.target.value);
                }}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Entrez l'adresse complète de votre image
              </p>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-4">
            {/* Aperçu de l'image */}
            {imagePreview && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Procession de la Toussaint"
                required
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez ce moment spécial..."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Statut public */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                className="rounded border-input accent-primary"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-foreground cursor-pointer">
                Rendre cette image publique
              </label>
            </div>
          </div>
        );
    }
  };

  return (
    <UnifiedFormModal 
      open={open} 
      onClose={onClose}
      title={
        activeTab === 'search' ? 'Chercher une image' :
        activeTab === 'upload' ? 'Télécharger une image' :
        activeTab === 'url' ? 'Ajouter un lien direct' :
        'Détails de l\'image'
      }
      headerClassName="bg-amber-900"
      maxWidth="max-w-4xl"
    >
      <div className="flex gap-6 py-4">
        {/* Colonne gauche - Logo et info */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/4 p-4 border-r border-border">
          <ImageIcon className="w-12 h-12 text-amber-900 mb-3 opacity-80" />
          <h3 className="text-lg font-semibold text-foreground text-center">Galerie</h3>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Ajouter un moment spécial à notre communauté
          </p>
        </div>

        {/* Colonne droite - Contenu */}
        <div className="w-full md:w-3/4">
          {/* Messages de succès et erreur */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-700"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Image ajoutée avec succès!</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Afficher le statut de soumission */}
          {submission && <SubmissionStatusAlert submission={submission} />}

          {/* Onglets */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-amber-900 text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Chercher
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-amber-900 text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Télécharger
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'url'
                  ? 'bg-amber-900 text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Lien direct
            </button>
            {imagePreview && (
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'bg-amber-900 text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Détails
              </button>
            )}
          </div>

          {/* Contenu des onglets */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderTabContent()}

            {/* Boutons d'action */}
            {activeTab === 'details' && (
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  ← Retour
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.imageUrl || !formData.title}
                  className="flex-1 rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '⏳ Ajout en cours...' : '✓ Ajouter l\'image'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await testStorageConnection();
                      alert(res.message || (res.ok ? 'Test OK' : 'Échec'));
                    } catch (e) {
                      alert('Erreur lors du test Storage: ' + String(e));
                    }
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  🔌 Tester Storage
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </UnifiedFormModal>
  );
};

export default GalleryImageModal;
