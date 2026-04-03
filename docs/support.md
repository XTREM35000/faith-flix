# Cours Pratique : Développer avec React, Vite et Supabase 🎯

Bienvenue dans ce cours pratique ! Je suis là pour t'accompagner pas à pas dans la découverte du développement web avec React, Vite et Supabase. Nous allons explorer le projet **paroisse2026**, une application réelle, pour comprendre chaque concept avec des exemples concrets.

Pas de panique si tu es novice – on avance doucement, avec des exemples tirés du code réel. À la fin de chaque section, un petit défi pour pratiquer ! 🚀

## 1. Structure du projet 📁

Ton projet React ressemble à une maison bien rangée. Chaque dossier a un rôle précis :

- **`src/pages/`** : Les "pièces" de ta maison. Chaque fichier `.tsx` est une page web (ex: `VideosPage.tsx`, `AboutPage.tsx`)
- **`src/components/`** : Les "meubles" réutilisables. Des petits bouts d'interface comme `VideoCard.tsx` ou `Header.tsx`
- **`src/hooks/`** : Les "outils magiques". Du code réutilisable pour gérer les données (ex: `useVideos.ts`)
- **`src/lib/supabase/`** : La "boîte à outils" pour parler à la base de données (ex: `videoQueries.ts`)
- **`src/contexts/`** : Les "informations partagées" entre composants (ex: `ParoisseContext.tsx`)

**Comment naviguer sans se perdre ?** Commence toujours par `src/App.tsx` – c'est la porte d'entrée. Les routes te mènent aux pages, qui utilisent des composants, qui appellent des hooks, qui parlent à Supabase.

**Petit défi 🎯** : Ouvre `src/pages/VideosPage.tsx` et compte combien de composants il importe depuis `src/components/`. Réponse : au moins 3 !

## 2. Les fonctions fléchées (=>) 🎯

En React, on utilise souvent des fonctions fléchées au lieu de `function`. Pourquoi ? Elles sont plus courtes et gardent le `this` de leur environnement.

**Différence :**
- `function maFonction() { return "bonjour"; }`
- `const maFonction = () => "bonjour";`

Regarde dans `src/components/VideoCard.tsx` :

```tsx
const VideoCard = ({ video, onOpen, onDeleted }: VideoCardProps) => {
  // Ici, on utilise une fonction fléchée pour le composant
  const handleDelete = async (e: React.MouseEvent) => {
    // Et une autre pour gérer la suppression
    e.stopPropagation();
    // ... code ...
  };
  // ...
};
```

Les fonctions fléchées sont partout dans React – pour les composants, les gestionnaires d'événements, les callbacks.

**Petit défi 🎯** : Dans `VideoCard.tsx`, trouve une fonction fléchée qui gère un clic. Modifie-la pour afficher une alerte "Clic !" avant son code actuel.

## 3. Créer une page 🏠

Une page, c'est simple : un composant React dans `src/pages/`. Étape par étape :

1. **Crée le fichier** : `src/pages/TemoignagesPage.tsx`
2. **Écris le composant de base** :

```tsx
import { useState } from 'react';

const TemoignagesPage = () => {
  const [temoignages, setTemoignages] = useState([]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Témoignages</h1>
      <p>Partagez vos témoignages ici !</p>
      {/* Liste des témoignages */}
    </div>
  );
};

export default TemoignagesPage;
```

3. **Ajoute la route** : Dans `src/App.tsx` ou ton router, ajoute :

```tsx
<Route path="/temoignages" element={<TemoignagesPage />} />
```

Regarde `src/pages/AboutPage.tsx` pour un exemple réel de page simple.

**Petit défi 🎯** : Crée une page "Contact" avec un formulaire basique (nom, email, message). Utilise `useState` pour stocker les valeurs.

## 4. Afficher du contenu dynamique 📊

Pour rendre ta page vivante, utilise des variables dans le JSX avec `{}`.

**Afficher une variable :**
```tsx
const nom = "Marie";
return <h1>Bonjour {nom} !</h1>;
```

**Lister avec .map() :**
```tsx
const videos = [{id: 1, title: "Vidéo 1"}, {id: 2, title: "Vidéo 2"}];
return (
  <ul>
    {videos.map(video => (
      <li key={video.id}>{video.title}</li>
    ))}
  </ul>
);
```

**Conditions :**
```tsx
{isAdmin && <button>Supprimer</button>}
{loading ? <p>Chargement...</p> : <p>Prêt !</p>}
```

Dans `src/components/VideoCard.tsx`, vois comment on affiche dynamiquement le titre et les vues :

```tsx
const title = video.title || 'Sans titre';
const views = video.views || 0;
// ...
<h3 className="font-semibold">{title}</h3>
<p className="text-sm text-muted-foreground">{views} vues</p>
```

**Petit défi 🎯** : Dans une page, crée une liste de 3 témoignages statiques avec `.map()`. Ajoute une condition pour afficher "Nouveau" si le témoignage a moins de 7 jours.

