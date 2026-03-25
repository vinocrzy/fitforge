// ═══════════════════════════════════════════════════════════════════
// FitForge — Sync Manager Hook (Phase 8 — Clerk)
// Orchestrates PouchDB ↔ CouchDB sync lifecycle:
//   - Starts sync when CouchDB is provisioned AND online
//   - Pauses sync on offline, resumes on reconnect
//   - Surfaces SyncStatus and pending RoutineConflicts to the UI
//   - Call once at the AppLayout level
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSyncConfigStore } from '@/store/useSyncConfigStore';
import {
  startSync,
  stopSync,
  getSyncStatus,
} from '@/lib/db/couchSync';
import type { SyncStatus, RoutineConflict } from '@/types';

export function useSyncManager() {
  const { isSignedIn } = useAuth();
  const syncConfig = useSyncConfigStore((s) => s.syncConfig);
  const clearSyncConfig = useSyncConfigStore((s) => s.clearSyncConfig);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus);
  const [conflicts, setConflicts] = useState<RoutineConflict[]>([]);
  const isOnlineRef = useRef<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const handleConflict = useCallback((conflict: RoutineConflict) => {
    setConflicts((prev) => {
      // Deduplicate by doc id — keep the latest detection
      const filtered = prev.filter((c) => c.id !== conflict.id);
      return [...filtered, conflict];
    });
  }, []);

  const dismissConflict = useCallback((id: string) => {
    setConflicts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Boot sync when signed in and CouchDB is provisioned
  useEffect(() => {
    if (!isSignedIn || !syncConfig) {
      stopSync();
      setSyncStatus({ state: 'idle', lastSyncedAt: null, errorMessage: null, pendingChanges: 0 });
      return;
    }

    // Clear sync config if user signed out
    if (!isSignedIn && syncConfig) {
      clearSyncConfig();
      return;
    }

    if (!isOnlineRef.current) {
      setSyncStatus((s) => ({ ...s, state: 'offline' }));
      return;
    }

    startSync({
      onStatusChange: setSyncStatus,
      onConflict: handleConflict,
    });

    return () => stopSync();
  }, [isSignedIn, syncConfig, handleConflict, clearSyncConfig]);

  // Online / offline window events
  useEffect(() => {
    const handleOnline = (): void => {
      isOnlineRef.current = true;
      if (isSignedIn && syncConfig) {
        startSync({
          onStatusChange: setSyncStatus,
          onConflict: handleConflict,
        });
      }
    };

    const handleOffline = (): void => {
      isOnlineRef.current = false;
      stopSync();
      setSyncStatus((s) => ({ ...s, state: 'offline', errorMessage: null }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSignedIn, syncConfig, handleConflict]);

  return { syncStatus, conflicts, dismissConflict };
}
