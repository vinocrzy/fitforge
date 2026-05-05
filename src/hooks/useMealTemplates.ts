// FitForge — TanStack Query hooks for MealTemplate CRUD + quick-log

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionDb } from '@/lib/db/pouchdb';
import type { MealTemplate, MealTemplateItem, MealSlot, MacroTargets, MealEntry } from '@/types';

// ─── Read: all templates ─────────────────────────────────────────

export function useMealTemplates() {
  return useQuery<MealTemplate[]>({
    queryKey: ['meal_templates'],
    queryFn: async () => {
      const result = await nutritionDb.allDocs<MealTemplate>({
        startkey: 'meal_template_',
        endkey: 'meal_template_\uffff',
        include_docs: true,
      });
      return result.rows
        .map(r => r.doc as MealTemplate)
        .filter(Boolean)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    staleTime: 1000 * 60,
  });
}

// ─── Mutation: create template ───────────────────────────────────

export interface CreateTemplateInput {
  name: string;
  slot: MealSlot;
  items: MealTemplateItem[];
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, slot, items }: CreateTemplateInput) => {
      const now = new Date().toISOString();
      const shortId = Math.random().toString(36).slice(2, 8);
      const totalMacros: MacroTargets = items.reduce(
        (acc, item) => ({
          calories: acc.calories + item.macros.calories,
          proteinG: acc.proteinG + item.macros.proteinG,
          carbsG: acc.carbsG + item.macros.carbsG,
          fatG: acc.fatG + item.macros.fatG,
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      );
      const doc: Omit<MealTemplate, '_rev'> = {
        _id: `meal_template_${now}_${shortId}`,
        type: 'meal_template',
        name: name.trim(),
        slot,
        items,
        totalMacros,
        createdAt: now,
      };
      return nutritionDb.put(doc);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal_templates'] });
    },
  });
}

// ─── Mutation: delete template ───────────────────────────────────

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rev }: { id: string; rev: string }) => {
      return nutritionDb.remove(id, rev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal_templates'] });
    },
  });
}

// ─── Mutation: quick-log all template items as MealEntries ───────

export interface LogTemplateInput {
  template: MealTemplate;
  date: string;   // YYYY-MM-DD
  slot: MealSlot;
}

export function useLogTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ template, date, slot }: LogTemplateInput) => {
      const now = new Date().toISOString();
      const docs = template.items.map((item, i) => {
        const shortId = Math.random().toString(36).slice(2, 8);
        const entry: Omit<MealEntry, '_rev'> = {
          _id: `meal_entry_${date}T${now.slice(11, 19)}_${shortId}_${i}`,
          type: 'meal_entry',
          date,
          slot,
          foodId: item.foodId,
          isCustomFood: item.isCustomFood,
          foodName: item.foodName,
          portionWeightG: item.portionWeightG,
          macros: item.macros,
          loggedAt: now,
        };
        return entry;
      });
      // Sequential puts to avoid conflicts
      for (const doc of docs) {
        await nutritionDb.put(doc);
      }
      return docs.length;
    },
    onSuccess: (_count, { date }) => {
      qc.invalidateQueries({ queryKey: ['meal_entries', date] });
    },
  });
}
