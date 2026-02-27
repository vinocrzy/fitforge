// ═══════════════════════════════════════════════════════════════════
// FitForge — Energy / Recovery Meter (Business Logic §4.4)
// Composite score 0–100 from time, volume, RPE, and self-report
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate a composite recovery/energy score (0–100).
 *
 * Signals:
 *  - Time since last workout (30%) — peaks at 48h
 *  - Volume load ratio (25%) — 1.0 = baseline, >1 = overloaded
 *  - Recent RPE history (25%) — lower = more recovered
 *  - Manual feel self-report (20%) — 1–5 scale
 */
export function calculateEnergyScore(
  lastWorkoutHoursAgo: number,
  volumeLoadRatio: number,
  avgRecentRpe: number,
  manualFeelScore: number
): number {
  // Time factor: peaks at 48h; degrades below 24h or above 96h
  const timeFactor =
    lastWorkoutHoursAgo < 24
      ? lastWorkoutHoursAgo / 24
      : lastWorkoutHoursAgo < 72
        ? 1.0
        : Math.max(0, 1 - (lastWorkoutHoursAgo - 72) / 48);

  // Volume factor: 1.0 ratio = full; 1.5 = half; ≥2.0 = 0
  const volumeFactor = Math.max(0, 1 - Math.max(0, volumeLoadRatio - 1));

  // RPE factor: RPE 5 = 1.0; RPE 8 = 0.4; RPE 10 = 0.0
  const rpeFactor = Math.max(0, 1 - (avgRecentRpe - 5) / 5);

  // Manual factor: 1 = 0.0; 3 = 0.5; 5 = 1.0
  const manualFactor = (manualFeelScore - 1) / 4;

  const score =
    timeFactor * 0.3 +
    volumeFactor * 0.25 +
    rpeFactor * 0.25 +
    manualFactor * 0.2;

  return Math.round(score * 100);
}

/**
 * Calculate the volume load ratio for the last 7 days vs. rolling baseline.
 */
export function calculateVolumeLoadRatio(
  last7DaysVolume: number,
  rollingBaselineKg: number
): number {
  if (rollingBaselineKg === 0) return 1.0;
  return last7DaysVolume / rollingBaselineKg;
}
