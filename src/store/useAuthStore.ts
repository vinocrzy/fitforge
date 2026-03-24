// ═══════════════════════════════════════════════════════════════════
// FitForge — Auth Store (Phase 7)
// Manages cloud account — app identity (displayName, email) is stored
// separately from CouchDB credentials (couchUsername, couchDbUrl).
//
// SECURITY NOTE: couchDbUrl contains an embedded password in Basic
// Auth format. This is the CouchDB convention. It is acceptable for
// a local-first PWA where the device is the trust boundary.
// Never log or display this value raw.
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
  /** Replace stored CouchDB credentials + URL (after re-test on settings page). */
  updateCouchCredentials: (couchUsername: string, couchDbUrl: string) => void;
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

      updateCouchCredentials: (couchUsername, couchDbUrl) =>
        set((state) =>
          state.account
            ? { account: { ...state.account, couchUsername, couchDbUrl } }
            : {}
        ),
    }),
    {
      name: 'fitforge-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
