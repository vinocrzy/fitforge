// ═══════════════════════════════════════════════════════════════════
// FitForge — Startup Sync Hook
// Calls syncExerciseLibrary() once on first mount (browser only)
// Architecture §2.4
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncExerciseLibrary } from '@/lib/db/syncExerciseLibrary';

/**
 * Run once on app startup to seed / delta-sync the exercise library
 * from the static JSON files in public/data/exercises/.
 */
export function useStartupSync() {
  const didRun = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    syncExerciseLibrary()
      .then(() => {
        // Invalidate exercise queries so UI picks up the fresh data
        queryClient.invalidateQueries({ queryKey: ['exercises'] });
      })
      .catch((err) => {
        console.error('[StartupSync] Exercise library sync failed:', err);
      });
  }, [queryClient]);
}
