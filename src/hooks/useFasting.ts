// FitForge — TanStack Query hooks for Intermittent Fasting

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionDb } from '@/lib/db/pouchdb';
import type { FastingLog } from '@/types';

// ─── Read: active fast (no endedAt) ──────────────────────────────

export function useActiveFast() {
  return useQuery<FastingLog | null>({
    queryKey: ['fasting', 'active'],
    queryFn: async () => {
      const result = await nutritionDb.allDocs<FastingLog>({
        startkey: 'fasting_log_',
        endkey: 'fasting_log_\uffff',
        include_docs: true,
        descending: false,
      });
      const all = result.rows.map(r => r.doc as FastingLog).filter(Boolean);
      // Active fast = most recent without endedAt
      const active = all.reverse().find(f => !f.endedAt);
      return active ?? null;
    },
    refetchInterval: 30_000, // Poll every 30s to keep timer live
    staleTime: 10_000,
  });
}

// ─── Read: fasting history ────────────────────────────────────────

export function useFastingHistory(limit = 30) {
  return useQuery<FastingLog[]>({
    queryKey: ['fasting', 'history', limit],
    queryFn: async () => {
      const result = await nutritionDb.allDocs<FastingLog>({
        startkey: 'fasting_log_',
        endkey: 'fasting_log_\uffff',
        include_docs: true,
        descending: true,
        limit,
      });
      return result.rows
        .map(r => r.doc as FastingLog)
        .filter(f => Boolean(f) && Boolean(f.endedAt))
        .slice(0, limit);
    },
    staleTime: 1000 * 60,
  });
}

// ─── Mutation: start a fast ──────────────────────────────────────

export function useStartFast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetHours, note }: { targetHours: number; note?: string }) => {
      const now = new Date().toISOString();
      const shortId = Math.random().toString(36).slice(2, 8);
      const doc: Omit<FastingLog, '_rev'> = {
        _id: `fasting_log_${now}_${shortId}`,
        type: 'fasting_log',
        startedAt: now,
        targetHours,
        ...(note ? { note } : {}),
      };
      return nutritionDb.put(doc);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fasting'] });
    },
  });
}

// ─── Mutation: end (complete) the active fast ───────────────────

export function useEndFast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; rev: string }) => {
      const doc = await nutritionDb.get<FastingLog>(id);
      return nutritionDb.put({ ...doc, endedAt: new Date().toISOString() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fasting'] });
    },
  });
}

// ─── Mutation: cancel active fast (delete) ───────────────────────

export function useCancelFast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rev }: { id: string; rev: string }) => {
      return nutritionDb.remove(id, rev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fasting'] });
    },
  });
}
