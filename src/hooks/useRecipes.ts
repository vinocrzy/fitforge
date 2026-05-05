// FitForge — TanStack Query hooks for Recipes

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionDb } from '@/lib/db/pouchdb';
import type { Recipe, RecipeIngredient, MealEntry, MealSlot, MacroTargets } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────

function sumMacros(ingredients: RecipeIngredient[]): MacroTargets {
  return ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.macros.calories,
      proteinG: acc.proteinG + ing.macros.proteinG,
      carbsG: acc.carbsG + ing.macros.carbsG,
      fatG: acc.fatG + ing.macros.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

function divMacros(m: MacroTargets, divisor: number): MacroTargets {
  if (divisor <= 0) return m;
  return {
    calories: Math.round(m.calories / divisor),
    proteinG: Math.round((m.proteinG / divisor) * 10) / 10,
    carbsG: Math.round((m.carbsG / divisor) * 10) / 10,
    fatG: Math.round((m.fatG / divisor) * 10) / 10,
  };
}

// ─── Read: all recipes ───────────────────────────────────────────

export function useRecipes() {
  return useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      const result = await nutritionDb.allDocs<Recipe>({
        startkey: 'recipe_',
        endkey: 'recipe_\uffff',
        include_docs: true,
        descending: false,
      });
      return result.rows
        .map(r => r.doc as Recipe)
        .filter(Boolean)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    staleTime: 1000 * 60,
  });
}

// ─── Read: single recipe ─────────────────────────────────────────

export function useRecipe(id: string) {
  return useQuery<Recipe | null>({
    queryKey: ['recipe', id],
    queryFn: async () => {
      try {
        return await nutritionDb.get<Recipe>(id);
      } catch {
        return null;
      }
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });
}

// ─── Mutation: create recipe ─────────────────────────────────────

export interface CreateRecipeInput {
  name: string;
  description?: string;
  servings: number;
  ingredients: RecipeIngredient[];
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRecipeInput) => {
      const now = new Date().toISOString();
      const shortId = Math.random().toString(36).slice(2, 8);
      const total = sumMacros(input.ingredients);
      const doc: Omit<Recipe, '_rev'> = {
        _id: `recipe_${now}_${shortId}`,
        type: 'recipe',
        name: input.name.trim(),
        description: input.description?.trim(),
        servings: Math.max(1, input.servings),
        ingredients: input.ingredients,
        totalMacros: total,
        perServingMacros: divMacros(total, input.servings),
        createdAt: now,
        updatedAt: now,
      };
      return nutritionDb.put(doc);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

// ─── Mutation: update recipe ─────────────────────────────────────

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recipe: Recipe) => {
      const now = new Date().toISOString();
      const total = sumMacros(recipe.ingredients);
      const updated: Recipe = {
        ...recipe,
        totalMacros: total,
        perServingMacros: divMacros(total, recipe.servings),
        updatedAt: now,
      };
      return nutritionDb.put(updated);
    },
    onSuccess: (_r, recipe) => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['recipe', recipe._id] });
    },
  });
}

// ─── Mutation: delete recipe ─────────────────────────────────────

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rev }: { id: string; rev: string }) => {
      return nutritionDb.remove(id, rev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

// ─── Mutation: log a recipe (N servings) as MealEntries ──────────

export interface LogRecipeInput {
  recipe: Recipe;
  date: string;
  slot: MealSlot;
  servings: number;   // number of servings to log (default 1)
}

export function useLogRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipe, date, slot, servings }: LogRecipeInput) => {
      const now = new Date().toISOString();
      const factor = servings / recipe.servings;

      // Scale each ingredient by serving factor and log as individual entries
      for (let i = 0; i < recipe.ingredients.length; i++) {
        const ing = recipe.ingredients[i];
        const shortId = Math.random().toString(36).slice(2, 8);
        const scaledMacros: MacroTargets = {
          calories: Math.round(ing.macros.calories * factor),
          proteinG: Math.round(ing.macros.proteinG * factor * 10) / 10,
          carbsG: Math.round(ing.macros.carbsG * factor * 10) / 10,
          fatG: Math.round(ing.macros.fatG * factor * 10) / 10,
        };
        const entry: Omit<MealEntry, '_rev'> = {
          _id: `meal_entry_${date}T${now.slice(11, 19)}_${shortId}_${i}`,
          type: 'meal_entry',
          date,
          slot,
          foodId: ing.foodId,
          isCustomFood: ing.isCustomFood,
          foodName: `${recipe.name} — ${ing.foodName}`,
          portionWeightG: Math.round(ing.portionWeightG * factor),
          macros: scaledMacros,
          loggedAt: now,
        };
        await nutritionDb.put(entry);
      }
      return recipe.ingredients.length;
    },
    onSuccess: (_count, { date }) => {
      qc.invalidateQueries({ queryKey: ['meal_entries', date] });
    },
  });
}
