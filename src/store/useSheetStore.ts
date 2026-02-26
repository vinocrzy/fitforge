// ═══════════════════════════════════════════════════════════════════
// FitForge — Zustand Sheet Store
// iOS 26 sheet-presentation scale-behind control
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

interface SheetState {
  isOpen: boolean;
  activeSheet: string | null;

  openSheet: (id: string) => void;
  closeSheet: () => void;
}

export const useSheetStore = create<SheetState>((set) => ({
  isOpen: false,
  activeSheet: null,

  openSheet: (id: string) => set({ isOpen: true, activeSheet: id }),
  closeSheet: () => set({ isOpen: false, activeSheet: null }),
}));
