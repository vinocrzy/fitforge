// FitForge — Weekly Nutrition Report Hook

import { useQuery } from '@tanstack/react-query';
import { nutritionDb } from '@/lib/db/pouchdb';
import { buildWeeklyReport, getWeekDates } from '@/lib/calculations/weeklyReport';
import type { MealEntry, MacroTargets } from '@/types';

export function useWeeklyReport(targetCalories: number, weekOffset = 0) {
  const { weekStart, weekEnd } = getWeekDates(weekOffset);

  return useQuery({
    queryKey: ['weekly_report', weekStart, weekEnd, targetCalories],
    queryFn: async () => {
      // Fetch all meal entries in the week range
      const startkey = `meal_entry_${weekStart}`;
      const endkey = `meal_entry_${weekEnd}T23:59:59.999Z\uffff`;

      const result = await nutritionDb.allDocs<MealEntry>({
        startkey,
        endkey,
        include_docs: true,
      });

      const entries = result.rows
        .map(r => r.doc as MealEntry)
        .filter(Boolean);

      // Aggregate macros per date
      const entriesByDate = new Map<string, MacroTargets>();
      for (const entry of entries) {
        const date = entry.date ?? entry.loggedAt?.slice(0, 10);
        if (!date) continue;
        const existing = entriesByDate.get(date) ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
        entriesByDate.set(date, {
          calories: existing.calories + (entry.macros?.calories ?? 0),
          proteinG: existing.proteinG + (entry.macros?.proteinG ?? 0),
          carbsG: existing.carbsG + (entry.macros?.carbsG ?? 0),
          fatG: existing.fatG + (entry.macros?.fatG ?? 0),
        });
      }

      return buildWeeklyReport(entriesByDate, targetCalories, weekOffset);
    },
    staleTime: 1000 * 60 * 5,
    enabled: targetCalories > 0,
  });
}
