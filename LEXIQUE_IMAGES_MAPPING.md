# 📸 Mapping Termes ↔ Fichiers Images

## 📋 Correspondance Complète

Ce fichier documente la correspondance entre les IDs des termes et les fichiers images du lexique.

### 🖥️ Interface

| Term ID          | Term Name       | Filename            | Path                                          | Status  |
| ---------------- | --------------- | ------------------- | --------------------------------------------- | ------- |
| `hero-banner`    | Hero Banner     | `banner.png`        | `/images/lexique/interface/banner.png`        | ✅ Créé |
| `modal`          | Modal           | `modal.png`         | `/images/lexique/interface/modal.png`         | ✅ Créé |
| `menu-deroulant` | Menu déroulant  | `menuderoulant.png` | `/images/lexique/interface/menuderoulant.png` | ✅ Créé |
| `checkbox`       | Checkbox        | `checkbox.png`      | `/images/lexique/interface/checkbox.png`      | ✅ Créé |
| `input`          | Champ de saisie | `input.png`         | `/images/lexique/interface/input.png`         | ✅ Créé |
| `select`         | Select/Dropdown | `select.png`        | `/images/lexique/interface/select.png`        | ✅ Créé |
| `section-page`   | Section de page | `section.png`       | `/images/lexique/interface/section.png`       | ✅ Créé |
| `icones`         | Icônes          | `icones.png`        | `/images/lexique/interface/icones.png`        | ✅ Créé |

### 🧭 Navigation

| Term ID           | Term Name              | Filename              | Path                                             | Status  |
| ----------------- | ---------------------- | --------------------- | ------------------------------------------------ | ------- |
| `en-tete`         | En-tête (Header)       | `header.png`          | `/images/lexique/navigation/header.png`          | ✅ Créé |
| `pied-page`       | Pied de page (Footer)  | `footer.png`          | `/images/lexique/navigation/footer.png`          | ✅ Créé |
| `sidebar`         | Menu latéral (Sidebar) | `sidebar.png`         | `/images/lexique/navigation/sidebar.png`         | ✅ Créé |
| `menu-horizontal` | Menu horizontal        | `menu_horizontal.png` | `/images/lexique/navigation/menu_horizontal.png` | ✅ Créé |
| `user-menu`       | Menu utilisateur       | `user_menu.png`       | `/images/lexique/navigation/user_menu.png`       | ✅ Créé |

### 📄 Contenu

| Term ID       | Term Name         | Filename          | Path                                      | Status  |
| ------------- | ----------------- | ----------------- | ----------------------------------------- | ------- |
| `carte`       | Carte (Card)      | `card.png`        | `/images/lexique/content/card.png`        | ✅ Créé |
| `vignette`    | Vignette          | `vignette.png`    | `/images/lexique/content/vignette.png`    | ✅ Créé |
| `tableau`     | Tableau           | `tableau.png`     | `/images/lexique/content/tableau.png`     | ✅ Créé |
| `titre`       | Titre             | `titre.png`       | `/images/lexique/content/titre.png`       | ✅ Créé |
| `sous-titre`  | Sous-titre        | `soustitre.png`   | `/images/lexique/content/soustitre.png`   | ✅ Créé |
| `description` | Description/Texte | `description.png` | `/images/lexique/content/description.png` | ✅ Créé |
| `row`         | Ligne/Row         | `row.png`         | `/images/lexique/content/row.png`         | ✅ Créé |

### ⚡ Actions

| Term ID        | Term Name          | Filename           | Path                                       | Status  |
| -------------- | ------------------ | ------------------ | ------------------------------------------ | ------- |
| `bouton`       | Bouton             | `bouton.png`       | `/images/lexique/actions/bouton.png`       | ✅ Créé |
| `formulaire`   | Formulaire         | `form.png`         | `/images/lexique/actions/form.png`         | ✅ Créé |
| `notification` | Notification/Alert | `notification.png` | `/images/lexique/actions/notification.png` | ✅ Créé |
| `toast`        | Toast              | `toast.png`        | `/images/lexique/actions/toast.png`        | ✅ Créé |
| `crud-actions` | Actions CRUD       | `crud.png`         | `/images/lexique/actions/crud.png`         | ✅ Créé |

### ⚙️ Administration

| Term ID     | Term Name                 | Filename        | Path                                  | Status  |
| ----------- | ------------------------- | --------------- | ------------------------------------- | ------- |
| `dashboard` | Dashboard/Tableau de bord | `dashboard.png` | `/images/lexique/admin/dashboard.png` | ✅ Créé |

## 📊 Statistiques

- **Total de fichiers PNG créés** : 26
- **Catégories** : 5
  - Interface : 8
  - Navigation : 5
  - Contenu : 7
  - Actions : 5
  - Administration : 1

## 🔄 Mise à Jour des Données

### Exemple de Structure dans `data/terms.ts`

```typescript
{
  id: 'hero-banner',
  term: 'Hero Banner',
  // ...
  screenshot: {
    path: '/images/lexique/interface/banner.png',
    alt: 'Description...',
    annotations: [...]
  }
}
```

## 📝 Prochaines Étapes

1. **Ajouter les `screenshot` manquants** aux autres termes dans `data/terms.ts`
2. **Remplacer les PNG minimalistes** par de vraies captures d'écran
3. **Optimiser les images** (compression, dimensionnement)
4. **Tester localement** pour vérifier l'affichage

## 🚀 Commandes Utiles

### Vérifier les fichiers créés

```bash
# PowerShell
Get-ChildItem -Path "public\images\lexique" -Recurse -File | Sort-Object FullName

# Git (voir les nouveaux fichiers)
git status
```

### Compresser les images (quand prêtes)

```bash
# Utiliser imagemin ou TinyPNG pour optimiser
npm install --save-dev imagemin imagemin-optipng imagemin-pngquant
npx imagemin public/images/lexique/**/*.png --out-dir=public/images/lexique
```

---

**Créé le** : 11 janvier 2026  
**Mise à jour** : Automatique lors de la création des fichiers
**Fichiers** : 26 PNG + 5 dossiers + .gitkeep
