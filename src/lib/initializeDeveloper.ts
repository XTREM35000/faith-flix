import { supabase } from "@/integrations/supabase/client";
import type { DeveloperSyncResponse } from "@/types/developer";

const SYNC_STORAGE_KEY = "ff_developer_sync_session_v1";

interface DeveloperSyncCache {
  fingerprint: string;
  syncedAt: number;
}

const getSessionFingerprint = (userId: string, expiresAt?: number | null) =>
  `${userId}:${expiresAt ?? "no-exp"}`;

const readSyncCache = (): DeveloperSyncCache | null => {
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeveloperSyncCache>;
    if (!parsed?.fingerprint || typeof parsed.syncedAt !== "number") return null;
    return { fingerprint: parsed.fingerprint, syncedAt: parsed.syncedAt };
  } catch (error) {
    console.warn("[DeveloperSync] Impossible de lire le cache localStorage:", error);
    return null;
  }
};

const writeSyncCache = (cache: DeveloperSyncCache) => {
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("[DeveloperSync] Impossible d'écrire le cache localStorage:", error);
  }
};

export type SyncDeveloperAccessOptions = {
  /**
   * Si vrai (ex. première installation : aucune paroisse / aucun super_admin), on appelle quand même
   * l’edge function `create-developer` sans session : elle utilise la service role côté serveur et
   * crée / répare le compte developer + paroisse SYSTEM en arrière-plan.
   */
  allowWithoutSession?: boolean;
};

export const syncDeveloperAccess = async (
  options?: SyncDeveloperAccessOptions,
): Promise<DeveloperSyncResponse> => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[DeveloperSync] Erreur getSession:", sessionError);
      return {
        success: false,
        message: "Session introuvable pour synchroniser le developer",
        error: sessionError.message,
      };
    }

    const allowBootstrap = options?.allowWithoutSession === true;

    if (!session?.user) {
      if (!allowBootstrap) {
        console.info("[DeveloperSync] Aucun utilisateur connecté, sync ignorée.");
        return {
          success: false,
          message: "Utilisateur non authentifié",
        };
      }
      console.info(
        "[DeveloperSync] Bootstrap première installation (sans session) → create-developer…",
      );
    } else {
      const fingerprint = getSessionFingerprint(session.user.id, session.expires_at);
      const cache = readSyncCache();

      if (cache?.fingerprint === fingerprint) {
        console.debug("[DeveloperSync] Synchronisation déjà effectuée pour cette session.");
        return {
          success: true,
          message: "Synchronisation déjà effectuée pour cette session",
        };
      }
    }

    console.info("[DeveloperSync] Appel de l'Edge Function create-developer...");
    const { data, error } = await supabase.functions.invoke<DeveloperSyncResponse>(
      "create-developer",
      { body: {} },
    );

    if (error) {
      console.error("[DeveloperSync] Erreur d'invocation:", error);
      return {
        success: false,
        message: "Échec de l'appel create-developer",
        error: error.message,
      };
    }

    const result: DeveloperSyncResponse = {
      success: Boolean(data?.success),
      message: data?.message ?? "Réponse reçue sans message",
      developer_id: data?.developer_id,
      developer_email: data?.developer_email,
      total_parishes: data?.total_parishes,
      added_to: data?.added_to,
      error: data?.error,
    };

    if (!result.success) {
      console.error("[DeveloperSync] Synchronisation échouée:", result);
      return result;
    }

    if (session?.user) {
      const fingerprint = getSessionFingerprint(session.user.id, session.expires_at);
      writeSyncCache({ fingerprint, syncedAt: Date.now() });
    }
    console.info("[DeveloperSync] Synchronisation réussie:", result);
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[DeveloperSync] Exception inattendue:", error);
    return {
      success: false,
      message: "Exception durant la synchronisation du developer",
      error: message,
    };
  }
};
