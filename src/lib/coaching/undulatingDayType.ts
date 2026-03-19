// ═══════════════════════════════════════════════════════════════════
// FitForge — Undulating Day Type Utility
// Calculates Heavy/Moderate/Light day for undulating periodization
// ═══════════════════════════════════════════════════════════════════

import type { Routine, WorkoutSession } from '@/types';

export type DayType = 'heavy' | 'moderate' | 'light' | null;

export interface DayTypeConfig {
  label: string;
  emoji: string;
  color: string;
}

export const DAY_TYPE_CONFIG: Record<Exclude<DayType, null>, DayTypeConfig> = {
  heavy: {
    label: 'Heavy',
    emoji: '🏋️',
    color: '#FF453A',
  },
  moderate: {
    label: 'Moderate',
    emoji: '💪',
    color: '#C5F74F',
  },
  light: {
    label: 'Light',
    emoji: '💨',
    color: '#64D2FF',
  },
};

/**
 * Checks if a routine has undulating exercises
 */
export function hasUndulatingExercises(routine: Routine): boolean {
  return routine.workout.some((ex) => ex.progressionScheme === 'undulating');
}

/**
 * Calculates the current day type based on undulating periodization 3-day cycle
 * Assumes 48h rest between sessions
 */
export function calculateDayType(
  routine: Routine | null,
  recentWorkouts: WorkoutSession[]
): DayType {
  if (!routine || !hasUndulatingExercises(routine)) {
    return null;
  }

  // Find last completed session for this routine
  const lastSession = recentWorkouts
    .filter((w) => w.routineId === routine._id)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

  if (!lastSession) {
    // First session → start with Heavy
    return 'heavy';
  }

  // Calculate days since last session
  const daysSinceLastSession = Math.floor(
    (Date.now() - new Date(lastSession.completedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Count sessions to determine position in 3-day cycle
  const routineSessionCount = recentWorkouts.filter(
    (w) => w.routineId === routine._id
  ).length;

  // If last session was very recent (< 48h), user might still be on same day type
  // Otherwise, advance to next in cycle
  const nextCyclePosition = routineSessionCount % 3;

  return nextCyclePosition === 0 ? 'heavy' : nextCyclePosition === 1 ? 'moderate' : 'light';
}
