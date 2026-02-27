// ═══════════════════════════════════════════════════════════════════
// FitForge — Fatigue Warnings Hook
// Analyzes recent workout data to generate fatigue warnings
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo, useState } from 'react';
import type { WorkoutSession, RoutineExerciseConfig } from '@/types';
import {
  averageRecentRpe,
  weeklyVolume,
  rollingBaselineVolume,
} from '@/lib/calculations/analytics';

export interface FatigueWarning {
  type: 'muscle_group' | 'volume' | 'rpe' | 'frequency';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  bodyPart?: string;
}

/**
 * Generate fatigue warnings for a routine about to be started,
 * based on recent workout history.
 */
export function useFatigueWarnings(
  workouts: WorkoutSession[],
  routineExercises: RoutineExerciseConfig[],
  exerciseBodyParts: Map<string, string>
): FatigueWarning[] {
  const [now] = useState(Date.now);
  return useMemo(() => {
    const warnings: FatigueWarning[] = [];
    if (workouts.length < 2) return warnings;

    // 1. Check volume overload
    const wkVol = weeklyVolume(workouts);
    const baseline = rollingBaselineVolume(workouts);
    if (baseline > 0) {
      const ratio = wkVol / baseline;
      if (ratio > 1.3) {
        warnings.push({
          type: 'volume',
          severity: ratio > 1.5 ? 'danger' : 'warning',
          title: 'High Volume Load',
          message: `Weekly volume is ${Math.round((ratio - 1) * 100)}% above your baseline. Consider reducing sets or weight.`,
        });
      }
    }

    // 2. Check recent RPE
    const avgRpe = averageRecentRpe(workouts, 3);
    if (avgRpe > 8.5) {
      warnings.push({
        type: 'rpe',
        severity: 'danger',
        title: 'Very High Intensity',
        message: 'Your recent sessions averaged RPE 8.5+. Your body may need lighter work.',
      });
    } else if (avgRpe > 7.5) {
      warnings.push({
        type: 'rpe',
        severity: 'warning',
        title: 'Elevated Intensity',
        message: 'Recent sessions are high intensity. Watch for signs of fatigue.',
      });
    }

    // 3. Check muscle group overlap (trained same group within 48h)
    const routineBodyParts = new Set<string>();
    for (const ex of routineExercises) {
      const bp = exerciseBodyParts.get(ex.exerciseId);
      if (bp) routineBodyParts.add(bp);
    }

    const hoursThreshold = 48;
    for (const w of workouts) {
      const hoursSince = (now - new Date(w.completedAt).getTime()) / 3600000;
      if (hoursSince > hoursThreshold) break;

      const workedParts = new Set<string>();
      for (const ex of [...(w.workout ?? []), ...(w.warmUp ?? [])]) {
        const bp = exerciseBodyParts.get(ex.exerciseId);
        if (bp) workedParts.add(bp);
      }

      for (const bp of routineBodyParts) {
        if (workedParts.has(bp)) {
          warnings.push({
            type: 'muscle_group',
            severity: 'info',
            title: `${bp.charAt(0).toUpperCase() + bp.slice(1)} Recently Trained`,
            message: `You worked ${bp} within the last ${Math.round(hoursSince)}h. May not be fully recovered.`,
            bodyPart: bp,
          });
        }
      }
    }

    // 4. Check training frequency (>5 sessions in last 7 days)
    const sevenDaysAgo = new Date(now - 7 * 24 * 3600000);
    const recentCount = workouts.filter((w) => new Date(w.completedAt) >= sevenDaysAgo).length;
    if (recentCount >= 6) {
      warnings.push({
        type: 'frequency',
        severity: 'warning',
        title: 'High Training Frequency',
        message: `${recentCount} sessions in the last 7 days. Consider a rest day.`,
      });
    }

    return warnings;
  }, [workouts, routineExercises, exerciseBodyParts, now]);
}
