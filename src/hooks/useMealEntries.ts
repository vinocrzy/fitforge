// FitForge — TanStack Query hooks for MealEntry CRUD

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionDb } from '@/lib/db/pouchdb';
import type { MealEntry, MealSlot, MacroTargets } from '@/types';

// ─── Read: all entries for a given YYYY-MM-DD date ───────────────

export function useMealEntries(date: string) {
  return useQuery<MealEntry[]>({
    queryKey: ['meal_entries', date],
    queryFn: async () => {
      const startkey = `meal_entry_${date}`;
      const endkey = `meal_entry_${date}T23:59:59.999Z\uffff`;
      const result = await nutritionDb.allDocs<MealEntry>({
        startkey,
        endkey,
        include_docs: true,
      });
      return result.rows.map(r => r.doc as MealEntry).filter(Boolean);
    },
    staleTime: 1000 * 30,
  });
}

// ─── Read: entries for a slot on a date ──────────────────────────

export function useSlotEntries(date: string, slot: MealSlot) {
  const { data: all = [], ...rest } = useMealEntries(date);
  return { data: all.filter(e => e.slot === slot), ...rest };
}

// ─── Computed: daily macro totals for a date ─────────────────────

export function useDailyTotals(date: string): {
  totals: MacroTargets;
  isLoading: boolean;
} {
  const { data: entries = [], isLoading } = useMealEntries(date);
  const totals: MacroTargets = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.macros?.calories ?? 0),
      proteinG: acc.proteinG + (e.macros?.proteinG ?? 0),
      carbsG: acc.carbsG + (e.macros?.carbsG ?? 0),
      fatG: acc.fatG + (e.macros?.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  return { totals, isLoading };
}

// ─── Mutation: log a meal entry ───────────────────────────────────

export interface LogMealInput {
  date: string;            // YYYY-MM-DD
  slot: MealSlot;
  foodId: string;
  isCustomFood: boolean;
  foodName: string;
  portionWeightG: number;
  macros: MacroTargets;    // pre-calculated by caller
}

export function useLogMealEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LogMealInput): Promise<MealEntry> => {
      const now = new Date().toISOString();
      const shortId = Math.random().toString(36).slice(2, 8);
      const doc: MealEntry = {
        _id: `meal_entry_${now}_${shortId}`,
        type: 'meal_entry',
        date: input.date,
        slot: input.slot,
        foodId: input.foodId,
        isCustomFood: input.isCustomFood,
        foodName: input.foodName,
        portionWeightG: input.portionWeightG,
        macros: input.macros,
        loggedAt: now,
      };
      await nutritionDb.put(doc);
      return doc;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['meal_entries', vars.date] });
    },
  });
}

// ─── Mutation: delete a meal entry ────────────────────────────────

export function useDeleteMealEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rev, date }: { id: string; rev: string; date: string }) => {
      await nutritionDb.remove(id, rev);
      return { date };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['meal_entries', result.date] });
    },
  });
}
