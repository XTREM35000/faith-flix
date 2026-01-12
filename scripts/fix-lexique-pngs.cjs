#!/usr/bin/env node
/**
 * Create valid placeholder PNG images using base64-encoded PNG data
 */
const fs = require('fs');
const path = require('path');

// Valid 1x1 transparent PNG (can be expanded by viewers/tools)
const VALID_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const baseDir = path.join('public', 'images', 'lexique');

// Find all PNG files
function findPNGs(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findPNGs(fullPath));
    } else if (file.endsWith('.png')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

const pngFiles = findPNGs(baseDir);

console.log(`Found ${pngFiles.length} PNG files`);

// Write valid PNG data to all files
const pngBuffer = Buffer.from(VALID_PNG_BASE64, 'base64');

for (const pngPath of pngFiles) {
  fs.writeFileSync(pngPath, pngBuffer);
  console.log(`✓ Fixed: ${path.basename(pngPath)}`);
}

console.log('\n✅ All PNG files restored to valid format!');
console.log(`PNG size: ${pngBuffer.length} bytes`);
