// ═══════════════════════════════════════════════════════════════════
// FitForge — Nutrition Calculations
// Mifflin-St Jeor BMR, TDEE, macro targets with protein floor
// ═══════════════════════════════════════════════════════════════════

import type { ActivityLevel, GoalPhase, MacroTargets } from '@/types';

// ─── Constants ───────────────────────────────────────────────────

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

/** Net calorie offset relative to TDEE */
export const GOAL_PHASE_OFFSETS: Record<GoalPhase, number> = {
  cut: -500,
  maintain: 0,
  bulk: 300,
};

export const SAFETY_FLOORS: Record<'male' | 'female', number> = {
  male: 1500,
  female: 1200,
};

export const PROTEIN_FLOOR_GRAMS_PER_KG = 2.2;

// ─── Macro split ratios (P / C / F) per phase ────────────────────

const MACRO_SPLITS: Record<GoalPhase, { proteinPct: number; carbsPct: number; fatPct: number }> = {
  cut:      { proteinPct: 0.35, carbsPct: 0.35, fatPct: 0.30 },
  maintain: { proteinPct: 0.30, carbsPct: 0.40, fatPct: 0.30 },
  bulk:     { proteinPct: 0.25, carbsPct: 0.50, fatPct: 0.25 },
};

// ─── Core Formulas ───────────────────────────────────────────────

/**
 * Mifflin-St Jeor BMR (kcal/day)
 */
export function calculateBMR(
  sex: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  ageYears: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Total Daily Energy Expenditure
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Apply goal-phase offset to TDEE
 */
export function calculateDailyTarget(tdee: number, goalPhase: GoalPhase): number {
  return tdee + GOAL_PHASE_OFFSETS[goalPhase];
}

/**
 * Clamp calculated daily target to sex-specific safety floor
 */
export function applySafetyFloor(calculatedTarget: number, sex: 'male' | 'female'): number {
  return Math.max(calculatedTarget, SAFETY_FLOORS[sex]);
}

/**
 * Break daily calorie target into macros.
 * Protein floor (2.2 g/kg) takes priority; remaining kcal distributed to carbs/fat
 * using the phase split ratios.
 */
export function calculateMacroTargets(
  dailyCalories: number,
  weightKg: number,
  goalPhase: GoalPhase,
): MacroTargets {
  const split = MACRO_SPLITS[goalPhase];

  // Protein floor
  const minProteinG = PROTEIN_FLOOR_GRAMS_PER_KG * weightKg;
  const splitProteinG = (dailyCalories * split.proteinPct) / 4;
  const proteinG = Math.max(minProteinG, splitProteinG);
  const proteinKcal = proteinG * 4;

  // Remaining kcal split between carbs and fat, preserving their ratio
  const remaining = Math.max(0, dailyCalories - proteinKcal);
  const carbsFatTotal = split.carbsPct + split.fatPct;
  const carbsPct = split.carbsPct / carbsFatTotal;
  const fatPct = split.fatPct / carbsFatTotal;

  const carbsG = Math.round((remaining * carbsPct) / 4);
  const fatG = Math.round((remaining * fatPct) / 9);

  return {
    calories: Math.round(dailyCalories),
    proteinG: Math.round(proteinG),
    carbsG,
    fatG,
  };
}

/**
 * Calculate age in whole years from ISO date string (YYYY-MM-DD)
 */
export function calculateAgeFromDob(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Full pipeline: biometric inputs → MacroTargets
 */
export function computeDailyTargets(
  sex: 'male' | 'female',
  dob: string,
  weightKg: number,
  heightCm: number,
  activityLevel: ActivityLevel,
  goalPhase: GoalPhase,
): MacroTargets {
  const age = calculateAgeFromDob(dob);
  const bmr = calculateBMR(sex, weightKg, heightCm, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const rawTarget = calculateDailyTarget(tdee, goalPhase);
  const safeTarget = applySafetyFloor(rawTarget, sex);
  return calculateMacroTargets(safeTarget, weightKg, goalPhase);
}
