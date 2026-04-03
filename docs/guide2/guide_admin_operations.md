# Guide des Opérations Administrateur

Ce guide explique étape par étape comment effectuer les opérations administratives dans l'application Paroisse 2026. Il est destiné aux utilisateurs ayant les rôles 'admin' ou 'super_admin'.

## Prérequis

- Vous devez être connecté avec un compte ayant le rôle 'admin' ou 'super_admin'.
- Accédez au tableau de bord administrateur via le menu ou l'URL `/admin/dashboard`.

## 1. Gestion des Rôles Utilisateur

Les rôles définissent les permissions des utilisateurs dans l'application.

### Étapes pour ajouter ou modifier un rôle :

1. **Accéder à la gestion des rôles** :
   - Depuis le tableau de bord admin, cliquez sur "Gestion des Rôles" ou allez directement à `/admin/roles`.

2. **Voir la liste des utilisateurs** :
   - La page affiche tous les utilisateurs enregistrés avec leurs rôles actuels.

3. **Modifier un rôle** :
   - Cliquez sur le bouton "Modifier" à côté de l'utilisateur souhaité.
   - Sélectionnez le nouveau rôle dans la liste déroulante :
     - `member` : Membre simple (permissions de base)
     - `admin` : Administrateur (gestion du contenu)
     - `super_admin` : Super administrateur (tous les droits)
     - `curé` : Prêtre (rôles spécifiques aux cultes)

4. **Sauvegarder les changements** :
   - Cliquez sur "Sauvegarder" pour appliquer le nouveau rôle.
   - L'utilisateur recevra automatiquement les nouvelles permissions.

### Permissions par rôle :
- **Super Admin** : Accès complet à toutes les fonctionnalités, gestion des paroisses, utilisateurs, etc.
- **Admin** : Gestion du contenu (vidéos, photos, événements), modération.
- **Curé** : Gestion des cultes, homélies, cérémonies.
- **Member** : Accès en lecture seule aux contenus publics.

## 2. Gestion des Officiants

Les officiants sont les personnes autorisées à célébrer les cérémonies religieuses.

### Étapes pour ajouter un officiant :

1. **Accéder à la gestion des officiants** :
   - Depuis le tableau de bord admin, cliquez sur "Officiants" ou allez à `/admin/officiants`.

2. **Ajouter un nouvel officiant** :
   - Cliquez sur le bouton "Ajouter un Officiant".
   - Remplissez le formulaire :
     - **Nom complet** : Nom et prénom de l'officiant
     - **Titre** : Prêtre, Diacre, etc.
     - **Paroisse** : Paroisse d'appartenance
     - **Contact** : Email ou téléphone (optionnel)
     - **Spécialisations** : Types de cérémonies (baptême, mariage, etc.)

3. **Sauvegarder** :
   - Cliquez sur "Créer" pour ajouter l'officiant à la base de données.

### Modifier ou supprimer un officiant :
- Cliquez sur "Modifier" pour changer les informations.
- Cliquez sur "Supprimer" pour retirer l'officiant (confirmation requise).

## 3. Gestion des Vidéos

### Pour les Administrateurs :

1. **Accéder à la page vidéos** :
   - Allez à `/videos` ou cliquez sur "Vidéos" dans le menu.

2. **Ajouter une vidéo** :
   - Cliquez sur le bouton "Ajouter une vidéo" (icône +).
   - Remplissez le formulaire :
     - **Titre** : Titre de la vidéo
     - **Description** : Description détaillée
     - **Catégorie** : Sermon, Musique, Célébration, Enseignement, Témoignage
     - **URL de la vidéo** : Lien YouTube, Vimeo, ou fichier upload
     - **Miniature** : Image de couverture (optionnel)
     - **Date** : Date de publication

3. **Modifier une vidéo** :
   - Cliquez sur l'icône "Modifier" (crayon) sur la vidéo souhaitée.
   - Changez les informations et sauvegardez.

4. **Supprimer une vidéo** :
   - Cliquez sur l'icône "Supprimer" (poubelle).
   - Confirmez la suppression.

### Pour les Membres Simples :
- Les membres peuvent uniquement visualiser les vidéos publiques.
- Ils ne peuvent pas ajouter, modifier ou supprimer de contenu.

## 4. Gestion de la Galerie Photos

### Pour les Administrateurs :

1. **Accéder à la galerie** :
   - Allez à `/gallery` ou cliquez sur "Galerie" dans le menu.

2. **Ajouter une photo** :
   - Cliquez sur "Ajouter une image".
   - Sélectionnez le fichier image depuis votre ordinateur.
   - Ajoutez un titre et une description (optionnel).
   - Choisissez la catégorie (événement, paroisse, etc.).

3. **Modifier une photo** :
   - Cliquez sur l'image pour voir les détails.
   - Utilisez les boutons "Modifier" pour changer titre/description.

4. **Supprimer une photo** :
   - Cliquez sur "Supprimer" et confirmez.

### Pour les Membres Simples :
- Consultation uniquement des photos publiques.

## 5. Gestion des Homélies

### Pour les Administrateurs/Curé :

1. **Accéder aux homélies** :
   - Allez à `/homilies` ou cliquez sur "Homélies".

2. **Ajouter une homélie** :
   - Cliquez sur "Ajouter une homélie".
   - Remplissez :
     - **Titre**
     - **Prêtre** : Sélectionnez l'officiant
     - **Date**
     - **Description**
     - **Vidéo URL** (optionnel)
     - **Image** (optionnel)
     - **Transcription** (optionnel)
     - **Durée** (en minutes)

3. **Modifier/Supprimer** :
   - Utilisez les boutons "Modifier" et "Supprimer" comme pour les vidéos.

### Pour les Membres Simples :
- Lecture des homélies publiées.

## 6. Gestion des Campagnes

### Pour les Administrateurs :

1. **Accéder aux campagnes** :
   - Allez à `/campaigns`.

2. **Créer une campagne** :
   - Cliquez sur "Nouvelle campagne".
   - Définissez :
     - Titre et description
     - Objectif financier
     - Dates de début/fin
     - Images promotionnelles

3. **CRUD complet** : Ajouter, modifier, supprimer comme les autres contenus.

## 7. Gestion des Cultes (Confession, Mariage, Baptême)

### Pour les Administrateurs/Curé :

1. **Accéder aux cultes** :
   - Confession : `/culte/confession`
   - Mariage : `/culte/mariage`
   - Baptême : `/culte/bapteme`

2. **Créer une demande/cérémonie** :
   - Cliquez sur "Nouvelle demande".
   - Remplissez le formulaire spécifique à chaque culte :
     - **Informations personnelles** des participants
     - **Date souhaitée**
     - **Officiant** (sélection parmi les officiants enregistrés)
     - **Détails spécifiques** (témoins pour mariage, parrain/marraine pour baptême)

3. **Approuver/Modifier/Annuler** :
   - Utilisez les boutons d'action pour gérer le statut des demandes.

### Pour les Membres Simples :
- Peuvent soumettre des demandes via les formulaires publics.
- Peuvent consulter l'historique de leurs demandes.

## Conseils Importants

- **Sauvegardez toujours** avant de quitter une page de modification.
- **Vérifiez les permissions** : Seuls les super admins peuvent gérer les rôles et paroisses.
- **Modération** : Vérifiez le contenu avant publication.
- **Support** : En cas de problème, contactez le support technique.

Ce guide vous rendra opérationnel pour toutes les tâches administratives courantes.