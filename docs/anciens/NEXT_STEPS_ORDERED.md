# 🎯 PROCHAINES ÉTAPES ORDONNÉES

_Roadmap d'implémentation pour terminer l'uniformisation_

---

## 🔴 PRIORITÉ 1 : Validation Immédiate (Aujourd'hui)

### ✅ Vérifier les Modales Refactorisées

**Action 1.1** - StreamEditorModal

```
Location : /admin/live
Temps : 5 min
Checklist :
  □ Ouvrir la modal
  □ Tester drag sur header
  □ Tester Escape key
  □ Tester focus sur inputs (pas de fermeture)
  □ Tester bouton X
Status : ✅ / ⚠️ / ❌ → À signaler si ❌
```

**Action 1.2** - DocumentEditorModal

```
Location : [Trouver où elle est utilisée]
Temps : 5 min
Mêmes tests que 1.1
Status : ✅ / ⚠️ / ❌ → À signaler si ❌
```

**Action 1.3** - Vérification Console

```
Temps : 2 min
Ouvrir DevTools (F12)
Script un cycle complet ouverture/fermeture
Chercher erreurs rouges
Status : ✅ / ⚠️ / ❌
```

---

## 🟠 PRIORITÉ 2 : Adaptation Rapide (Cette Semaine)

### 2️⃣ Adapter EventModalForm.tsx

**Estimé :** ~15 minutes

**Étapes:**

```
1. Ouvrir src/components/EventModalForm.tsx
2. Chercher le JSX de rendu de modal (chercher "return")
3. Remplacer par UnifiedFormModal (voir MODAL_USAGE_EXAMPLES.tsx)
4. Importer : import UnifiedFormModal from '@/components/ui/unified-form-modal'
5. Tester : ouvrir, drag, focus, escape, buttons
6. Valider avec VALIDATION_CHECKLIST.md
7. Commit: "refactor: EventModalForm uses UnifiedFormModal"
```

