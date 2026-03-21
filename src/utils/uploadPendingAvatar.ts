import { supabase } from '@/integrations/supabase/client';

/**
 * Upload l'avatar en attente stocké en sessionStorage lors du signup
 * Appelé lors du premier login après confirmation d'email
 */
export async function uploadPendingAvatar(userId: string): Promise<string | null> {
  try {
    const pendingData = sessionStorage.getItem('pending_avatar_upload');
    if (!pendingData) {
      console.log('Aucun avatar en attente à uploader');
      return null;
    }

    const avatarData = JSON.parse(pendingData);
    const { fileData, fileName, mimeType } = avatarData;

    console.log('📤 Upload de l\'avatar en attente...');

    // Convertir base64 en blob
    const byteString = atob(fileData.split(',')[1]);
    const byteNumbers = new Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteNumbers[i] = byteString.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Upload vers le bucket
    const bucket = import.meta.env.VITE_BUCKET_AVATAR || 'avatars';
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, { upsert: true });

    if (uploadError) {
      console.error('❌ Erreur upload avatar:', uploadError);
      return null;
    }

    console.log('✅ Avatar uploadé avec succès');

    // Obtenir l'URL publique
    const { data: publicData } = await supabase.storage.from(bucket).getPublicUrl(fileName);
    const avatar_url = publicData?.publicUrl || null;

    if (avatar_url) {
      console.log('✅ URL avatar publique:', avatar_url);

      // Mettre à jour les metadata auth
      try {
        const { error: metaErr } = await supabase.auth.updateUser({
          data: { avatar_url },
        });

        if (metaErr) {
          console.error('❌ Erreur mise à jour metadata avec avatar:', metaErr);
        } else {
          console.log('✅ Metadata mise à jour avec avatar_url');
        }
      } catch (err) {
        console.error('Erreur lors de la mise à jour metadata:', err);
      }

      // Synchroniser public.profiles (profil créé par trigger souvent sans avatar)
      try {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profileErr) {
          console.error('❌ Erreur mise à jour profiles.avatar_url:', profileErr);
        } else {
          console.log('✅ profiles.avatar_url mis à jour');
        }
      } catch (err) {
        console.error('Erreur mise à jour profil avatar:', err);
      }
    }

    // Nettoyer sessionStorage
    sessionStorage.removeItem('pending_avatar_upload');

    return avatar_url;
  } catch (err) {
    console.error('❌ Erreur uploadPendingAvatar:', err);
    return null;
  }
}
