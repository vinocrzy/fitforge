// ═══════════════════════════════════════════════════════════════════
// FitForge — Auth Store (Phase 7)
// Manages cloud account credentials + CouchDB URL.
// Credentials are stored in localStorage (via Zustand persist).
//
// SECURITY NOTE: The couchDbUrl stored here already contains the
// user password embedded in the URL (Basic Auth convention used by
// CouchDB's _session endpoint). This is acceptable for a local-first
// PWA where the device is the trust boundary. Never log this value.
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CloudAccount } from '@/types';

export interface AuthState {
  account: CloudAccount | null;
  isAuthenticated: boolean;

  // Actions
  login: (account: CloudAccount) => void;
  logout: () => void;
  updateDisplayName: (name: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      account: null,
      isAuthenticated: false,

      login: (account) =>
        set({
          account,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          account: null,
          isAuthenticated: false,
        }),

      updateDisplayName: (name) =>
        set((state) =>
          state.account
            ? { account: { ...state.account, displayName: name } }
            : {}
        ),
    }),
    {
      name: 'fitforge-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
