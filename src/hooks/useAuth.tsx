/**
 * Hook d’auth (contexte) : `login`, `signOut`, `register` et `signUpWithEmail`.
 *
 * **Inscription :** `signUpWithEmail` / `register` appellent `supabase.auth.signUp`
 * avec l’email fourni tel quel (aucune réécriture de domaine côté frontend).
 */
export { useAuth } from './useAuthHook';

