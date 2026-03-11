# Procédure Stripe - Architecture Production

## Changements et améliorations

### 1. Edge Function `create-payment`

- Insère un don dans la table `donations` avec `status: "pending"`.
- Crée une session Stripe Checkout avec `metadata: { donation_id }`.
- Stocke `stripe_session_id` dans la table `donations`.

### 2. Stripe Webhook

- Lors de l'événement `checkout.session.completed` :
  - Récupère `donation_id` depuis `metadata`.
  - Met à jour la table `donations` :
    - `status: "paid"`
    - `stripe_payment_intent`
    - `paid_at` (date de paiement)
  - Ignore les doublons (si déjà payé).

### 3. Vérification du paiement côté frontend

- La page `donation-success` lit `session_id` depuis l'URL.
- Appelle l'Edge Function `verify-payment`.
- Récupère le don via `stripe_session_id`.
- Affiche l'état selon le champ `status` :
  - `paid` → succès
  - `pending` → attente
  - `failed` → échec

### 4. Sécurité et fiabilité

- Le webhook Stripe est la seule source de vérité pour la confirmation de paiement.
- Le frontend ne fait plus confiance à la redirection Stripe.
- Les doublons d'événements Stripe sont ignorés.
- Aucun changement sur les composants UI ou modals.
- Pas de redirection automatique après paiement.

### 5. Synchronisation

- Synchronisation fiable entre Stripe et Supabase.
- Statut du don toujours vérifié côté backend.

---

Cette architecture garantit la fiabilité, la sécurité et la cohérence des paiements Stripe, tout en préservant l'expérience utilisateur existante.
