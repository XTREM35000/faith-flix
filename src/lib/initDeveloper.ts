import { syncDeveloperAccess } from '@/lib/initializeDeveloper';

/**
 * Au démarrage : tente de créer / réparer le compte développeur via l’edge function
 * `create-developer` même sans session (bootstrap première installation).
 */
export async function ensureDeveloperAccount() {
  return syncDeveloperAccess({ allowWithoutSession: true });
}
