// ═══════════════════════════════════════════════════════════════════
// FitForge — TanStack Query hooks: Weight Logs
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionDb } from '@/lib/db/pouchdb';
import type { WeightLog } from '@/types';

/**
 * Fetch weight logs from the last `limitDays` days (default 90).
 */
export function useWeightLogs(limitDays = 90) {
  return useQuery<WeightLog[]>({
    queryKey: ['weight_logs', limitDays],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - limitDays);
      const startkey = `weight_log_${cutoff.toISOString()}`;
      const endkey = `weight_log_\uffff`;

      const result = await nutritionDb.allDocs<WeightLog>({
        startkey,
        endkey,
        include_docs: true,
      });

      return result.rows
        .map((r) => r.doc as WeightLog)
        .filter(Boolean)
        .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
    },
  });
}

/**
 * Log a new weight entry.
 */
export function useLogWeight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      weightKg,
      note,
    }: {
      weightKg: number;
      note?: string;
    }) => {
      const now = new Date().toISOString();
      const doc: Omit<WeightLog, '_rev'> = {
        _id: `weight_log_${now}`,
        type: 'weight_log',
        weightKg,
        loggedAt: now,
        ...(note ? { note } : {}),
      };
      await nutritionDb.put(doc);
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight_logs'] });
    },
  });
}
