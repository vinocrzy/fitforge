// FitForge — Food Library Store (in-memory search, no persist)

import { create } from 'zustand';
import { nutritionDb } from '@/lib/db/pouchdb';
import type { FoodLibraryItem, FoodItem } from '@/types';

interface FoodStoreState {
  libraryItems: FoodLibraryItem[];
  customItems: FoodItem[];
  isLoading: boolean;
  loadLibrary: () => Promise<void>;
  search: (query: string) => Array<FoodLibraryItem | FoodItem>;
}

export const useFoodStore = create<FoodStoreState>()((set, get) => ({
  libraryItems: [],
  customItems: [],
  isLoading: false,

  loadLibrary: async (): Promise<void> => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      // Load library items (stored with prefix food_F)
      const libResult = await nutritionDb.allDocs<FoodLibraryItem>({
        startkey: 'food_F',
        endkey: 'food_F\uffff',
        include_docs: true,
      });
      // Normalize old flat schema → FoodLibraryItem (handles docs stored before schema migration)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const libraryItems: FoodLibraryItem[] = libResult.rows
        .map(r => r.doc as any)
        .filter(Boolean)
        .map((raw): FoodLibraryItem | null => {
          if (raw.per100g) return raw as FoodLibraryItem;
          if (!raw.caloriesPer100g && raw.caloriesPer100g !== 0) return null;
          return {
            id: raw.id,
            name: raw.name,
            category: raw.category ?? 'Other',
            isCustom: false,
            ...(raw.brand ? { brand: raw.brand } : {}),
            per100g: {
              calories: raw.caloriesPer100g ?? 0,
              proteinG: raw.proteinPer100g  ?? 0,
              carbsG:   raw.carbsPer100g   ?? 0,
              fatG:     raw.fatPer100g     ?? 0,
            },
            defaultPortion: {
              amount:  1,
              unit:    raw.defaultPortion?.unit ?? 'g',
              weightG: raw.defaultPortion?.weightGrams ?? raw.defaultPortion?.weightG ?? 100,
            },
          };
        })
        .filter((doc): doc is FoodLibraryItem => doc !== null);

      // Load custom items
      const customResult = await nutritionDb.allDocs<FoodItem>({
        startkey: 'food_item_',
        endkey: 'food_item_\uffff',
        include_docs: true,
      });
      const customItems: FoodItem[] = customResult.rows
        .map(r => r.doc as FoodItem)
        .filter((doc): doc is FoodItem => Boolean(doc) && doc.per100g !== undefined);

      set({ libraryItems, customItems, isLoading: false });
    } catch (err) {
      console.error('[FoodStore] Failed to load library:', err);
      set({ isLoading: false });
    }
  },

  search: (query: string): Array<FoodLibraryItem | FoodItem> => {
    const { libraryItems, customItems } = get();
    if (!query.trim()) return [...customItems, ...libraryItems].slice(0, 30);
    const q = query.toLowerCase().trim();
    const matchLib = libraryItems.filter(f => f.name.toLowerCase().includes(q));
    const matchCustom = customItems.filter(f => f.name.toLowerCase().includes(q));
    // Custom items first, then library items
    return [...matchCustom, ...matchLib];
  },
}));
