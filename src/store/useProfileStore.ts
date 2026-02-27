// ═══════════════════════════════════════════════════════════════════
// FitForge — Zustand Profile Store
// User profile, XP, PRs, unit preference
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ExperienceLevel,
  FitnessGoal,
  PersonalRecord,
} from '@/types';

interface ProfileState {
  weightKg: number;
  unitPreference: 'kg' | 'lbs';
  experienceLevel: ExperienceLevel;
  goals: FitnessGoal[];
  xp: number;
  level: number;
  streakDays: number;
  lastWorkoutDate: string | null;
  prs: Record<string, PersonalRecord>;
  onboardingComplete: boolean;
  manualFeelScore: number;
  lastFeelPromptDate: string | null;
  fatigueThresholdPercent: number;

  // Actions
  setWeight: (kg: number) => void;
  setUnitPreference: (unit: 'kg' | 'lbs') => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setGoals: (goals: FitnessGoal[]) => void;
  addXP: (amount: number) => void;
  updatePR: (exerciseId: string, pr: PersonalRecord) => void;
  completeOnboarding: () => void;
  incrementStreak: () => void;
  setManualFeelScore: (score: number) => void;
  setFatigueThreshold: (percent: number) => void;
}

const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 2900,
  3500, 4200, 5000, 5900, 6900, 8000, 9200, 10500, 12000, 13700,
];

function getLevel(totalXp: number): number {
  const idx = LEVEL_THRESHOLDS.findLastIndex((t) => totalXp >= t);
  return Math.max(1, idx + 1);
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      weightKg: 70,
      unitPreference: 'kg',
      experienceLevel: 'beginner',
      goals: [],
      xp: 0,
      level: 1,
      streakDays: 0,
      lastWorkoutDate: null,
      prs: {},
      onboardingComplete: false,
      manualFeelScore: 3,
      lastFeelPromptDate: null,
      fatigueThresholdPercent: 30,

      setWeight: (kg) => set({ weightKg: kg }),

      setUnitPreference: (unit) => set({ unitPreference: unit }),

      setExperienceLevel: (level) => set({ experienceLevel: level }),

      setGoals: (goals) => set({ goals }),

      addXP: (amount) =>
        set((state) => {
          const newXP = state.xp + amount;
          return { xp: newXP, level: getLevel(newXP) };
        }),

      updatePR: (exerciseId, pr) =>
        set((state) => ({
          prs: { ...state.prs, [exerciseId]: pr },
        })),

      completeOnboarding: () => set({ onboardingComplete: true }),

      incrementStreak: () =>
        set((state) => ({
          streakDays: state.streakDays + 1,
          lastWorkoutDate: new Date().toISOString(),
        })),

      setManualFeelScore: (score) =>
        set({
          manualFeelScore: score,
          lastFeelPromptDate: new Date().toISOString().split('T')[0],
        }),

      setFatigueThreshold: (percent) =>
        set({ fatigueThresholdPercent: percent }),
    }),
    {
      name: 'fitforge-profile',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
