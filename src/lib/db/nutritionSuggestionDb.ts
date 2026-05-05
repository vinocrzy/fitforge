// ═══════════════════════════════════════════════════════════════════
// FitForge — Nutrition Suggestion Database Server Utilities
// CouchDB operations for fitforge_nutrition_suggestions DB.
// Server-side only — never import in client components.
// ═══════════════════════════════════════════════════════════════════

import { couchFetch } from '@/lib/db/trainerDb';

const NS_DB = 'fitforge_nutrition_suggestions';

export async function ensureNutritionSuggestionDb(): Promise<void> {
  const res = await couchFetch(`/${NS_DB}`, { method: 'PUT' });
  if (!res.ok && res.status !== 412) {
    throw new Error(`Failed to create ${NS_DB}: ${res.status}`);
  }
  // Index for trainer queries
  await couchFetch(`/${NS_DB}/_index`, {
    method: 'POST',
    body: JSON.stringify({
      index: { fields: ['type', 'fromTrainerId', 'createdAt'] },
      ddoc: 'ns-trainer-index',
      type: 'json',
    }),
  });
  // Index for client queries
  await couchFetch(`/${NS_DB}/_index`, {
    method: 'POST',
    body: JSON.stringify({
      index: { fields: ['type', 'toClientId', 'status', 'createdAt'] },
      ddoc: 'ns-client-index',
      type: 'json',
    }),
  });
}

export async function getNutritionSuggestionDoc(
  docId: string,
): Promise<Record<string, unknown> | null> {
  const res = await couchFetch(`/${NS_DB}/${encodeURIComponent(docId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to get ${docId}: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

export async function putNutritionSuggestionDoc(
  doc: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const docId = doc._id as string;
  const res = await couchFetch(`/${NS_DB}/${encodeURIComponent(docId)}`, {
    method: 'PUT',
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error(`Failed to put ${docId}: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

export interface NsQueryOptions {
  trainerId?: string;
  clientId?: string;
  status?: string;
  limit?: number;
  skip?: number;
}

export async function listNutritionSuggestions(options: NsQueryOptions = {}): Promise<{
  suggestions: Record<string, unknown>[];
  total: number;
}> {
  const { limit = 50, skip = 0 } = options;
  const selector: Record<string, unknown> = { type: 'nutrition_suggestion' };
  if (options.trainerId) selector.fromTrainerId = options.trainerId;
  if (options.clientId) selector.toClientId = options.clientId;
  if (options.status) selector.status = options.status;

  const res = await couchFetch(`/${NS_DB}/_find`, {
    method: 'POST',
    body: JSON.stringify({
      selector,
      sort: [{ type: 'desc' }, { createdAt: 'desc' }],
      limit,
      skip,
    }),
  });
  if (!res.ok) throw new Error(`Failed to query ${NS_DB}: ${res.status}`);
  const data = await res.json() as { docs: Record<string, unknown>[]; bookmark?: string };
  return { suggestions: data.docs, total: data.docs.length };
}
