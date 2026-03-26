// ═══════════════════════════════════════════════════════════════════
// FitForge — Trainer Notification TanStack Query Hooks
// Client-side data fetching for trainer notifications via REST API
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TrainerNotification } from '@/types';

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

// ─── List Notifications ───────────────────────────────────────────

export function useTrainerNotifications(limit = 30): ReturnType<typeof useQuery<TrainerNotification[]>> {
  return useQuery({
    queryKey: ['trainer-notifications', limit],
    queryFn: async () => {
      const res = await apiFetch<TrainerNotification[]>(
        `/api/trainer-notifications?limit=${limit}`,
      );
      return res.data;
    },
    staleTime: 30 * 1000, // 30s
  });
}

// ─── Unread Count ─────────────────────────────────────────────────

interface UnreadCount {
  unread: number;
}

export function useUnreadNotificationCount(): ReturnType<typeof useQuery<number>> {
  return useQuery({
    queryKey: ['trainer-notifications', 'unread-count'],
    queryFn: async () => {
      const res = await apiFetch<UnreadCount>(
        '/api/trainer-notifications?countOnly=true',
      );
      return res.data.unread;
    },
    staleTime: 15 * 1000, // 15s — check frequently for badge
  });
}

// ─── Mark Single Read ─────────────────────────────────────────────

export function useMarkNotificationRead(): ReturnType<typeof useMutation<TrainerNotification, Error, string>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await apiFetch<TrainerNotification>(
        `/api/trainer-notifications/${encodeURIComponent(notificationId)}/read`,
        { method: 'PATCH' },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-notifications'] });
    },
  });
}

// ─── Mark All Read ────────────────────────────────────────────────

interface MarkAllResult {
  markedRead: number;
}

export function useMarkAllNotificationsRead(): ReturnType<typeof useMutation<MarkAllResult, Error, void>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch<MarkAllResult>(
        '/api/trainer-notifications/read-all',
        { method: 'POST' },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-notifications'] });
    },
  });
}
