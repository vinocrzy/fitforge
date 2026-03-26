// ═══════════════════════════════════════════════════════════════════
// FitForge — Connection + Client TanStack Query Hooks
// Client-side data fetching for PT connections via REST API
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TrainerConnection, TrainerProfile, SharedDataSettings } from '@/types';

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

// ─── Active Connection (User-side) ────────────────────────────────

interface ActiveConnectionData {
  connection: TrainerConnection | null;
  trainer: TrainerProfile | null;
}

export function useActiveConnection(): ReturnType<typeof useQuery<ActiveConnectionData>> {
  return useQuery({
    queryKey: ['connection', 'active'],
    queryFn: async () => {
      const res = await apiFetch<ActiveConnectionData>('/api/connections/active');
      return res.data;
    },
    staleTime: 60 * 1000, // 1min cache
  });
}

// ─── List Connections ─────────────────────────────────────────────

interface UseConnectionsOptions {
  role?: 'trainer' | 'client';
  status?: string;
}

export function useConnections(options: UseConnectionsOptions = {}): ReturnType<typeof useQuery<TrainerConnection[]>> {
  const { role, status } = options;
  return useQuery({
    queryKey: ['connections', role ?? '', status ?? ''],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      const qs = params.toString();
      const res = await apiFetch<TrainerConnection[]>(`/api/connections${qs ? `?${qs}` : ''}`);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

// ─── Subscribe to Trainer ─────────────────────────────────────────

export function useSubscribeToTrainer(): ReturnType<typeof useMutation<TrainerConnection, Error, string>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trainerId: string) => {
      const res = await apiFetch<TrainerConnection>('/api/connections', {
        method: 'POST',
        body: JSON.stringify({ trainerId }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

// ─── Respond to Connection Request (Trainer-side) ─────────────────

interface RespondInput {
  connectionId: string;
  action: 'accept' | 'decline';
}

export function useRespondToConnection(): ReturnType<typeof useMutation<TrainerConnection, Error, RespondInput>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ connectionId, action }: RespondInput) => {
      const res = await apiFetch<TrainerConnection>(
        `/api/connections/${encodeURIComponent(connectionId)}/respond`,
        { method: 'PATCH', body: JSON.stringify({ action }) },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
  });
}

// ─── End Connection ───────────────────────────────────────────────

export function useEndConnection(): ReturnType<typeof useMutation<TrainerConnection, Error, string>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiFetch<TrainerConnection>(
        `/api/connections/${encodeURIComponent(connectionId)}/end`,
        { method: 'PATCH' },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
  });
}

// ─── Update Privacy Settings ──────────────────────────────────────

interface UpdatePrivacyInput {
  connectionId: string;
  sharedData: SharedDataSettings;
}

export function useUpdatePrivacy(): ReturnType<typeof useMutation<TrainerConnection, Error, UpdatePrivacyInput>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ connectionId, sharedData }: UpdatePrivacyInput) => {
      // Privacy updates go through a PATCH on the connection
      const res = await apiFetch<TrainerConnection>(
        `/api/connections/${encodeURIComponent(connectionId)}/privacy`,
        { method: 'PATCH', body: JSON.stringify({ sharedData }) },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

// ─── Trainer's Client List ────────────────────────────────────────

interface ClientListItem {
  connectionId: string;
  clientId: string;
  status: string;
  connectedAt: string;
  sharedData: SharedDataSettings;
}

export function useClients(status?: string): ReturnType<typeof useQuery<ClientListItem[]>> {
  return useQuery({
    queryKey: ['clients', status ?? 'active'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const qs = params.toString();
      const res = await apiFetch<ClientListItem[]>(`/api/clients${qs ? `?${qs}` : ''}`);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}
