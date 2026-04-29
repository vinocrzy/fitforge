// ═══════════════════════════════════════════════════════════════════
// FitForge — CouchDB Sync Engine (Phase 8 — Clerk + Proxy)
// Bidirectional PouchDB ↔ CouchDB replication via Next.js API proxy.
//   - Browser PouchDB syncs to /api/couch/{dbName}/...
//   - The proxy authenticates via Clerk and forwards to CouchDB
//   - No CouchDB credentials in the browser
//   - Exponential backoff on network errors
//   - Conflict detection and queuing for UI resolution
// ═══════════════════════════════════════════════════════════════════

import PouchDB from 'pouchdb';
import type { SyncStatus, RoutineConflict } from '@/types';

// Databases that sync to CouchDB (exercises are static, never synced)
const SYNCABLE_DBS = [
  'fitforge_custom_exercises',
  'fitforge_routines',
  'fitforge_workouts',
  'fitforge_profile',
  'fitforge_nutrition',
] as const;

type SyncHandle = PouchDB.Replication.Sync<object>;

// ─── Module-level state ─────────────────────────────────────────────
const _handles: Partial<Record<string, SyncHandle>> = {};
let _retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
let _retryCount = 0;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;   // 5 min cap

// Callbacks wired by useSyncManager
let _onStatusChange: ((status: SyncStatus) => void) | null = null;
let _onConflict: ((conflict: RoutineConflict) => void) | null = null;

let _currentStatus: SyncStatus = {
  state: 'idle',
  lastSyncedAt: null,
  errorMessage: null,
  pendingChanges: 0,
};

function emitStatus(patch: Partial<SyncStatus>): void {
  _currentStatus = { ..._currentStatus, ...patch };
  _onStatusChange?.(_currentStatus);
}

// ─── Public API ─────────────────────────────────────────────────────

export interface SyncConfig {
  onStatusChange: (status: SyncStatus) => void;
  onConflict: (conflict: RoutineConflict) => void;
}

/**
 * Build the proxy URL for a given database.
 * PouchDB will talk to /api/couch/{dbName} which the Next.js proxy
 * maps to the correct per-user CouchDB database.
 */
function buildProxyUrl(dbName: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/api/couch/${dbName}`;
}

/**
 * Start continuous bidirectional sync for all syncable databases.
 * Safe to call multiple times — stops existing handles first.
 */
export function startSync(config: SyncConfig): void {
  _onStatusChange = config.onStatusChange;
  _onConflict = config.onConflict;

  // Stop any in-flight sync before reconnecting
  stopSync();

  emitStatus({ state: 'syncing', errorMessage: null });

  for (const dbName of SYNCABLE_DBS) {
    const proxyUrl = buildProxyUrl(dbName);
    const local = new PouchDB(dbName);
    const remote = new PouchDB(proxyUrl, {
      // Clerk session cookies are sent automatically with same-origin fetch
      fetch: (url: string | Request, opts?: RequestInit) => {
        return fetch(url, {
          ...opts,
          credentials: 'same-origin',
        });
      },
    } as PouchDB.Configuration.RemoteDatabaseConfiguration);

    const handle = local.sync(remote, {
      live: true,
      retry: true,
    });

    handle
      .on('change', (info) => {
        const pending = (info.change as { pending?: number }).pending ?? 0;
        emitStatus({ state: 'syncing', pendingChanges: pending });
      })
      .on('paused', () => {
        _retryCount = 0;
        emitStatus({
          state: 'synced',
          lastSyncedAt: new Date().toISOString(),
          pendingChanges: 0,
          errorMessage: null,
        });
      })
      .on('active', () => {
        emitStatus({ state: 'syncing' });
      })
      .on('denied', (err) => {
        console.error('[couchSync] denied:', err);
        emitStatus({ state: 'error', errorMessage: 'Permission denied by server.' });
      })
      .on('error', (err) => {
        console.error('[couchSync] error:', err);
        scheduleRetry(config);
      })
      .on('complete', () => {
        emitStatus({ state: 'idle' });
      });

    _handles[dbName] = handle;
  }

  // Detect conflicts in routines
  detectConflicts(config.onConflict);
}

/**
 * Stop all active sync handles and cancel any pending retry.
 */
export function stopSync(): void {
  if (_retryTimeoutId !== null) {
    clearTimeout(_retryTimeoutId);
    _retryTimeoutId = null;
  }
  for (const dbName of SYNCABLE_DBS) {
    _handles[dbName]?.cancel();
    delete _handles[dbName];
  }
}

/**
 * Get a snapshot of the current sync status (for initial store hydration).
 */
export function getSyncStatus(): SyncStatus {
  return _currentStatus;
}

// ─── Conflict Detection ─────────────────────────────────────────────

async function detectConflicts(
  onConflict: (c: RoutineConflict) => void,
): Promise<void> {
  try {
    const db = new PouchDB('fitforge_routines');
    const result = await db.allDocs({ include_docs: true, conflicts: true });

    for (const row of result.rows) {
      const doc = row.doc as (typeof row.doc & { _conflicts?: string[] });
      if (doc._conflicts && doc._conflicts.length > 0) {
        const proxyUrl = buildProxyUrl('fitforge_routines');
        const remoteDb = new PouchDB(proxyUrl, {
          fetch: (url: string | Request, opts?: RequestInit) =>
            fetch(url, { ...opts, credentials: 'same-origin' }),
        } as PouchDB.Configuration.RemoteDatabaseConfiguration);

        for (const conflictRev of doc._conflicts) {
          try {
            const remoteDoc = await remoteDb.get(doc._id, { rev: conflictRev });
            onConflict({
              id: doc._id,
              local: doc,
              remote: remoteDoc,
              detectedAt: new Date().toISOString(),
            });
          } catch {
            // Conflict rev may have been resolved already
          }
        }
      }
    }
  } catch (err) {
    console.error('[couchSync] conflict detection error:', err);
  }
}

// ─── Conflict Resolution ────────────────────────────────────────────

export async function resolveConflictKeepLocal(conflict: RoutineConflict): Promise<void> {
  const db = new PouchDB('fitforge_routines');
  const doc = conflict.local as PouchDB.Core.ExistingDocument<object> & {
    _conflicts?: string[];
  };

  if (doc._conflicts) {
    for (const rev of doc._conflicts) {
      await db.remove(doc._id, rev);
    }
  }
}

export async function resolveConflictKeepRemote(conflict: RoutineConflict): Promise<void> {
  const db = new PouchDB('fitforge_routines');
  const local = conflict.local as PouchDB.Core.ExistingDocument<object>;
  const remote = conflict.remote as PouchDB.Core.ExistingDocument<object>;

  await db.remove(local._id, local._rev);
  await db.put({ ...remote, _id: local._id, _rev: undefined });
}

// ─── Internals ──────────────────────────────────────────────────────

function scheduleRetry(config: SyncConfig): void {
  if (_retryTimeoutId !== null) return;

  const delayMs = Math.min(
    1000 * Math.pow(2, _retryCount),
    MAX_RETRY_DELAY_MS,
  );
  _retryCount += 1;

  emitStatus({
    state: 'error',
    errorMessage: `Sync error. Retrying in ${Math.round(delayMs / 1000)}s…`,
  });

  _retryTimeoutId = setTimeout(() => {
    _retryTimeoutId = null;
    startSync(config);
  }, delayMs);
}
