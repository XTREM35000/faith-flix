# 🔴 URGENT FIX - Suppression des membres ne marche pas

## 🎯 Problème RACINE Identifié

**L'erreur FK réelle**: la table `homepage_sections` a une FK vers `auth.users` **WITHOUT ON DELETE CASCADE**.

Quand on supprime de `profiles`, la cascade tente de supprimer de `auth.users`, mais `homepage_sections` bloque.

```
Chaîne de problème:
DELETE profiles
  → (ON DELETE CASCADE)
  → DELETE auth.users
  → ✗ BLOQUÉ par homepage_sections.updated_by FK
```

---

## ✅ Solution: DEUX OPTIONS

### 🔥 Option 1: Fix FK Constraints (RAPIDE - 2 minutes)

Exécutez ce SQL dans Supabase SQL Editor:

```sql
-- Fix FK constraint sur homepage_sections
ALTER TABLE public.homepage_sections
DROP CONSTRAINT IF EXISTS homepage_sections_updated_by_fkey;

ALTER TABLE public.homepage_sections
ADD CONSTRAINT homepage_sections_updated_by_fkey
FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

**Puis testez la suppression.** Ça devrait marcher !

---

### 🏆 Option 2: Soft Delete (Meilleure pratique pour production)

Au lieu de supprimer, marquer comme inactif. C'est plus sûr et ne viole jamais les FK.

**Étape 1:** Exécutez ce SQL dans Supabase:

```sql
-- Ajouter colonne is_active
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

-- Nouvelle policy: Admin peut UPDATE is_active
CREATE POLICY "profiles_update_admin"
ON public.profiles
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
);

-- SELECT: Only active profiles
CREATE POLICY "profiles_select_active"
ON public.profiles
FOR SELECT
USING (is_active = true OR auth.uid() = id);
```

**Étape 2:** Modifiez le code TypeScript:

Dans [AdminUsersPage.tsx](src/pages/AdminUsersPage.tsx) et [MembersPage.tsx](src/pages/MembersPage.tsx):

```typescript
// REMPLACER cette ligne:
const { error } = await supabase.from('profiles').delete().eq('id', deleteConfirmId)

// PAR cette ligne:
const { error } = await supabase
  .from('profiles')
  .update({ is_active: false })
  .eq('id', deleteConfirmId)
```

---

## 🎯 Quelle option choisir ?

| Aspect            | Option 1       | Option 2   |
| ----------------- | -------------- | ---------- |
| **Vitesse**       | 2 min          | 5 min      |
| **FK Violations** | Risqué         | ✅ Zéro    |
| **Audit Trail**   | ❌ Non         | ✅ Oui     |
| **Reversibility** | ❌ Non         | ✅ Oui     |
| **Recommandé**    | Quick fix démo | Production |

**Je recommande Option 2** pour la qualité, mais **Option 1** si vous êtes en urgence absolue.

---

## ✅ État du Code TypeScript

- ✅ Déjà correct - utilise `.delete().eq('id', id)`
- ✅ Erreurs affichées en Toast (pas window.alert)
- ✅ ConfirmDialog React pour MembersPage
- ✅ Code prêt pour soft delete (juste changer `.delete()` en `.update({ is_active: false })`)

---

## 📁 Migrations Créées

- ✅ [051_fix_fk_constraints_for_deletion.sql](supabase/migrations/051_fix_fk_constraints_for_deletion.sql) - Corrige les FK
- ✅ [052_add_soft_delete_support.sql](supabase/migrations/052_add_soft_delete_support.sql) - Ajoute soft delete

---

**Status:** 🔴 **URGENT** - À faire MAINTENANT avant la démo  
**Temps estimé:** 2-5 minutes  
**Impact:** Critique
