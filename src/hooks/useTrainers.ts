// ═══════════════════════════════════════════════════════════════════
// FitForge — Trainer TanStack Query Hooks
// Client-side data fetching for the PT portal via REST API
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TrainerProfile, TrainerSpecialization } from '@/types';

// ─── API helpers ──────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
  pagination?: { total: number; page: number; pageSize: number; hasMore: boolean };
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    },
  });
  const json = await res.json() as ApiResponse<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `Request failed: ${res.status}`);
  }
  return json;
}

// ─── List Trainers ────────────────────────────────────────────────

interface UseTrainersOptions {
  search?: string;
  specialization?: TrainerSpecialization | null;
}

export function useTrainers(options: UseTrainersOptions = {}): ReturnType<typeof useQuery<TrainerProfile[]>> {
  const { search, specialization } = options;
  return useQuery({
    queryKey: ['trainers', search ?? '', specialization ?? ''],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (specialization) params.set('specialization', specialization);
      params.set('limit', '50');
      const qs = params.toString();
      const res = await apiFetch<TrainerProfile[]>(`/api/trainers${qs ? `?${qs}` : ''}`);
      return res.data;
    },
    staleTime: 2 * 60 * 1000, // 2min cache
  });
}

// ─── Single Trainer ───────────────────────────────────────────────

export function useTrainer(trainerId: string): ReturnType<typeof useQuery<TrainerProfile>> {
  return useQuery({
    queryKey: ['trainer', trainerId],
    queryFn: async () => {
      const res = await apiFetch<TrainerProfile>(`/api/trainers/${encodeURIComponent(trainerId)}`);
      return res.data;
    },
    enabled: !!trainerId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Own Trainer Profile ──────────────────────────────────────────

export function useMyTrainerProfile(): ReturnType<typeof useQuery<TrainerProfile | null>> {
  return useQuery({
    queryKey: ['trainerProfile', 'me'],
    queryFn: async () => {
      try {
        const res = await apiFetch<TrainerProfile>('/api/trainers/me');
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Enroll as Trainer ────────────────────────────────────────────

interface EnrollTrainerInput {
  displayName: string;
  bio: string;
  specializations: TrainerSpecialization[];
  certifications: { name: string; issuedBy: string; year: number }[];
  experienceYears: number;
}

export function useEnrollTrainer(): ReturnType<typeof useMutation<TrainerProfile, Error, EnrollTrainerInput>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EnrollTrainerInput) => {
      const res = await apiFetch<TrainerProfile>('/api/trainers', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['trainerProfile'] });
    },
  });
}

// ─── Update Trainer Profile ───────────────────────────────────────

export function useUpdateTrainer(trainerId: string): ReturnType<typeof useMutation<TrainerProfile, Error, Partial<EnrollTrainerInput & { availability: string }>>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<EnrollTrainerInput & { availability: string }>) => {
      const res = await apiFetch<TrainerProfile>(`/api/trainers/${encodeURIComponent(trainerId)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['trainer', trainerId] });
      queryClient.invalidateQueries({ queryKey: ['trainerProfile'] });
    },
  });
}
