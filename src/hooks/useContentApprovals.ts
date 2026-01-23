import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ContentApproval, ApprovalStatus, ContentType } from '@/types/database';

interface PendingContent {
  id: string;
  content_type: 'video' | 'gallery';
  title: string;
  description?: string;
  submitted_at: string;
  image_url?: string;
  thumbnail_url?: string;
  user_id: string;
}

export const useContentApprovals = () => {
  const [pendingItems, setPendingItems] = useState<PendingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les vidéos et images en attente d'approbation
  const fetchPendingApprovals = useCallback(async () => {
    try {
      setLoading(true);
      
      // Récupérer les vidéos en attente
      const { data: pendingVideos, error: videosError } = await supabase
        .from('videos')
        .select('id, title, description, submitted_at, thumbnail_url, user_id')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (videosError) throw videosError;

      // Récupérer les images en attente
      const { data: pendingImages, error: imagesError } = await supabase
        .from('gallery_images')
        .select('id, title, description, submitted_at, image_url, thumbnail_url, user_id')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (imagesError) throw imagesError;

      console.log('Pending videos:', pendingVideos?.length);
      console.log('Pending images:', pendingImages?.length);

      // Combiner et formater les résultats
      const combined: PendingContent[] = [
        ...(pendingVideos || []).map(v => ({
          id: v.id,
          content_type: 'video' as const,
          title: v.title,
          description: v.description,
          submitted_at: v.submitted_at,
          thumbnail_url: v.thumbnail_url,
          user_id: v.user_id,
        })),
        ...(pendingImages || []).map(i => ({
          id: i.id,
          content_type: 'gallery' as const,
          title: i.title,
          description: i.description,
          submitted_at: i.submitted_at,
          image_url: i.image_url,
          thumbnail_url: i.thumbnail_url,
          user_id: i.user_id,
        })),
      ];

      console.log('Total pending items:', combined.length);
      setPendingItems(combined);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      console.error('Error fetching pending approvals:', message);
      setError(message);
      setPendingItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Approuver un contenu
  const approveContent = useCallback(
    async (contentType: ContentType, contentId: string) => {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        console.log('Approving', contentType, contentId, 'by user', userId);

        const { data, error: updateError } = await supabase
          .from(contentType === 'video' ? 'videos' : 'gallery_images')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: userId,
          })
          .eq('id', contentId)
          .select();

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }

        console.log('Update result:', data);

        // Attendre un bit et rafraîchir la liste
        setTimeout(() => {
          fetchPendingApprovals();
        }, 500);
        
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de l\'approbation';
        console.error('Approval error:', message);
        return { success: false, error: message };
      }
    },
    [fetchPendingApprovals]
  );

  // Rejeter un contenu
  const rejectContent = useCallback(
    async (contentType: ContentType, contentId: string, reason: string = '') => {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        console.log('Rejecting', contentType, contentId, 'by user', userId, 'reason:', reason);

        // D'abord, mettre à jour le statut
        const { data: updateData, error: updateError } = await supabase
          .from(contentType === 'video' ? 'videos' : 'gallery_images')
          .update({
            status: 'rejected',
            rejection_reason: reason,
            approved_at: new Date().toISOString(),
            approved_by: userId,
          })
          .eq('id', contentId)
          .select();

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }

        console.log('Update result:', updateData);

        // Ensuite, supprimer immédiatement le contenu rejeté
        const { error: deleteError } = await supabase
          .from(contentType === 'video' ? 'videos' : 'gallery_images')
          .delete()
          .eq('id', contentId);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw deleteError;
        }

        console.log('Deleted successfully');

        // Attendre un bit et rafraîchir la liste
        setTimeout(() => {
          fetchPendingApprovals();
        }, 500);
        
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du rejet';
        console.error('Rejection error:', message);
        return { success: false, error: message };
      }
    },
    [fetchPendingApprovals]
  );

  // Charger au montage
  useEffect(() => {
    fetchPendingApprovals();
  }, [fetchPendingApprovals]);

  return {
    pendingItems,
    loading,
    error,
    approveContent,
    rejectContent,
    refetch: fetchPendingApprovals,
  };
};

export default useContentApprovals;
