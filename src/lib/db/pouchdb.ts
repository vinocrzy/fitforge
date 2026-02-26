// ═══════════════════════════════════════════════════════════════════
// FitForge — PouchDB Database Instances
// 5 databases as per architecture doc §2.3
// Uses lazy initialization to avoid SSR/prerender crashes from
// native leveldown bindings.
// ═══════════════════════════════════════════════════════════════════

import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

PouchDB.plugin(PouchDBFind);

// ─── Lazy singletons (created on first access) ───────────────────

const _cache: Record<string, PouchDB.Database> = {};

function db(name: string): PouchDB.Database {
  if (!_cache[name]) _cache[name] = new PouchDB(name);
  return _cache[name];
}

/** Seeded exercise library (read-only, static) */
export const exerciseDb = new Proxy({} as PouchDB.Database, {
  get: (_, p) => (db('fitforge_exercises') as any)[p],
});
/** User-created exercises */
export const customExerciseDb = new Proxy({} as PouchDB.Database, {
  get: (_, p) => (db('fitforge_custom_exercises') as any)[p],
});
/** User-created routines */
export const routineDb = new Proxy({} as PouchDB.Database, {
  get: (_, p) => (db('fitforge_routines') as any)[p],
});
/** Completed session logs */
export const workoutDb = new Proxy({} as PouchDB.Database, {
  get: (_, p) => (db('fitforge_workouts') as any)[p],
});
/** User profile, preferences, PRs, XP */
export const profileDb = new Proxy({} as PouchDB.Database, {
  get: (_, p) => (db('fitforge_profile') as any)[p],
});

// ─── Database Names (for sync) ────────────────────────────────────

export const DB_NAMES = [
  'fitforge_exercises',
  'fitforge_custom_exercises',
  'fitforge_routines',
  'fitforge_workouts',
  'fitforge_profile',
] as const;

// ─── Utility: Destroy all databases (for testing/reset) ──────────

export async function destroyAllDatabases(): Promise<void> {
  await Promise.all([
    exerciseDb.destroy(),
    customExerciseDb.destroy(),
    routineDb.destroy(),
    workoutDb.destroy(),
    profileDb.destroy(),
  ]);
}
