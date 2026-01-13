# 🔍 Diagnostic - Insertion de Profil

## Problème Initial

La table `public.profiles` n'était pas alimentée lors de l'inscription, seule `auth.users` l'était.

## Cause Identifiée

Le code de RegisterForm.tsx tentait d'insérer des rôles **français** comme `'moderateur'`, `'pretre'`, `'diacre'`, etc., mais la table `profiles` a une contrainte **CHECK** qui n'accepte que les valeurs :

- `'super_admin'`
- `'admin'`
- `'member'`

Exemple de contrainte dans la migration `001_profiles_roles.sql` :

```sql
role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'member'))
```

## Corrections Appliquées

### 1. RegisterForm.tsx

✅ Fonction `mapRoleToDb()` corrigée pour retourner uniquement les valeurs acceptées :

- `'admin'` ← admin, super_admin
- `'member'` ← tous les autres rôles (membres par défaut)

### 2. ProfilePage.tsx

✅ Deux fonctions `normalize()` corrigées (initialization et save) pour utiliser les bonnes valeurs

### 3. AdminUsersPage.tsx

✅ Fonction `normalize()` et `displayRole()` corrigées pour être cohérentes

## Résultat Attendu

Après une inscription :

- ✅ L'utilisateur est créé dans `auth.users`
- ✅ Un profil est créé dans `public.profiles` avec role = `'member'`
- ✅ L'avatar_url est sauvegardé s'il y a un fichier
- ✅ Lors de la confirmation email, l'avatar s'affiche correctement

## Tests à Faire

1. Créer un compte avec avatar → Vérifier que le profil est dans `public.profiles`
2. Se connecter après confirmation email → Avatar doit être visible dans le user menu
3. Éditer le profil en Admin → Les valeurs de rôle doivent être cohérentes
