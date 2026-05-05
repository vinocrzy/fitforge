// ═══════════════════════════════════════════════════════════════════
// FitForge — Weekly Nutrition Report Calculations
// ═══════════════════════════════════════════════════════════════════

import type { MacroTargets } from '@/types';

// ─── Types ────────────────────────────────────────────────────────

export interface DayReport {
  date: string;          // YYYY-MM-DD
  dayLabel: string;      // "Mon", "Tue", etc.
  logged: boolean;       // true if any entries exist for this day
  totals: MacroTargets;
  adherence: number;     // 0–100, based on calorie proximity to target
}

export interface WeeklyReport {
  weekStart: string;     // YYYY-MM-DD (Monday)
  weekEnd: string;       // YYYY-MM-DD (Sunday)
  days: DayReport[];     // 7 entries, Mon→Sun
  loggedDays: number;    // count of days with at least one entry
  avgCalories: number;   // average across logged days only
  avgProteinG: number;
  avgCarbsG: number;
  avgFatG: number;
  totalCalories: number; // sum across all 7 days
  adherenceScore: number; // 0–100, average across logged days
  streakDays: number;    // consecutive logged days ending on most recent logged day
}

// ─── Helpers ─────────────────────────────────────────────────────

export function getWeekDates(weekOffset = 0): { weekStart: string; weekEnd: string; dates: string[] } {
  // weekOffset=0 → current week (Mon–Sun), -1 → last week, etc.
  const now = new Date();
  // Day of week: 0=Sun, 1=Mon, ..., 6=Sat
  const dayOfWeek = now.getDay();
  // Monday = day 1; offset from Monday
  const daysFromMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return {
    weekStart: dates[0],
    weekEnd: dates[6],
    dates,
  };
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Calculate adherence for a single day.
 * 100% = exactly at target. Penalises over/under by proximity.
 * Under: score = (actual / target) * 100, capped at 100
 * Over: score = max(0, 100 - ((actual - target) / target) * 100)
 */
export function calcDayAdherence(calories: number, targetCalories: number): number {
  if (targetCalories <= 0) return 0;
  if (calories <= targetCalories) {
    return Math.round((calories / targetCalories) * 100);
  }
  const overage = calories - targetCalories;
  return Math.max(0, Math.round(100 - (overage / targetCalories) * 100));
}

/**
 * Build a full WeeklyReport from raw entry data.
 *
 * @param entriesByDate - map of date → MacroTotals for that date (pre-aggregated)
 * @param targetCalories - user's daily calorie target
 * @param weekOffset - 0 = current week, -1 = previous, etc.
 */
export function buildWeeklyReport(
  entriesByDate: Map<string, MacroTargets>,
  targetCalories: number,
  weekOffset = 0,
): WeeklyReport {
  const { weekStart, weekEnd, dates } = getWeekDates(weekOffset);

  const days: DayReport[] = dates.map((date, i) => {
    const totals = entriesByDate.get(date) ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    const logged = totals.calories > 0;
    return {
      date,
      dayLabel: DAY_LABELS[i],
      logged,
      totals,
      adherence: logged ? calcDayAdherence(totals.calories, targetCalories) : 0,
    };
  });

  const loggedDays = days.filter(d => d.logged);
  const loggedCount = loggedDays.length;

  const totalCalories = days.reduce((s, d) => s + d.totals.calories, 0);
  const avgCalories = loggedCount > 0 ? Math.round(totalCalories / loggedCount) : 0;
  const avgProteinG = loggedCount > 0
    ? Math.round((days.reduce((s, d) => s + d.totals.proteinG, 0) / loggedCount) * 10) / 10
    : 0;
  const avgCarbsG = loggedCount > 0
    ? Math.round((days.reduce((s, d) => s + d.totals.carbsG, 0) / loggedCount) * 10) / 10
    : 0;
  const avgFatG = loggedCount > 0
    ? Math.round((days.reduce((s, d) => s + d.totals.fatG, 0) / loggedCount) * 10) / 10
    : 0;

  const adherenceScore = loggedCount > 0
    ? Math.round(loggedDays.reduce((s, d) => s + d.adherence, 0) / loggedCount)
    : 0;

  // Streak: count consecutive logged days going backwards from the last logged day
  let streakDays = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].logged) streakDays++;
    else break;
  }

  return {
    weekStart,
    weekEnd,
    days,
    loggedDays: loggedCount,
    avgCalories,
    avgProteinG,
    avgCarbsG,
    avgFatG,
    totalCalories,
    adherenceScore,
    streakDays,
  };
}
