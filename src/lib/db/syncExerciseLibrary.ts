// ═══════════════════════════════════════════════════════════════════
// FitForge — Exercise Library Versioned Sync
// Architecture §2.4 — delta sync replacing seedExercisesIfEmpty()
// ═══════════════════════════════════════════════════════════════════

import { exerciseDb } from './pouchdb';
import type { ExerciseManifest, ExerciseRecord } from '@/types';

const META_DOC_ID = '_local/exercise_library_meta';

interface LibraryMeta {
  _id: typeof META_DOC_ID;
  _rev?: string;
  version: string;
  count: number;
  syncedAt: string;
}

export async function syncExerciseLibrary(): Promise<void> {
  try {
    // 1. Fetch manifest (served from SW cache — works offline)
    const res = await fetch('/data/exercise-manifest.json');
    if (!res.ok) {
      console.warn('[ExerciseLib] Manifest not found — skipping sync.');
      return;
    }
    const manifest: ExerciseManifest = await res.json();

    // 2. Read stored version
    let meta: LibraryMeta | null = null;
    try {
      meta = await exerciseDb.get<LibraryMeta>(META_DOC_ID);
    } catch {
      // _local doc doesn't exist yet — first install
    }

    // 3. Version match → nothing to do
    if (meta?.version === manifest.version) {
      console.debug(
        `[ExerciseLib] Up to date (v${manifest.version}, ${manifest.count} exercises)`
      );
      return;
    }

    console.info(
      `[ExerciseLib] Update detected: ${meta?.version ?? 'none'} → ${manifest.version}. Running delta sync…`
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
    await exerciseDb.put(updatedMeta);

    console.info(
      `[ExerciseLib] Sync complete. Library now at v${manifest.version}.`
    );
  } catch (err) {
    console.error('[ExerciseLib] Sync failed:', err);
  }
}

async function deltaSync(manifest: ExerciseManifest): Promise<void> {
  // 1. Fetch all existing exercise docs from PouchDB
  const allRows = await exerciseDb.allDocs({ include_docs: false });
  const existingMap = new Map(
    allRows.rows
      .filter((r) => !r.id.startsWith('_'))
      .map((r) => [r.id, r.value.rev])
  );

  // 2. Fetch stored per-exercise hashes
  let storedHashes: Record<string, string> = {};
  try {
    const hashDoc = await exerciseDb.get<{ hashes: Record<string, string> }>(
      '_local/exercise_hashes'
    );
    storedHashes = hashDoc.hashes;
  } catch {
    /* first run */
  }

  const manifestIds = new Set(manifest.exercises.map((e) => e.id));

  // 3. Classify each manifest entry
  const toUpsert: { id: string }[] = [];
  const toDelete: { _id: string; _rev: string; _deleted: true }[] = [];

  for (const { id, hash } of manifest.exercises) {
    const docId = `exercise_${id}`;
    const existingRev = existingMap.get(docId);

    if (!existingRev) {
      toUpsert.push({ id });
    } else if (storedHashes[id] !== hash) {
      toUpsert.push({ id });
    }
  }

  // 4. Find exercises removed from the library
  for (const [docId, rev] of existingMap) {
    const id = docId.replace('exercise_', '');
    if (!manifestIds.has(id)) {
      toDelete.push({ _id: docId, _rev: rev, _deleted: true });
    }
  }

  console.info(
    `[ExerciseLib] Delta: +${toUpsert.length} upsert, -${toDelete.length} delete`
  );

  // 5. Load and upsert changed/new exercise JSON files
  if (toUpsert.length > 0) {
    const newDocs = await Promise.all(
      toUpsert.map(async ({ id }) => {
        const paddedId = id.padStart(4, '0');
        const res = await fetch(`/data/exercises/${paddedId}.json`);
        const ex: ExerciseRecord = await res.json();
        const docId = `exercise_${id}`;
        const existingRev = existingMap.get(docId);
        return {
          ...ex,
          _id: docId,
          ...(existingRev ? { _rev: existingRev } : {}),
          type: 'exercise' as const,
        };
      })
    );
    await exerciseDb.bulkDocs(newDocs);
  }

  // 6. Apply deletes
  if (toDelete.length > 0) {
    await exerciseDb.bulkDocs(toDelete);
  }

  // 7. Persist updated hash index
  let hashDocRev: string | undefined;
  try {
    const existing = await exerciseDb.get('_local/exercise_hashes');
    hashDocRev = existing._rev;
  } catch {
    /* ok */
  }

  const newHashes = Object.fromEntries(
    manifest.exercises.map(({ id, hash }) => [id, hash])
  );
  await exerciseDb.put({
    _id: '_local/exercise_hashes',
    ...(hashDocRev ? { _rev: hashDocRev } : {}),
    hashes: newHashes,
  });
}
