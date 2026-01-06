# Tutoriels vidéo — Démonstration du site média paroissial

Objectif : produire une série de courtes vidéos de démonstration (Desktop + Mobile pour l'ouverture), claires, conformes à la charte visuelle et faciles à suivre par des non-techniciens.

Format recommandé

- Résolution : 1920×1080 (Full HD)
- Framerate : 30fps
- Durée idéale par vidéo : 2–5 minutes (max 8 min pour démos complètes)
- Son : micro externe (ou casque), 44.1/48kHz
- Intro : 5–8s (logo + titre vidéo)
- Outro : 5s (contact / lien / appel à l'action)
- Palette : respecter la charte (couleurs principales du site)

Organisation générale (fichiers vidéo)

- Partie 1 — Ouverture & accès (Desktop + Mobile)
- Partie 2 → N — Parcours (une vidéo par groupe du sidebar)

Planning détaillé et durations (horaire indicatif)

Vidéo 01 — Ouvrir l'application (Desktop + Mobile)

- Durée : 3:30
- Contenu :
  - 0:00–0:08 Intro (logo + titre : "Accéder à l'application")
  - 0:08–0:40 Desktop : saisir l'URL dans la barre d'adresse et appuyer Entrée
  - 0:40–1:20 Desktop : cliquer sur un lien (ex : lien de démo) ouvre la page dans le navigateur
  - 1:20–1:50 Mobile : ouvrir l'URL sur mobile (copier-coller ou cliquer sur lien reçu) ; démonstration navigateur mobile
  - 1:50–2:30 Astuce : créer un raccourci sur l'écran d'accueil (iOS/Android) — rapide pas-à-pas
  - 2:30–3:30 Résumé + CTA (ouvrir la page d'accueil)

Vidéo 02 — Landing Page : aperçu et sections

- Durée : 4:00
- Contenu :
  - 0:00–0:08 Intro
  - 0:08–0:45 Header : logo, recherche, menu, icône Aide
  - 0:45–1:40 Hero Banner : titre, sous-titre, image/video de fond, boutons primaire
  - 1:40–2:20 Sections principales : vidéos récentes, événements, galerie
  - 2:20–3:10 Footer / infos de contact
  - 3:10–4:00 Résumé et navigation vers inscription

Vidéo 03 — S'inscrire / Se connecter

- Durée : 4:00
- Contenu :
  - 0:00–0:08 Intro
  - 0:08–1:10 Clin d'œil : ouvrir le modal d'auth (bouton avatar/header)
  - 1:10–2:20 Remplir le formulaire d'inscription (photo avatar optionnelle) et valider
  - 2:20–3:00 Connexion (login) et explication des erreurs courantes
  - 3:00–4:00 Après connexion : ce qui change dans le header (avatar, menu utilisateur)

Vidéo 04 — Navigation principale après connexion (Desktop)

- Durée : 4:30
- Contenu :
  - 0:00–0:08 Intro
  - 0:08–0:40 Vue d'ensemble du Dashboard / Sidebar (membre vs admin)
  - 0:40–1:30 Sidebar : explication des groupes (Messes, Homélies, Announcements, Directory, etc.)
  - 1:30–2:10 Header : icônes Chat & Notifications (compteurs), comment les utiliser
  - 2:10–3:10 User Menu : options (profil, déconnexion, admin tools si admin)
  - 3:10–4:30 Différences Admin : boutons CRUD sur le Hero, accès aux pages d'administration

Vidéo 05 — Parcours détaillé : un vidéo par groupe du Sidebar

- Format : une vidéo courte (2–4 min) par groupe
- Exemple de liste (adapter selon `MENU_GROUPS` actuel) :
  - A — Messes
  - B — Homélies
  - C — Chorale / Musique
  - D — Événements
  - E — Annonces
  - F — Annuaire / Directory
  - G — Documents / Podcasts
- Contenu type pour chaque vidéo de groupe :
  - 0:00–0:10 Intro courte
  - 0:10–0:50 Présentation de la page (objectifs)
  - 0:50–1:40 Exemple : consulter, filtrer, rechercher
  - 1:40–2:30 Actions clés : jouer une vidéo, télécharger un document, s'inscrire à un événement
  - Option admin (si applicable) : 30–60s pour CRUD

Vidéo 06 — Chat & Notifications (fonctionnalités en temps réel)

- Durée : 3:30
- Contenu :
  - 0:00–0:10 Intro
  - 0:10–0:50 Ouvrir le chat (Live) et envoyer un message
  - 0:50–1:40 Notifications : où elles apparaissent, comment marquer comme lu
  - 1:40–2:40 Cas pratique : modération (pour admin) ou réponse rapide
  - 2:40–3:30 Résumé et bonnes pratiques de modération

Vidéo 07 — Gestion du profil et paramètres

- Durée : 2:30
- Contenu :
  - Modifier avatar, nom, email
  - Préférences de notification
  - Supprimer compte (si prévu) / désactivation

Conseils pratiques pour l'enregistrement

- Micro : privilégier micro externe pour voix claire
- Éclairage : lumière devant, éviter contre-jours
- Naviguer lentement, mettre des zooms sur éléments importants
- Utiliser la souris visible, pointer les boutons importants (cursor highlight)
- Faire des prises courtes, couper les hésitations en montage

Checklist post-production

- Ajouter titres et sous-titres (FR)
- Ajouter chapitrage (timestamps) dans la description
- Vérifier contraste texte/fond (accessibilité)
- Export MP4 H.264 (preset web)

Fichiers produits

- `videotuto-01-open-url.mp4` — Vidéo 01
- `videotuto-02-landing.mp4` — Vidéo 02
- `videotuto-03-auth.mp4` — Vidéo 03
- `videotuto-04-navigation.mp4` — Vidéo 04
- `videotuto-05-group-<slug>.mp4` — par groupe du sidebar
- `videotuto-06-chat-notifs.mp4` — Chat & notifications
- `videotuto-07-profile.mp4` — Profil et paramètres

Notes finales

- Nous pouvons ajouter des sous-titres automatiques puis corriger.
- Dites-moi si vous voulez que je génère des scripts de narration détaillés pour chaque vidéo (phrases exactes), ou des visuels d'intro/outro (assets).
