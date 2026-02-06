# ⚡ GUIDE RAPIDE - 5 Minutes pour Corriger le Problème d'Email

## 🎯 Le Problème

Email de réinitialisation du mot de passe n'est pas envoyé via `/auth`

## ✅ La Solution (3 étapes)

### 1️⃣ Configurer Supabase Email Provider (2 min)

```
URL: https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/email

Choisir UNE option:
├─ SendGrid (recommandé, gratuit) → https://sendgrid.com → Copier API Key
├─ Gmail (gratuit) → Créer "App Password" → https://myaccount.google.com/apppasswords
└─ Mailgun (gratuit 3 mois) → https://mailgun.com
```

### 2️⃣ Ajouter URL de Redirection (1 min)

```
URL: https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/url-configuration

Ajouter:
http://localhost:5173/reset-password
https://faith-flix.vercel.app/reset-password
```

### 3️⃣ Tester (2 min)

```
Option A: Page de test
→ npm run dev
→ http://localhost:5173/dev/test-password-reset
→ Entrer email + Cliquer "Tester"

Option B: Formulaire normal
→ /auth → "Mot de passe oublié" → Entrer email
→ Ouvrir DevTools (F12) → Chercher logs "🔍 DIAGNOSTIC"
```

---

## 🔍 Messages Attendus

### ✅ Si ça marche:

```
✅ Email accepté par Supabase
→ Vous recevrez un email de réinitialisation
```

### ❌ Si ça ne marche pas:

Voir le message d'erreur dans DevTools:

```
❌ User not found → Email non enregistré
❌ rate limit → Trop de tentatives
❌ Email provider → Service non configuré
```

---

## 📋 Checklist (5 minutes)

- [ ] Aller sur https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/email
- [ ] Configurer Email Provider (SendGrid/Gmail/Mailgun)
- [ ] Ajouter URL: `http://localhost:5173/reset-password`
- [ ] Ajouter URL: `https://faith-flix.vercel.app/reset-password`
- [ ] npm run dev
- [ ] Tester à http://localhost:5173/dev/test-password-reset
- [ ] ✓ Vérifier que l'email arrive

---

## 📚 Documentation Complète

- `SOLUTION_PASSWORD_RESET_EMAIL.md` - Guide détaillé (15 min)
- `RECAP_CORRECTIONS_EMAIL.md` - Résumé des modifications (5 min)
- `password-reset-check.ps1` - Script de vérification automatique

---

## 🚀 Déploiement

```bash
# 1. Tester localement
npm run dev

# 2. Commit et push
git add .
git commit -m "fix: improve email password reset diagnostics"
git push origin main

# 3. Tester en production
https://faith-flix.vercel.app/dev/test-password-reset
```

---

**Status**: ✅ Prêt pour configuration et test  
**Temps requis**: ~10 minutes (configuration + test)
