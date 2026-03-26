// ═══════════════════════════════════════════════════════════════════
// FitForge — Trainer Database Server Utilities
// CouchDB operations for the shared fitforge_trainers database.
// Server-side only — never import in client components.
// ═══════════════════════════════════════════════════════════════════

const COUCHDB_ADMIN_URL = process.env.COUCHDB_ADMIN_URL ?? '';
const TRAINER_DB = 'fitforge_trainers';

function parseCouchAdminUrl(): { baseUrl: string; authHeader: string } {
  const parsed = new URL(COUCHDB_ADMIN_URL);
  const authHeader = `Basic ${btoa(
    `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`
  )}`;
  const baseUrl = `${parsed.protocol}//${parsed.host}${
    parsed.pathname === '/' ? '' : parsed.pathname
  }`;
  return { baseUrl, authHeader };
}

export async function couchFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const { baseUrl, authHeader } = parseCouchAdminUrl();
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authHeader,
      ...(options.headers as Record<string, string>),
    },
  });
}

export async function ensureTrainerDb(): Promise<void> {
  const res = await couchFetch(`/${TRAINER_DB}`, { method: 'PUT' });
  if (!res.ok && res.status !== 412) {
    const body = await res.text();
    throw new Error(`Failed to create ${TRAINER_DB}: ${res.status} ${body}`);
  }
}

export async function getTrainerDoc(docId: string): Promise<Record<string, unknown> | null> {
  const res = await couchFetch(`/${TRAINER_DB}/${encodeURIComponent(docId)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get ${docId}: ${res.status} ${body}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function putTrainerDoc(doc: Record<string, unknown>): Promise<Record<string, unknown>> {
  const docId = doc._id as string;
  const res = await couchFetch(`/${TRAINER_DB}/${encodeURIComponent(docId)}`, {
    method: 'PUT',
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to put ${docId}: ${res.status} ${body}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export interface TrainerListOptions {
  search?: string;
  specialization?: string;
  limit?: number;
  skip?: number;
}

export async function listTrainers(options: TrainerListOptions = {}): Promise<{
  trainers: Record<string, unknown>[];
  total: number;
}> {
  const { limit = 50, skip = 0 } = options;

  // Build Mango selector
  const selector: Record<string, unknown> = {
    type: 'trainer_profile',
    status: 'active',
  };

  if (options.specialization) {
    selector.specializations = { $elemMatch: { $eq: options.specialization } };
  }

  if (options.search) {
    selector.displayName = { $regex: `(?i)${options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` };
  }

  // Ensure index exists
  await couchFetch(`/${TRAINER_DB}/_index`, {
    method: 'POST',
    body: JSON.stringify({
      index: { fields: ['type', 'status', 'createdAt'] },
      ddoc: 'trainer-index',
      type: 'json',
    }),
  });

  const findRes = await couchFetch(`/${TRAINER_DB}/_find`, {
    method: 'POST',
    body: JSON.stringify({
      selector,
      sort: [{ createdAt: 'desc' }],
      limit,
      skip,
    }),
  });

  if (!findRes.ok) {
    const body = await findRes.text();
    throw new Error(`Failed to query trainers: ${findRes.status} ${body}`);
  }

  const result = await findRes.json() as { docs: Record<string, unknown>[] };

  return {
    trainers: result.docs,
    total: result.docs.length,
  };
}
