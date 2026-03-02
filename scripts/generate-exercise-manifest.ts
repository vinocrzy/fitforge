// ═══════════════════════════════════════════════════════════════════
// FitForge — Build Script: Generate Exercise Manifest
// Scans data/exercises/*.json, produces public/data/exercise-manifest.json
// and copies exercise files to public/data/exercises/
// Architecture §2.4
// ═══════════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const exercisesDir = path.join(process.cwd(), 'data', 'exercises');
const outputDir = path.join(process.cwd(), 'public', 'data');
const exercisesOutputDir = path.join(outputDir, 'exercises');
const outputPath = path.join(outputDir, 'exercise-manifest.json');

// Ensure output directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(exercisesOutputDir)) {
  fs.mkdirSync(exercisesOutputDir, { recursive: true });
}

// Check if exercises directory exists
if (!fs.existsSync(exercisesDir)) {
  console.warn(
    `[ExerciseManifest] Warning: ${exercisesDir} does not exist. Creating empty manifest.`
  );
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ version: 'empty', count: 0, exercises: [] }, null, 2)
  );
  process.exit(0);
}

const files = fs.readdirSync(exercisesDir).filter((f) => f.endsWith('.json'));

let copied = 0;
let skipped = 0;

const entries = files.map((file) => {
  const sourcePath = path.join(exercisesDir, file);
  const destPath = path.join(exercisesOutputDir, file);
  const raw = fs.readFileSync(sourcePath, 'utf-8');
  
  // Copy exercise file to public directory if needed
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
  exercises: entries,
};

fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log(
  `[ExerciseManifest] Generated: ${entries.length} exercises, version ${libraryHash}`
);
console.log(
  `[ExerciseManifest] Copied: ${copied} files, Skipped: ${skipped} files (already up-to-date)`
);
