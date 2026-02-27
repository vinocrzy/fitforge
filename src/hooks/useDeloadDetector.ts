// ═══════════════════════════════════════════════════════════════════
// FitForge — Deload Detector Hook
// Monitors training patterns and suggests deload weeks
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import type { WorkoutSession } from '@/types';
import { detectDeloadSignals, type DeloadSignal } from '@/lib/calculations/analytics';

export interface DeloadRecommendation {
  shouldDeload: boolean;
  signals: DeloadSignal[];
  suggestedDurationDays: number;
  volumeReductionPercent: number;
}

export function useDeloadDetector(
  workouts: WorkoutSession[],
  streakDays: number
): DeloadRecommendation {
  return useMemo(() => {
    const signals = detectDeloadSignals(workouts, streakDays);
    const warningCount = signals.filter((s) => s.severity === 'warning').length;
    const suggestionCount = signals.filter((s) => s.severity === 'suggestion').length;

    // Recommend deload if 2+ warnings or 1 warning + 2 suggestions
    const shouldDeload = warningCount >= 2 || (warningCount >= 1 && suggestionCount >= 2);

    return {
      shouldDeload,
      signals,
      suggestedDurationDays: warningCount >= 2 ? 7 : 5,
      volumeReductionPercent: warningCount >= 2 ? 50 : 30,
    };
  }, [workouts, streakDays]);
}
