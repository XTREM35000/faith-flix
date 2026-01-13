# 🔴 URGENT FIX - Suppression des membres ne marche pas

## Problème Identifié

L'erreur FK constraint vient d'une tentative de DELETE sur `auth.users`. **La solution : ne supprimer QUE de la table `profiles`**, pas de `auth.users`.

## État du Code

✅ **AdminUsersPage.tsx** et **MembersPage.tsx** : Code TypeScript est déjà correct

- Utilise `.delete().eq('id', id)` sur la table `profiles`
- Affiche les erreurs dans Toast (pas window.alert)

❌ **Manquant : RLS Policy DELETE** sur la table `profiles`

- Vous avez la policy UPDATE
- Vous avez des policy SELECT
- Vous n'avez PAS de policy DELETE pour les admins

## Action Immédiate (En Démo Live)

### Option 1: SQL Direct dans Supabase Console (5 minutes) ⚡

1. Allez à : `Project > SQL Editor`
2. Exécutez ce SQL (⚠️ Important: dropez les anciennes policies d'abord):

```sql
-- Step 1: Drop all old policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
DROP POLICY IF EXISTS profiles_update_all ON public.profiles;

-- Step 2: Recreate basic policies
-- SELECT: Everyone can see all profiles
CREATE POLICY "profiles_select_all"
ON public.profiles
FOR SELECT
USING (true);

-- UPDATE: Users can update their own profile, or admins can update any
CREATE POLICY "profiles_update_all"
ON public.profiles
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (
    auth.uid() = id
    OR (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    auth.uid() = id
    OR (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
  )
);

-- DELETE: ONLY admins can delete profiles
CREATE POLICY "profiles_delete_admin"
ON public.profiles
FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
);
```

3. Cliquez "Run"
4. Testez: Allez à `/admin/users`, essayez de supprimer un membre
5. Vous devriez voir un Toast (pas une fenêtre d'alerte) avec le résultat

## Points Clés

✨ **Ce qui fonctionne maintenant:**

- ✅ Affichage des erreurs en Toast (pas window.confirm/alert)
- ✅ Code TypeScript utilise l'approche RLS directe
- ✅ Messages d'erreur détaillés et clairs

📋 **Ce qui reste à faire:**

- ⚠️ Créer la RLS Policy DELETE dans Supabase (ou exécuter le SQL ci-dessus)

## Vérification

Après avoir appliqué le SQL:

1. Allez à `/admin/users` ou `/membres`
2. Essayez de supprimer un utilisateur
3. Vous devriez voir :
   - ✅ Toast de succès (si ça marche)
   - 🔴 Toast d'erreur avec détails (si problème)

## Debug Si Ça Ne Marche Pas

1. Vérifiez votre rôle:

   ```sql
   SELECT id, email, role FROM profiles WHERE id = auth.uid();
   ```

   → Vous devez avoir `role = 'admin'` ou `'super_admin'`

2. Vérifiez les policies:

   ```sql
   SELECT policyname, permissive, cmd FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'profiles';
   ```

3. Testez directement la DELETE:
   ```sql
   DELETE FROM profiles WHERE id = '...'; -- remplacez avec un vrai ID
   ```

---

**Status:** 🔴 **URGENT** - À faire MAINTENANT
**Temps estimé:** 2-5 minutes
**Impact:** Critique pour la démo live

-- === RECREATE ALL POLICIES ===

-- 1. SELECT: Everyone can see all profiles
CREATE POLICY "profiles_select_all"
ON public.profiles
FOR SELECT
USING (true);

-- 2. UPDATE: Users can update their own profile OR admins can update any profile
CREATE POLICY "profiles_update_self_or_admin"
ON public.profiles
FOR UPDATE
USING (
auth.uid() = id
OR (
auth.role() = 'authenticated'
AND EXISTS (
SELECT 1 FROM profiles p
WHERE p.id = auth.uid()
AND p.role IN ('admin', 'super_admin')
)
)
)
WITH CHECK (
auth.uid() = id
OR (
auth.role() = 'authenticated'
AND EXISTS (
SELECT 1 FROM profiles p
WHERE p.id = auth.uid()
AND p.role IN ('admin', 'super_admin')
)
)
);

-- 3. DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete_admin_only"
ON public.profiles
FOR DELETE
USING (
auth.role() = 'authenticated'
AND EXISTS (
SELECT 1 FROM profiles p
WHERE p.id = auth.uid()
AND p.role IN ('admin', 'super_admin')
)
);

```

### 3. Cliquer "Run" ou Ctrl+Enter

Vous devriez voir: ✅ Success

---

## CODE CÔTÉ APPLICATION (Déjà fait)

✅ Les modifications suivantes sont déjà appliquées:

1. **AdminUsersPage.tsx**:

   - Utilise maintenant `supabase.from('profiles').delete().eq('id', id)`
   - Affiche les erreurs RLS dans le Toast (pas de `window.alert()`)
   - Dialog de confirmation React

2. **MembersPage.tsx**:
   - Remplacé `window.confirm()` par Dialog React
   - Utilise maintenant `supabase.from('profiles').delete().eq('id', id)`
   - Affiche les erreurs RLS dans le Toast

---

## VÉRIFICATION

Après avoir exécuté le SQL:

1. Aller à `/admin/users`
2. Cliquer "Supprimer" sur un utilisateur
3. Cliquer "Supprimer" dans la dialog
4. Vous devriez voir: ✅ "Succès - Utilisateur supprimé avec succès"

Si vous voyez encore une erreur, vérifier:

- Vous êtes bien connecté en tant qu'Admin (role = 'admin')
- La migration SQL a été exécutée correctement
- Consultez la console du navigateur (F12) pour les détails d'erreur

---

## NOTES

- Les erreurs RLS (Permission denied) sont maintenant affichées dans le Toast React (pas de `window.alert()`)
- Les messages d'erreur détaillés s'affichent pour faciliter le débogage
```
