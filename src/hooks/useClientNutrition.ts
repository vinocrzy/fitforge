// FitForge — Trainer hook: read a client's nutrition summary

'use client';

import { useQuery } from '@tanstack/react-query';
import type { DietProfile } from '@/types';

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

export interface ClientNutritionData {
  dietProfile: DietProfile | null;
  last7Days: {
    loggedDays: number;
    avgCalories: number;
    avgProteinG: number;
    avgCarbsG: number;
    avgFatG: number;
  };
}

export function useClientNutrition(clientId: string) {
  return useQuery<ClientNutritionData>({
    queryKey: ['client_nutrition', clientId],
    queryFn: async () => {
      const res = await apiFetch<ClientNutritionData>(
        `/api/clients/${encodeURIComponent(clientId)}/nutrition`,
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(clientId),
  });
}