## 5. Les hooks essentiels 🪝

Les hooks sont des fonctions spéciales qui "accrochent" des fonctionnalités à tes composants.

**useState : gérer une variable qui change**
```tsx
const [count, setCount] = useState(0);
return <button onClick={() => setCount(count + 1)}>{count}</button>;
```

**useEffect : exécuter du code au montage**
```tsx
useEffect(() => {
  console.log("Composant monté !");
}, []); // [] = une seule fois
```

**useContext : partager des données globales**
```tsx
const theme = useContext(ThemeContext);
```

Dans `src/hooks/useVideos.ts`, vois `useState` pour les vidéos et `useEffect` pour charger les données :

```tsx
const [videos, setVideos] = useState<Video[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadVideos();
}, [paroisseId]);
```

**Petit défi 🎯** : Dans un composant, utilise `useState` pour un compteur de clics. Avec `useEffect`, log "Compteur changé" quand il augmente.

## 6. Appels Supabase (CRUD complet) 🗄️

Supabase est ta base de données. Voici les 4 opérations de base :

**Lire : .select()**
```tsx
const { data } = await supabase.from('videos').select('*');
```

**Ajouter : .insert()**
```tsx
await supabase.from('videos').insert({ title: 'Nouvelle vidéo' });
```

**Modifier : .update()**
```tsx
await supabase.from('videos').update({ title: 'Titre modifié' }).eq('id', videoId);
```

**Supprimer : .delete()**
```tsx
await supabase.from('videos').delete().eq('id', videoId);
```

Gère toujours les erreurs et le chargement :

```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

try {
  setLoading(true);
  const { data, error } = await supabase.from('videos').select('*');
  if (error) throw error;
  setVideos(data);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
```

Regarde `src/lib/supabase/videoQueries.ts` pour des exemples réels.

**Petit défi 🎯** : Crée une fonction pour ajouter un nouveau témoignage à une table `temoignages`. Gère le loading et les erreurs.

## 7. Créer un custom hook 🛠️

Pourquoi ? Pour réutiliser du code logique entre composants.

Exemple : `src/hooks/useVideos.ts` gère le chargement des vidéos :

```tsx
export const useVideos = (limit = 4) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVideos = async () => {
    // ... appel Supabase ...
  };

  useEffect(() => { loadVideos(); }, []);

  return { videos, loading, refetch: loadVideos };
};
```

**Étapes pour créer le tien :**
1. Crée un fichier `src/hooks/useMonHook.ts`
2. Importe les hooks nécessaires
3. Écris la logique
4. Return les valeurs/données

**Petit défi 🎯** : Crée `useTemoignages.ts` qui charge une liste de témoignages depuis Supabase. Utilise-le dans ta page Témoignages.

## 8. Bonnes pratiques pour novices ✨

- **Nomme clairement** : `userName` au lieu de `u`, `handleSubmit` au lieu de `f`
- **Évite le props drilling** : Utilise `useContext` pour partager des données profondes
- **Types TypeScript** : Définit les interfaces pour tes données
- **Lis les erreurs** : La console te parle – écoute-la !

Dans le projet, vois comment `ParoisseContext.tsx` évite le props drilling en partageant l'info paroisse globalement.

**Petit défi 🎯** : Trouve une variable mal nommée dans le code et renomme-la. Vérifie que tout fonctionne encore.

## 9. Exercices pratiques (avec solutions) 💪

### Exercice 1 : Ajouter un champ "auteur" à une vidéo
**Objectif** : Modifier la table vidéos pour ajouter un auteur.

**Étapes :**
1. Dans Supabase, ajoute une colonne `author` (text)
2. Modifie `VideoCard.tsx` pour afficher `{video.author}`
3. Dans le formulaire d'upload, ajoute un champ auteur

**Solution** : Regarde `src/components/VideoModalForm.tsx` pour voir comment ajouter des champs.

### Exercice 2 : Créer une page "Favoris"
**Objectif** : Une page qui affiche les vidéos favorites.

**Étapes :**
1. Crée `src/pages/FavorisPage.tsx`
2. Utilise `useVideos()` pour charger les vidéos
3. Filtre celles marquées comme favorites
4. Ajoute la route dans le router

**Solution** : Copie la structure de `VideosPage.tsx` et ajoute un filtre.

### Exercice 3 : Ajouter un bouton "J'aime"
**Objectif** : Permettre aux utilisateurs d'aimer une vidéo.

**Étapes :**
1. Ajoute une colonne `likes` (integer) dans la table vidéos
2. Dans `VideoCard.tsx`, ajoute un bouton ❤️
3. Au clic, incrémente le compteur en base
4. Affiche le nombre de likes

**Solution** : Utilise `.update()` de Supabase pour modifier le like.

Bravo d'avoir suivi ce cours ! Tu as maintenant les bases pour développer avec React et Supabase. N'hésite pas à explorer le code du projet pour plus d'exemples. Bonne continuation ! 🎉