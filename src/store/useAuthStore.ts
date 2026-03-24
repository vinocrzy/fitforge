// ═══════════════════════════════════════════════════════════════════
// FitForge — Auth Store (Phase 7 — multi-account)
//
// Supports multiple accounts on the same device (e.g. family members
// each with their own CouchDB user and optional app PIN).
//
// STORAGE LAYOUT (localStorage key "fitforge-auth"):
//   accounts     — CloudAccount[]  all accounts added to this device
//   activeUserId — string | null   userId of the currently active profile
//
// DERIVED FIELDS (kept in sync by every action):
//   account         — CloudAccount | null
//   isAuthenticated — boolean
//
// MIGRATION (v1 → v2):
//   Old format had a single `account` field. Migration moves it into
//   `accounts[]` and generates a stable userId if one was missing.
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CloudAccount } from '@/types';

export interface AuthState {
  /** All accounts added to this device. */
  accounts: CloudAccount[];
  /** userId of the currently active user. null = locked / nobody signed in. */
  activeUserId: string | null;

  // ── Derived shortcuts kept in sync by every action ──────────────
  /** The active user's CloudAccount — null if nobody is signed in. */
  account: CloudAccount | null;
  /** True when an account is active on this device. */
  isAuthenticated: boolean;
  /**
   * Set to true immediately after login() so the restore screen knows
   * this is a fresh login (possibly on a new device). Never persisted.
   * Clear it by calling clearJustLoggedIn().
   */
  justLoggedIn: boolean;

  /**
   * True when the user explicitly chose to skip cloud sync setup.
   * Allows them to use the app in local-only mode without an account.
   * Persisted — cleared automatically when they later call login().
   */
  skippedAuth: boolean;

  // ── Actions ─────────────────────────────────────────────────────
  /**
   * Add (or replace) an account and set it as active.
   * Call this after successful login / registration.
   */
  login: (account: CloudAccount) => void;

  /**
   * Deactivate the current user (lock the device).
   * The account stays in `accounts` so re-login only needs a PIN.
   */
  logout: () => void;

  /**
   * Switch the active profile by userId.
   * Call AFTER PIN has been verified externally (e.g. user-select page).
   */
  setActiveUser: (userId: string) => void;

  /**
   * Permanently remove an account from this device.
   * If it was the active user, they are also signed out.
   */
  removeAccount: (userId: string) => void;

  /** Update the display name of the currently active user. */
  updateDisplayName: (name: string) => void;

  /** Replace CouchDB credentials for the active user (after re-test). */
  updateCouchCredentials: (couchUsername: string, couchDbUrl: string) => void;

  /** Store a new appPinHash for the currently active user. */
  updatePinHash: (hash: string | undefined) => void;

  /** Clear the justLoggedIn flag once the restore screen has acknowledged it. */
  clearJustLoggedIn: () => void;

  /** Mark the user as local-only ("Skip for now"). Cleared on next login(). */
  skipAuth: () => void;
}

// ─── Helper ────────────────────────────────────────────────────────

function deriveActive(
  accounts: CloudAccount[],
  activeUserId: string | null,
): Pick<AuthState, 'account' | 'isAuthenticated'> {
  const account = accounts.find((a) => a.userId === activeUserId) ?? null;
  return { account, isAuthenticated: account !== null };
}

// ─── Store ─────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accounts: [],
      activeUserId: null,
      account: null,
      isAuthenticated: false,
      justLoggedIn: false,
      skippedAuth: false,

      login: (account) =>
        set((state) => {
          // Upsert: replace if userId already in list, else append
          const idx = state.accounts.findIndex((a) => a.userId === account.userId);
          const accounts =
            idx >= 0
              ? state.accounts.map((a, i) => (i === idx ? account : a))
              : [...state.accounts, account];
          return {
            accounts,
            activeUserId: account.userId,
            justLoggedIn: true,
            skippedAuth: false,
            ...deriveActive(accounts, account.userId),
          };
        }),

      logout: () =>
        set((state) => ({
          activeUserId: null,
          ...deriveActive(state.accounts, null),
        })),

      setActiveUser: (userId) =>
        set((state) => {
          if (!state.accounts.find((a) => a.userId === userId)) return {};
          return {
            activeUserId: userId,
            ...deriveActive(state.accounts, userId),
          };
        }),

      removeAccount: (userId) =>
        set((state) => {
          const accounts = state.accounts.filter((a) => a.userId !== userId);
          const activeUserId =
            state.activeUserId === userId ? null : state.activeUserId;
          return { accounts, activeUserId, ...deriveActive(accounts, activeUserId) };
        }),

      updateDisplayName: (name) =>
        set((state) => {
          if (!state.activeUserId) return {};
          const accounts = state.accounts.map((a) =>
            a.userId === state.activeUserId ? { ...a, displayName: name } : a,
          );
          return { accounts, ...deriveActive(accounts, state.activeUserId) };
        }),

      updateCouchCredentials: (couchUsername, couchDbUrl) =>
        set((state) => {
          if (!state.activeUserId) return {};
          const accounts = state.accounts.map((a) =>
            a.userId === state.activeUserId
              ? { ...a, couchUsername, couchDbUrl }
              : a,
          );
          return { accounts, ...deriveActive(accounts, state.activeUserId) };
        }),

      updatePinHash: (hash) =>
        set((state) => {
          if (!state.activeUserId) return {};
          const accounts = state.accounts.map((a) =>
            a.userId === state.activeUserId ? { ...a, appPinHash: hash } : a,
          );
          return { accounts, ...deriveActive(accounts, state.activeUserId) };
        }),

      clearJustLoggedIn: () => set({ justLoggedIn: false }),

      skipAuth: () => set({ skippedAuth: true }),
    }),
    {
      name: 'fitforge-auth',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => ({
        accounts: state.accounts,
        activeUserId: state.activeUserId,
        account: state.account,
        isAuthenticated: state.isAuthenticated,
        skippedAuth: state.skippedAuth,
        // justLoggedIn is intentionally excluded — session-only
      }),
      // Migrate old single-account format (v1) → multi-account accounts[]
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          const old = persistedState as {
            account?: (CloudAccount & { userId?: string }) | null;
            isAuthenticated?: boolean;
          };
          if (old.account) {
            const userId =
              old.account.userId ??
              (typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `uid_${Date.now().toString(36)}`);
            const account: CloudAccount = { ...old.account, userId };
            return {
              accounts: [account],
              activeUserId: userId,
              account,
              isAuthenticated: true,
            };
          }
          return {
            accounts: [],
            activeUserId: null,
            account: null,
            isAuthenticated: false,
          };
        }
        return persistedState as AuthState;
      },
    },
  ),
);
