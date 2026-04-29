// ═══════════════════════════════════════════════════════════════════
// FitForge — Diet Zustand Store
// Source of truth is PouchDB — no persist middleware here
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { nutritionDb } from '@/lib/db/pouchdb';
import { computeDailyTargets } from '@/lib/calculations/nutrition';
import { useProfileStore } from './useProfileStore';
import type { DietProfile, DietSetupFormState, ActivityLevel, GoalPhase } from '@/types';

// ─── State shape ─────────────────────────────────────────────────

interface DietState {
  dietProfile: DietProfile | null;
  setupForm: DietSetupFormState;
  isLoadingProfile: boolean;
  isSavingProfile: boolean;
  profileError: string | null;

  // Actions
  loadDietProfile: (clerkUserId: string) => Promise<void>;
  saveDietProfile: (clerkUserId: string, form: DietSetupFormState) => Promise<void>;
  updateGoalPhase: (goalPhase: GoalPhase) => Promise<void>;
  setSetupForm: (patch: Partial<DietSetupFormState>) => void;
  clearSetupForm: () => void;
}

// ─── Default form state ──────────────────────────────────────────

const DEFAULT_FORM: DietSetupFormState = {
  sex: '',
  dob: '',
  heightCm: '',
  weightKg: '',
  activityLevel: '',
  goalPhase: '',
};

// ─── Store ───────────────────────────────────────────────────────

export const useDietStore = create<DietState>((set, get) => ({
  dietProfile: null,
  setupForm: DEFAULT_FORM,
  isLoadingProfile: false,
  isSavingProfile: false,
  profileError: null,

  loadDietProfile: async (clerkUserId: string) => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const doc = await nutritionDb.get<DietProfile>(`diet_profile_user_${clerkUserId}`);
      set({ dietProfile: doc, isLoadingProfile: false });
    } catch (err: unknown) {
      const isNotFound =
        err instanceof Error &&
        (err as { status?: number }).status === 404;
      set({
        dietProfile: null,
        isLoadingProfile: false,
        profileError: isNotFound ? null : 'Failed to load diet profile',
      });
    }
  },

  saveDietProfile: async (clerkUserId: string, form: DietSetupFormState) => {
    if (
      !form.sex ||
      !form.dob ||
      form.heightCm === '' ||
      form.weightKg === '' ||
      !form.activityLevel ||
      !form.goalPhase
    ) {
      set({ profileError: 'All fields are required' });
      return;
    }

    set({ isSavingProfile: true, profileError: null });

    try {
      const dailyTargets = computeDailyTargets(
        form.sex,
        form.dob,
        form.weightKg as number,
        form.heightCm as number,
        form.activityLevel as ActivityLevel,
        form.goalPhase as GoalPhase,
      );

      const now = new Date().toISOString();
      const docId = `diet_profile_user_${clerkUserId}`;

      // Fetch existing _rev if present (update vs create)
      let existingRev: string | undefined;
      try {
        const existing = await nutritionDb.get<DietProfile>(docId);
        existingRev = existing._rev;
      } catch {
        /* first save */
      }

      const profile: DietProfile = {
        _id: docId,
        ...(existingRev ? { _rev: existingRev } : {}),
        type: 'diet_profile',
        clerkUserId,
        sex: form.sex,
        dob: form.dob,
        heightCm: form.heightCm as number,
        weightKg: form.weightKg as number,
        activityLevel: form.activityLevel as ActivityLevel,
        goalPhase: form.goalPhase as GoalPhase,
        dailyTargets,
        createdAt: existingRev ? (get().dietProfile?.createdAt ?? now) : now,
        updatedAt: now,
      };

      await nutritionDb.put(profile);
      set({ dietProfile: profile, isSavingProfile: false });
    } catch (err) {
      console.error('[DietStore] saveDietProfile error:', err);
      set({ isSavingProfile: false, profileError: 'Failed to save diet profile' });
    }
  },

  updateGoalPhase: async (goalPhase: GoalPhase) => {
    const current = get().dietProfile;
    if (!current) return;

    set({ isSavingProfile: true, profileError: null });
    try {
      const dailyTargets = computeDailyTargets(
        current.sex,
        current.dob,
        current.weightKg,
        current.heightCm,
        current.activityLevel,
        goalPhase,
      );

      const updated: DietProfile = {
        ...current,
        goalPhase,
        dailyTargets,
        updatedAt: new Date().toISOString(),
      };

      await nutritionDb.put(updated);
      // Fetch the saved doc to get the updated _rev
      const saved = await nutritionDb.get<DietProfile>(updated._id);
      set({ dietProfile: saved, isSavingProfile: false });
    } catch (err) {
      console.error('[DietStore] updateGoalPhase error:', err);
      set({ isSavingProfile: false, profileError: 'Failed to update goal phase' });
    }
  },

  setSetupForm: (patch: Partial<DietSetupFormState>) => {
    set((s) => ({ setupForm: { ...s.setupForm, ...patch } }));
  },

  clearSetupForm: () => {
    const weightKg = useProfileStore.getState().weightKg;
    set({ setupForm: { ...DEFAULT_FORM, weightKg: weightKg || '' } });
  },
}));
