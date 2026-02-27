// ═══════════════════════════════════════════════════════════════════
// FitForge — XP Calculation (Business Logic §4.5)
// Session XP based on calories, variety, completion, PRs, streaks
// ═══════════════════════════════════════════════════════════════════

import type { PersonalRecord, WorkoutSummary } from '@/types';

/**
 * Calculate XP earned for a workout session.
 *
 * Formula:
 *   0.5 × calories
 * + 10  × exerciseCount
 * + completionRate × 50
 * + PRs × 100
 * + 50  (if ≥ 45 min)
 * + streakDay × 5 (if streak > 1)
 */
export function calculateSessionXP(
  summary: WorkoutSummary,
  prsAchieved: PersonalRecord[]
): number {
  let xp = 0;

  // Base: 0.5 XP per calorie burned
  xp += summary.totalCalories * 0.5;

  // Exercise variety bonus: 10 XP per exercise
  xp += (summary.exerciseCount ?? 0) * 10;

  // Completion bonus: up to 50 XP for full completion
  xp += (summary.completionRate ?? 1) * 50;

  // PR bonus: 100 XP per personal record
  xp += prsAchieved.length * 100;

  // Time bonus: 50 XP for sessions ≥ 45 minutes
  if (summary.totalTimeSec >= 2700) {
    xp += 50;
  }

  // Streak multiplier: 5 XP per streak day (only if streak > 1)
  if ((summary.streakDay ?? 0) > 1) {
    xp += (summary.streakDay ?? 0) * 5;
  }

  return Math.round(xp);
}
