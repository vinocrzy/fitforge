// ═══════════════════════════════════════════════════════════════════
// FitForge — Core TypeScript Interfaces
// All DB document types and shared shapes
// ═══════════════════════════════════════════════════════════════════

// ─── Exercise Library (seeded, read-only) ─────────────────────────

export interface ExerciseRecord {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'strength' | 'cardio' | 'stretching' | 'plyometrics';
}

// PouchDB document wrapper
export interface ExerciseDoc extends ExerciseRecord {
  _id: string;
  _rev?: string;
  type: 'exercise';
}

// ─── Custom Exercises (user-created) ──────────────────────────────

export type SessionPhase = 'warmUp' | 'workout' | 'stretch';

export interface CustomExercise {
  _id: string;
  _rev?: string;
  type: 'custom_exercise';
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'strength' | 'cardio' | 'stretching' | 'plyometrics';
  phaseHint: SessionPhase;
  isCustom: true;
  createdAt: string;
}

// ─── Routine ──────────────────────────────────────────────────────

export type ProgressionScheme = 'none' | 'linear' | 'double' | 'undulating';

export interface RoutineExerciseConfig {
  exerciseId: string;
  isCustom: boolean;
  sets: number;
  targetReps?: number;
  holdSec?: number;
  restTimeSec: number;
  weightKg: number | null;
  progressionScheme?: ProgressionScheme;
  progressionStepKg?: number;
  progressionRepCeiling?: number;
  autoWarmUp?: boolean;
}

export interface Routine {
  _id: string;
  _rev?: string;
  type: 'routine';
  name: string;
  createdAt: string;
  updatedAt?: string;
  unitPreference: 'kg' | 'lbs';
  warmUp: RoutineExerciseConfig[];
  workout: RoutineExerciseConfig[];
  stretch: RoutineExerciseConfig[];
}

// ─── Workout Session (completed log) ──────────────────────────────

export interface CompletedSet {
  setNumber: number;
  targetReps?: number;
  actualReps?: number;
  holdSec?: number;
  weightKg: number | null;
  rpe?: number;
  completedAt: string;
  restTakenSec?: number;
}

export interface SessionExercise {
  exerciseId: string;
  isCustom: boolean;
  sets: CompletedSet[];
}

export interface WorkoutSummary {
  totalCalories: number;
  warmUpCalories: number;
  workoutCalories: number;
  stretchCalories: number;
  totalTimeSec: number;
  intensityScore: number;
  xpEarned: number;
  exerciseCount?: number;
  completionRate?: number;
  streakDay?: number;
}

export interface WorkoutSession {
  _id: string;
  _rev?: string;
  type: 'workout_session';
  routineId: string | null;
  startedAt: string;
  completedAt: string;
  mode: 'structured' | 'freestyle';
  unitPreference: 'kg' | 'lbs';
  warmUp: SessionExercise[];
  workout: SessionExercise[];
  stretch: SessionExercise[];
  summary: WorkoutSummary;
  isDeload?: boolean;
}

// ─── Active Exercise (in-session, Zustand store) ──────────────────

export interface ActiveExercise {
  exerciseId: string;
  isCustom: boolean;
  targetSets: number;
  targetReps?: number;
  holdSec?: number;
  restTimeSec: number;
  weightKg: number | null;
  completedSets: CompletedSet[];
  isComplete: boolean;
}

// ─── User Profile ─────────────────────────────────────────────────

export interface PersonalRecord {
  exerciseId: string;
  type: 'weight' | 'volume' | 'reps';
  value: number;
  achievedAt: string;
  maxWeightKg?: number;
  maxVolume?: number;
  maxReps?: number;
}

export type FitnessGoal =
  | 'muscle_gain'
  | 'cardio'
  | 'athletic'
  | 'flexibility'
  | 'fat_loss'
  | 'maintain';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  _id: string;
  _rev?: string;
  type: 'profile';
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
  createdAt: string;
  updatedAt: string;
  pendingCoachingNotes?: CoachingNote[];
}

// ─── Coaching Notes ───────────────────────────────────────────────

export interface CoachingNote {
  id: string;
  exerciseId: string;
  type: 'reduce_load' | 'increase_load' | 'deload';
  message: string;
  suggestedValue?: number;
  createdAt: string;
  dismissed: boolean;
}

// ─── Exercise Manifest (build-time generated) ─────────────────────

export interface ExerciseManifestEntry {
  id: string;
  hash: string;
}

export interface ExerciseManifest {
  version: string;
  count: number;
  exercises: ExerciseManifestEntry[];
}

// ─── Workout Category ─────────────────────────────────────────────

export type WorkoutCategory =
  | 'strength'
  | 'cardio'
  | 'stretching'
  | 'warmup'
  | 'upper'
  | 'lower'
  | 'core'
  | 'fullbody';
