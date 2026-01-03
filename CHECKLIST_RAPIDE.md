# ✅ CHECKLIST PRATIQUE - À FAIRE MAINTENANT

## 🎯 EN 5 MINUTES

### **Minute 1️⃣: Lire**

- [ ] Lire ce fichier (checklist)
- [ ] Lire [README_CORRECTIONS.md](README_CORRECTIONS.md)

### **Minute 2️⃣: Diagnostic**

```
ALLER À: Supabase Dashboard → SQL Editor
COPIER: QUICK_SQL_COMMANDS.sql (partie 1: VÉRIFIER RAPIDEMENT)
EXÉCUTER: Cmd+K ou Ctrl+K
NOTER: Les counts (gallery_images et homepage_content)
```

### **Minute 3️⃣: Correction** (SI VIDE)

```
SI gallery_images count = 0:
  COPIER: supabase/migrations/004_fix_...sql
  EXÉCUTER: Cmd+K ou Ctrl+K
  ATTENDRE: Confirmation

SINON:
  SAUTER CETTE ÉTAPE
```

### **Minute 4️⃣: Recharger**

```
F5 dans le navigateur
OU
npm run dev
```

### **Minute 5️⃣: Tester**

```
F12 pour ouvrir console
VÉRIFIER: Pas d'erreur rouge 406
VÉRIFIER: Logs "📸 Gallery Query"
ACCÉDER À: /galerie
VÉRIFIER: Images ou message "Aucune photo"
```

---

## 📋 CHECKLIST SIMPLE

- [ ] **Diagnostic**

  - [ ] Ouvrir Supabase SQL Editor
  - [ ] Copier QUICK_SQL_COMMANDS.sql
  - [ ] Exécuter diagnostic
  - [ ] Noter les counts

- [ ] **Correction** (si vide)

  - [ ] Copier 004*fix*...sql
  - [ ] Exécuter correction
  - [ ] Vérifier confirmations

- [ ] **Test Local**

  - [ ] npm run dev (ou F5)
  - [ ] Ouvrir Console (F12)
  - [ ] Vérifier logs
  - [ ] Accéder /galerie
  - [ ] Vérifier images

- [ ] **Validation**
  - [ ] Pas d'erreur 406
  - [ ] Logs affichés correctement
  - [ ] Images ou message clair
  - [ ] Pas d'erreurs console
  - [ ] Application stable

---

## 🚀 GO LIVE CHECKLIST

**Avant de Valider**

- [ ] Diagnostic exécuté
- [ ] Correction appliquée (si nécessaire)
- [ ] Tests locaux passants
- [ ] Console sans erreurs
- [ ] UI responsive

**Documentation**

- [ ] README lu
- [ ] Guides consultés
- [ ] Commandes SQL exécutées
- [ ] Logs vérifiés

**Status Final**

- [ ] Code modifié ✅
- [ ] SQL exécuté ✅
- [ ] Tests passants ✅
- [ ] Prêt production ✅

---

## 📞 AIDE RAPIDE

**Erreur 406 persiste?**
→ Vérifier auth.uid() n'est pas null
→ Vérifier politiques RLS

**Galerie vide après insertion?**
→ Vérifier is_public = true
→ Vérifier COUNT(\*) > 0

**Erreurs TypeScript?**
→ Ce sont des erreurs pré-existantes
→ À ignorer pour l'instant

**Script SQL ne s'exécute pas?**
→ Copier-coller sans guillemets
→ Vérifier la syntaxe
→ Consulter INDEX_CORRECTIONS.md

---

## 🎯 OBJECTIF FINAL

```
✅ Erreur 406 gérée
✅ Galerie vide détectée
✅ Message utilisateur clair
✅ Logs informatifs
✅ Application stable

RESULTAT: PRÊT POUR PRODUCTION ✅
```

---

## 📂 FICHIERS À CONSULTER

| Besoin         | Fichier                                          |
| -------------- | ------------------------------------------------ |
| Vue d'ensemble | [README_CORRECTIONS.md](README_CORRECTIONS.md)   |
| Commandes SQL  | [QUICK_SQL_COMMANDS.sql](QUICK_SQL_COMMANDS.sql) |
| Instructions   | [CORRECTION_GUIDE.md](CORRECTION_GUIDE.md)       |
| Navigation     | [INDEX_CORRECTIONS.md](INDEX_CORRECTIONS.md)     |

---

**Durée**: ~5 minutes  
**Difficulté**: ⭐ (très facile, copy-paste)  
**Status**: ✅ Prêt
