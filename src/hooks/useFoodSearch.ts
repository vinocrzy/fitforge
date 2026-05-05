// FitForge — useFoodSearch hook (debounced in-memory food search)

import { useState, useEffect, useCallback } from 'react';
import { useFoodStore } from '@/store/useFoodStore';
import type { FoodLibraryItem, FoodItem } from '@/types';

export function useFoodSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const { search, loadLibrary, isLoading, libraryItems, customItems } = useFoodStore();

  // Load library on first use
  useEffect(() => {
    if (libraryItems.length === 0 && customItems.length === 0) {
      loadLibrary();
    }
  }, [libraryItems.length, customItems.length, loadLibrary]);

  // Debounce query 200 ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const results: Array<FoodLibraryItem | FoodItem> = search(debouncedQuery);

  const handleQuery = useCallback((q: string) => setQuery(q), []);

  return { query, setQuery: handleQuery, results, isLoading };
}
