import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ContentApproval, ContentType } from '@/types/database';

export const useContentSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Soumettre du contenu pour approbation
  const submitContent = useCallback(
    async (
      contentType: ContentType,
      contentId: string,
      title: string,
      description?: string
    ) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // Créer une entrée dans content_approvals
        const user = (await supabase.auth.getUser()).data.user;
        const userId = user?.id;
        if (!userId) {
          const msg = 'Non authentifié: impossible de soumettre pour approbation';
          setError(msg);
          return { success: false, error: msg };
        }

        const { error: submitError } = await supabase.from('content_approvals').insert({
          content_type: contentType,
          content_id: contentId,
          user_id: userId,
          title,
          description,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

        if (submitError) throw submitError;

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la soumission';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  // Vérifier si un contenu est en attente
  const checkSubmissionStatus = useCallback(
    async (contentType: ContentType, contentId: string) => {
      try {
        const { data, error: queryError } = await supabase
          .from('content_approvals')
          .select('*')
          .eq('content_id', contentId)
          .eq('content_type', contentType)
          .single();

        if (queryError && queryError.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is fine
          throw queryError;
        }

        return {
          hasSubmission: !!data,
          submission: data as ContentApproval | null,
        };
      } catch (err) {
        console.error('Error checking submission status:', err);
        return { hasSubmission: false, submission: null };
      }
    },
    []
  );

  return {
    submitContent,
    checkSubmissionStatus,
    isSubmitting,
    error,
  };
};

export default useContentSubmission;
