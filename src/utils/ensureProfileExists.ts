import { supabase } from '@/integrations/supabase/client';
import { uploadPendingAvatar } from './uploadPendingAvatar';

/**
 * Crée un profil dans public.profiles si l'utilisateur n'en a pas
 * Utilise les metadata de auth.users
 */
export async function ensureProfileExists(userId: string) {
  try {
    // Vérifier si le profil existe déjà (incl. avatar pour pending upload après inscription)
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Erreur lors de la vérification du profil:', checkError);
      return null;
    }

    // Profil déjà créé (ex. trigger SQL) : compléter l’avatar si fichier en attente
    if (existingProfile) {
      if (!existingProfile.avatar_url) {
        console.log('⏳ Profil sans avatar — tentative pending_avatar_upload…');
        await uploadPendingAvatar(userId);
      } else {
        console.log('✅ Profil existe déjà avec avatar');
      }
      return { id: existingProfile.id };
    }

    // Récupérer les données de l'utilisateur auth
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      console.error('❌ Impossible de récupérer l\'utilisateur auth:', authError);
      return null;
    }

    const user = authData.user;
    const metadata = user.user_metadata || {};

    console.log('🔍 Création du profil avec les metadata:', metadata);

    // Uploader l'avatar en attente si disponible
    let avatar_url = metadata.avatar_url || null;
    if (!avatar_url) {
      console.log('⏳ Tentative upload avatar en attente...');
      const uploadedUrl = await uploadPendingAvatar(user.id);
      if (uploadedUrl) {
        avatar_url = uploadedUrl;
        console.log('✅ Avatar uploadé et URL obtenue:', avatar_url);
      }
    }

    // Créer le profil avec les metadata
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: metadata.full_name || null,
      avatar_url: avatar_url || null,
      phone: metadata.phone || null,
      role: metadata.role || 'membre', // Utiliser le rôle des metadata, sinon défaut
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📝 Insertion du profil:', profileData);

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur lors de la création du profil:', {
        message: insertError.message,
        code: (insertError as Record<string, unknown>).code,
        details: (insertError as Record<string, unknown>).details,
      });
      return null;
    }

    console.log('✅ Profil créé avec succès:', newProfile);
    return newProfile;
  } catch (err) {
    console.error('❌ Exception lors de ensureProfileExists:', err);
    return null;
  }
}
