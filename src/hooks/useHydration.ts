// FitForge — TanStack Query hooks for Hydration Tracking

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionDb } from '@/lib/db/pouchdb';
import type { HydrationEntry } from '@/types';

// ─── Read: today's hydration entries ─────────────────────────────

export function useHydrationToday(date: string) {
  return useQuery<HydrationEntry[]>({
    queryKey: ['hydration', date],
    queryFn: async () => {
      const result = await nutritionDb.allDocs<HydrationEntry>({
        startkey: `hydration_${date}`,
        endkey: `hydration_${date}\uffff`,
        include_docs: true,
      });
      return result.rows.map(r => r.doc as HydrationEntry).filter(Boolean);
    },
    staleTime: 1000 * 30,
  });
}

// ─── Computed: total ml for a date ───────────────────────────────

export function useTotalHydrationMl(date: string): { totalMl: number; isLoading: boolean } {
  const { data: entries = [], isLoading } = useHydrationToday(date);
  const totalMl = entries.reduce((sum, e) => sum + e.amountMl, 0);
  return { totalMl, isLoading };
}

// ─── Mutation: log a hydration entry ─────────────────────────────

export function useLogHydration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, amountMl }: { date: string; amountMl: number }) => {
      const now = new Date().toISOString();
      const shortId = Math.random().toString(36).slice(2, 8);
      const doc: Omit<HydrationEntry, '_rev'> = {
        _id: `hydration_${date}_${now}_${shortId}`,
        type: 'hydration_entry',
        date,
        amountMl,
        loggedAt: now,
      };
      return nutritionDb.put(doc);
    },
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: ['hydration', vars.date] });
    },
  });
}

// ─── Mutation: delete a hydration entry ──────────────────────────

export function useDeleteHydration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rev, date }: { id: string; rev: string; date: string }) => {
      await nutritionDb.remove(id, rev);
      return { date };
    },
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: ['hydration', vars.date] });
    },
  });
}
