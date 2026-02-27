// ═══════════════════════════════════════════════════════════════════
// FitForge — Personal Record Detection
// Compares completed sets against historical bests
// ═══════════════════════════════════════════════════════════════════

import type { PersonalRecord } from '@/types';

interface CompletedSetData {
  exerciseId: string;
  weightKg: number;
  actualReps: number;
}

/**
 * Detect new personal records from completed sets.
 * Checks max weight, max volume (weight × reps), and max reps.
 */
export function detectPRs(
  completedSets: CompletedSetData[],
  existingPRs: Record<string, PersonalRecord>
): PersonalRecord[] {
  const newPRs: PersonalRecord[] = [];
  const now = new Date().toISOString();

  // Group best performance per exercise from this session
  const sessionBests = new Map<string, { maxWeight: number; maxVolume: number; maxReps: number }>();

  completedSets.forEach(({ exerciseId, weightKg, actualReps }) => {
    const volume = weightKg * actualReps;
    const current = sessionBests.get(exerciseId) ?? { maxWeight: 0, maxVolume: 0, maxReps: 0 };

    sessionBests.set(exerciseId, {
      maxWeight: Math.max(current.maxWeight, weightKg),
      maxVolume: Math.max(current.maxVolume, volume),
      maxReps: Math.max(current.maxReps, actualReps),
    });
  });

  sessionBests.forEach((best, exerciseId) => {
    const existing = existingPRs[exerciseId];

    if (!existing || best.maxWeight > (existing.maxWeightKg ?? 0)) {
      newPRs.push({
        exerciseId,
        type: 'weight',
        value: best.maxWeight,
        achievedAt: now,
        maxWeightKg: best.maxWeight,
        maxVolume: existing?.maxVolume,
        maxReps: existing?.maxReps,
      });
    }

    if (!existing || best.maxVolume > (existing.maxVolume ?? 0)) {
      newPRs.push({
        exerciseId,
        type: 'volume',
        value: best.maxVolume,
        achievedAt: now,
        maxWeightKg: existing?.maxWeightKg,
        maxVolume: best.maxVolume,
        maxReps: existing?.maxReps,
      });
    }

    if (!existing || best.maxReps > (existing.maxReps ?? 0)) {
      newPRs.push({
        exerciseId,
        type: 'reps',
        value: best.maxReps,
        achievedAt: now,
        maxWeightKg: existing?.maxWeightKg,
        maxVolume: existing?.maxVolume,
        maxReps: best.maxReps,
      });
    }
  });

  return newPRs;
}
