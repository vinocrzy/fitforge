// ═══════════════════════════════════════════════════════════════════
// FitForge — Exercise Burn Today Hook
// Reads today's completed workout sessions and sums totalCalories
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useQuery } from '@tanstack/react-query';
import { workoutDb } from '@/lib/db/pouchdb';
import type { WorkoutSession } from '@/types';

interface ExerciseBurnResult {
  burnKcal: number;
  isLoading: boolean;
}

/**
 * Returns total calories burned from workout sessions logged today.
 */
export function useExerciseBurnToday(): ExerciseBurnResult {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, isLoading } = useQuery<number>({
    queryKey: ['exercise_burn_today', today],
    queryFn: async () => {
      // workout_ docs use ISO timestamp in _id: workout_{ISO}_{nanoid}
      const startkey = `workout_${today}`;
      const endkey = `workout_${today}\uffff`;

      const result = await workoutDb.allDocs<WorkoutSession>({
        startkey,
        endkey,
        include_docs: true,
      });

      return result.rows.reduce((sum, row) => {
        const doc = row.doc as WorkoutSession | undefined;
        return sum + (doc?.summary?.totalCalories ?? 0);
      }, 0);
    },
  });

  return { burnKcal: data ?? 0, isLoading };
}
