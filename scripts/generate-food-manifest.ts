// ═══════════════════════════════════════════════════════════════════
// FitForge — Build Script: Generate Food Manifest
// Scans data/foods/*.json, produces public/data/food-manifest.json
// and copies food files to public/data/foods/
// ═══════════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const foodsDir = path.join(process.cwd(), 'data', 'foods');
const outputDir = path.join(process.cwd(), 'public', 'data');
const foodsOutputDir = path.join(outputDir, 'foods');
const outputPath = path.join(outputDir, 'food-manifest.json');

// Ensure output directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(foodsOutputDir)) {
  fs.mkdirSync(foodsOutputDir, { recursive: true });
}

// Check if foods directory exists
if (!fs.existsSync(foodsDir)) {
  console.warn(
    `[FoodManifest] Warning: ${foodsDir} does not exist. Creating empty manifest.`
  );
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ version: 'empty', count: 0, foods: [] }, null, 2)
  );
  process.exit(0);
}

const files = fs.readdirSync(foodsDir).filter((f) => f.endsWith('.json'));

let copied = 0;
let skipped = 0;

const entries = files.map((file) => {
  const sourcePath = path.join(foodsDir, file);
  const destPath = path.join(foodsOutputDir, file);
  const raw = fs.readFileSync(sourcePath, 'utf-8');

  // Copy food file to public directory if needed
  if (fs.existsSync(destPath)) {
    const sourceStats = fs.statSync(sourcePath);
    const destStats = fs.statSync(destPath);
    // Skip if same size (already copied)
    if (sourceStats.size === destStats.size) {
      skipped++;
    } else {
      fs.copyFileSync(sourcePath, destPath);
      copied++;
    }
  } else {
    fs.copyFileSync(sourcePath, destPath);
    copied++;
  }

  const data = JSON.parse(raw);
  const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 8);
  return { id: data.id, hash };
});

const libraryHash = crypto
  .createHash('sha1')
  .update(JSON.stringify(entries))
  .digest('hex')
  .slice(0, 12);

const manifest = {
  version: libraryHash,
  count: entries.length,
  foods: entries,
};

fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log(
  `[FoodManifest] Generated: ${entries.length} foods, version ${libraryHash}`
);
console.log(
  `[FoodManifest] Copied: ${copied} files, Skipped: ${skipped} files (already up-to-date)`
);
