// ═══════════════════════════════════════════════════════════════════
// FitForge — Guest Mode Store
// Tracks whether the user is using the app as a guest (no Clerk auth)
// Persisted to localStorage + cookie for middleware access
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GuestState {
  isGuest: boolean;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
}

function setGuestCookie(value: boolean): void {
  if (typeof document === 'undefined') return;
  if (value) {
    document.cookie = 'fitforge-guest=true; path=/; max-age=31536000; SameSite=Lax';
  } else {
    document.cookie = 'fitforge-guest=; path=/; max-age=0; SameSite=Lax';
  }
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      isGuest: false,
      enableGuestMode: () => {
        setGuestCookie(true);
        set({ isGuest: true });
      },
      disableGuestMode: () => {
        setGuestCookie(false);
        set({ isGuest: false });
      },
    }),
    {
      name: 'fitforge-guest',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
