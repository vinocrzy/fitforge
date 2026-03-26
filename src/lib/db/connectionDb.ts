// ═══════════════════════════════════════════════════════════════════
// FitForge — Connection Database Server Utilities
// CouchDB operations for the shared fitforge_connections database.
// Server-side only — never import in client components.
// ═══════════════════════════════════════════════════════════════════

import { couchFetch } from '@/lib/db/trainerDb';

const CONNECTION_DB = 'fitforge_connections';

export async function ensureConnectionDb(): Promise<void> {
  const res = await couchFetch(`/${CONNECTION_DB}`, { method: 'PUT' });
  if (!res.ok && res.status !== 412) {
    const body = await res.text();
    throw new Error(`Failed to create ${CONNECTION_DB}: ${res.status} ${body}`);
  }

  // Ensure indexes
  await couchFetch(`/${CONNECTION_DB}/_index`, {
    method: 'POST',
    body: JSON.stringify({
      index: { fields: ['type', 'trainerId', 'status'] },
      ddoc: 'connection-trainer-index',
      type: 'json',
    }),
  });

  await couchFetch(`/${CONNECTION_DB}/_index`, {
    method: 'POST',
    body: JSON.stringify({
      index: { fields: ['type', 'clientId', 'status'] },
      ddoc: 'connection-client-index',
      type: 'json',
    }),
  });
}

export async function getConnectionDoc(docId: string): Promise<Record<string, unknown> | null> {
  const res = await couchFetch(`/${CONNECTION_DB}/${encodeURIComponent(docId)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get ${docId}: ${res.status} ${body}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function putConnectionDoc(doc: Record<string, unknown>): Promise<Record<string, unknown>> {
  const docId = doc._id as string;
  const res = await couchFetch(`/${CONNECTION_DB}/${encodeURIComponent(docId)}`, {
    method: 'PUT',
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to put ${docId}: ${res.status} ${body}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export interface ConnectionQueryOptions {
  trainerId?: string;
  clientId?: string;
  status?: string;
  limit?: number;
  skip?: number;
}

export async function listConnections(options: ConnectionQueryOptions = {}): Promise<{
  connections: Record<string, unknown>[];
  total: number;
}> {
  const { limit = 50, skip = 0 } = options;

  const selector: Record<string, unknown> = {
    type: 'trainer_connection',
  };

  if (options.trainerId) selector.trainerId = options.trainerId;
  if (options.clientId) selector.clientId = options.clientId;
  if (options.status) selector.status = options.status;

  const findRes = await couchFetch(`/${CONNECTION_DB}/_find`, {
    method: 'POST',
    body: JSON.stringify({
      selector,
      sort: [{ requestedAt: 'desc' }],
      limit,
      skip,
    }),
  });

  if (!findRes.ok) {
    const body = await findRes.text();
    throw new Error(`Failed to query connections: ${findRes.status} ${body}`);
  }

  const result = await findRes.json() as { docs: Record<string, unknown>[] };

  return {
    connections: result.docs,
    total: result.docs.length,
  };
}

/** Find the user's currently active connection (pending or active) */
export async function findActiveConnection(clientId: string): Promise<Record<string, unknown> | null> {
  const { connections } = await listConnections({
    clientId,
    limit: 50,
  });

  // Return the first pending or active connection
  return connections.find(
    (c) => c.status === 'pending' || c.status === 'active'
  ) ?? null;
}

/** Find active connection between a specific trainer and client */
export async function findConnectionBetween(
  trainerId: string,
  clientId: string,
): Promise<Record<string, unknown> | null> {
  const selector: Record<string, unknown> = {
    type: 'trainer_connection',
    trainerId,
    clientId,
    status: { $in: ['pending', 'active'] },
  };

  const findRes = await couchFetch(`/${CONNECTION_DB}/_find`, {
    method: 'POST',
    body: JSON.stringify({ selector, limit: 1 }),
  });

  if (!findRes.ok) return null;

  const result = await findRes.json() as { docs: Record<string, unknown>[] };
  return result.docs[0] ?? null;
}
