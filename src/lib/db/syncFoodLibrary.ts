// ═══════════════════════════════════════════════════════════════════
// FitForge — Food Library Versioned Sync
// Near-equivalent of syncExerciseLibrary.ts for the food database
// ═══════════════════════════════════════════════════════════════════

import { nutritionDb } from './pouchdb';
import type { FoodManifest, FoodLibraryItem } from '@/types';

const META_DOC_ID = '_local/food_library_meta';

interface LibraryMeta {
  _id: typeof META_DOC_ID;
  _rev?: string;
  version: string;
  count: number;
  syncedAt: string;
}

export async function syncFoodLibrary(): Promise<void> {
  try {
    // 1. Fetch manifest (served from SW cache — works offline)
    const res = await fetch('/data/food-manifest.json');
    if (!res.ok) {
      console.warn('[FoodLib] Manifest not found — skipping sync.');
      return;
    }
    const manifest: FoodManifest = await res.json();

    // 2. Read stored version
    let meta: LibraryMeta | null = null;
    try {
      meta = await nutritionDb.get<LibraryMeta>(META_DOC_ID);
    } catch {
      // _local doc doesn't exist yet — first install
    }

    // 3. Version match → nothing to do
    if (meta?.version === manifest.version) {
      console.debug(
        `[FoodLib] Up to date (v${manifest.version}, ${manifest.count} foods)`
      );
      return;
    }

    console.info(
      `[FoodLib] Update detected: ${meta?.version ?? 'none'} → ${manifest.version}. Running delta sync…`
    );

    // 4. Delta sync
    await deltaSync(manifest);

    // 5. Persist new version
    const updatedMeta: LibraryMeta = {
      _id: META_DOC_ID,
      ...(meta?._rev ? { _rev: meta._rev } : {}),
      version: manifest.version,
      count: manifest.count,
      syncedAt: new Date().toISOString(),
    };
    await nutritionDb.put(updatedMeta);

    console.info(
      `[FoodLib] Sync complete. Library now at v${manifest.version}.`
    );
  } catch (err) {
    console.error('[FoodLib] Sync failed:', err);
  }
}

async function deltaSync(manifest: FoodManifest): Promise<void> {
  // 1. Fetch all existing food docs from PouchDB
  const allRows = await nutritionDb.allDocs({ include_docs: false });
  const existingMap = new Map(
    allRows.rows
      .filter((r) => !r.id.startsWith('_'))
      .map((r) => [r.id, r.value.rev])
  );

  // 2. Fetch stored per-food hashes
  let storedHashes: Record<string, string> = {};
  try {
    const hashDoc = await nutritionDb.get<{ hashes: Record<string, string> }>(
      '_local/food_hashes'
    );
    storedHashes = hashDoc.hashes;
  } catch {
    /* first run */
  }

  const manifestIds = new Set(manifest.foods.map((f) => f.id));

  // 3. Classify each manifest entry
  const toUpsert: { id: string }[] = [];
  const toDelete: { _id: string; _rev: string; _deleted: true }[] = [];

  for (const { id, hash } of manifest.foods) {
    const docId = `food_${id}`;
    const existingRev = existingMap.get(docId);

    if (!existingRev) {
      toUpsert.push({ id });
    } else if (storedHashes[id] !== hash) {
      toUpsert.push({ id });
    }
  }

  // 4. Find foods removed from the library
  for (const [docId, rev] of existingMap) {
    if (!docId.startsWith('food_')) continue;
    const id = docId.replace('food_', '');
    if (!manifestIds.has(id)) {
      toDelete.push({ _id: docId, _rev: rev, _deleted: true });
    }
  }

  console.info(
    `[FoodLib] Delta: +${toUpsert.length} upsert, -${toDelete.length} delete`
  );

  // 5. Load and upsert changed/new food JSON files
  if (toUpsert.length > 0) {
    const newDocs = await Promise.all(
      toUpsert.map(async ({ id }) => {
        const res = await fetch(`/data/foods/${id}.json`);
        const food: FoodLibraryItem = await res.json();
        const docId = `food_${id}`;
        const existingRev = existingMap.get(docId);
        return {
          ...food,
          _id: docId,
          ...(existingRev ? { _rev: existingRev } : {}),
        };
      })
    );
    await nutritionDb.bulkDocs(newDocs);
  }

  // 6. Apply deletes
  if (toDelete.length > 0) {
    await nutritionDb.bulkDocs(toDelete);
  }

  // 7. Persist updated hash index
  let hashDocRev: string | undefined;
  try {
    const existing = await nutritionDb.get('_local/food_hashes');
    hashDocRev = existing._rev;
  } catch {
    /* ok */
  }

  const newHashes = Object.fromEntries(
    manifest.foods.map(({ id, hash }) => [id, hash])
  );
  await nutritionDb.put({
    _id: '_local/food_hashes',
    ...(hashDocRev ? { _rev: hashDocRev } : {}),
    hashes: newHashes,
  });
}
