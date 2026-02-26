// ═══════════════════════════════════════════════════════════════════
// FitForge — Prefetch Routine GIFs (Architecture §2.7)
// Preload GIFs for a given routine into Cache Storage
// ═══════════════════════════════════════════════════════════════════

import type { Routine } from '@/types';

/**
 * Prefetch only the GIFs for exercises in the active routine.
 * Call on the routine detail page when the user lands on it.
 */
export async function prefetchRoutineGifs(routine: Routine): Promise<void> {
  if (!('caches' in window)) return;

  const cache = await caches.open('exercise-gifs');
  const exerciseIds = [
    ...routine.warmUp,
    ...routine.workout,
    ...routine.stretch,
  ].map((ex) => ex.exerciseId);

  const uniqueIds = [...new Set(exerciseIds)];

  await Promise.allSettled(
    uniqueIds.map(async (id) => {
      const url = `/data/gifs/${id}.gif`;
      const cached = await cache.match(url);
      if (!cached) {
        await fetch(url);
      }
    })
  );
}
