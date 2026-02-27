// ═══════════════════════════════════════════════════════════════════
// FitForge — Muscle Heatmap Mapping
// Maps exercise bodyPart/target to react-body-highlighter muscles
// ═══════════════════════════════════════════════════════════════════

import type { Muscle } from 'react-body-highlighter';
import type { SessionExercise, ExerciseRecord } from '@/types';

/**
 * Map exercise target muscle to react-body-highlighter muscle slugs.
 * An exercise can activate multiple body-highlighter muscles.
 */
const TARGET_TO_MUSCLES: Record<string, Muscle[]> = {
  abs: ['abs', 'obliques'],
  adductors: ['adductor'],
  biceps: ['biceps'],
  calves: ['calves'],
  delts: ['front-deltoids', 'back-deltoids'],
  forearms: ['forearm'],
  glutes: ['gluteal'],
  hamstrings: ['hamstring'],
  lats: ['upper-back'],
  pectorals: ['chest'],
  quads: ['quadriceps'],
  'serratus anterior': ['obliques'],
  traps: ['trapezius'],
  triceps: ['triceps'],
  'upper back': ['upper-back', 'trapezius'],
};

/**
 * Map secondary muscles (string) to react-body-highlighter muscle slugs.
 */
const SECONDARY_TO_MUSCLES: Record<string, Muscle[]> = {
  abs: ['abs'],
  adductors: ['adductor'],
  biceps: ['biceps'],
  calves: ['calves'],
  'front deltoids': ['front-deltoids'],
  'rear deltoids': ['back-deltoids'],
  deltoids: ['front-deltoids', 'back-deltoids'],
  delts: ['front-deltoids', 'back-deltoids'],
  forearms: ['forearm'],
  glutes: ['gluteal'],
  hamstrings: ['hamstring'],
  'hip flexors': ['adductor', 'quadriceps'],
  lats: ['upper-back'],
  'lower back': ['lower-back'],
  'lower trapezius': ['trapezius'],
  obliques: ['obliques'],
  pectorals: ['chest'],
  quads: ['quadriceps'],
  quadriceps: ['quadriceps'],
  'serratus anterior': ['obliques'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  traps: ['trapezius'],
  triceps: ['triceps'],
  'upper back': ['upper-back'],
  'upper trapezius': ['trapezius'],
};

export interface MuscleFrequency {
  muscle: Muscle;
  frequency: number;
}

export interface HighlighterExerciseData {
  name: string;
  muscles: Muscle[];
  frequency?: number;
}

/**
 * Convert a list of session exercises + their records into
 * react-body-highlighter exercise data.
 *
 * Frequency = number of sets performed targeting that muscle.
 */
export function exercisesToHighlighterData(
  sessionExercises: SessionExercise[],
  exerciseRecordMap: Map<string, ExerciseRecord>
): HighlighterExerciseData[] {
  const result: HighlighterExerciseData[] = [];

  sessionExercises.forEach((se) => {
    const record = exerciseRecordMap.get(se.exerciseId);
    if (!record) return;

    const muscles = new Set<Muscle>();

    // Primary target
    const primary = TARGET_TO_MUSCLES[record.target.toLowerCase()];
    primary?.forEach((m) => muscles.add(m));

    // Secondary muscles
    record.secondaryMuscles?.forEach((sm) => {
      const mapped = SECONDARY_TO_MUSCLES[sm.toLowerCase()];
      mapped?.forEach((m) => muscles.add(m));
    });

    if (muscles.size > 0) {
      result.push({
        name: record.name,
        muscles: Array.from(muscles),
        frequency: se.sets.length,
      });
    }
  });

  return result;
}

/**
 * Get an aggregate muscle frequency map from exercise data.
 * Returns a Map of muscle -> total frequency (set count).
 */
export function getMuscleFrequencies(
  data: HighlighterExerciseData[]
): Map<Muscle, number> {
  const freqMap = new Map<Muscle, number>();

  data.forEach((entry) => {
    const freq = entry.frequency ?? 1;
    entry.muscles.forEach((m) => {
      freqMap.set(m, (freqMap.get(m) ?? 0) + freq);
    });
  });

  return freqMap;
}

/**
 * Get the list of unique muscle groups worked in a session.
 */
export function getWorkedMuscleNames(
  sessionExercises: SessionExercise[],
  exerciseRecordMap: Map<string, ExerciseRecord>
): string[] {
  const muscles = new Set<string>();

  sessionExercises.forEach((se) => {
    const record = exerciseRecordMap.get(se.exerciseId);
    if (record && se.sets.length > 0) {
      muscles.add(record.target);
      record.secondaryMuscles?.forEach((m) => muscles.add(m));
    }
  });

  return Array.from(muscles).sort();
}
