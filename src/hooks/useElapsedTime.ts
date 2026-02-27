// ═══════════════════════════════════════════════════════════════════
// FitForge — useElapsedTime Hook
// Tracks elapsed workout time with pause support
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Returns elapsed seconds since startedAt, pausing when isPaused is true.
 */
export function useElapsedTime(
  startedAt: Date | null,
  isPaused: boolean
): number {
  const [elapsed, setElapsed] = useState(0);
  const pausedElapsedRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startedAt) {
      return;
    }

    if (isPaused) {
      pauseStartRef.current = Date.now();
      return;
    }

    // If resuming from pause, accumulate paused time
    if (pauseStartRef.current) {
      pausedElapsedRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }

    const interval = setInterval(() => {
      const totalPaused = pausedElapsedRef.current;
      const raw = Math.floor(
        (Date.now() - startedAt.getTime() - totalPaused) / 1000
      );
      setElapsed(Math.max(0, raw));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, isPaused]);

  return elapsed;
}
