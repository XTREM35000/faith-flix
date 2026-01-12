# 📸 Guide d'Intégration des Images Lexique

## 🎯 Vue d'Ensemble

Ce guide décrit comment intégrer les captures d'écran dans le lexique du Site Paroissial.

## 🔧 Architecture Technique

### 1️⃣ **Composant TermCard** ([src/pages/LexiquePage/components/TermCard.tsx](src/pages/LexiquePage/components/TermCard.tsx))

Le composant a été amélioré pour afficher :

- **Section Image** : Juste après l'en-tête, AVANT "Qu'est-ce que c'est ?"
- **Annotations interactives** : Cercles numérotés sur l'image
- **Placeholder** : Message informatif si l'image n'existe pas
- **Chargement** : État de chargement de l'image

```tsx
{
  /* 🖼️ SECTION IMAGE */
}
{
  term.screenshot && (
    <div className='p-4 border-b border-gray-200'>{/* Affichage ou placeholder */}</div>
  )
}

{
  /* Contenu (Qu'est-ce que c'est ?) */
}
;<div className='p-4 space-y-4'>{/* ... */}</div>
```

### 2️⃣ **Hook useLexiqueImage** ([src/pages/LexiquePage/hooks/useLexiqueImage.ts](src/pages/LexiquePage/hooks/useLexiqueImage.ts))

Gère la vérification et le chargement des images :

```typescript
const { imagePath, imageExists, isLoading } = useLexiqueImage(
  term.category, // 'interface', 'navigation', etc.
  term.id, // 'hero-banner', 'en-tete', etc.
)
```

### 3️⃣ **Types Existants** ([src/pages/LexiquePage/types.ts](src/pages/LexiquePage/types.ts))

Structure des données (déjà en place) :

```typescript
interface AnnotationMarker {
  x: string // Position X (px ou %)
  y: string // Position Y (px ou %)
  text: string // Texte du point clé
  type: 'primary' | 'secondary'
}

interface LexiqueScreenshot {
  path: string // Chemin vers l'image
  alt: string // Alt text
  annotations: AnnotationMarker[] // Points clés
}

interface LexiqueTerm {
  // ... propriétés existantes ...
  screenshot?: LexiqueScreenshot // Optionnel
}
```

### 4️⃣ **Données** ([src/pages/LexiquePage/data/terms.ts](src/pages/LexiquePage/data/terms.ts))

Les termes incluent maintenant la propriété `screenshot` :

```typescript
{
  id: 'hero-banner',
  term: 'Hero Banner',
  category: 'interface',
  // ...
  screenshot: {
    path: '/images/lexique/interface/hero-banner.png',
    alt: 'Premier élément visible sur la page...',
    annotations: [
      {
        x: '20%',
        y: '25%',
        text: 'Titre principal',
        type: 'primary',
      },
      // ...
    ],
  },
}
```

## 📂 Structure des Fichiers

```
public/images/lexique/
├── interface/        ✅ Créé
├── navigation/       ✅ Créé
├── content/          ✅ Créé
├── actions/          ✅ Créé
├── admin/            ✅ Créé
└── README.md         ✅ Créé
```

## 📋 Checklist : Ajouter une Image

### Étape 1 : Prendre la Capture

- [ ] Ouvrir le site paroissial
- [ ] Naviguer vers l'élément à capturer
- [ ] Prendre une capture d'écran (Print Screen, Shift+Cmd+4, etc.)
- [ ] Recadrer si nécessaire
- [ ] Exporter en PNG

### Étape 2 : Sauvegarder le Fichier

```bash
# Format du chemin
public/images/lexique/{catégorie}/{term-id}.png

# Exemple
public/images/lexique/interface/hero-banner.png
```

**Étapes** :

- [ ] Ouvrir un éditeur d'images (Paint, Preview, GIMP, etc.)
- [ ] Optimiser la taille (recommandé : 1200px × 600px)
- [ ] Compresser le PNG
- [ ] Sauvegarder dans le bon dossier avec le bon nom

### Étape 3 : Mettre à Jour les Données

Dans `src/pages/LexiquePage/data/terms.ts`, ajouter `screenshot` au terme :

```typescript
{
  id: 'mon-terme',
  term: 'Mon Terme',
  category: 'interface',
  // ... autres propriétés ...

  // ➕ AJOUTER CECI :
  screenshot: {
    path: '/images/lexique/interface/mon-terme.png',
    alt: 'Description brève de l\'image',
    annotations: [
      {
        x: '25%',
        y: '50%',
        text: 'Élément 1',
        type: 'primary',
      },
      {
        x: '75%',
        y: '50%',
        text: 'Élément 2',
        type: 'secondary',
      },
    ],
  },
}
```

