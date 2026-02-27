// ═══════════════════════════════════════════════════════════════════
// FitForge — useAutoCount Hook
// Metronome-based rep counting with countdown and haptic feedback
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useReducer, useEffect, useCallback } from 'react';

type Phase = 'idle' | 'countdown' | 'counting' | 'complete';

interface AutoCountState {
  phase: Phase;
  repCount: number;
  countdownValue: number;
}

type AutoCountAction =
  | { type: 'START' }
  | { type: 'TICK_COUNTDOWN' }
  | { type: 'BEGIN_COUNTING' }
  | { type: 'INCREMENT_REP' }
  | { type: 'STOP_EARLY' }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };

function autoCountReducer(
  state: AutoCountState,
  action: AutoCountAction
): AutoCountState {
  switch (action.type) {
    case 'START':
      return { phase: 'countdown', repCount: 0, countdownValue: 3 };
    case 'TICK_COUNTDOWN':
      return { ...state, countdownValue: state.countdownValue - 1 };
    case 'BEGIN_COUNTING':
      return { ...state, phase: 'counting' };
    case 'INCREMENT_REP':
      return { ...state, repCount: state.repCount + 1 };
    case 'STOP_EARLY':
    case 'COMPLETE':
      return { ...state, phase: 'complete' };
    case 'RESET':
      return { phase: 'idle', repCount: 0, countdownValue: 3 };
    default:
      return state;
  }
}

export function useAutoCount(targetReps: number, repDurationMs = 2000) {
  const [state, dispatch] = useReducer(autoCountReducer, {
    phase: 'idle',
    repCount: 0,
    countdownValue: 3,
  });

  // Countdown phase: tick from 3 → 0 → start counting
  useEffect(() => {
    if (state.phase !== 'countdown') return;
    if (state.countdownValue === 0) {
      dispatch({ type: 'BEGIN_COUNTING' });
      return;
    }
    const t = setTimeout(
      () => dispatch({ type: 'TICK_COUNTDOWN' }),
      1000
    );
    return () => clearTimeout(t);
  }, [state.phase, state.countdownValue]);

  // Counting phase: increment rep every repDurationMs
  useEffect(() => {
    if (state.phase !== 'counting') return;

    // Haptic on each rep
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (state.repCount >= targetReps) {
      dispatch({ type: 'COMPLETE' });
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      return;
    }

    const t = setTimeout(
      () => dispatch({ type: 'INCREMENT_REP' }),
      repDurationMs
    );
    return () => clearTimeout(t);
  }, [state.phase, state.repCount, targetReps, repDurationMs]);

  const start = useCallback(() => dispatch({ type: 'START' }), []);
  const stopEarly = useCallback(() => dispatch({ type: 'STOP_EARLY' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, start, stopEarly, reset };
}
