// ═══════════════════════════════════════════════════════════════════
// FitForge — Client Progress TanStack Query Hooks
// Trainer-side data fetching for client stats via REST API
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useQuery } from '@tanstack/react-query';
import type { ClientProgressSnapshot, WorkoutSession, PersonalRecord } from '@/types';

// ─── API helpers ──────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

async function apiFetch<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json() as ApiResponse<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `Request failed: ${res.status}`);
  }
  return json;
}

// ─── Client Progress Snapshot ─────────────────────────────────────

export function useClientProgress(clientId: string | undefined): ReturnType<typeof useQuery<ClientProgressSnapshot>> {
  return useQuery({
    queryKey: ['client-progress', clientId],
    queryFn: async () => {
      const res = await apiFetch<ClientProgressSnapshot>(
        `/api/clients/${encodeURIComponent(clientId!)}/progress`,
      );
      return res.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2min cache
  });
}

// ─── Client Workout History ───────────────────────────────────────

interface UseClientWorkoutsOptions {
  clientId: string | undefined;
  limit?: number;
  skip?: number;
}

export function useClientWorkouts(options: UseClientWorkoutsOptions): ReturnType<typeof useQuery<WorkoutSession[]>> {
  const { clientId, limit = 20, skip = 0 } = options;
  return useQuery({
    queryKey: ['client-workouts', clientId, limit, skip],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('skip', String(skip));
      const res = await apiFetch<WorkoutSession[]>(
        `/api/clients/${encodeURIComponent(clientId!)}/workouts?${params.toString()}`,
      );
      return res.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Client Personal Records ──────────────────────────────────────

export function useClientPRs(clientId: string | undefined): ReturnType<typeof useQuery<PersonalRecord[]>> {
  return useQuery({
    queryKey: ['client-prs', clientId],
    queryFn: async () => {
      const res = await apiFetch<PersonalRecord[]>(
        `/api/clients/${encodeURIComponent(clientId!)}/prs`,
      );
      return res.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
}
