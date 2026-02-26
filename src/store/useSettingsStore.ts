// ═══════════════════════════════════════════════════════════════════
// FitForge — Zustand Settings Store
// App-wide settings and preferences
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  isOnline: boolean;
  hapticEnabled: boolean;
  autoCountEnabled: boolean;
  repDurationMs: number;
  restTimerSound: boolean;

  // Actions
  setOnline: (online: boolean) => void;
  toggleHaptic: () => void;
  toggleAutoCount: () => void;
  setRepDuration: (ms: number) => void;
  toggleRestTimerSound: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isOnline: true,
      hapticEnabled: true,
      autoCountEnabled: false,
      repDurationMs: 2000,
      restTimerSound: true,

      setOnline: (online) => set({ isOnline: online }),
      toggleHaptic: () => set((s) => ({ hapticEnabled: !s.hapticEnabled })),
      toggleAutoCount: () =>
        set((s) => ({ autoCountEnabled: !s.autoCountEnabled })),
      setRepDuration: (ms) => set({ repDurationMs: ms }),
      toggleRestTimerSound: () =>
        set((s) => ({ restTimerSound: !s.restTimerSound })),
    }),
    {
      name: 'fitforge-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hapticEnabled: state.hapticEnabled,
        autoCountEnabled: state.autoCountEnabled,
        repDurationMs: state.repDurationMs,
        restTimerSound: state.restTimerSound,
      }),
    }
  )
);
