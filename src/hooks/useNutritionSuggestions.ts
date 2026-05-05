// FitForge — TanStack Query hooks for NutritionSuggestion (client-side)

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NutritionSuggestion } from '@/types';

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

// ─── List suggestions (role-aware — server decides what to return) ─

export function useNutritionSuggestions(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  return useQuery<NutritionSuggestion[]>({
    queryKey: ['nutrition_suggestions', status],
    queryFn: async () => {
      const res = await apiFetch<NutritionSuggestion[]>(
        `/api/nutrition-suggestions?${params.toString()}`,
      );
      return res.data;
    },
    staleTime: 1000 * 60,
  });
}

// ─── Trainer: send nutrition suggestion ─────────────────────────

export interface SendNutritionSuggestionInput {
  clientId: string;
  message: string;
  suggestedGoalPhase?: 'cut' | 'maintain' | 'bulk';
  suggestedDailyCalories?: number;
}

export function useSendNutritionSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SendNutritionSuggestionInput) => {
      return apiFetch<{ id: string }>('/api/nutrition-suggestions', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition_suggestions'] });
    },
  });
}

// ─── User: respond to a suggestion ──────────────────────────────

export function useRespondNutritionSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: 'accept' | 'dismiss';
    }) => {
      return apiFetch<{ id: string; status: string }>(
        `/api/nutrition-suggestions/${id}/respond`,
        { method: 'PATCH', body: JSON.stringify({ action }) },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition_suggestions'] });
    },
  });
}
