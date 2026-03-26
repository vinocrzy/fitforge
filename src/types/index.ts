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
  isDeload?: boolean;
  sourceRoutineId?: string; // For deload routines, reference to original
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
  prsAchieved?: PersonalRecord[];
  avgRpe?: number;
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
  // Phase 5 additions
  manualFeelScore?: number; // 1-5 self-report
  lastFeelPromptDate?: string; // ISO date
  fatigueThresholdPercent?: number; // 0-100 threshold for fatigue warnings
  // Phase 6 additions
  notificationPreferences?: NotificationPreferences;
  coachingNoteHistory?: CoachingNote[]; // Applied/dismissed notes archive
}

// ─── Coaching Notes ───────────────────────────────────────────────

export interface CoachingNote {
  id: string;
  exerciseId: string;
  type: 'reduce_load' | 'increase_load' | 'deload';
  message: string;
  suggestedValue?: number;
  suggestedReps?: number;
  currentValue?: number;
  avgRpe?: number;
  createdAt: string;
  dismissed: boolean;
  appliedAt?: string;
  appliedToRoutineId?: string;
}

// ─── Notification Preferences ─────────────────────────────────────

export interface NotificationPreferences {
  enabled: boolean;
  restDayReminders: boolean;
  restDayThresholdDays: number;
  streakAlerts: boolean;
  streakAlertTime: string; // HH:MM format (24h)
  deloadPrompts: boolean;
  coachingNotes: boolean;
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

// ─── Cloud Sync (Phase 8 — Clerk) ─────────────────────────────────

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: string | null;   // ISO timestamp
  errorMessage: string | null;
  pendingChanges: number;        // Local writes not yet pushed
}

/**
 * CouchDB sync configuration provisioned server-side after Clerk auth.
 * Stored in Zustand (localStorage). No credentials — sync goes through proxy.
 */
export interface CouchSyncConfig {
  /** Clerk userId — used as CouchDB database namespace prefix. */
  clerkUserId: string;
  /** ISO timestamp of when CouchDB databases were provisioned. */
  provisionedAt: string;
}

export interface RoutineConflict {
  id: string;                    // Document _id
  local: unknown;                // Local version (full doc)
  remote: unknown;               // Incoming conflicting version
  detectedAt: string;
}

// ─── Personal Trainer Portal ──────────────────────────────────────

export type TrainerStatus = 'pending' | 'active' | 'suspended';
export type AvailabilityStatus = 'accepting' | 'full' | 'paused';

export type TrainerSpecialization =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'weight_loss'
  | 'bodybuilding'
  | 'powerlifting'
  | 'rehabilitation'
  | 'sports_performance'
  | 'general_fitness';

export interface TrainerCertification {
  name: string;
  issuedBy: string;
  year: number;
}

export interface TrainerProfile {
  _id: string;
  _rev?: string;
  type: 'trainer_profile';
  clerkUserId: string;
  displayName: string;
  bio: string;
  specializations: TrainerSpecialization[];
  certifications: TrainerCertification[];
  experienceYears: number;
  photoUrl?: string;
  status: TrainerStatus;
  availability: AvailabilityStatus;
  clientCount: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── PT ↔ User Connection ─────────────────────────────────────────

export type ConnectionStatus = 'pending' | 'active' | 'declined' | 'ended';

export interface SharedDataSettings {
  workoutHistory: boolean;
  personalRecords: boolean;
  bodyStats: boolean;
  streakData: boolean;
}

export interface TrainerConnection {
  _id: string;
  _rev?: string;
  type: 'trainer_connection';
  trainerId: string;      // Clerk userId of the trainer
  clientId: string;       // Clerk userId of the user
  status: ConnectionStatus;
  requestedAt: string;
  respondedAt?: string;
  endedAt?: string;
  endedBy?: 'trainer' | 'client';
  sharedData: SharedDataSettings;
}

// ─── Routine Suggestions ──────────────────────────────────────────

export type SuggestionStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface RoutineSuggestion {
  _id: string;
  _rev?: string;
  type: 'routine_suggestion';
  trainerId: string;
  clientId: string;
  routineSnapshot: Routine;     // Full routine data (frozen copy)
  trainerNote?: string;         // Guidance from PT (max 1000 chars)
  status: SuggestionStatus;
  suggestedAt: string;
  respondedAt?: string;
  acceptedRoutineId?: string;   // If accepted, the ID of the user's copy
}

// ─── Client Progress Snapshot ─────────────────────────────────────

export interface WorkoutSummaryBrief {
  sessionId: string;
  routineName: string | null;
  completedAt: string;
  durationSec: number;
  totalCalories: number;
  exerciseCount: number;
  avgRpe?: number;
}

export interface ClientProgressSnapshot {
  _id: string;
  _rev?: string;
  type: 'client_progress';
  clientId: string;
  trainerId: string;
  snapshotDate: string;
  recentWorkouts: WorkoutSummaryBrief[];
  weeklyVolume: number;
  monthlyWorkoutCount: number;
  currentStreak: number;
  complianceRate: number;       // 0-1
  prs: PersonalRecord[];
  bodyWeightKg?: number;
  energyScore?: number;
  createdAt: string;
}

