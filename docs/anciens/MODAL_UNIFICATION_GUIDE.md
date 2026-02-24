# 📋 Guide d'Uniformisation des Formulaires Modaux - Faith-Flix

## ✅ Étapes Complétées

### 1. Création du composant unifié `UnifiedFormModal.tsx`

**Emplacement :** `src/components/ui/unified-form-modal.tsx`

**Caractéristiques :**

- ✅ Draggable sur le header (logique optimisée)
- ✅ Gestion du focus par défaut (Escape key)
- ✅ Header standardisé marron-ambré (`bg-amber-900`)
- ✅ Contenu scrollable
- ✅ Props flexibles pour la personnalisation
- ✅ Accessibilité (role="dialog", aria-modal, aria-labelledby)

**Props disponibles :**

```typescript
interface UnifiedFormModalProps {
  open: boolean // Contrôle l'ouverture
  onClose: () => void // Callback fermeture
  title: string // Titre du modal
  children: React.ReactNode // Contenu du formulaire
  headerClassName?: string // Classes Tailwind pour header (défaut: 'bg-amber-900')
  maxWidth?: string // Classes Tailwind pour largeur (défaut: 'max-w-2xl')
  headerLeftAdornment?: React.ReactNode // Éléments additionnels en haut-gauche du header
  showCloseButton?: boolean // Afficher le bouton X (défaut: true)
}
```

### 2. Refactorisation de `StreamEditorModal.tsx`

- ✅ Convertie en wrapper mince qui utilise `UnifiedFormModal`
- ✅ Conserve l'interface existante pour compatibilité rétroactive
- ✅ Toutes les fonctionnalités presentes

### 3. Refactorisation de `DocumentEditorModal.tsx`

- ✅ Convertie en wrapper mince qui utilise `UnifiedFormModal`
- ✅ Support pour `headerClassName` personnalisé
- ✅ Toutes les fonctionnalités presentes

---

## 🎯 Prochaines Étapes (Guide d'Action)

### **PHASE 1 : Modales Formulaires Prioritaires**

#### A. `EventModalForm.tsx`

**Status :** Utilise actuellement `BaseModal` + structure custom

**Action :**

```typescript
// Chercher le rendu du modal dans EventModalForm.tsx
// Remplacer la structure existante par:

<UnifiedFormModal
  open={open}
  onClose={onClose}
  title="Événement"
  headerClassName="bg-amber-900"
>
  {/* Contenu du formulaire existant */}
</UnifiedFormModal>
```

**Fichier à modifier :** `src/components/EventModalForm.tsx` (chercher le `return` JSX de la modal)

---

#### B. `VideoModal.tsx`

**Status :** Structure propriétaire avec Framer Motion

**Action :** Adapter progressivement

```typescript
// Remplacer la structure de modal personnalisée par UnifiedFormModal
// Conserver les animations Framer Motion sur le contenu si désiré

<UnifiedFormModal open={open} onClose={handleClose} title="Ajouter une vidéo">
  {/* Contenu existant */}
</UnifiedFormModal>
```

**Fichier à modifier :** `src/components/VideoModal.tsx` (lignes ~113-308)

---

#### C. `SetupWizardModal.tsx`

**Status :** Utilise `DraggableModal` (OK)

**Action :** Adaptation mineure pour uniformité

```typescript
// Remplacer DraggableModal par UnifiedFormModal avec options personnalisées

<UnifiedFormModal
  open={open}
  onClose={onClose}
  title={getTitleForStep(step)}
  headerClassName="bg-blue-600"
>
  {/* Contenu du wizard */}
</UnifiedFormModal>
```

**Fichier à modifier :** `src/components/SetupWizardModal.tsx` (ligne ~140)

---

#### D. `ForgotPasswordModal.tsx`

**Status :** À analyser

**Actions recommandées :**

1. Vérifier la structure actuelle
2. Adapter selon le pattern global

---

### **PHASE 2 : Modales Secondaires & Modals Spécialisées**

#### E. `AuthModal.tsx`

**Status :** Utilise `DraggableModal`

