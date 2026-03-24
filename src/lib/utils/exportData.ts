// ═══════════════════════════════════════════════════════════════════
// FitForge — Data Export Utility (Phase 7)
// Downloads all personal PouchDB data as JSON or CSV.
// Triggered client-side only — no server roundtrip.
// ═══════════════════════════════════════════════════════════════════

import { customExerciseDb, routineDb, workoutDb, profileDb } from '@/lib/db/pouchdb';
import type { WorkoutSession } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function isoDateTag(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── JSON Export ─────────────────────────────────────────────────

/**
 * Exports all personal PouchDB documents as a single JSON file.
 * Excludes internal PouchDB design documents.
 */
export async function exportAllDataAsJSON(): Promise<void> {
  const [customExercises, routines, workouts, profile] = await Promise.all([
    customExerciseDb.allDocs({ include_docs: true }),
    routineDb.allDocs({ include_docs: true }),
    workoutDb.allDocs({ include_docs: true }),
    profileDb.allDocs({ include_docs: true }),
  ]);

  const filterDesignDocs = <T extends { id: string }>(row: T) =>
    !row.id.startsWith('_design/');

  const dump = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {
      customExercises: customExercises.rows.filter(filterDesignDocs).map((r) => r.doc),
      routines: routines.rows.filter(filterDesignDocs).map((r) => r.doc),
      workouts: workouts.rows.filter(filterDesignDocs).map((r) => r.doc),
      profile: profile.rows.filter(filterDesignDocs).map((r) => r.doc),
    },
  };

  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `fitforge-export-${isoDateTag()}.json`);
}

// ─── CSV Export ──────────────────────────────────────────────────

/**
 * Exports completed workout sessions flattened to CSV rows.
 * Columns: date, routineName, durationMin, caloriesBurned, totalSets, totalExercises
 */
export async function exportWorkoutsAsCSV(): Promise<void> {
  const result = await workoutDb.allDocs({ include_docs: true });

  const sessions = result.rows
    .filter((r) => !r.id.startsWith('_design/'))
    .map((r) => r.doc as WorkoutSession)
    .filter(Boolean)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  const header = ['date', 'routineName', 'durationMin', 'caloriesBurned', 'totalSets', 'totalExercises'];

  const rows = sessions.map((s) => {
    const date = new Date(s.completedAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
    const durationMin = s.summary?.totalTimeSec != null
      ? Math.round(s.summary.totalTimeSec / 60)
      : '';
    const calories = s.summary?.totalCalories ?? '';

    // Count sets across all phases
    const allExercises = [
      ...(s.warmUp ?? []),
      ...(s.workout ?? []),
      ...(s.stretch ?? []),
    ];
    const totalSets = allExercises.reduce(
      (acc, ex) => acc + (ex.sets?.length ?? 0),
      0,
    );
    const totalExercises = allExercises.length;

    return [date, `"${s.routineId ?? ''}"`, durationMin, calories, totalSets, totalExercises]
      .join(',');
  });

  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `fitforge-workouts-${isoDateTag()}.csv`);
}
