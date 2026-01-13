# 🔍 Diagnostic - Schéma Profiles & Insertion

## Schéma Réel de la Table `public.profiles`

```sql
create table public.profiles (
  id uuid not null,
  username text null,
  full_name text null,
  avatar_url text null,
  role text null default 'membre'::text,
  parish_role text null,
  email text null,
  phone text null,
  bio text null,
  join_date timestamp with time zone null default now(),
  is_verified boolean null default false,
  settings jsonb null default '{"theme": "auto", "language": "fr", "notifications": true}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_active boolean not null default true,
  last_read_messages_at timestamp with time zone null,

  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign key (id) references auth.users (id),
  constraint profiles_role_check check (
    role = any (array[
      'membre'::text,
      'moderateur'::text,
      'admin'::text,
      'pretre'::text,
      'diacre'::text
    ])
  )
);
```

## Rôles Acceptés

✅ `'membre'` (défaut)
✅ `'moderateur'`
✅ `'admin'`
✅ `'pretre'`
✅ `'diacre'`

## Corrections Appliquées

### 1. RegisterForm.tsx ✅

La fonction `mapRoleToDb()` retourne maintenant les bonnes valeurs françaises :

- `'admin'` ← admin, super_admin
- `'moderateur'` ← moderateur, moderator
- `'pretre'` ← pretre, priest
- `'diacre'` ← diacre
- `'membre'` ← tous les autres (défaut)

**Code clé :**

```typescript
const mapRoleToDb = (r?: string) => {
  if (!r) return 'membre'
  const s = String(r).toLowerCase()
  if (s.includes('admin') || s.includes('super')) return 'admin'
  if (s.includes('moder')) return 'moderateur'
  if (s.includes('pretre') || s.includes('priest')) return 'pretre'
  if (s.includes('diacre')) return 'diacre'
  return 'membre' // Default
}
```

### 2. ProfilePage.tsx ✅

Les deux fonctions `normalize()` (affichage initial + sauvegarde) retournent les valeurs françaises

### 3. AdminUsersPage.tsx ✅

Les fonctions `normalize()` et `displayRole()` sont cohérentes avec le schéma

## Debugging Logs Améliorés

Le RegisterForm logge désormais :

```javascript
console.log("🔍 Tentative d'insertion du profil:", insertData)
console.log('📝 Résultat insertion profil:', { data: profileData, error: profileInsertErr })

if (profileInsertErr) {
  console.error('❌ Erreur insertion profil:', {
    message: profileInsertErr.message,
    code: profileInsertErr.code,
    details: profileInsertErr.details,
  })
}
```

## Fallback si Erreur

Si l'insertion dans `public.profiles` échoue, le code met les données dans `auth.users` metadata :

```typescript
await supabase.auth.updateUser({
  data: {
    full_name: fullName || null,
    phone: fullPhone || null,
    avatar_url: avatar_url || null,
    role: dbRole,
  },
})
```

## Status Actuel ✅

✅ Tous les fichiers utilisent les bonnes valeurs de rôle
✅ Le code est cohérent entre RegisterForm, ProfilePage, AdminUsersPage
✅ Il y a un fallback en cas d'erreur RLS
✅ Les logs sont détaillés pour déboguer les problèmes

## Prochains Tests

1. Créer un compte → Vérifier les logs de console
2. Vérifier que le profil est dans `public.profiles`
3. Se connecter après confirmation email → Avatar doit s'afficher
