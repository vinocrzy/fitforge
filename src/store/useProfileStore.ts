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
  CoachingNote,
  NotificationPreferences,
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
  pendingCoachingNotes: CoachingNote[];
  coachingNoteHistory: CoachingNote[];
  notificationPreferences: NotificationPreferences;

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
  addCoachingNote: (note: CoachingNote) => void;
  dismissCoachingNote: (id: string) => void;
  applyCoachingNote: (id: string, routineId: string) => void;
  updateNotificationPref: (key: keyof NotificationPreferences, value: boolean | number | string) => void;
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
      pendingCoachingNotes: [],
      coachingNoteHistory: [],
      notificationPreferences: {
        enabled: false,
        restDayReminders: true,
        restDayThresholdDays: 2,
        streakAlerts: true,
        streakAlertTime: '18:00',
        deloadPrompts: true,
        coachingNotes: true,
      },

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

      addCoachingNote: (note) =>
        set((state) => {
          // Prevent duplicates - check if note for same exercise + type already exists
          const exists = state.pendingCoachingNotes.some(
            (n) => n.exerciseId === note.exerciseId && n.type === note.type && !n.dismissed
          );
          if (exists) return state;
          return {
            pendingCoachingNotes: [...state.pendingCoachingNotes, note],
          };
        }),

      dismissCoachingNote: (id) =>
        set((state) => {
          const note = state.pendingCoachingNotes.find((n) => n.id === id);
          if (!note) return state;
          return {
            pendingCoachingNotes: state.pendingCoachingNotes.filter((n) => n.id !== id),
            coachingNoteHistory: [
              ...state.coachingNoteHistory,
              { ...note, dismissed: true },
            ],
          };
        }),

      applyCoachingNote: (id, routineId) =>
        set((state) => {
          const note = state.pendingCoachingNotes.find((n) => n.id === id);
          if (!note) return state;
          const appliedNote: CoachingNote = {
            ...note,
            appliedAt: new Date().toISOString(),
            appliedToRoutineId: routineId,
          };
          return {
            pendingCoachingNotes: state.pendingCoachingNotes.filter((n) => n.id !== id),
            coachingNoteHistory: [...state.coachingNoteHistory, appliedNote],
          };
        }),

      updateNotificationPref: (key, value) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            [key]: value,
          },
        })),
    }),
    {
      name: 'fitforge-profile',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