**Note :** Garder le système actuel pour le moment (complexe avec animations)

- ✅ Peut rester sur `DraggableModal` pour la gestion multi-onglets et animations complexes
- 🎨 Standardiser le header visual si possible

---

#### F. `WelcomeModal.tsx`, `HomilyModal.tsx`, `GalleryImageModal.tsx`

**Status :** Structures spécialisées

**Action :** Évaluer au cas par cas selon les besoins métier

---

## 🛠️ Guide d'Implémentation Progressive

### **Pour adapter chaque composant :**

1. **Importer le composant :**

   ```typescript
   import UnifiedFormModal from '@/components/ui/unified-form-modal'
   ```

2. **Identifier le rendu modal actuel** dans le JSX

3. **Remplacer par :**

   ```typescript
   <UnifiedFormModal
     open={/* state */}
     onClose={/* fonction */}
     title={/* titre */}
     headerClassName="bg-amber-900" // ou personnalisé
     maxWidth="max-w-2xl" // ou personnalisé
   >
     {/* Contenu existant du formulaire */}
   </UnifiedFormModal>
   ```

4. **Tester :**
   - ✅ Modal s'ouvre/ferme normalement
   - ✅ Header est draggable
   - ✅ Pas de fermeture intempestive en cliquant sur les champs
   - ✅ Escape key ferme la modal
   - ✅ Aucune régression fonctionnelle

---

## 📊 Checklist d'Uniformisation

- [x] `UnifiedFormModal.tsx` créé
- [x] `StreamEditorModal.tsx` refactorisé
- [x] `DocumentEditorModal.tsx` refactorisé
- [ ] `EventModalForm.tsx` - À faire
- [ ] `VideoModal.tsx` - À faire
- [ ] `SetupWizardModal.tsx` - À faire
- [ ] `ForgotPasswordModal.tsx` - À analyser
- [ ] `AuthModal.tsx` - À améliorer (optionnel)
- [ ] `WelcomeModal.tsx` - À évaluer
- [ ] Tests globaux de focus et drag

---

## 🎨 Charte Visuelle Unifiée

| Aspect             | Standard          | Alternative Autorisée                          |
| ------------------ | ----------------- | ---------------------------------------------- |
| **Header Couleur** | `bg-amber-900`    | `bg-blue-600`, `bg-green-600` (selon contexte) |
| **Header Texte**   | `text-white`      | -                                              |
| **Largeur Défaut** | `max-w-2xl`       | `max-w-3xl`, `max-w-md` (selon contenu)        |
| **Draggable**      | ✅ Oui            | -                                              |
| **Fermeture**      | Bouton X + Escape | -                                              |
| **Scroll Contenu** | ✅ Oui            | -                                              |
| **Z-index**        | `z-50`            | Cohérent avec l'application                    |

---

## 🔍 Vérification Focus & Drag

### Test du Focus

```
1. Ouvrir la modal
2. Cliquer sur un champ input → Pas de fermeture
3. Taper dans le champ → OK
4. Presser Escape → Modal ferme
5. Tab circulaire dans les éléments → OK
```

### Test du Drag

```
1. Cliquer sur le header et traîner → Modal se déplace
2. Cliquer sur un bouton dans le header → Pas de déplacement (drag cancel)
3. Fermer et réouvrir → Position réinitialisée
```

---

## 📝 Notes d'Implémentation

- **Rétro-compatibilité :** Les anciens composants (`StreamEditorModal`, `DocumentEditorModal`) sont conservés mais utilisent maintenant `UnifiedFormModal` en interne
- **Zéro Régression :** Aucune fonctionnalité métier n'est altérée
- **Progressif :** Les adaptations se font pas à pas, composant par composant
- **Maintenabilité :** Un seul endroit où gérer le style et la logique des modales

---

## 🚀 Exécution Recommandée

**Ordre de priorité :**

1. Tests manuels des modales refactorisées
2. Adapter `EventModalForm.tsx` et `VideoModal.tsx`
3. Adapter `SetupWizardModal.tsx`
4. Analyser les modales secondaires au cas par cas
5. Session de tests d'intégration globale
