// FitForge — useFoodSearch hook (debounced in-memory food search)

import { useState, useEffect, useCallback } from 'react';
import { useFoodStore } from '@/store/useFoodStore';
import type { FoodLibraryItem, FoodItem } from '@/types';

export function useFoodSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const search       = useFoodStore(s => s.search);
  const loadLibrary  = useFoodStore(s => s.loadLibrary);
  const isLoading    = useFoodStore(s => s.isLoading);
  const libraryCount = useFoodStore(s => s.libraryItems.length);
  const customCount  = useFoodStore(s => s.customItems.length);

  console.log({loadLibrary});
  console.log({libraryCount, customCount});

  // Load library on first use
  useEffect(() => {
    if (libraryCount === 0 && customCount === 0) {
      loadLibrary();
    }
  }, [libraryCount, customCount, loadLibrary]);

  // Debounce query 200 ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const results: Array<FoodLibraryItem | FoodItem> = search(debouncedQuery);

  const handleQuery = useCallback((q: string) => setQuery(q), []);

  return { query, setQuery: handleQuery, results, isLoading };
}
