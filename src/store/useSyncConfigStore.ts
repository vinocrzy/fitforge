// ═══════════════════════════════════════════════════════════════════
// FitForge — Sync Config Store (Phase 8 — Clerk)
//
// Authentication is handled entirely by Clerk. This store only
// persists the CouchDB sync configuration that is provisioned
// server-side after Clerk login.
//
// STORAGE LAYOUT (localStorage key "fitforge-sync"):
//   syncConfig — CouchSyncConfig | null
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CouchSyncConfig } from '@/types';

export interface SyncConfigState {
  /** CouchDB sync config provisioned after Clerk auth. Null if not yet provisioned. */
  syncConfig: CouchSyncConfig | null;

  /** Store the provisioned CouchDB config after successful provisioning. */
  setSyncConfig: (config: CouchSyncConfig) => void;

  /** Clear sync config (e.g. on sign-out). */
  clearSyncConfig: () => void;
}

export const useSyncConfigStore = create<SyncConfigState>()(
  persist(
    (set) => ({
      syncConfig: null,

      setSyncConfig: (config) => set({ syncConfig: config }),

      clearSyncConfig: () => set({ syncConfig: null }),
    }),
    {
      name: 'fitforge-sync',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
