// ═══════════════════════════════════════════════════════════════════
// FitForge — Build Script: Generate Exercise Manifest
// Scans data/exercises/*.json, produces public/data/exercise-manifest.json
// Architecture §2.4
// ═══════════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const exercisesDir = path.join(process.cwd(), 'data', 'exercises');
const outputDir = path.join(process.cwd(), 'public', 'data');
const outputPath = path.join(outputDir, 'exercise-manifest.json');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
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

const entries = files.map((file) => {
  const raw = fs.readFileSync(path.join(exercisesDir, file), 'utf-8');
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
