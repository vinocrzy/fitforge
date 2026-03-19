// ═══════════════════════════════════════════════════════════════════
// FitForge — RPE Advisor Hook
// PT Feature 2: Analyzes RPE trends and generates load adjustment suggestions
// ═══════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import type { WorkoutSession, CoachingNote } from '@/types';

export interface RpeAdvisorOptions {
  lookbackDays?: number;
  highRpeThreshold?: number;
  lowRpeThreshold?: number;
  highRpeSessions?: number;
  lowRpeSessions?: number;
  weightStepKg?: number;
  repStep?: number;
}

const DEFAULT_OPTIONS: Required<RpeAdvisorOptions> = {
  lookbackDays: 14,
  highRpeThreshold: 9,
  lowRpeThreshold: 6,
  highRpeSessions: 2,
  lowRpeSessions: 3,
  weightStepKg: 2.5,
  repStep: 1,
};

interface ExerciseRpeHistory {
  exerciseId: string;
  sessions: {
    date: string;
    avgRpe: number;
    maxWeight: number;
    avgReps: number;
  }[];
}

/**
 * Analyzes RPE trends from workout history and generates coaching notes
 * for load adjustments (increase or decrease).
 */
export function useRpeAdvisor(
  workouts: WorkoutSession[],
  options: RpeAdvisorOptions = {}
): CoachingNote[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return useMemo(() => {
    const notes: CoachingNote[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - opts.lookbackDays);

    // Filter recent workouts
    const recentWorkouts = workouts.filter((w) => {
      const wDate = new Date(w.completedAt);
      return wDate >= cutoffDate;
    });

    if (recentWorkouts.length === 0) return [];

    // Build per-exercise RPE history (workout phase only)
    const exerciseHistory = new Map<string, ExerciseRpeHistory>();

    for (const workout of recentWorkouts) {
      for (const exercise of workout.workout) {
        const { exerciseId } = exercise;
        const setsWithRpe = exercise.sets.filter((s) => s.rpe !== undefined);

        if (setsWithRpe.length === 0) continue;

        const avgRpe =
          setsWithRpe.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / setsWithRpe.length;
        const maxWeight = Math.max(...exercise.sets.map((s) => s.weightKg ?? 0));
        const avgReps =
          exercise.sets.reduce((sum, s) => sum + (s.actualReps ?? 0), 0) / exercise.sets.length;

        if (!exerciseHistory.has(exerciseId)) {
          exerciseHistory.set(exerciseId, {
            exerciseId,
            sessions: [],
          });
        }

        exerciseHistory.get(exerciseId)!.sessions.push({
          date: workout.completedAt,
          avgRpe,
          maxWeight,
          avgReps,
        });
      }
    }

    // Analyze each exercise for trends
    for (const [exerciseId, history] of exerciseHistory) {
      // Sort by date descending (most recent first)
      history.sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Need minimum sessions for analysis
      if (history.sessions.length < Math.min(opts.highRpeSessions, opts.lowRpeSessions)) {
        continue;
      }

      // Check for high RPE trend (reduce load)
      const recentHighRpeSessions = history.sessions.slice(0, opts.highRpeSessions);
      const avgHighRpe =
        recentHighRpeSessions.reduce((sum, s) => sum + s.avgRpe, 0) / recentHighRpeSessions.length;

      if (avgHighRpe > opts.highRpeThreshold) {
        const lastSession = history.sessions[0];
        const reductionPercent = avgHighRpe >= 9.5 ? 10 : 5;
        const suggestedWeight = lastSession.maxWeight * (1 - reductionPercent / 100);

        notes.push({
          id: `rpe-reduce-${exerciseId}-${Date.now()}`,
          exerciseId,
          type: 'reduce_load',
          message: `High average RPE (${avgHighRpe.toFixed(1)}) detected over last ${opts.highRpeSessions} sessions. Consider reducing load by ${reductionPercent}%.`,
          currentValue: lastSession.maxWeight,
          suggestedValue: Math.round(suggestedWeight * 4) / 4, // Round to 0.25kg
          avgRpe: avgHighRpe,
          createdAt: new Date().toISOString(),
          dismissed: false,
        });
        continue; // Don't check for increase if we're suggesting decrease
      }

      // Check for low RPE trend (increase load)
      if (history.sessions.length >= opts.lowRpeSessions) {
        const recentLowRpeSessions = history.sessions.slice(0, opts.lowRpeSessions);
        const avgLowRpe =
          recentLowRpeSessions.reduce((sum, s) => sum + s.avgRpe, 0) / recentLowRpeSessions.length;

        if (avgLowRpe <= opts.lowRpeThreshold) {
          const lastSession = history.sessions[0];
          const suggestedWeight = lastSession.maxWeight + opts.weightStepKg;
          const suggestedReps = Math.ceil(lastSession.avgReps) + opts.repStep;

          notes.push({
            id: `rpe-increase-${exerciseId}-${Date.now()}`,
            exerciseId,
            type: 'increase_load',
            message: `Low average RPE (${avgLowRpe.toFixed(1)}) over last ${opts.lowRpeSessions} sessions. Ready to progress!`,
            currentValue: lastSession.maxWeight,
            suggestedValue: suggestedWeight,
            suggestedReps,
            avgRpe: avgLowRpe,
            createdAt: new Date().toISOString(),
            dismissed: false,
          });
        }
      }
    }

    return notes;
  }, [workouts, opts]);
}