**Reference:** `src/components/StreamEditorModal.tsx` (voir comment c'est fait)

---

### 3️⃣ Adapter VideoModal.tsx

**Estimé :** ~20 minutes (contient Framer Motion)

**Étapes:**

```
1. Ouvrir src/components/VideoModal.tsx
2. Identifier la structure de modal (AnimatePresence, motion.div)
3. Garder les animations Framer Motion sur le contenu
4. Envelopper avec UnifiedFormModal pour le container
5. Tester toutes les animations
6. Vérifier focus & drag
7. Commit: "refactor: VideoModal uses UnifiedFormModal"
```

**Note:** Les animations Framer Motion peuvent rester sur le contenu

---

### 4️⃣ Adapter SetupWizardModal.tsx

**Estimé :** ~10 minutes

**Étapes:**

```
1. Ouvrir src/components/SetupWizardModal.tsx
2. Remplacer DraggableModal wrapping par UnifiedFormModal
3. Passer les props : open, onClose, title (dynamique par step?)
4. Tester : tous les steps, drag, focus
5. Vérifier persistance d'état pas affectée
6. Commit: "refactor: SetupWizardModal uses UnifiedFormModal"
```

**Total Actions 2 + 3 + 4 : ~45 minutes**  
**Status:** Très faisable en 1h vendredi

---

## 🟡 PRIORITÉ 3 : Analyse & Adaptation (Prochaine Semaine)

### 5️⃣ Analyser ForgotPasswordModal.tsx

**Estimé :** ~15 minutes

**Action:**

```
1. Lire le code existant
2. Chercher patterns similaires
3. Décider : adapter ou laisser (dépend structure)
4. Si adapter : suivre le pattern de MODAL_USAGE_EXAMPLES.tsx
5. Si laisser : documenter la raison
6. Decision : ⏳ À faire
```

---

### 6️⃣ Évaluer AuthModal.tsx

**Estimé :** ~20 minutes

**Action:**

```
1. Lire le code (utilise déjà DraggableModal)
2. Vérifier si remplacer par UnifiedFormModal apporte valeur
3. Considérer : animations complexes, multi-onglets, etc.
4. Recommandation possible : Laisser comme est (déjà optimisé)
5. Decision : 🤔 À discuter
```

---

### 7️⃣ Auditer Modales Mineures

**Estimé :** ~30 minutes

**Chercher et analyser:**

```
□ WelcomeModal.tsx - Simple, blue header
□ HomilyModal.tsx - À localiser & analyser
□ GalleryImageModal.tsx - À localiser & analyser
□ Autres _Modal.tsx non encore touchées

Pour chaque :
  1. Lire le code
  2. Décider : adapter ou laisser
  3. Noter dans ADAPTER_OR_LEAVE.md
```

---

## 🟢 PRIORITÉ 4 : Consolidation (Fin Semaine)

### 8️⃣ Tests d'Intégration Globale

**Estimé :** ~45 minutes

**Checklist:**

```
□ Toutes les modales s'ouvrent correctement
□ Pas de console errors
□ Drag fonctionne partout
□ Focus OK partout
□ Performance stable
□ Accessibilité preservée

Si ✅ : Déploiement en test
Si ⚠️ : Corriger & retry
Si ❌ : Escalader
```

---

### 9️⃣ Documentation Finale

**Estimé :** ~20 minutes

**Actions:**

```
□ Mettre à jour MODIFICATIONS_SUMMARY.md avec toutes les adaptations
□ Ajouter screenshots avant/après si pertinent
□ Mettre à jour INDEX_GLOBAL.md status
□ Créer LESSONS_LEARNED.md avec insights
□ Commit: "docs: update after full uniformization"
```

---

### 🔟 Déploiement & Monitoring

**Estimé :** ~15 minutes

**Actions:**

```
□ Code review par pair
□ Merge en develop
□ Déploiement en staging
□ Vérification 1h
□ Merge en main si ✅
□ Monitor erreurs 24h
□ Escalader si problèmes
```

---

## 📊 Timeline Proposal

```
JOUR 1 (Aujourd'hui) - PRIORITÉ 1
├─ 1h : Validation des 2 modales refactorisées
└─ Risque : Bas (changements mineurs)

JOUR 2-3-4 (Cette Semaine) - PRIORITÉ 2
├─ 1.5h : Adapter 3 modales prioritaires (Events, Video, Setup)
├─ Tests : 30 min
└─ Risque : Moyen (nécessite test métier)

JOUR 5-6-7 (Prochaine Semaine) - PRIORITÉ 3
├─ 1h : Analyser les autres modales
├─ 0.5h : Décisions sur chaque
└─ Risque : Bas (analysis only)

JOUR 8-9-10 (Fin Semaine) - PRIORITÉ 4
├─ 1h : Tests intégration complets
├─ 0.5h : Docs finales
├─ Déploiement & monitoring
└─ Risque : Très bas (validation complète)
```

**Total :** ~6 heures de développement + testing  
**Réaliste :** 2-3 jours avec tests appropriés

---

## ✅ Gates de Validation Entre Étapes

**Avant PRIORITÉ 2 :**

```
Gate 1 : Modales refactorisées validées ✅
         Si NON → Fix & retry
         Si OUI → Proceed
```

**Avant PRIORITÉ 3 :**

```
Gate 2 : EventModalForm, VideoModal, SetupWizardModal adaptées & testées
         Pas de régression métier
         Si OUI → Proceed
```

**Avant PRIORITÉ 4 :**

```
Gate 3 : Toutes les modales audit complété
         Plan d'action clair pour chacune
         Si OUI → Proceed
```

**Avant Déploiement :**

```
Gate 4 : Tests intégrés complets passés
         Code review approuvée
         Aucune console error
         Si OUI → Deploy
```

---

## 🎯 Assignements Recommandés

| Tâche                     | Owner         | Est.  | Start   | End     |
| ------------------------- | ------------- | ----- | ------- | ------- |
| PRIORITÉ 1 - Validation   | [Dev Lead]    | 1h    | Ajd     | Ajd     |
| PRIORITÉ 2.1 - EventModal | [Dev 1]       | 15min | Dem     | Dem     |
| PRIORITÉ 2.2 - VideoModal | [Dev 2]       | 20min | Dem     | Dem     |
| PRIORITÉ 2.3 - SetupModal | [Dev 1]       | 10min | Dem     | Dem     |
| PRIORITÉ 2 - Tests        | [QA]          | 45min | Dem     | Dem     |
| PRIORITÉ 3 - Audit        | [Dev Lead]    | 1h    | Sem Pro | Sem Pro |
| PRIORITÉ 4 - Integration  | [Dev Team]    | 1h    | Ven     | Ven     |
| PRIORITÉ 4 - Docs         | [Tech Writer] | 20min | Ven     | Ven     |
| PRIORITÉ 4 - Deployment   | [Dev Ops]     | 15min | Ven     | Ven     |

---

## 📋 Ressources Disponibles

- 📖 [`MODAL_UNIFICATION_GUIDE.md`](MODAL_UNIFICATION_GUIDE.md) - Reference complète
- 💡 [`MODAL_USAGE_EXAMPLES.tsx`](MODAL_USAGE_EXAMPLES.tsx) - Code copy-paste prêt
- 🧪 [`VALIDATION_CHECKLIST.md`](VALIDATION_CHECKLIST.md) - Tests à faire
- 📚 [`INDEX_GLOBAL.md`](INDEX_GLOBAL.md) - Navigation docs

---

## 🚩 Points de Blocage Potentiels

| Blocage           | Cause                 | Mitigation                        |
| ----------------- | --------------------- | --------------------------------- |
| Regression métier | Logique non couverte  | Tests métier avant commit         |
| Focus issues      | Logique unique modal  | Valider avec VALIDATION_CHECKLIST |
| Performance       | Si change majeur      | Benchmark avant/après             |
| Auth issues       | Si modal auth touchée | Escalader immédiatement           |

---

## 🎊 Succès Criteria

```
✅ PRIORITÉ 1 SUCCESS
□ 2 modales validées sans erreurs
□ Drag fonctionne
□ Focus OK
□ Escape key OK

✅ PRIORITÉ 2 SUCCESS
□ 3 modales adaptées & testées
□ 0 régressions métier
□ 0 console errors
□ Performance stable

✅ PRIORITÉ 3 SUCCESS
□ Toutes les modales auditées
□ Plan clair pour chacune
□ Décisions documentées

✅ PRIORITÉ 4 SUCCESS
□ Tests intégrés 100% passés
□ Déploiement clean
□ Monitoring durant 24h OK
□ 0 incidents post-deploy
```

---

## 📞 Escalade Rapide

**Problème Urgent ?**

1. Slack : [@Dev Lead] + contexte
2. Check : `VALIDATION_CHECKLIST.md` pour cause probable
3. Rollback si déploiement si critique
4. Analyse post-incident

**Question sur Adaptation ?**

1. Consulter : `MODAL_USAGE_EXAMPLES.tsx`
2. Lire : `MODAL_UNIFICATION_GUIDE.md`
3. Pair programming 30min si bloqué

---

## 🎯 Finale

Avec ce plan ordonnée, l'uniformisation complète des modales sera :

- ✅ **Methodique** (pas de chaos)
- ✅ **Testée** (0 bugs déployés)
- ✅ **Documentée** (facile à maintenir)
- ✅ **Rapide** (~6 heures code + testing)

**Objectif :** 100% des modales uniformisées d'ici fin de semaine ✨
