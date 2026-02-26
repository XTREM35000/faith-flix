# Guide : Éviter les bugs de saisie et focus dans les modales

## Problèmes courants rencontrés

### 1. **Inputs limités à quelques caractères**

Cause : Les événements pointers du modal interfèrent avec les inputs.

**Solution :**

- ✅ Toujours vérifier que les inputs sont dans une zone `pointer-events: auto`
- ✅ Utiliser `isInteractiveTarget()` pour détecter inputs, textareas, boutons, labels
- ✅ Retourner tôt du handler pointer si la target est interactive

### 2. **Focus passe automatiquement au bouton de fermeture**

Cause : Le modal ou un parent défocuse involontairement les inputs.

**Solution :**

- ✅ Ne pas ajouter d'attributs `autoFocus` sur les éléments du header
- ✅ Ne pas appeler `element.focus()` automatiquement dans les handlers pointer
- ✅ Laisser le focus naturellement sur l'input saisit par l'utilisateur
- ✅ S'assurer que `pointer-events` ne bloque pas les inputs (ne pas mettre `pointer-events: none` sur le contenu du formulaire)

## Bonnes pratiques d'implémentation

### Pour les composants container modaux :

```tsx
// ✅ BON : Vérifier si target interactive
function onPointerDown(e: React.PointerEvent) {
  if (isInteractiveTarget(e.target)) return;  // Sortir tôt
  // démarrer le drag...
}

// ✅ BON : Autoriser pointer-events sur le contenu
<div style={{ pointerEvents: 'auto' }}>
  <input ... />
</div>
```

### Pour les inputs/formulaires dans une modale :

```tsx
// ✅ BON : Utiliser des inputs standard shadcn/ui
<Input
  value={formData.field}
  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
  className="w-full"
/>

// ❌ MAUVAIS : Ajouter des restrictions inutiles
<input maxLength="2" />  // Limite artificielle
<input onPointerDown={(e) => e.preventDefault()} />  // Bloque les events
```

## Checklist avant refactorisation modale

- [ ] Aucun `autoFocus` sur les éléments non-input du header
- [ ] `pointer-events: auto` sur tous les inputs/textareas
- [ ] `isInteractiveTarget()` détecte correctement input/textarea/select/button
- [ ] Handlers pointer retournent tôt pour les targets interactives
- [ ] Pas de `preventDefault()` sur pointer events des inputs
- [ ] Pas de `e.stopPropagation()` sur les inputs eux-mêmes

## Architecture recommandée pour DraggableModal

```
<DraggableModal>
  <header data-drag-handle>...</header>  ← Point de drag
  <div pointerEvents="auto">
    <form>
      <input />  ← Zone saisie, pas de drag
    </form>
  </div>
</DraggableModal>
```

---

**Résumé** : Pointer events + inputs = nécessité stricte de séparation. Les inputs doivent toujours avoir priorité sur les gestes de drag/resize. Utiliser `pointer-events` CSS et la détection `isInteractiveTarget()` pour éviter les conflits.
