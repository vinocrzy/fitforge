// ═══════════════════════════════════════════════════════════════════
// FitForge — Apply Coaching Note
// Utility to update routines based on coaching suggestions
// ═══════════════════════════════════════════════════════════════════

import { routineDb } from '@/lib/db/pouchdb';
import type { Routine, CoachingNote, RoutineExerciseConfig } from '@/types';

export interface ApplyResult {
  success: boolean;
  routinesUpdated: string[];
  error?: string;
}

/**
 * Finds all routines containing the specified exercise and applies the coaching note suggestion
 */
export async function applyCoachingNote(note: CoachingNote): Promise<ApplyResult> {
  try {
    // Fetch all routines
    const result = await routineDb.allDocs({
      include_docs: true,
    });

    const routines = result.rows
      .filter((row) => !row.id.startsWith('_'))
      .map((row) => row.doc as unknown as Routine);

    // Find routines containing this exercise
    const matchingRoutines = routines.filter((routine) => {
      const hasInWarmUp = routine.warmUp.some((ex) => ex.exerciseId === note.exerciseId);
      const hasInWorkout = routine.workout.some((ex) => ex.exerciseId === note.exerciseId);
      const hasInStretch = routine.stretch.some((ex) => ex.exerciseId === note.exerciseId);
      return hasInWarmUp || hasInWorkout || hasInStretch;
    });

    if (matchingRoutines.length === 0) {
      return {
        success: false,
        routinesUpdated: [],
        error: 'No routines found containing this exercise',
      };
    }

    // For now, apply to the most recently updated routine
    // TODO: In Phase 6 step 7, add routine selector sheet for multiple matches
    const targetRoutine = matchingRoutines.sort((a, b) => {
      const dateA = new Date(a.updatedAt ?? a.createdAt).getTime();
      const dateB = new Date(b.updatedAt ?? b.createdAt).getTime();
      return dateB - dateA;
    })[0];

    // Apply the suggestion
    const updateExercise = (exercise: RoutineExerciseConfig): RoutineExerciseConfig => {
      if (exercise.exerciseId !== note.exerciseId) return exercise;

      const updated = { ...exercise };

      if (note.type === 'reduce_load' || note.type === 'increase_load') {
        if (note.suggestedValue !== undefined) {
          updated.weightKg = note.suggestedValue;
        }
        if (note.suggestedReps !== undefined) {
          updated.targetReps = note.suggestedReps;
        }
      }

      return updated;
    };

    const updatedRoutine: Routine = {
      ...targetRoutine,
      warmUp: targetRoutine.warmUp.map(updateExercise),
      workout: targetRoutine.workout.map(updateExercise),
      stretch: targetRoutine.stretch.map(updateExercise),
      updatedAt: new Date().toISOString(),
    };

    // Save updated routine
    await routineDb.put(updatedRoutine);

    return {
      success: true,
      routinesUpdated: [targetRoutine._id],
    };
  } catch (error) {
    console.error('Error applying coaching note:', error);
    return {
      success: false,
      routinesUpdated: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Finds all routines containing a specific exercise
 */
export async function findRoutinesWithExercise(exerciseId: string): Promise<Routine[]> {
  try {
    const result = await routineDb.allDocs({
      include_docs: true,
    });

    const routines = result.rows
      .filter((row) => !row.id.startsWith('_'))
      .map((row) => row.doc as unknown as Routine);

    return routines.filter((routine) => {
      const hasInWarmUp = routine.warmUp.some((ex) => ex.exerciseId === exerciseId);
      const hasInWorkout = routine.workout.some((ex) => ex.exerciseId === exerciseId);
      const hasInStretch = routine.stretch.some((ex) => ex.exerciseId === exerciseId);
      return hasInWarmUp || hasInWorkout || hasInStretch;
    });
  } catch (error) {
    console.error('Error finding routines:', error);
    return [];
  }
}
