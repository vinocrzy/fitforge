// ═══════════════════════════════════════════════════════════════════
// FitForge — Suggestion TanStack Query Hooks
// Client-side data fetching for routine suggestions via REST API
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RoutineSuggestion } from '@/types';

// ─── API helpers ──────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
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

// ─── List Suggestions ─────────────────────────────────────────────

interface UseSuggestionsOptions {
  status?: string;
}

export function useSuggestions(options: UseSuggestionsOptions = {}): ReturnType<typeof useQuery<RoutineSuggestion[]>> {
  const { status } = options;
  return useQuery({
    queryKey: ['suggestions', status ?? ''],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const qs = params.toString();
      const res = await apiFetch<RoutineSuggestion[]>(`/api/suggestions${qs ? `?${qs}` : ''}`);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

// ─── Pending Suggestion Count ─────────────────────────────────────

interface PendingCount {
  count: number;
}

export function usePendingSuggestionCount(): ReturnType<typeof useQuery<number>> {
  return useQuery({
    queryKey: ['suggestions', 'pending-count'],
    queryFn: async () => {
      const res = await apiFetch<PendingCount>('/api/suggestions/pending');
      return res.data.count;
    },
    staleTime: 30 * 1000, // 30s — check frequently for badges
  });
}

// ─── Create Suggestion (Trainer-side) ─────────────────────────────

interface CreateSuggestionInput {
  clientId: string;
  routineSnapshot: Record<string, unknown>;
  trainerNote?: string;
}

export function useCreateSuggestion(): ReturnType<typeof useMutation<RoutineSuggestion, Error, CreateSuggestionInput>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSuggestionInput) => {
      const res = await apiFetch<RoutineSuggestion>('/api/suggestions', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

// ─── Respond to Suggestion (User-side) ────────────────────────────

interface RespondSuggestionInput {
  suggestionId: string;
  action: 'accept' | 'decline';
  acceptedRoutineId?: string;
}

export function useRespondToSuggestion(): ReturnType<typeof useMutation<RoutineSuggestion, Error, RespondSuggestionInput>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ suggestionId, action, acceptedRoutineId }: RespondSuggestionInput) => {
      const res = await apiFetch<RoutineSuggestion>(
        `/api/suggestions/${encodeURIComponent(suggestionId)}/respond`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action, acceptedRoutineId }),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}
