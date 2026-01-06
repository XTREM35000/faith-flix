#!/usr/bin/env node
/**
 * Script de migration : uploader toutes les images locales vers Supabase bucket 'gallery'
 * Usage: node scripts/migrate-hero-images.mjs
 * 
 * Prérequis:
 * - .env doit contenir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
 * - npm i @supabase/supabase-js glob fs-extra dotenv
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = 'gallery'; // Bucket existant
const SRC_DIR = path.resolve(rootDir, 'public', 'images');
const OUTPUT_FILE = path.resolve(rootDir, 'migration-hero-images-mapping.json');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERREUR: VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY manquants dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
  },
});

const mapping = {
  timestamp: new Date().toISOString(),
  bucket: BUCKET,
  supabaseUrl: SUPABASE_URL,
  images: [],
  summary: {
    total: 0,
    uploaded: 0,
    failed: 0,
  },
};

async function uploadFile(filePath) {
  try {
    const rel = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
    const fileName = path.basename(filePath);
    // Préfixe: "hero-images/{relative-path}" pour différencier des autres uploads dans "gallery"
    const key = `hero-images/${Date.now()}_${rel}`;
    
    console.log(`  📤 Upload: ${rel}...`);
    const file = await fs.readFile(filePath);
    
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(key, file, { upsert: false });
    
    if (error) {
      console.error(`    ❌ Erreur: ${error.message}`);
      return null;
    }
    
    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    console.log(`    ✅ Succès: ${publicData.publicUrl}`);
    
    return {
      localPath: `/images/${rel}`,
      storageKey: data.path,
      publicUrl: publicData.publicUrl,
    };
  } catch (e) {
    console.error(`    ❌ Exception: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Début de la migration des images du Hero Banner...');
  console.log(`   Bucket: ${BUCKET}`);
  console.log(`   Source: ${SRC_DIR}`);
  console.log('');
  
  // Lister tous les fichiers images dans /public/images
  // Utiliser des chemins avec forward slashes pour globSync (cross-platform)
  const imageExtensions = ['*.png', '*.jpg', '*.jpeg', '*.webp', '*.avif', '*.svg'];
  const globPath = SRC_DIR.replace(/\\/g, '/');
  const patterns = imageExtensions.map(ext => `${globPath}/**/${ext}`);
  const files = globSync(patterns, { nodir: true });
  
  if (files.length === 0) {
    console.warn('⚠️  Aucun fichier image trouvé dans', SRC_DIR);
    await fs.writeJson(OUTPUT_FILE, mapping, { spaces: 2 });
    console.log(`📄 Mapping sauvegardé à: ${OUTPUT_FILE}`);
    return;
  }
  
  console.log(`📂 ${files.length} fichier(s) image(s) détecté(s):`);
  
  for (const filePath of files) {
    mapping.summary.total++;
    const result = await uploadFile(filePath);
    
    if (result) {
      mapping.images.push(result);
      mapping.summary.uploaded++;
    } else {
      mapping.summary.failed++;
    }
    
    // Petit délai pour éviter throttle
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('');
  console.log('📊 Résumé de la migration:');
  console.log(`   Total:    ${mapping.summary.total}`);
  console.log(`   Uploadés: ${mapping.summary.uploaded} ✅`);
  console.log(`   Échoués:  ${mapping.summary.failed} ❌`);
  
  // Sauvegarder le mapping
  await fs.writeJson(OUTPUT_FILE, mapping, { spaces: 2 });
  console.log(`\n📄 Mapping sauvegardé à: ${OUTPUT_FILE}`);
  
  if (mapping.summary.failed === 0) {
    console.log('\n✨ Migration réussie! Tous les fichiers ont été uploadés.');
  } else {
    console.log(`\n⚠️  ${mapping.summary.failed} fichier(s) n'ont pas pu être uploadés.`);
    console.log('   Vérifiez les permissions du bucket et réessayez.');
  }
}

main().catch(e => {
  console.error('❌ Erreur fatale:', e.message);
  process.exit(1);
});
