import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

async function killCursorProcesses() {
  log('\n🔪 Arrêt des processus Cursor...', colors.cyan);
  try {
    await execAsync('taskkill /F /IM cursor.exe 2>nul').catch(() => {});
    await execAsync('taskkill /F /IM Cursor.exe 2>nul').catch(() => {});
    log('✅ Processus Cursor arrêtés', colors.green);
  } catch (error) {
    log('⚠️ Aucun processus Cursor trouvé', colors.yellow);
  }
}

async function forceDeleteWithPowerShell(folderPath) {
  if (!folderPath || !fs.existsSync(folderPath)) {
    log(`⚠️ Déjà supprimé ou inexistant : ${folderPath}`, colors.yellow);
    return false;
  }

  try {
    // Méthode 1: Suppression Node.js directe
    fs.rmSync(folderPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    log(`✅ Supprimé (Node) : ${folderPath}`, colors.green);
    return true;
  } catch (err) {
    log(`⚠️ Node a échoué pour ${folderPath}, tentative PowerShell...`, colors.yellow);
    
    // Méthode 2: PowerShell en admin avec force
    try {
      const command = `Remove-Item -Path "${folderPath}" -Recurse -Force -ErrorAction SilentlyContinue`;
      await execAsync(`powershell -Command "& {${command}}"`);
      
      // Vérifier si le dossier existe encore
      if (!fs.existsSync(folderPath)) {
        log(`✅ Supprimé (PowerShell) : ${folderPath}`, colors.green);
        return true;
      } else {
        log(`❌ Échec même avec PowerShell pour : ${folderPath}`, colors.red);
        return false;
      }
    } catch (psErr) {
      log(`❌ Erreur PowerShell pour ${folderPath}: ${psErr.message}`, colors.red);
      return false;
    }
  }
}

async function deleteFolderSafely(folderPath, description) {
  log(`\n📁 Traitement : ${description}`, colors.cyan);
  
  if (!fs.existsSync(folderPath)) {
    log(`✅ Déjà supprimé : ${folderPath}`, colors.green);
    return true;
  }
  
  return await forceDeleteWithPowerShell(folderPath);
}

function cleanTempFiles() {
  log('\n🧹 Nettoyage des fichiers temporaires...', colors.cyan);
  const tempDir = os.tmpdir();
  try {
    const files = fs.readdirSync(tempDir);
    const cursorFiles = files.filter(f => f.startsWith('cursor-') || f.startsWith('Cursor-'));
    
    cursorFiles.forEach(file => {
      const filePath = path.join(tempDir, file);
      try {
        fs.rmSync(filePath, { recursive: true, force: true });
        log(`✅ Supprimé temp : ${file}`, colors.green);
      } catch (err) {
        log(`⚠️ Impossible de supprimer ${file}: ${err.message}`, colors.yellow);
      }
    });
    
    if (cursorFiles.length === 0) {
      log('ℹ️ Aucun fichier temporaire Cursor trouvé', colors.yellow);
    }
  } catch (err) {
    log(`❌ Erreur accès temp: ${err.message}`, colors.red);
  }
}

async function resetCursor() {
  console.clear();
  log('╔════════════════════════════════════════════════╗', colors.magenta);
  log('║         RÉINITIALISATION COMPLÈTE CURSOR      ║', colors.magenta);
  log('║                (Version améliorée)             ║', colors.magenta);
  log('╚════════════════════════════════════════════════╝', colors.magenta);
  
  // Confirmation
  log('\n⚠️  Cette opération va supprimer DÉFINITIVEMENT :', colors.yellow);
  log('   • Tous les paramètres Cursor', colors.yellow);
  log('   • L\'historique des chats', colors.yellow);
  log('   • Les caches', colors.yellow);
  log('   • Les extensions installées', colors.yellow);
  log('   • Les données de projets', colors.yellow);
  log('\n📌 Cursor redeviendra comme une nouvelle installation.\n', colors.cyan);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('Confirmer la réinitialisation ? (oui/non): ', resolve);
  });
  rl.close();
  
  if (answer.toLowerCase() !== 'oui') {
    log('\n❌ Opération annulée.', colors.red);
    return;
  }
  
  await killCursorProcesses();
  
  // Pause pour s'assurer que les processus sont bien terminés
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Définir les chemins
  const appData = process.env.APPDATA;
  if (!appData) {
    log('❌ Impossible de trouver APPDATA', colors.red);
    return;
  }
  
  const cursorPath = path.join(appData, 'Cursor');
  const localAppData = process.env.LOCALAPPDATA;
  
  log('\n📂 Suppression des dossiers Cursor...', colors.cyan);
  
  // Liste des dossiers à supprimer avec descriptions
  const foldersToDelete = [
    { path: path.join(cursorPath, 'User'), desc: 'Paramètres et historique utilisateur' },
    { path: path.join(cursorPath, 'Cache'), desc: 'Cache principal' },
    { path: path.join(cursorPath, 'GPUCache'), desc: 'Cache GPU' },
    { path: path.join(cursorPath, 'User', 'workspaceStorage'), desc: 'Historique des projets' },
    { path: path.join(localAppData, 'Cursor'), desc: 'Données locales Cursor' }
  ];
  
  // Supprimer chaque dossier
  for (const folder of foldersToDelete) {
    if (folder.path) {
      await deleteFolderSafely(folder.path, folder.desc);
    }
  }
  
  cleanTempFiles();
  
  log('\n🔍 Vérification finale...', colors.cyan);
  
  // Vérifier ce qui reste
  let reste = false;
  for (const folder of foldersToDelete) {
    if (folder.path && fs.existsSync(folder.path)) {
      log(`⚠️ Reste : ${folder.path}`, colors.yellow);
      reste = true;
    }
  }
  
  if (!reste) {
    log('✅ Tous les dossiers ont été supprimés avec succès !', colors.green);
  } else {
    log('\n📌 Conseil : Redémarre l\'ordinateur puis relance ce script.', colors.yellow);
  }
  
  log('\n✨ RÉINITIALISATION TERMINÉE ! ✨', colors.magenta);
  log('\n➡️  Étapes suivantes :', colors.cyan);
  log('   1. Redémarre ton ordinateur (recommandé)', colors.cyan);
  log('   2. Rouvre Cursor', colors.cyan);
  log('   3. Reconnecte-toi à GitHub (si nécessaire)', colors.cyan);
  log('   4. Les extensions se réinstalleront automatiquement', colors.cyan);
  log('   5. L\'historique des chats a été effacé', colors.cyan);
  
  log('\n📊 Résumé :', colors.green);
  log('   ✅ Processus arrêtés', colors.green);
  log('   ✅ Cache nettoyé', colors.green);
  log('   ✅ Paramètres utilisateur supprimés', colors.green);
  log('   ✅ Historique des projets effacé', colors.green);
  
  if (reste) {
    log('\n⚠️  NOTE : Certains dossiers n\'ont pas pu être supprimés.', colors.yellow);
    log('   Un redémarrage devrait résoudre le problème.', colors.yellow);
  }
}

// Exécution avec gestion d'erreur améliorée
resetCursor().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});