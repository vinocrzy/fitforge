// ═══════════════════════════════════════════════════════════════════
// FitForge — Analytics Calculations (Phase 5)
// Volume trends, body part frequency, progressive overload
// ═══════════════════════════════════════════════════════════════════

import type { WorkoutSession, SessionExercise, CompletedSet } from '@/types';

// ─── Volume Calculations ──────────────────────────────────────────

/** Calculate total volume (sets × reps × weight) for a single exercise */
function exerciseVolume(ex: SessionExercise): number {
  return ex.sets.reduce((acc, s) => {
    const reps = s.actualReps ?? s.targetReps ?? 0;
    const weight = s.weightKg ?? 0;
    return acc + reps * weight;
  }, 0);
}

/** Total volume for a workout session (all phases) */
export function sessionVolume(session: WorkoutSession): number {
  const all = [
    ...(session.warmUp ?? []),
    ...(session.workout ?? []),
    ...(session.stretch ?? []),
  ];
  return all.reduce((acc, ex) => acc + exerciseVolume(ex), 0);
}

/** Calculate 7-day rolling volume from workouts */
export function weeklyVolume(workouts: WorkoutSession[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return workouts
    .filter((w) => new Date(w.completedAt) >= cutoff)
    .reduce((acc, w) => acc + sessionVolume(w), 0);
}

/** Calculate 30-day rolling weekly average volume (baseline) */
export function rollingBaselineVolume(workouts: WorkoutSession[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const recent = workouts.filter((w) => new Date(w.completedAt) >= cutoff);
  if (recent.length === 0) return 0;
  const totalVol = recent.reduce((acc, w) => acc + sessionVolume(w), 0);
  // Average weekly: total over 30 days ÷ ~4.3 weeks
  return totalVol / 4.3;
}

/** Average RPE from last N sessions */
export function averageRecentRpe(workouts: WorkoutSession[], n = 3): number {
  const recent = workouts.slice(0, n);
  if (recent.length === 0) return 5;
  const allSets: CompletedSet[] = [];
  for (const w of recent) {
    for (const ex of [...(w.warmUp ?? []), ...(w.workout ?? []), ...(w.stretch ?? [])]) {
      allSets.push(...ex.sets);
    }
  }
  const rpes = allSets.map((s) => s.rpe).filter((r): r is number => r != null && r > 0);
  if (rpes.length === 0) return 5;
  return rpes.reduce((a, b) => a + b, 0) / rpes.length;
}

// ─── Volume Trend (weekly buckets) ────────────────────────────────

export interface VolumeWeek {
  weekLabel: string; // e.g. "Jan 6"
  volume: number;
  sessions: number;
}

/** Group workouts into weekly volume buckets (last N weeks) */
export function volumeTrend(workouts: WorkoutSession[], weeks = 8): VolumeWeek[] {
  const result: VolumeWeek[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);

    const weekWorkouts = workouts.filter((w) => {
      const d = new Date(w.completedAt);
      return d >= weekStart && d < weekEnd;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    result.push({
      weekLabel: `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`,
      volume: weekWorkouts.reduce((acc, w) => acc + sessionVolume(w), 0),
      sessions: weekWorkouts.length,
    });
  }

  return result;
}

// ─── Body Part Frequency ──────────────────────────────────────────

export interface BodyPartFrequency {
  bodyPart: string;
  count: number;
}

/** Count exercise occurrences by body part over given workouts */
export function bodyPartFrequency(
  workouts: WorkoutSession[],
  exerciseMap: Map<string, string> // exerciseId → bodyPart
): BodyPartFrequency[] {
  const counts: Record<string, number> = {};

  for (const w of workouts) {
    for (const ex of [...(w.warmUp ?? []), ...(w.workout ?? []), ...(w.stretch ?? [])]) {
      const bodyPart = exerciseMap.get(ex.exerciseId) ?? 'other';
      counts[bodyPart] = (counts[bodyPart] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([bodyPart, count]) => ({ bodyPart, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Progressive Overload ─────────────────────────────────────────

export interface OverloadTarget {
  exerciseId: string;
  lastWeightKg: number;
  lastReps: number;
  targetWeightKg: number;
  targetReps: number;
  scheme: string;
}

/** Calculate next-session target based on progression scheme */
export function calculateOverloadTarget(
  exerciseId: string,
  lastSets: CompletedSet[],
  scheme: 'linear' | 'double' | 'undulating' | 'none',
  stepKg = 2.5,
  repCeiling = 12
): OverloadTarget | null {
  if (scheme === 'none' || lastSets.length === 0) return null;

  const lastWeight = lastSets[0].weightKg ?? 0;
  const avgReps = lastSets.reduce((a, s) => a + (s.actualReps ?? 0), 0) / lastSets.length;

  switch (scheme) {
    case 'linear': {
      // If hit rep ceiling → increase weight, reset reps
      if (avgReps >= repCeiling) {
        return {
          exerciseId,
          lastWeightKg: lastWeight,
          lastReps: Math.round(avgReps),
          targetWeightKg: lastWeight + stepKg,
          targetReps: Math.max(repCeiling - 4, 6),
          scheme,
        };
      }
      // Otherwise add 1 rep
      return {
        exerciseId,
        lastWeightKg: lastWeight,
        lastReps: Math.round(avgReps),
        targetWeightKg: lastWeight,
        targetReps: Math.round(avgReps) + 1,
        scheme,
      };
    }
    case 'double': {
      // Double progression: increase reps first, then weight
      if (avgReps >= repCeiling) {
        return {
          exerciseId,
          lastWeightKg: lastWeight,
          lastReps: Math.round(avgReps),
          targetWeightKg: lastWeight + stepKg,
          targetReps: Math.max(repCeiling - 4, 6),
          scheme,
        };
      }
      return {
        exerciseId,
        lastWeightKg: lastWeight,
        lastReps: Math.round(avgReps),
        targetWeightKg: lastWeight,
        targetReps: Math.min(Math.round(avgReps) + 2, repCeiling),
        scheme,
      };
    }
    case 'undulating': {
      // Alternate heavy/light weeks
      return {
        exerciseId,
        lastWeightKg: lastWeight,
        lastReps: Math.round(avgReps),
        targetWeightKg: lastWeight + stepKg * 0.5,
        targetReps: Math.round(avgReps),
        scheme,
      };
    }
    default:
      return null;
  }
}

// ─── Deload Detection ─────────────────────────────────────────────

export interface DeloadSignal {
  reason: 'volume_overload' | 'high_rpe' | 'plateau' | 'streak_long';
  severity: 'suggestion' | 'warning';
  message: string;
}

/** Detect if user needs a deload week */
export function detectDeloadSignals(
  workouts: WorkoutSession[],
  streakDays: number
): DeloadSignal[] {
  const signals: DeloadSignal[] = [];

  if (workouts.length < 4) return signals;

  // Check volume overload: weekly volume > 1.5× baseline
  const wkVol = weeklyVolume(workouts);
  const baseline = rollingBaselineVolume(workouts);
  if (baseline > 0 && wkVol / baseline > 1.5) {
    signals.push({
      reason: 'volume_overload',
      severity: 'warning',
      message: 'Volume load is significantly above your baseline. Consider reducing intensity.',
    });
  }

  // Check sustained high RPE (>8 avg over last 3 sessions)
  const avgRpe = averageRecentRpe(workouts, 3);
  if (avgRpe > 8) {
    signals.push({
      reason: 'high_rpe',
      severity: 'warning',
      message: 'Your recent sessions have been very intense (RPE > 8). A lighter week may help recovery.',
    });
  }

  // Check plateau: no PR in last 14 days + consistent training
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentWorkouts = workouts.filter((w) => new Date(w.completedAt) >= twoWeeksAgo);
  const recentPrs = recentWorkouts.flatMap((w) => w.summary?.prsAchieved ?? []);
  if (recentWorkouts.length >= 6 && recentPrs.length === 0) {
    signals.push({
      reason: 'plateau',
      severity: 'suggestion',
      message: 'No new PRs in 2 weeks despite consistent training. A deload might break the plateau.',
    });
  }

  // Check long streak without rest: 14+ consecutive days
  if (streakDays >= 14) {
    signals.push({
      reason: 'streak_long',
      severity: 'suggestion',
      message: `${streakDays}-day streak! Great dedication, but consider scheduling a rest day.`,
    });
  }

  return signals;
}
