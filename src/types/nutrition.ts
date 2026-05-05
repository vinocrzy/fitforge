// FitForge — Nutrition & Diet TypeScript Interfaces

export type GoalPhase = 'cut' | 'maintain' | 'bulk';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type PortionUnit = 'g' | 'ml' | 'oz' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'serving';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type NutritionSuggestionStatus = 'pending' | 'accepted' | 'dismissed';

export interface MacroTargets { calories: number; proteinG: number; carbsG: number; fatG: number; }
export interface PortionSpec { amount: number; unit: PortionUnit; weightG: number; }
export interface PortionDisplay { label: string; weightG: number; }

export interface FoodLibraryItem {
  id: string; name: string; brand?: string; category: string; isCustom: false;
  per100g: MacroTargets; defaultPortion: PortionSpec; alternatePortions?: PortionSpec[]; barcode?: string;
}

export interface FoodItem {
  _id: string; _rev?: string; type: 'food_item'; isCustom: true; name: string; brand?: string; category: string;
  per100g: MacroTargets; defaultPortion: PortionSpec; alternatePortions?: PortionSpec[]; barcode?: string; createdAt: string;
}

export interface DietProfile {
  _id: string; _rev?: string; type: 'diet_profile'; clerkUserId: string;
  sex: 'male' | 'female'; dob: string; heightCm: number; weightKg: number;
  activityLevel: ActivityLevel; goalPhase: GoalPhase; dailyTargets: MacroTargets; createdAt: string; updatedAt: string;
}

export interface WeightLog { _id: string; _rev?: string; type: 'weight_log'; weightKg: number; loggedAt: string; note?: string; }

export interface MealEntry {
  _id: string; _rev?: string; type: 'meal_entry'; date: string; slot: MealSlot; foodId: string;
  isCustomFood: boolean; foodName: string; portionWeightG: number; macros: MacroTargets; loggedAt: string;
}

export interface MealTemplateItem { foodId: string; isCustomFood: boolean; foodName: string; portionWeightG: number; macros: MacroTargets; }
export interface MealTemplate {
  _id: string; _rev?: string; type: 'meal_template'; name: string; slot: MealSlot;
  items: MealTemplateItem[]; totalMacros: MacroTargets; createdAt: string;
}

export interface NutritionSuggestion {
  _id: string; _rev?: string; type: 'nutrition_suggestion'; fromTrainerId: string; toClientId: string;
  message: string; suggestedGoalPhase?: GoalPhase; suggestedDailyCalories?: number;
  status: NutritionSuggestionStatus; createdAt: string; respondedAt?: string;
}

export interface FoodManifestEntry { id: string; hash: string; }
export interface FoodManifest { version: string; count: number; foods: FoodManifestEntry[]; }

export interface DietSetupFormState {
  sex: 'male' | 'female' | ''; dob: string; heightCm: number | ''; weightKg: number | '';
  activityLevel: ActivityLevel | ''; goalPhase: GoalPhase | '';
}

export interface FastingLog {
  _id: string;          // fasting_log_{startedAt ISO}_{shortId}
  _rev?: string;
  type: 'fasting_log';
  startedAt: string;    // ISO8601
  endedAt?: string;     // ISO8601 — undefined while active
  targetHours: number;  // 16 | 18 | 20 | 23
  note?: string;
}

export interface HydrationEntry {
  _id: string;          // hydration_{date}_{loggedAt ISO}_{shortId}
  _rev?: string;
  type: 'hydration_entry';
  date: string;         // YYYY-MM-DD
  amountMl: number;
  loggedAt: string;     // ISO8601
}