### Étape 4 : Tester Localement

```bash
# Démarrer le serveur de développement
npm run dev
# ou
yarn dev
# ou
bun run dev

# Naviguer vers la page Lexique et vérifier l'affichage
```

## 🎨 Bonnes Pratiques

### Capture d'Écran

✅ **À faire** :

- Nettoyer l'interface (fermer les popups, notifications)
- Capturer à pleine largeur si possible
- Inclure le contexte pertinent

❌ **À éviter** :

- Barres personnelles, favoris du navigateur
- Informations sensibles (données réelles)
- Images trop sombres ou trop claires

### Annotations

✅ **À faire** :

- 2-4 points clés par image maximum
- Position précise (utiliser le navigateur Web ou un éditeur d'images)
- Texte court et descriptif

❌ **À éviter** :

- Trop nombreuses annotations
- Texte trop long ou technique
- Positions improbables

### Dimensions

- **Minimum** : 800px × 400px
- **Recommandé** : 1200px × 600px
- **Format** : PNG pour la clarté, JPG pour les photos

### Compression

Utiliser un outil en ligne ou local :

```bash
# Linux/Mac
imagemin public/images/lexique/**/*.png --out-dir=public/images/lexique

# Ou utiliser
# - TinyPNG.com
# - ImageOptim
# - OptiPNG
```

## 🔍 Vérification

### Vérifier la Structure

```bash
ls -la public/images/lexique/
```

### Vérifier les Images Existantes

```bash
find public/images/lexique -name "*.png" | sort
```

### Vérifier les Types TypeScript

```bash
npm run build
# ou vérifier les erreurs dans l'IDE
```

## 📊 État Actuel

### ✅ Termes Configurés

| Terme                 | Catégorie  | ID            | Chemin                                      | Status        |
| --------------------- | ---------- | ------------- | ------------------------------------------- | ------------- |
| Hero Banner           | interface  | `hero-banner` | `/images/lexique/interface/hero-banner.png` | 📋 Données OK |
| En-tête (Header)      | navigation | `en-tete`     | `/images/lexique/navigation/en-tete.png`    | 📋 Données OK |
| Pied de page (Footer) | navigation | `pied-page`   | `/images/lexique/navigation/pied-page.png`  | 📋 Données OK |

### 📌 À Configurer

Voir `src/pages/LexiquePage/data/terms.ts` pour la liste complète. Les termes sans `screenshot` afficheront un placeholder.

## 🚀 Prochaines Étapes

1. **Ajouter les 3 images manquantes** :

   - `public/images/lexique/interface/hero-banner.png`
   - `public/images/lexique/navigation/en-tete.png`
   - `public/images/lexique/navigation/pied-page.png`

2. **Configurer les autres termes progressivement** :

   - Cliquez sur un terme sans image pour voir le placeholder
   - Prenez une capture d'écran
   - Suivez la checklist ci-dessus

3. **Optimiser les images** :
   - Compression
   - Responsive design
   - Accessibilité

## 🆘 Dépannage

### L'image ne s'affiche pas

- ✅ Vérifier le chemin du fichier
- ✅ Vérifier la catégorie (doit correspondre à `term.category`)
- ✅ Vérifier le nom du fichier (doit être `{term.id}.png`)
- ✅ Vérifier que `term.screenshot` existe dans les données
- ✅ Ouvrir le DevTools (F12) → Network pour voir les erreurs 404

### Les annotations ne s'affichent pas

- ✅ Vérifier que `term.screenshot.annotations` est un array non-vide
- ✅ Vérifier que `x` et `y` sont des strings valides (ex: "20%", "100px")
- ✅ Vérifier que `type` est "primary" ou "secondary"

### Page ne compile pas

- ✅ Vérifier la syntaxe TypeScript (VSCode devrait le signaler)
- ✅ Vérifier les imports (useLexiqueImage, getCategoryColor)
- ✅ Exécuter `npm run build` pour voir les erreurs exactes

## 📚 Ressources

- [Types TypeScript](src/pages/LexiquePage/types.ts)
- [Hook useLexiqueImage](src/pages/LexiquePage/hooks/useLexiqueImage.ts)
- [Composant TermCard](src/pages/LexiquePage/components/TermCard.tsx)
- [Données des Termes](src/pages/LexiquePage/data/terms.ts)
- [Guide des Images](public/images/lexique/README.md)

---

**Version** : 1.0  
**Date** : 11 janvier 2026  
**Statut** : ✅ Prêt pour intégration des images
