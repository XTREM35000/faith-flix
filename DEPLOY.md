# Déploiement et parité local / production

- **Production** : https://www.nd-compassion.ci (déploiement Vercel).

## Parité local = production

Pour que le comportement en local soit identique à la production :

1. **Variables d’environnement**  
   Utilisez les mêmes variables que sur Vercel dans un fichier `.env.local` à la racine du projet.  
   Copiez `.env.example` en `.env.local` et renseignez les valeurs (celles de la prod pour reproduire la prod en local).

2. **Build de production en local**  
   Pour tester le build comme sur Vercel :
   ```bash
   bun run build
   bun run preview
   ```
   Ouvrir l’URL indiquée (souvent `http://localhost:4173`) pour vérifier le comportement avant déploiement.

3. **Route profil**  
   L’application utilise partout la route **`/profile`** (pas `/profil`).
