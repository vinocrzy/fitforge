// ═══════════════════════════════════════════════════════════════════
// FitForge — Suggestion Database Server Utilities
// CouchDB operations for the shared fitforge_suggestions database.
// Server-side only — never import in client components.
// ═══════════════════════════════════════════════════════════════════

import { couchFetch } from '@/lib/db/trainerDb';

const SUGGESTION_DB = 'fitforge_suggestions';

export async function ensureSuggestionDb(): Promise<void> {
  const res = await couchFetch(`/${SUGGESTION_DB}`, { method: 'PUT' });
  if (!res.ok && res.status !== 412) {
    const body = await res.text();
    throw new Error(`Failed to create ${SUGGESTION_DB}: ${res.status} ${body}`);
  }

  // Indexes for trainer and client queries
  await couchFetch(`/${SUGGESTION_DB}/_index`, {
    method: 'POST',
    body: JSON.stringify({
      index: { fields: ['type', 'trainerId', 'suggestedAt'] },
      ddoc: 'suggestion-trainer-index',
      type: 'json',
    }),
  });

  await couchFetch(`/${SUGGESTION_DB}/_index`, {
    method: 'POST',
    body: JSON.stringify({
      index: { fields: ['type', 'clientId', 'status', 'suggestedAt'] },
      ddoc: 'suggestion-client-index',
      type: 'json',
    }),
  });
}

export async function getSuggestionDoc(docId: string): Promise<Record<string, unknown> | null> {
  const res = await couchFetch(`/${SUGGESTION_DB}/${encodeURIComponent(docId)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get ${docId}: ${res.status} ${body}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function putSuggestionDoc(doc: Record<string, unknown>): Promise<Record<string, unknown>> {
  const docId = doc._id as string;
  const res = await couchFetch(`/${SUGGESTION_DB}/${encodeURIComponent(docId)}`, {
    method: 'PUT',
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to put ${docId}: ${res.status} ${body}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export interface SuggestionQueryOptions {
  trainerId?: string;
  clientId?: string;
  status?: string;
  limit?: number;
  skip?: number;
}

export async function listSuggestions(options: SuggestionQueryOptions = {}): Promise<{
  suggestions: Record<string, unknown>[];
  total: number;
}> {
  const { limit = 50, skip = 0 } = options;

  const selector: Record<string, unknown> = {
    type: 'routine_suggestion',
  };

  if (options.trainerId) selector.trainerId = options.trainerId;
  if (options.clientId) selector.clientId = options.clientId;
  if (options.status) selector.status = options.status;

  const findRes = await couchFetch(`/${SUGGESTION_DB}/_find`, {
    method: 'POST',
    body: JSON.stringify({
      selector,
      sort: [{ suggestedAt: 'desc' }],
      limit,
      skip,
    }),
  });

  if (!findRes.ok) {
    const body = await findRes.text();
    throw new Error(`Failed to query suggestions: ${findRes.status} ${body}`);
  }

  const result = await findRes.json() as { docs: Record<string, unknown>[] };

  return {
    suggestions: result.docs,
    total: result.docs.length,
  };
}

/** Count pending suggestions for a client */
export async function countPendingSuggestions(clientId: string): Promise<number> {
  const { suggestions } = await listSuggestions({
    clientId,
    status: 'pending',
    limit: 100,
  });
  return suggestions.length;
}
