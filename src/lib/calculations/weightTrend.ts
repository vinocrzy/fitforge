// ═══════════════════════════════════════════════════════════════════
// FitForge — Weight Trend Analysis
// Plateau detection, divergence alert, rolling average
// ═══════════════════════════════════════════════════════════════════

import type { WeightLog } from '@/types';
import type { GoalPhase } from '@/types';

// ─── Types ────────────────────────────────────────────────────────

export interface WeightPoint {
  date: string;      // YYYY-MM-DD
  weightKg: number;
  isNewLow: boolean;
}

export interface RollingAveragePoint {
  date: string;
  avgKg: number;
}

export interface WeightTrendResult {
  points: WeightPoint[];
  rollingAvg: RollingAveragePoint[];
  currentWeight: number | null;
  lowestWeight: number | null;
  isNewLow: boolean;
  divergenceAlert: boolean;       // weight change deviates >0.3 kg/week from predicted
  plateauAlert: boolean;          // stable ≤0.1 kg variance for ≥4 consecutive weeks on deficit
  trendDirection: 'losing' | 'gaining' | 'stable' | 'insufficient_data';
  weeklyChangeKg: number | null;  // positive = gaining, negative = losing
}

// ─── Rolling average (28-day window) ────────────────────────────

export function computeRollingAverage(
  points: WeightPoint[],
  windowDays = 28,
): RollingAveragePoint[] {
  if (points.length < 2) return [];
  return points.map((p, i) => {
    const windowStart = new Date(p.date + 'T12:00:00');
    windowStart.setDate(windowStart.getDate() - windowDays);
    const inWindow = points
      .slice(0, i + 1)
      .filter(q => new Date(q.date + 'T12:00:00') >= windowStart);
    const avg = inWindow.reduce((s, q) => s + q.weightKg, 0) / inWindow.length;
    return { date: p.date, avgKg: Math.round(avg * 10) / 10 };
  });
}

// ─── Main analysis ───────────────────────────────────────────────

export function analyzeWeightTrend(
  logs: WeightLog[],
  goalPhase: GoalPhase,
): WeightTrendResult {
  if (logs.length === 0) {
    return {
      points: [],
      rollingAvg: [],
      currentWeight: null,
      lowestWeight: null,
      isNewLow: false,
      divergenceAlert: false,
      plateauAlert: false,
      trendDirection: 'insufficient_data',
      weeklyChangeKg: null,
    };
  }

  // Sort ascending by loggedAt
  const sorted = [...logs].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const lowestEver = Math.min(...sorted.map(l => l.weightKg));

  const points: WeightPoint[] = sorted.map(l => ({
    date: l.loggedAt.slice(0, 10),
    weightKg: l.weightKg,
    isNewLow: l.weightKg <= lowestEver,
  }));

  const currentWeight = sorted[sorted.length - 1].weightKg;
  const isNewLow = currentWeight <= lowestEver;

  const rollingAvg = computeRollingAverage(points);

  // ── Weekly change ───────────────────────────────────────────────
  let weeklyChangeKg: number | null = null;
  let trendDirection: WeightTrendResult['trendDirection'] = 'insufficient_data';

  if (sorted.length >= 2) {
    const recent = sorted.slice(-7);  // last 7 entries
    if (recent.length >= 2) {
      const first = recent[0].weightKg;
      const last = recent[recent.length - 1].weightKg;
      const daySpan = Math.max(
        1,
        (new Date(recent[recent.length - 1].loggedAt).getTime() -
          new Date(recent[0].loggedAt).getTime()) /
          86400000,
      );
      weeklyChangeKg = Math.round(((last - first) / daySpan) * 7 * 100) / 100;

      if (Math.abs(weeklyChangeKg) < 0.1) trendDirection = 'stable';
      else if (weeklyChangeKg < 0) trendDirection = 'losing';
      else trendDirection = 'gaining';
    }
  }

  // ── Divergence alert ────────────────────────────────────────────
  // Expected rate: cut=-0.5kg/wk, maintain=0, bulk=+0.3kg/wk
  const EXPECTED_RATE: Record<GoalPhase, number> = {
    cut: -0.5,
    maintain: 0,
    bulk: 0.3,
  };
  const expected = EXPECTED_RATE[goalPhase] ?? 0;
  const divergenceAlert =
    weeklyChangeKg !== null &&
    sorted.length >= 7 &&
    Math.abs(weeklyChangeKg - expected) > 0.3;

  // ── Plateau detection ───────────────────────────────────────────
  // Weight stable (≤0.1 kg variance) for ≥4 consecutive weeks on a deficit
  let plateauAlert = false;
  if (goalPhase === 'cut' && sorted.length >= 4) {
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recent4wk = sorted.filter(
      l => new Date(l.loggedAt) >= fourWeeksAgo,
    );
    if (recent4wk.length >= 4) {
      const weights = recent4wk.map(l => l.weightKg);
      const variance = Math.max(...weights) - Math.min(...weights);
      plateauAlert = variance <= 0.1;
    }
  }

  return {
    points,
    rollingAvg,
    currentWeight,
    lowestWeight: lowestEver,
    isNewLow,
    divergenceAlert,
    plateauAlert,
    trendDirection,
    weeklyChangeKg,
  };
}
