// ═══════════════════════════════════════════════════════════════════
// FitForge — PouchDB Query Hooks via TanStack Query
// Wrappers for querying PouchDB through TanStack Query
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  exerciseDb,
  customExerciseDb,
  routineDb,
  workoutDb,
  profileDb,
} from '@/lib/db/pouchdb';
import type {
  ExerciseDoc,
  CustomExercise,
  Routine,
  WorkoutSession,
  UserProfile,
} from '@/types';

// ─── Exercise Library ─────────────────────────────────────────────

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const result = await exerciseDb.allDocs({ include_docs: true });
      return result.rows
        .filter((row) => !row.id.startsWith('_'))
        .map((row) => row.doc as unknown as ExerciseDoc);
    },
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ['exercise', id],
    queryFn: async () => {
      const doc = await exerciseDb.get(`exercise_${id}`);
      return doc as unknown as ExerciseDoc;
    },
    enabled: !!id,
  });
}

// ─── Custom Exercises ─────────────────────────────────────────────

export function useCustomExercises() {
  return useQuery({
    queryKey: ['customExercises'],
    queryFn: async () => {
      const result = await customExerciseDb.allDocs({ include_docs: true });
      return result.rows
        .filter((row) => !row.id.startsWith('_'))
        .map((row) => row.doc as unknown as CustomExercise);
    },
  });
}

export function useCreateCustomExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exercise: CustomExercise) => {
      return customExerciseDb.put(exercise);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customExercises'] });
    },
  });
}

// ─── Routines ─────────────────────────────────────────────────────

export function useRoutines() {
  return useQuery({
    queryKey: ['routines'],
    queryFn: async () => {
      const result = await routineDb.allDocs({ include_docs: true });
      return result.rows
        .filter((row) => !row.id.startsWith('_'))
        .map((row) => row.doc as unknown as Routine);
    },
  });
}

export function useRoutine(id: string) {
  return useQuery({
    queryKey: ['routine', id],
    queryFn: async () => {
      const doc = await routineDb.get(id);
      return doc as unknown as Routine;
    },
    enabled: !!id,
  });
}

export function useSaveRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (routine: Routine) => {
      return routineDb.put(routine);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (routine: Routine) => {
      return routineDb.remove(routine._id, routine._rev!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

// ─── Workouts ─────────────────────────────────────────────────────

export function useWorkoutHistory() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const result = await workoutDb.allDocs({
        include_docs: true,
        descending: true,
      });
      return result.rows
        .filter((row) => !row.id.startsWith('_'))
        .map((row) => row.doc as unknown as WorkoutSession);
    },
  });
}

/** Workouts within last N days */
export function useRecentWorkouts(days: number) {
  return useQuery({
    queryKey: ['workouts', 'recent', days],
    queryFn: async () => {
      const result = await workoutDb.allDocs({
        include_docs: true,
        descending: true,
      });
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return result.rows
        .filter((row) => !row.id.startsWith('_'))
        .map((row) => row.doc as unknown as WorkoutSession)
        .filter((w) => new Date(w.completedAt) >= cutoff);
    },
  });
}

/** Workouts for a specific month (year, month 0-indexed) */
export function useMonthWorkouts(year: number, month: number) {
  return useQuery({
    queryKey: ['workouts', 'month', year, month],
    queryFn: async () => {
      const result = await workoutDb.allDocs({
        include_docs: true,
      });
      return result.rows
        .filter((row) => !row.id.startsWith('_'))
        .map((row) => row.doc as unknown as WorkoutSession)
        .filter((w) => {
          const d = new Date(w.completedAt);
          return d.getFullYear() === year && d.getMonth() === month;
        });
    },
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: async () => {
      const doc = await workoutDb.get(id);
      return doc as unknown as WorkoutSession;
    },
    enabled: !!id,
  });
}

export function useSaveWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workout: WorkoutSession) => {
      return workoutDb.put(workout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// ─── Profile ──────────────────────────────────────────────────────

export function useUserProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const doc = await profileDb.get('profile_user_001');
        return doc as unknown as UserProfile;
      } catch {
        return null;
      }
    },
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      return profileDb.put(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
