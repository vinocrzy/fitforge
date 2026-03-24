// ═══════════════════════════════════════════════════════════════════
// FitForge — Sync Manager Hook (Phase 7)
// Orchestrates PouchDB ↔ CouchDB sync lifecycle:
//   - Starts sync when user is authenticated AND online
//   - Pauses sync on offline, resumes on reconnect
//   - Surfaces SyncStatus and pending RoutineConflicts to the UI
//   - Call once at the AppLayout level
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  startSync,
  stopSync,
  getSyncStatus,
} from '@/lib/db/couchSync';
import type { SyncStatus, RoutineConflict } from '@/types';

export function useSyncManager() {
  const { account, isAuthenticated } = useAuthStore();
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

  // Boot sync when authenticated and online
  useEffect(() => {
    if (!isAuthenticated || !account) {
      stopSync();
      setSyncStatus({ state: 'idle', lastSyncedAt: null, errorMessage: null, pendingChanges: 0 });
      return;
    }

    if (!isOnlineRef.current) {
      setSyncStatus((s) => ({ ...s, state: 'offline' }));
      return;
    }

    startSync({
      couchDbUrl: account.couchDbUrl,
      userId: account.userId,
      onStatusChange: setSyncStatus,
      onConflict: handleConflict,
    });

    return () => stopSync();
  }, [isAuthenticated, account, handleConflict]);

  // Online / offline window events
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      if (isAuthenticated && account) {
        startSync({
          couchDbUrl: account.couchDbUrl,
          userId: account.userId,
          onStatusChange: setSyncStatus,
          onConflict: handleConflict,
        });
      }
    };

    const handleOffline = () => {
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
  }, [isAuthenticated, account, handleConflict]);

  return { syncStatus, conflicts, dismissConflict };
}
