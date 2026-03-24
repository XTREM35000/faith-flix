#!/bin/bash

# =====================================================
# NETTOYAGE COMPLET CURSOR – GIT BASH (ADMIN)
# =====================================================

echo -e "\033[36m🔪 Arrêt des processus Cursor...\033[0m"
taskkill //F //IM Cursor.exe 2>/dev/null
taskkill //F //IM cursor.exe 2>/dev/null
taskkill //F //IM "Cursor Setup.exe" 2>/dev/null
taskkill //F //IM cursor1.exe 2>/dev/null

echo -e "\033[36m🗑️ Suppression des dossiers d'installation...\033[0m"
rm -rf "/c/Users/$USER/AppData/Local/Programs/Cursor" 2>/dev/null
rm -rf "/c/Users/$USER/AppData/Local/Programs/cursor" 2>/dev/null
rm -rf "/c/Users/$USER/AppData/Local/Programs/cursor1" 2>/dev/null

echo -e "\033[36m🗑️ Suppression des configurations...\033[0m"
rm -rf "/c/Users/$USER/AppData/Roaming/Cursor" 2>/dev/null
rm -rf "/c/Users/$USER/AppData/Roaming/cursor" 2>/dev/null
rm -rf "/c/Users/$USER/AppData/Roaming/cursor1" 2>/dev/null

echo -e "\033[36m🗑️ Suppression des caches...\033[0m"
rm -rf "/c/Users/$USER/AppData/Local/Cursor" 2>/dev/null
rm -rf "/c/Users/$USER/AppData/Local/cursor" 2>/dev/null
rm -rf "/c/Users/$USER/AppData/Local/cursor1" 2>/dev/null

echo -e "\033[36m🗑️ Suppression des fichiers temporaires...\033[0m"
rm -rf "/c/Users/$USER/AppData/Local/Temp/cursor-"* 2>/dev/null
rm -rf "/c/Users/$USER/AppData/Local/Temp/Cursor-"* 2>/dev/null
rm -rf "/c/Users/$USER/AppData/Local/Temp/"*cursor* 2>/dev/null

echo -e "\033[36m🗑️ Nettoyage du registre...\033[0m"
reg delete "HKCU\Software\Cursor" /f 2>/dev/null
reg delete "HKCU\Software\cursor" /f 2>/dev/null
reg delete "HKLM\SOFTWARE\Cursor" /f 2>/dev/null
reg delete "HKLM\SOFTWARE\cursor" /f 2>/dev/null

echo -e "\033[32m✅ Nettoyage terminé !\033[0m"
echo -e "\033[33m➡️ Redémarre l'ordinateur maintenant avant de réinstaller.\033[0m"