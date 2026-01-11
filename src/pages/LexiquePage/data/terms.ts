/**
 * Données du Lexique - Tous les termes du Site Paroissial
 * Guide complet pour les administrateurs, bénévoles et visiteurs
 */

import type { LexiqueTerm, LexiqueCategoryMetadata } from '../types';

export const LEXIQUE_CATEGORIES: LexiqueCategoryMetadata[] = [
  {
    id: 'interface',
    name: 'Interface',
    icon: '🖥️',
    description: 'Éléments visuels et composants de l\'interface',
    color: 'blue',
  },
  {
    id: 'navigation',
    name: 'Navigation',
    icon: '🧭',
    description: 'Menus et structures de navigation',
    color: 'emerald',
  },
  {
    id: 'content',
    name: 'Contenu',
    icon: '📄',
    description: 'Éléments de contenu et présentation de données',
    color: 'amber',
  },
  {
    id: 'actions',
    name: 'Actions',
    icon: '⚡',
    description: 'Boutons, formulaires et interactions',
    color: 'rose',
  },
  {
    id: 'admin',
    name: 'Administration',
    icon: '⚙️',
    description: 'Outils et sections d\'administration',
    color: 'purple',
  },
];

export const LEXIQUE_TERMS: LexiqueTerm[] = [
  // ========== INTERFACE ==========
  {
    id: 'hero-banner',
    term: 'Hero Banner',
    synonyms: ['Bannière d\'accueil', 'Image principale', 'Bannière héros'],
    category: 'interface',
    icon: '🖼️',
    definition: {
      what: 'Grande zone visuelle en haut de la page d\'accueil qui présente le message principal du jour ou de la semaine avec titre, description et boutons d\'action.',
      purpose: [
        'Accueillir les visiteurs avec un message fort et motivant',
        'Mettre en avant un événement ou annonce importante',
        'Guider les utilisateurs vers l\'action principale (s\'inscrire, consulter, participer)',
        'Créer une première impression professionnelle et invitante',
      ],
      location: 'En haut de la page d\'accueil, immédiatement après le header',
      usage: {
        admin: 'Modifiable via Administration → Page d\'accueil → Sections → Hero. Vous pouvez changer le titre, la description, l\'image de fond et les boutons.',
        user: 'Zone informative. Lisez le message et cliquez sur les boutons pour accéder à l\'action suggérée.',
      },
    },
    relatedTerms: ['en-tete', 'bouton', 'section-page'],
    difficulty: 'beginner',
  },

  {
    id: 'en-tete',
    term: 'En-tête (Header)',
    synonyms: ['Header', 'Barre d\'en-tête', 'Barre supérieure'],
    category: 'navigation',
    icon: '📍',
    definition: {
      what: 'Barre horizontale en haut de chaque page du site contenant le logo, les menus de navigation et les icônes de connexion/compte.',
      purpose: [
        'Fournir un accès rapide aux principales sections du site',
        'Afficher l\'état de connexion de l\'utilisateur',
        'Donner accès aux fonctionnalités de notifications et messages',
        'Maintenir une identité visuelle cohérente sur toutes les pages',
      ],
      location: 'Tout en haut de chaque page, position fixe (reste visible en scrollant)',
      usage: {
        admin: 'Le header ne peut être modifié que via le code. Les administrateurs peuvent voir leur compte en cliquant sur l\'icône utilisateur.',
        user: 'Cliquez sur les liens du menu pour naviguer. Utilisez l\'icône utilisateur pour accéder à votre profil ou vous déconnecter.',
      },
    },
    relatedTerms: ['menu-horizontal', 'icones', 'user-menu'],
    difficulty: 'beginner',
  },

  {
    id: 'pied-page',
    term: 'Pied de page (Footer)',
    synonyms: ['Footer', 'Bas de page'],
    category: 'navigation',
    icon: '📌',
    definition: {
      what: 'Bande horizontale au bas de chaque page contenant des informations supplémentaires, liens utiles, coordonnées et copyright.',
      purpose: [
        'Fournir des liens importants (plan du site, mentions légales, contact)',
        'Afficher les informations de la paroisse (adresse, horaires)',
        'Créer une structure cohérente à toutes les pages',
        'Lister les réseaux sociaux et moyens de contact',
      ],
      location: 'Bas de chaque page',
      usage: {
        admin: 'Modifiable via Administration → Paramètres → Pied de page',
        user: 'Consultez le pied de page pour trouver les informations de contact et les liens utiles.',
      },
    },
    relatedTerms: ['en-tete', 'menu-horizontal'],
    difficulty: 'beginner',
  },

  {
    id: 'sidebar',
    term: 'Menu latéral (Sidebar)',
    synonyms: ['Barre latérale', 'Menu gauche', 'Panneau latéral'],
    category: 'navigation',
    icon: '📋',
    definition: {
      what: 'Panneau vertical situé sur le côté gauche de l\'écran dans les pages d\'administration, contenant les menus de navigation des sections administrateur.',
      purpose: [
        'Organiser hiérarchiquement les fonctions d\'administration',
        'Fournir une navigation rapide entre les sections (dashboard, vidéos, événements, etc.)',
        'Indiquer la section actuelle (mise en évidence)',
        'Économiser l\'espace en vertical',
      ],
      location: 'Côté gauche des pages d\'administration, position fixe',
      usage: {
        admin: 'Utilisez le sidebar pour naviguer vers les différentes sections d\'administration. Cliquez sur un élément pour accéder à cette section.',
        user: 'Le sidebar n\'est visible que pour les administrateurs.',
      },
    },
    relatedTerms: ['menu-horizontal', 'menu-deroulant'],
    difficulty: 'beginner',
  },

  {
    id: 'menu-horizontal',
    term: 'Menu horizontal',
    synonyms: ['Navigation principale', 'Menu principal', 'Barre de navigation'],
    category: 'navigation',
    icon: '🔗',
    definition: {
      what: 'Ensemble de liens de navigation disposés horizontalement, généralement dans le header, permettant d\'accéder aux principales sections du site.',
      purpose: [
        'Donner accès à toutes les sections principales du site',
        'Aider les visiteurs à explorer le contenu',
        'Offrir une navigation cohérente sur toutes les pages',
        'Afficher l\'organisation logique du site',
      ],
      location: 'Dans le header, au centre ou à droite selon le design',
      usage: {
        user: 'Cliquez sur un lien pour accéder à la section correspondante (Accueil, Vidéos, Événements, etc.).',
        admin: 'Les administrateurs voient des options supplémentaires (Administration, Tableau de bord).',
      },
    },
    relatedTerms: ['en-tete', 'menu-deroulant', 'user-menu'],
    difficulty: 'beginner',
  },

  {
    id: 'menu-deroulant',
    term: 'Menu déroulant',
    synonyms: ['Dropdown menu', 'Menu contextuel', 'Sous-menu'],
    category: 'interface',
    icon: '▼',
    definition: {
      what: 'Menu caché qui s\'affiche lors du clic ou du survol sur un élément, révélant des options supplémentaires ou un sous-menu.',
      purpose: [
        'Réduire l\'encombrement visuel en masquant les options secondaires',
        'Organiser les options en catégories',
        'Améliorer la navigation sans surcharger l\'interface',
      ],
      location: 'Associé à un élément cliquable (bouton, menu item)',
      usage: {
        user: 'Cliquez (ou survolez sur desktop) un élément avec une flèche pour révéler les options supplémentaires.',
      },
    },
    relatedTerms: ['menu-horizontal', 'bouton'],
    difficulty: 'beginner',
  },

  {
    id: 'carte',
    term: 'Carte (Card)',
    synonyms: ['Bloc de contenu', 'Vignette', 'Conteneur'],
    category: 'content',
    icon: '📦',
    definition: {
      what: 'Petit bloc rectangulaire contenant un titre, une image, une description et généralement un bouton d\'action. Utilisé pour afficher des éléments de contenu de manière organisée.',
      purpose: [
        'Afficher des éléments de contenu de manière uniformisée',
        'Permettre une disposition en grille (plusieurs cartes côte à côte)',
        'Faciliter la navigation entre plusieurs contenus similaires',
        'Présenter clairement les informations essentielles',
      ],
      location: 'Partout sur le site: section vidéos, événements, galerie, annonces',
      usage: {
        user: 'Cliquez sur une carte pour accéder au contenu détaillé. L\'image et le titre sont cliquables.',
      },
    },
    relatedTerms: ['vignette', 'bouton', 'section-page'],
    difficulty: 'beginner',
  },

  {
    id: 'vignette',
    term: 'Vignette (Thumbnail)',
    synonyms: ['Miniature', 'Image de couverture', 'Aperçu visuel'],
    category: 'content',
    icon: '🖼️',
    definition: {
      what: 'Petite image de couverture ou d\'aperçu affichée sur une carte ou dans une liste, généralement cliquable pour accéder au contenu complet.',
      purpose: [
        'Donner un aperçu visuel rapide du contenu',
        'Faciliter la navigation visuelle',
        'Améliorer l\'attrait visuel de la page',
        'Réduire le temps de chargement (images optimisées)',
      ],
      location: 'En haut de chaque carte de contenu (vidéo, événement, galerie)',
      usage: {
        user: 'Cliquez sur la vignette pour ouvrir le contenu complet.',
        admin: 'Les vignettes sont souvent générées automatiquement à partir de l\'image principale du contenu.',
      },
    },
    relatedTerms: ['carte', 'image'],
    difficulty: 'beginner',
  },

  {
    id: 'bouton',
    term: 'Bouton',
    synonyms: ['Élément cliquable', 'Commande', 'Contrôle'],
    category: 'actions',
    icon: '🔘',
    definition: {
      what: 'Élément interactif cliquable déclenchant une action (ouvrir un lien, soumettre un formulaire, confirmer une action).',
      purpose: [
        'Inciter l\'utilisateur à effectuer une action',
        'Déclencher une fonction du site',
        'Guider l\'utilisateur dans ses choix',
        'Améliorer l\'accessibilité',
      ],
      location: 'Partout: hero banner, cartes, formulaires, barres d\'actions',
      usage: {
        user: 'Cliquez sur un bouton pour effectuer l\'action correspondante (Lire la suite, S\'inscrire, Supprimer, etc.).',
      },
    },
    relatedTerms: ['carte', 'formulaire', 'action-CRUD'],
    difficulty: 'beginner',
  },

  // ========== ACTIONS ==========
  {
    id: 'action-CRUD',
    term: 'Bouton CRUD',
    synonyms: ['Bouton de gestion', 'Bouton d\'édition', 'Fonctions CRUD'],
    category: 'actions',
    icon: '⚙️',
    definition: {
      what: 'Ensemble de quatre boutons ou options pour gérer le contenu: Create (Créer), Read (Lire), Update (Modifier), Delete (Supprimer).',
      purpose: [
        'Permettre la gestion complète du contenu',
        'Créer une cohérence dans la gestion des données',
        'Faciliter la compréhension des fonctionnalités d\'administration',
      ],
      location: 'Panneaux d\'administration (vidéos, événements, galerie, etc.)',
      usage: {
        admin: 'Utilisez ces boutons pour gérer le contenu: Créer un nouvel élément, Lire/consulter, Modifier les détails, Supprimer.',
      },
    },
    relatedTerms: ['bouton', 'formulaire', 'tableau'],
    difficulty: 'intermediate',
  },

  {
    id: 'formulaire',
    term: 'Formulaire',
    synonyms: ['Formulaire de saisie', 'Formulaire d\'édition', 'Form'],
    category: 'actions',
    icon: '📝',
    definition: {
      what: 'Ensemble de champs (texte, sélecteurs, dates, etc.) permettant de saisir ou modifier des informations.',
      purpose: [
        'Collecter des informations utilisateur',
        'Permettre la création/modification de contenu',
        'Valider les données avant soumission',
        'Guider l\'utilisateur dans le processus d\'entrée de données',
      ],
      location: 'Pages d\'administration, pages de connexion/inscription, pages de contact',
      usage: {
        user: 'Remplissez les champs requis et cliquez sur Envoyer. Les champs marqués d\'un * sont obligatoires.',
        admin: 'Utilisez les formulaires pour créer ou modifier du contenu. Les validations vous aideront à entrer les bonnes données.',
      },
    },
    relatedTerms: ['bouton', 'zone-saisie', 'checkbox'],
    difficulty: 'intermediate',
  },

  {
    id: 'modal',
    term: 'Modal (Popup)',
    synonyms: ['Fenêtre modale', 'Popup', 'Boîte de dialogue'],
    category: 'interface',
    icon: '🪟',
    definition: {
      what: 'Fenêtre qui s\'affiche par-dessus le reste de la page, souvent avec un fond semi-transparent, contenant un message, un formulaire ou une confirmation.',
      purpose: [
        'Demander confirmation avant une action importante',
        'Afficher un formulaire dans un contexte spécifique',
        'Alerter l\'utilisateur d\'un événement important',
        'Forcer l\'attention de l\'utilisateur sur un message',
      ],
      location: 'Peut apparaître n\'importe où sur le site',
      usage: {
        user: 'Lisez le message et cliquez sur le bouton approprié (Confirmer, Annuler, Fermer). Cliquez sur la X ou le fond pour fermer le modal.',
      },
    },
    relatedTerms: ['bouton', 'notification'],
    difficulty: 'beginner',
  },

  {
    id: 'notification',
    term: 'Notification',
    synonyms: ['Alerte', 'Message système', 'Toast'],
    category: 'actions',
    icon: '🔔',
    definition: {
      what: 'Message court affiché temporairement pour informer l\'utilisateur du résultat d\'une action (succès, erreur, confirmation).',
      purpose: [
        'Confirmer qu\'une action a réussi',
        'Alerter en cas d\'erreur',
        'Informer de changements importants',
        'Donner un retour immédiat à l\'utilisateur',
      ],
      location: 'Coin en haut ou en bas de l\'écran, disparaît après quelques secondes',
      usage: {
        user: 'Lisez le message pour connaître le résultat de votre action. Il disparaît automatiquement.',
      },
    },
    relatedTerms: ['modal', 'message-toast'],
    difficulty: 'beginner',
  },

  {
    id: 'message-toast',
    term: 'Message toast',
    synonyms: ['Toast notification', 'Message éphémère', 'Alerte temporaire'],
    category: 'actions',
    icon: '📢',
    definition: {
      what: 'Message court qui apparaît temporairement, généralement en bas à droite, pour informer rapidement sans interruption majeure.',
      purpose: [
        'Donner un retour rapide et non-intrusif',
        'Informer sans bloquer l\'interface',
        'Afficher plusieurs messages rapidement',
      ],
      location: 'Coin en bas à droite généralement',
      usage: {
        user: 'Ces messages disparaissent automatiquement. Vous pouvez les fermer manuellement si nécessaire.',
      },
    },
    relatedTerms: ['notification', 'modal'],
    difficulty: 'beginner',
  },

  // ========== CONTENU ==========
  {
    id: 'tableau',
    term: 'Tableau (Table)',
    synonyms: ['Tableau de données', 'Liste tabulaire'],
    category: 'content',
    icon: '📊',
    definition: {
      what: 'Grille d\'informations organisées en lignes et colonnes affichant des données structurées.',
      purpose: [
        'Afficher de nombreuses données de manière organisée',
        'Permettre la comparaison entre plusieurs éléments',
        'Faciliter la recherche et le tri dans les données',
        'Afficher des informations détaillées dans un format compact',
      ],
      location: 'Pages d\'administration (liste des vidéos, des événements, des utilisateurs)',
      usage: {
        admin: 'Cliquez sur les entêtes de colonne pour trier. Utilisez la recherche pour filtrer. Les boutons d\'action (éditer, supprimer) sont dans la colonne Actions.',
      },
    },
    relatedTerms: ['ligne-tableau', 'section-page'],
    difficulty: 'intermediate',
  },

  {
    id: 'ligne-tableau',
    term: 'Ligne de tableau (Row)',
    synonyms: ['Ligne', 'Enregistrement', 'Élément du tableau'],
    category: 'content',
    icon: '➡️',
    definition: {
      what: 'Rangée horizontale du tableau contenant les données d\'un élément spécifique.',
      purpose: [
        'Afficher l\'information complète d\'un élément',
        'Permettre les actions sur un élément particulier',
      ],
      location: 'Dans un tableau',
      usage: {
        admin: 'Cliquez sur la ligne pour afficher les détails ou les actions disponibles.',
      },
    },
    relatedTerms: ['tableau'],
    difficulty: 'beginner',
  },

  {
    id: 'titre',
    term: 'Titre (Heading)',
    synonyms: ['En-tête de section', 'Titre principal'],
    category: 'content',
    icon: '🔤',
    definition: {
      what: 'Texte important, généralement plus grand, utilisé pour identifier une section ou le sujet principal d\'une page.',
      purpose: [
        'Organiser le contenu hiérarchiquement',
        'Aider la lecture et l\'accessibilité',
        'Identifier rapidement les sections',
      ],
      location: 'Partout: haut des pages, début de sections',
      usage: {
        user: 'Les titres vous aident à comprendre la structure de la page.',
      },
    },
    relatedTerms: ['sous-titre', 'description'],
    difficulty: 'beginner',
  },

  {
    id: 'sous-titre',
    term: 'Sous-titre (Subtitle)',
    synonyms: ['Sous-titre', 'Sous-en-tête', 'Titre secondaire'],
    category: 'content',
    icon: '📄',
    definition: {
      what: 'Texte secondaire fournissant des détails ou des clarifications sur le titre principal.',
      purpose: [
        'Fournir du contexte additionnel',
        'Clarifier le sujet',
        'Améliorer la hiérarchie visuelle',
      ],
      location: 'Sous les titres principaux',
      usage: {
        user: 'Lisez les sous-titres pour plus de détails.',
      },
    },
    relatedTerms: ['titre', 'description'],
    difficulty: 'beginner',
  },

  {
    id: 'description',
    term: 'Description',
    synonyms: ['Texte de description', 'Contenu textuel', 'Paragraphe'],
    category: 'content',
    icon: '📖',
    definition: {
      what: 'Texte explicatif détaillé décrivant un élément, son contenu ou sa fonction.',
      purpose: [
        'Fournir les détails importants',
        'Expliquer le contexte',
        'Engager le lecteur avec du contenu substantiel',
      ],
      location: 'Partout: cartes, pages détaillées, sections explicatives',
      usage: {
        user: 'Lisez les descriptions pour comprendre le contenu.',
      },
    },
    relatedTerms: ['titre', 'sous-titre'],
    difficulty: 'beginner',
  },

  // ========== ADMIN ==========
  {
    id: 'section-page',
    term: 'Section de page',
    synonyms: ['Section', 'Bloc de contenu', 'Zone de page'],
    category: 'interface',
    icon: '🎯',
    definition: {
      what: 'Zone importante de la page contenant un groupe d\'éléments connexes, généralement séparée visuellement du reste.',
      purpose: [
        'Organiser le contenu en zones logiques',
        'Séparer visuellement les différents types de contenu',
        'Faciliter la navigation et la compréhension',
      ],
      location: 'Partout sur le site',
      usage: {
        user: 'Les sections vous aident à naviguer et comprendre l\'organisation du contenu.',
        admin: 'Vous pouvez éditer chaque section via Administration → Page d\'accueil → Sections.',
      },
    },
    relatedTerms: ['hero-banner', 'carte'],
    difficulty: 'intermediate',
  },

  {
    id: 'zone-saisie',
    term: 'Zone de saisie (Input)',
    synonyms: ['Champ de texte', 'Champ d\'entrée', 'Input field'],
    category: 'interface',
    icon: '⌨️',
    definition: {
      what: 'Petit champ où l\'utilisateur peut taper du texte (nom, email, message, etc.).',
      purpose: [
        'Collecter l\'entrée utilisateur',
        'Permettre la saisie de texte libre',
      ],
      location: 'Dans les formulaires, barres de recherche',
      usage: {
        user: 'Cliquez dans le champ et tapez votre texte.',
      },
    },
    relatedTerms: ['formulaire', 'checkbox'],
    difficulty: 'beginner',
  },

  {
    id: 'checkbox',
    term: 'Zone à cocher (Checkbox)',
    synonyms: ['Case à cocher', 'Boîte de sélection', 'Checkbox'],
    category: 'interface',
    icon: '☑️',
    definition: {
      what: 'Petite boîte carrée que l\'utilisateur peut cocher ou décocher pour sélectionner une option.',
      purpose: [
        'Permettre la sélection multiple d\'options',
        'Confirmer un consentement (accepter les conditions)',
        'Activer/désactiver une fonction',
      ],
      location: 'Formulaires, listes d\'options',
      usage: {
        user: 'Cliquez sur la case pour la cocher ou la décocher.',
      },
    },
    relatedTerms: ['formulaire', 'zone-saisie', 'selecteur'],
    difficulty: 'beginner',
  },

  {
    id: 'selecteur',
    term: 'Zone de sélection (Select)',
    synonyms: ['Sélecteur', 'Liste déroulante', 'Dropdown'],
    category: 'interface',
    icon: '🔽',
    definition: {
      what: 'Élément permettant de choisir une option parmi une liste prédéfinie affichée dans un menu déroulant.',
      purpose: [
        'Limiter les choix à des options valides',
        'Réduire l\'encombrement visuel',
        'Faciliter la saisie de données structurées',
      ],
      location: 'Formulaires, filtres, paramètres',
      usage: {
        user: 'Cliquez sur le sélecteur pour voir les options et choisissez celle que vous voulez.',
      },
    },
    relatedTerms: ['formulaire', 'menu-deroulant'],
    difficulty: 'beginner',
  },

  {
    id: 'icones',
    term: 'Icônes',
    synonyms: ['Symboles', 'Pictogrammes', 'Icônes visuelles'],
    category: 'interface',
    icon: '🎨',
    definition: {
      what: 'Petites images symboliques (souvent une simple forme ou dessin) représentant une fonction ou un concept.',
      purpose: [
        'Communiquer rapidement une idée ou une fonction',
        'Améliorer la clarté visuelle',
        'Faciliter l\'accessibilité',
        'Créer une cohérence visuelle',
      ],
      location: 'Partout: menus, boutons, notifications, cartes',
      usage: {
        user: 'Les icônes vous aident à identifier rapidement les fonctions (loupe pour rechercher, cœur pour j\'aime, etc.).',
      },
    },
    relatedTerms: ['bouton', 'menu-horizontal'],
    difficulty: 'beginner',
  },

  {
    id: 'user-menu',
    term: 'Menu utilisateur (User Menu)',
    synonyms: ['Menu de compte', 'Menu profil', 'Dropdown utilisateur'],
    category: 'navigation',
    icon: '👤',
    definition: {
      what: 'Menu déroulant spécifique affichant les options liées au compte utilisateur (profil, paramètres, déconnexion).',
      purpose: [
        'Accéder rapidement aux fonctions liées au compte',
        'Afficher l\'état de connexion',
        'Faciliter la déconnexion et la gestion du profil',
      ],
      location: 'En haut à droite du header, généralement identifié par une icône utilisateur',
      usage: {
        user: 'Cliquez sur votre avatar ou l\'icône utilisateur pour accéder à votre menu personnel.',
      },
    },
    relatedTerms: ['en-tete', 'menu-deroulant'],
    difficulty: 'beginner',
  },

  {
    id: 'tableau-de-bord',
    term: 'Tableau de bord (Dashboard)',
    synonyms: ['Panneau de contrôle', 'Vue d\'ensemble', 'Dashboard'],
    category: 'admin',
    icon: '📈',
    definition: {
      what: 'Page d\'administration affichant un résumé des statistiques principales et des raccourcis vers les fonctions d\'administration essentielles.',
      purpose: [
        'Offrir un aperçu rapide de l\'état du site',
        'Fournir un accès rapide aux fonctions importantes',
        'Afficher les métriques clés (nombre de vidéos, événements, utilisateurs)',
        'Montrer les tâches à faire',
      ],
      location: 'Administration → Tableau de bord (réservé aux administrateurs)',
      usage: {
        admin: 'Consultez le tableau de bord chaque fois que vous lancez l\'administration. Il vous montre les statistiques et les actions suggérées.',
      },
    },
    relatedTerms: ['section-admin', 'action-CRUD'],
    difficulty: 'intermediate',
  },
];
