// ═══════════════════════════════════════════════════════════════════
// FitForge — Calorie Burn Calculation
// MET-based calorie estimation for workouts
// ═══════════════════════════════════════════════════════════════════

import type { ExerciseRecord, CompletedSet, SessionPhase } from '@/types';

const BASE_MET: Record<string, Record<string, number>> = {
  strength:    { beginner: 3.5, intermediate: 5.0, advanced: 6.0 },
  cardio:      { beginner: 7.0, intermediate: 9.0, advanced: 11.0 },
  stretching:  { beginner: 2.5, intermediate: 2.5, advanced: 2.5 },
  plyometrics: { beginner: 7.0, intermediate: 8.5, advanced: 10.0 },
};

const AVG_REP_DURATION_SEC = 3;

const PHASE_MET_MODIFIER: Record<SessionPhase, number> = {
  warmUp:  0.6,
  workout: 1.0,
  stretch: 1.0,
};

/**
 * Calculate calories burned for a set of completed exercises.
 * Uses MET × weight_kg × duration_hours formula.
 */
export function calculateCalories(
  exercises: { exerciseRecord: ExerciseRecord | null; sets: CompletedSet[]; phase: SessionPhase }[],
  userWeightKg: number,
  actualRpeAvg?: number
): number {
  let totalCalories = 0;

  exercises.forEach(({ exerciseRecord, sets, phase }) => {
    const baseMet = exerciseRecord
      ? (BASE_MET[exerciseRecord.category]?.[exerciseRecord.difficulty] ?? 4.0)
      : 4.0;

    // RPE modifier: RPE 10 = +20%, RPE 7 = ±0%, RPE 5 = −6.6%
    const rpeMod = actualRpeAvg
      ? 1 + (actualRpeAvg - 7) * 0.033
      : 1.0;

    const phaseMod = PHASE_MET_MODIFIER[phase];
    const met = baseMet * rpeMod * phaseMod;

    sets.forEach((set) => {
      const activeTimeSec = set.holdSec
        ? set.holdSec
        : (set.actualReps ?? 0) * AVG_REP_DURATION_SEC;

      const activeCalories = met * userWeightKg * (activeTimeSec / 3600);
      const restCalories = 1.2 * userWeightKg * ((set.restTakenSec ?? 0) / 3600);

      totalCalories += activeCalories + restCalories;
    });
  });

  return Math.round(totalCalories);
}

/**
 * Calculate calories for each phase independently.
 */
export function calculatePhaseCalories(
  exercises: { exerciseRecord: ExerciseRecord | null; sets: CompletedSet[]; phase: SessionPhase }[],
  userWeightKg: number,
  rpeAvg?: number
): { warmUp: number; workout: number; stretch: number; total: number } {
  const byPhase = { warmUp: 0, workout: 0, stretch: 0 };

  (['warmUp', 'workout', 'stretch'] as SessionPhase[]).forEach((phase) => {
    const phaseExercises = exercises.filter((e) => e.phase === phase);
    byPhase[phase] = calculateCalories(phaseExercises, userWeightKg, rpeAvg);
  });

  return {
    ...byPhase,
    total: byPhase.warmUp + byPhase.workout + byPhase.stretch,
  };
}
