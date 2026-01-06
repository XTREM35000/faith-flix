# 🚀 Démarrage Rapide : Migration Images Hero Banner

**⏱️ Temps total: ~30 min (dont 15 min de test)**

---

## 📋 En 5 Commandes

### 1️⃣ Installer dépendances

```bash
npm install --save-dev @supabase/supabase-js glob fs-extra dotenv
```

### 2️⃣ Exécuter la migration

```bash
node scripts/migrate-hero-images.mjs
```

**Attend:** Fichier `migration-hero-images-mapping.json` généré ✅

### 3️⃣ Lancer l'app

```bash
npm run dev
```

**Attend:** App démarre sur `http://localhost:5173`

### 4️⃣ Tester une page

Ouvrir dans le navigateur:

```
http://localhost:5173/videos
```

DevTools (F12) → Network tab → Chercher l'image hero  
Vérifier: Status 200 + URL contient `supabase.co`

### 5️⃣ Valider tout

Suivre: [MIGRATION_HERO_IMAGES_CHECKLIST.md](MIGRATION_HERO_IMAGES_CHECKLIST.md)

---

## ⚠️ Avant de Commencer

### Vérifier `.env`

```bash
grep "VITE_SUPABASE" .env
```

**Résultat attendu:**

```
VITE_SUPABASE_URL=https://[PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_KEY]
```

**Si manquant:** Ajouter à `.env` et redémarrer le terminal

### Vérifier Supabase

- Aller à: https://supabase.com/dashboard
- Cliquer votre projet
- Aller à Storage
- Vérifier que bucket `gallery` existe et est **PUBLIC** ✅

---

## 🎯 Résultat Attendu

Après exécution du script:

```bash
$ node scripts/migrate-hero-images.mjs
🚀 Début de la migration des images du Hero Banner...
   Bucket: gallery
   Source: c:\axe\faith-flix\public\images

📂 23 fichier(s) image(s) détecté(s):
  📤 Upload: bapteme.png...
    ✅ Succès: https://...supabase.co/storage/v1/object/public/gallery/hero-images/...

... [autres fichiers] ...

📊 Résumé de la migration:
   Total:    23
   Uploadés: 23 ✅
   Échoués:  0 ❌

📄 Mapping sauvegardé à: migration-hero-images-mapping.json

✨ Migration réussie! Tous les fichiers ont été uploadés.
```

---

## 📝 Fichiers de Référence

| Problème                       | Document                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| "Pourquoi faire ça?"           | [MIGRATION_HERO_IMAGES_RESUME.md](MIGRATION_HERO_IMAGES_RESUME.md)                                                   |
| "Quels images sont affectées?" | [MIGRATION_HERO_IMAGES_CARTOGRAPHIE.md](MIGRATION_HERO_IMAGES_CARTOGRAPHIE.md)                                       |
| "Étapes détaillées?"           | [MIGRATION_HERO_IMAGES_GUIDE.sh](MIGRATION_HERO_IMAGES_GUIDE.sh)                                                     |
| "Je dois tester comment?"      | [MIGRATION_HERO_IMAGES_CHECKLIST.md](MIGRATION_HERO_IMAGES_CHECKLIST.md)                                             |
| "Code examples?"               | [MIGRATION_HERO_IMAGES_REFACTOR_EXAMPLES.ts](MIGRATION_HERO_IMAGES_REFACTOR_EXAMPLES.ts)                             |
| "SQL optionnel?"               | [supabase/migrations/021_migrate_hero_images_optional.sql](supabase/migrations/021_migrate_hero_images_optional.sql) |

---

## 🆘 SOS Rapide

### ❌ "Script ne s'exécute pas"

```bash
# Vérifier que .env a les bonnes variables
echo $VITE_SUPABASE_URL

# Sinon, créer .env:
cat > .env << EOF
VITE_SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_KEY]
EOF
```

### ❌ "App démarre avec erreurs TypeScript"

```bash
# Vérifier que src/lib/images.ts existe
ls src/lib/images.ts

# Si absent, il a été créé dans cette session
# Relancer: npm run dev
```

### ❌ "Image ne s'affiche pas (blanche)"

DevTools → Network → Chercher l'image hero

- Si Status 404: URL Supabase mal formée → Vérifier mapping.json
- Si Status 403: Bucket pas public → Supabase Dashboard → Storage → gallery → "Public"

### ❌ "Lighthouse dit LCP > 2.5s"

C'est normal pour les mesures locales (dev mode).  
En production, LCP améliore grâce au:

- Compression + CDN Supabase
- Preload `<link rel="preload">`
- Assets optimisés WebP/AVIF

---

## ✅ Checklist Post-Migration (5 min)

- [ ] Script migration exécuté sans erreur
- [ ] `migration-hero-images-mapping.json` créé
- [ ] `npm run dev` démarre l'app
- [ ] `/videos` affiche image correctement
- [ ] DevTools Network montre URL Supabase
- [ ] Console (F12) sans erreur 404 image
- [ ] Vérifier 2-3 autres pages (galerie, donations, etc.)

**Si tout ✅:** Migration réussie!

---

## 🎁 Bonus: Éditer une Image Hero

Maintenant que les images sont centralisées, vous pouvez les éditer:

1. Aller sur `/dashboard` (ou `/videos`, `/galerie`, etc.)
2. Cliquer le bouton ✏️ en haut à droite du hero
3. Uploader une nouvelle image
4. Cliquer "Enregistrer"
5. ✅ Nouvelle image visible instantanément + sauvegardée en DB

---

## 📞 Besoin d'Aide?

Consultez le guide complet:  
**→ [MIGRATION_HERO_IMAGES_GUIDE.sh](MIGRATION_HERO_IMAGES_GUIDE.sh)**

---

**Ready? Let's go! 🚀**

```bash
node scripts/migrate-hero-images.mjs
```
