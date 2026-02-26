import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convertir les URL en chemins de fichiers (nécessaire pour ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const rootDir = '.';
const exclusions = ['node_modules', 'dist', 'public', 'nhost', '.vscode', '.nuxt', '.output', '.git', '.bolt', '.next'];
let outputFile = 'project_structure.txt';

// NOUVEAU : Fichiers à exclure à la racine uniquement
const rootFileExclusions = ['.md', '.txt', '.sql'];
const excludedFolders = ['docs']; // Dossier à exclure complètement

// Vérifier si le fichier existe déjà et l'incrémenter
let counter = 1;
while (fs.existsSync(outputFile)) {
    outputFile = `project_structure_${counter++}.txt`;
}

// Fonction pour vérifier si on doit exclure un fichier à la racine
function shouldExcludeRootFile(fileName, currentPath) {
    // Vérifier si on est à la racine
    const isRoot = path.dirname(currentPath) === rootDir || path.dirname(currentPath) === '.';
    
    if (isRoot) {
        // Vérifier l'extension du fichier
        const ext = path.extname(fileName).toLowerCase();
        return rootFileExclusions.includes(ext);
    }
    return false;
}

// Fonction récursive pour lister la structure avec indentation
function listDir(dir, indent = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const isDirectory = fs.statSync(fullPath).isDirectory();

        // Exclure les dossiers spécifiques
        if (isDirectory && excludedFolders.includes(item)) continue;

        // Exclure les dossiers standards
        if (exclusions.includes(item)) continue;

        // Pour les fichiers à la racine, vérifier les exclusions
        if (!isDirectory && shouldExcludeRootFile(item, fullPath)) continue;

        fs.appendFileSync(outputFile, `${indent}${isDirectory ? '📁' : '📄'} ${item}\n`);

        if (isDirectory) {
            listDir(fullPath, indent + '  ');
        }
    }
}

// Exécuter la fonction
fs.writeFileSync(outputFile, `Structure du projet (exclusions : ${exclusions.join(', ')})\n========================================\n\n`);
listDir(rootDir);
console.log(`La structure du projet a été enregistrée dans "${outputFile}"`);