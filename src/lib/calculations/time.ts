// ═══════════════════════════════════════════════════════════════════
// FitForge — Time Estimation & Delta Tracking
// Pre and post-workout time calculations
// ═══════════════════════════════════════════════════════════════════

import type { Routine, RoutineExerciseConfig } from '@/types';

const AVG_REP_DURATION_SEC = 3;

/**
 * Estimate time for a single phase.
 */
function estimatePhaseTime(items: RoutineExerciseConfig[]): number {
  return items.reduce((total, ex) => {
    const activePerSet = ex.holdSec
      ? ex.holdSec
      : (ex.targetReps ?? 0) * AVG_REP_DURATION_SEC;
    return total + ex.sets * (activePerSet + ex.restTimeSec);
  }, 0);
}

/**
 * Estimate total routine time across all three phases.
 */
export function estimateRoutineTime(routine: Routine): {
  warmUpSec: number;
  workoutSec: number;
  stretchSec: number;
  totalSec: number;
} {
  const warmUpSec = estimatePhaseTime(routine.warmUp);
  const workoutSec = estimatePhaseTime(routine.workout);
  const stretchSec = estimatePhaseTime(routine.stretch);

  // +10% overhead on workout phase only
  const totalSec = warmUpSec + Math.round(workoutSec * 1.1) + stretchSec;

  // Add 20s transition buffer between phases
  return { warmUpSec, workoutSec, stretchSec, totalSec: totalSec + 40 };
}

/**
 * Calculate time delta between estimated and actual.
 */
export function getTimeDelta(
  estimatedSec: number,
  actualSec: number
): { deltaSeconds: number; label: string } {
  const delta = estimatedSec - actualSec;
  const absDelta = Math.abs(delta);
  const mins = Math.floor(absDelta / 60);
  const secs = absDelta % 60;

  const label =
    delta > 0
      ? `${mins}m ${secs}s faster than estimated`
      : delta < 0
        ? `${mins}m ${secs}s longer than estimated`
        : 'Right on schedule';

  return { deltaSeconds: delta, label };
}

/**
 * Format seconds to m:ss display.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to hh:mm:ss for long sessions.
 */
export function formatTimeLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
