// ═══════════════════════════════════════════════════════════════════
// FitForge — Sprint 0: Migrate Food Schema
// Transforms data/foods/F*.json from old nested schema to canonical
// flat schema defined in docs/09-diet-calorie-counter.md §6.2
//
// Run once:  npx ts-node scripts/migrate-food-schema.ts
// Idempotent — skips already-migrated files.
// ═══════════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';

const foodsDir = path.join(process.cwd(), 'data', 'foods');

if (!fs.existsSync(foodsDir)) {
  console.error(`[migrate] foods directory not found: ${foodsDir}`);
  process.exit(1);
}

const files = fs.readdirSync(foodsDir).filter((f) => f.endsWith('.json'));

const CATEGORY_MAP: Record<string, string> = {
  Protein:    'protein-meat-fish',
  Grains:     'pulse-grain',
  Dairy:      'dairy',
  Vegetables: 'vegetable',
  Fruits:     'fruit',
  Fats:       'oil-condiment',
  Beverages:  'beverage',
  Snacks:     'snack',
};

let migratedCount = 0;
let skippedCount = 0;

for (const file of files) {
  const filePath = path.join(foodsDir, file);
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Already migrated — skip
  if ('caloriesPer100g' in raw) {
    console.log(`  ✓  ${file} already migrated — skipping`);
    skippedCount++;
    continue;
  }

  const migrated = {
    id:              raw.id,
    name:            raw.name,
    nameLocal:       null,
    category:        CATEGORY_MAP[raw.category] ?? raw.category,
    caloriesPer100g: raw.per100g.calories,
    proteinPer100g:  raw.per100g.proteinG,
    carbsPer100g:    raw.per100g.carbsG,
    fatPer100g:      raw.per100g.fatG,
    fiberPer100g:    0,
    defaultPortion: {
      unit:        raw.defaultPortion.unit,
      weightGrams: raw.defaultPortion.weightG ?? raw.defaultPortion.amount,
    },
    altPortions: [],
    source:      'manual',
    isCustom:    false,
  };

  fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2));
  console.log(`  ↻  ${file} migrated`);
  migratedCount++;
}

console.log(`\nMigration complete: ${migratedCount} migrated, ${skippedCount} already up-to-date.`);
console.log('Run generate-food-manifest.ts to verify.');
