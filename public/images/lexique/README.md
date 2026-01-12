# 📸 Images du Lexique - Guide d'intégration

## 📂 Structure des Dossiers

```
public/images/lexique/
├── interface/        # Composants et éléments visuels
│   ├── hero-banner.png
│   ├── modal.png
│   ├── carte.png
│   └── ...
├── navigation/       # Menus et structures de navigation
│   ├── en-tete.png
│   ├── pied-page.png
│   ├── sidebar.png
│   └── ...
├── content/          # Contenu et présentation de données
│   ├── vignette.png
│   ├── tableau.png
│   └── ...
├── actions/          # Boutons, formulaires et interactions
│   ├── bouton.png
│   ├── formulaire.png
│   └── ...
└── admin/            # Outils d'administration
    ├── crud-actions.png
    └── dashboard.png
```

## 🎯 Système de Nommage

Les images doivent être nommées **exactement** selon l'`id` du terme dans `src/pages/LexiquePage/data/terms.ts`.

### Exemple :

Pour le terme :

```typescript
{
  id: 'hero-banner',
  term: 'Hero Banner',
  category: 'interface',
  // ...
  screenshot: {
    path: '/images/lexique/interface/hero-banner.png',
    alt: 'Description...',
    annotations: [...]
  }
}
```

L'image doit être placée à : **`public/images/lexique/interface/hero-banner.png`**

## 📝 Format des Images

- **Format** : PNG
- **Résolution recommandée** : 1200px × 600px minimum
- **Optimisation** : Compressées pour le web

## 🖼️ Annotations sur les Images

Les annotations permettent de pointer des éléments spécifiques sur l'image.

### Structure d'une annotation :

```typescript
{
  x: '20%',           // Position horizontale (px ou %)
  y: '25%',           // Position verticale (px ou %)
  text: 'Titre',      // Texte du point clé
  type: 'primary'     // 'primary' (⭐ Important) ou 'secondary' (ℹ️ Info)
}
```

### Rendu dans TermCard :

- Les annotations apparaissent comme des **cercles numérotés** sur l'image
- Cliquer sur un cercle ou sur le point clé dans la liste pour plus de détails
- Les éléments `primary` sont mis en évidence en bleu
- Les éléments `secondary` affichent des informations supplémentaires

## ✅ Checklist d'Implémentation

Pour ajouter une image à un terme existant :

- [ ] Prendre une **capture d'écran** de l'élément sur le site
- [ ] Sauvegarder au format **PNG**
- [ ] Placer dans le dossier correct selon la catégorie
- [ ] Nommer le fichier selon l'`id` du terme
- [ ] Ajouter/mettre à jour la propriété `screenshot` dans `data/terms.ts`
- [ ] Ajouter des `annotations` pour pointer les éléments clés
- [ ] Tester que l'image s'affiche correctement

## 🔄 Processus de Chargement

1. **Vérification** : Le hook `useLexiqueImage()` vérifie si le fichier existe
2. **Affichage** :
   - ✅ Si l'image existe → Affichage avec annotations
   - ⏳ Si en cours de chargement → Message "Chargement..."
   - ❌ Si l'image manque → Placeholder informatif

## 📋 Termes avec Images (Actualisé)

### ✅ Actuellement Configurés :

| Terme                 | Catégorie  | ID            | Chemin                                      |
| --------------------- | ---------- | ------------- | ------------------------------------------- |
| Hero Banner           | interface  | `hero-banner` | `/images/lexique/interface/hero-banner.png` |
| En-tête (Header)      | navigation | `en-tete`     | `/images/lexique/navigation/en-tete.png`    |
| Pied de page (Footer) | navigation | `pied-page`   | `/images/lexique/navigation/pied-page.png`  |

### 📌 À Configurer :

Consultez `src/pages/LexiquePage/data/terms.ts` pour la liste complète des termes et ajouter les images progressivement.

## 🚀 Commandes Utiles

### Créer la structure (Linux/Mac) :

```bash
bash scripts/create-lexique-folders.sh
```

### Vérifier les fichiers existants :

```bash
ls -la public/images/lexique/
find public/images/lexique -name "*.png" | sort
```

## 💡 Conseils

1. **Dimensions** : Garder un ratio cohérent pour l'affichage responsive
2. **Compression** : Utiliser des outils comme TinyPNG pour optimiser
3. **Alt text** : Toujours renseigner la propriété `alt` de la capture
4. **Annotations** : Limiter à 3-4 points clés par image
5. **Positionnement** : Utiliser des pourcentages pour la compatibilité mobile

---

**Dernière mise à jour** : 11 janvier 2026  
**Responsable** : Équipe Développement
