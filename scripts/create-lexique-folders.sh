#!/bin/bash
# Script de création de la structure de dossiers pour les images du lexique
# Utilisation : bash create-lexique-folders.sh

BASE_DIR="public/images/lexique"
CATEGORIES=("interface" "navigation" "content" "actions" "admin")

echo "📁 Création de la structure pour le lexique..."
echo "Chemin de base: $BASE_DIR"
echo ""

for category in "${CATEGORIES[@]}"; do
  mkdir -p "$BASE_DIR/$category"
  echo "  ✅ Créé: $BASE_DIR/$category/"
done

echo ""
echo "📋 Structure finale:"
find "$BASE_DIR" -type d | sort
echo ""
echo "✨ Structure créée avec succès!"
echo ""
echo "💡 Prochaines étapes:"
echo "1. Prendre des captures d'écran de chaque élément du site"
echo "2. Les sauvegarder au format PNG dans le dossier approprié"
echo "3. Les nommer selon le 'id' du terme (ex: hero-banner.png)"
echo "4. Les placer dans le dossier de la catégorie correspondante"
echo ""
echo "📝 Exemple:"
echo "   - Catégorie: interface"
echo "   - Terme ID: hero-banner"
echo "   - Chemin final: $BASE_DIR/interface/hero-banner.png"
