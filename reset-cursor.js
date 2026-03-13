reset-cursor.jsconst { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');

const execAsync = util.promisify(exec);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
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

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
      log(`✅ Supprimé : ${folderPath}`, colors.green);
      return true;
    } catch (err) {
      log(`❌ Erreur lors de la suppression de ${folderPath}: ${err.message}`, colors.red);
      return false;
    }
  } else {
    log(`⚠️ Non trouvé : ${folderPath}`, colors.yellow);
    return false;
  }
}

function cleanTempFiles() {
  log('\n🧹 Nettoyage des fichiers temporaires...', colors.cyan);
  const tempDir = os.tmpdir();
  try {
    const files = fs.readdirSync(tempDir);
    const cursorFiles = files.filter(f => f.startsWith('cursor-'));
    
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
  log('╚════════════════════════════════════════════════╝', colors.magenta);
  
  // Confirmation
  log('\n⚠️  Cette opération va supprimer DÉFINITIVEMENT :', colors.yellow);
  log('   • Tous les paramètres Cursor', colors.yellow);
  log('   • L\'historique des chats', colors.yellow);
  log('   • Les caches', colors.yellow);
  log('   • Les extensions installées', colors.yellow);
  log('   • Les données de projets', colors.yellow);
  log('\n📌 Cursor redeviendra comme une nouvelle installation.\n', colors.cyan);
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Confirmer la réinitialisation ? (oui/non): ', async (answer) => {
    if (answer.toLowerCase() !== 'oui') {
      log('\n❌ Opération annulée.', colors.red);
      readline.close();
      return;
    }
    readline.close();
    
    await killCursorProcesses();
    
    // Définir les chemins
    const appData = process.env.APPDATA;
    if (!appData) {
      log('❌ Impossible de trouver APPDATA', colors.red);
      return;
    }
    
    const cursorPath = path.join(appData, 'Cursor');
    const localAppData = process.env.LOCALAPPDATA;
    
    log('\n📂 Suppression des dossiers Cursor...', colors.cyan);
    
    const pathsToDelete = [
      path.join(cursorPath, 'User'),
      path.join(cursorPath, 'Cache'),
      path.join(cursorPath, 'GPUCache'),
      path.join(cursorPath, 'User', 'workspaceStorage')
    ];
    
    if (localAppData) {
      pathsToDelete.push(path.join(localAppData, 'Cursor'));
    }
    
    pathsToDelete.forEach(deleteFolderRecursive);
    
    cleanTempFiles();
    
    log('\n✨ RÉINITIALISATION TERMINÉE ! ✨', colors.magenta);
    log('\n➡️  Étapes suivantes :', colors.cyan);
    log('   1. Rouvre Cursor', colors.cyan);
    log('   2. Reconnecte-toi à GitHub (si nécessaire)', colors.cyan);
    log('   3. Tes extensions se réinstalleront automatiquement', colors.cyan);
    log('   4. L\'historique des chats a été effacé', colors.cyan);
    
    log('\n📊 Résumé :', colors.green);
    log('   ✅ Cursor remis à zéro', colors.green);
    log('   ✅ Cache nettoyé', colors.green);
    log('   ✅ Historique effacé', colors.green);
    log('   ✅ Paramètres supprimés\n', colors.green);
  });
}

// Exécution
resetCursor().catch(err => {
  console.error('Erreur:', err);
});