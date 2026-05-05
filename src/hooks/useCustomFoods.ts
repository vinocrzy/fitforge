// FitForge — useCustomFoods hook

import { useMutation } from '@tanstack/react-query';
import { nutritionDb } from '@/lib/db/pouchdb';
import { useFoodStore } from '@/store/useFoodStore';
import type { FoodItem, MacroTargets, PortionSpec } from '@/types';

export interface CreateCustomFoodInput {
  name: string;
  category: string;
  per100g: MacroTargets;
  defaultPortion: PortionSpec;
  brand?: string;
}

export function useCreateCustomFood() {
  const loadLibrary = useFoodStore(s => s.loadLibrary);

  return useMutation({
    mutationFn: async (input: CreateCustomFoodInput): Promise<FoodItem> => {
      const now = new Date().toISOString();
      const shortId = Math.random().toString(36).slice(2, 8);
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
      const doc: FoodItem = {
        _id: `food_item_${slug}_${shortId}`,
        type: 'food_item',
        isCustom: true,
        name: input.name,
        category: input.category,
        per100g: input.per100g,
        defaultPortion: input.defaultPortion,
        ...(input.brand ? { brand: input.brand } : {}),
        createdAt: now,
      };
      await nutritionDb.put(doc);
      return doc;
    },
    onSuccess: () => {
      // Reload in-memory store so new item is searchable immediately
      loadLibrary();
    },
  });
}
