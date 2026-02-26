// ═══════════════════════════════════════════════════════════════════
// FitForge — Zustand Session Store
// Active workout session state management
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type {
  ActiveExercise,
  CompletedSet,
  Routine,
  SessionPhase,
  WorkoutSummary,
} from '@/types';

interface WorkoutSessionState {
  sessionId: string | null;
  routineId: string | null;
  mode: 'structured' | 'freestyle';

  // Phase tracking
  currentPhase: SessionPhase;
  currentExerciseIndex: number;
  currentSetIndex: number;

  // The three exercise lists
  warmUp: ActiveExercise[];
  workout: ActiveExercise[];
  stretch: ActiveExercise[];

  startedAt: Date | null;
  isPaused: boolean;
  isResting: boolean;
  restEndAt: Date | null;
  isTransitioning: boolean;

  // Actions
  startSession: (routine?: Routine) => void;
  completeSet: (set: CompletedSet) => void;
  startRest: (durationSec: number) => void;
  skipRest: () => void;
  advancePhase: () => void;
  skipPhaseTransition: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => WorkoutSummary;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  routineId: null,
  mode: 'structured' as const,
  currentPhase: 'warmUp' as SessionPhase,
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  warmUp: [] as ActiveExercise[],
  workout: [] as ActiveExercise[],
  stretch: [] as ActiveExercise[],
  startedAt: null as Date | null,
  isPaused: false,
  isResting: false,
  restEndAt: null as Date | null,
  isTransitioning: false,
};

function routineToActiveExercises(
  items: Routine['warmUp'] | Routine['workout'] | Routine['stretch']
): ActiveExercise[] {
  return items.map((item) => ({
    exerciseId: item.exerciseId,
    isCustom: item.isCustom,
    targetSets: item.sets,
    targetReps: item.targetReps,
    holdSec: item.holdSec,
    restTimeSec: item.restTimeSec,
    weightKg: item.weightKg,
    completedSets: [],
    isComplete: false,
  }));
}

export const useSessionStore = create<WorkoutSessionState>((set, get) => ({
  ...initialState,

  startSession: (routine?: Routine) => {
    const sessionId = `workout_${new Date().toISOString()}_${Math.random().toString(36).slice(2, 8)}`;

    if (routine) {
      set({
        ...initialState,
        sessionId,
        routineId: routine._id,
        mode: 'structured',
        warmUp: routineToActiveExercises(routine.warmUp),
        workout: routineToActiveExercises(routine.workout),
        stretch: routineToActiveExercises(routine.stretch),
        startedAt: new Date(),
        currentPhase: routine.warmUp.length > 0 ? 'warmUp' : 'workout',
      });
    } else {
      set({
        ...initialState,
        sessionId,
        mode: 'freestyle',
        startedAt: new Date(),
        currentPhase: 'workout',
      });
    }
  },

  completeSet: (completedSet: CompletedSet) => {
    const state = get();
    const phase = state.currentPhase;
    const exercises = [...state[phase]];
    const exercise = { ...exercises[state.currentExerciseIndex] };

    exercise.completedSets = [...exercise.completedSets, completedSet];

    if (exercise.completedSets.length >= exercise.targetSets) {
      exercise.isComplete = true;
    }

    exercises[state.currentExerciseIndex] = exercise;

    const updates: Partial<WorkoutSessionState> = {
      [phase]: exercises,
    };

    // Auto-advance set index
    if (exercise.isComplete) {
      // Move to next exercise
      if (state.currentExerciseIndex < exercises.length - 1) {
        updates.currentExerciseIndex = state.currentExerciseIndex + 1;
        updates.currentSetIndex = 0;
      }
    } else {
      updates.currentSetIndex = state.currentSetIndex + 1;
    }

    set(updates as WorkoutSessionState);
  },

  startRest: (durationSec: number) => {
    set({
      isResting: true,
      restEndAt: new Date(Date.now() + durationSec * 1000),
    });
  },

  skipRest: () => {
    set({ isResting: false, restEndAt: null });
  },

  advancePhase: () => {
    const state = get();
    const phaseOrder: SessionPhase[] = ['warmUp', 'workout', 'stretch'];
    const currentIdx = phaseOrder.indexOf(state.currentPhase);
    const nextPhase = phaseOrder[currentIdx + 1];

    if (nextPhase) {
      set({
        currentPhase: nextPhase,
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        isTransitioning: false,
      });
    }
  },

  skipPhaseTransition: () => {
    set({ isTransitioning: false });
    get().advancePhase();
  },

  pauseSession: () => set({ isPaused: true }),
  resumeSession: () => set({ isPaused: false }),

  endSession: () => {
    const state = get();
    const totalTimeSec = state.startedAt
      ? Math.round((Date.now() - state.startedAt.getTime()) / 1000)
      : 0;

    // Basic summary — real calorie calculation in lib/calculations
    const summary: WorkoutSummary = {
      totalCalories: 0,
      warmUpCalories: 0,
      workoutCalories: 0,
      stretchCalories: 0,
      totalTimeSec,
      intensityScore: 0,
      xpEarned: 0,
    };

    return summary;
  },

  reset: () => set(initialState),
}));
