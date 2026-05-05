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
      const libraryItems = libResult.rows
        .map(r => r.doc as FoodLibraryItem)
        .filter(Boolean);

      // Load custom items
      const customResult = await nutritionDb.allDocs<FoodItem>({
        startkey: 'food_item_',
        endkey: 'food_item_\uffff',
        include_docs: true,
      });
      const customItems = customResult.rows
        .map(r => r.doc as FoodItem)
        .filter(Boolean);

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
