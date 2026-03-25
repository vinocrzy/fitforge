// ═══════════════════════════════════════════════════════════════════
// FitForge — CouchDB Provisioning API Route (Phase 8 — Clerk + Proxy)
//
// Called after Clerk authentication to ensure per-user CouchDB
// databases exist. Since all sync goes through the proxy, we no
// longer need to create CouchDB users or return credentials.
//
// POST /api/auth/provision-couch
//   → Authenticated via Clerk middleware
//   → Creates per-user CouchDB databases if they don't exist
//   → Returns { clerkUserId, provisionedAt }
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const COUCHDB_ADMIN_URL = process.env.COUCHDB_ADMIN_URL ?? '';

const SYNCABLE_DBS = [
  'fitforge_custom_exercises',
  'fitforge_routines',
  'fitforge_workouts',
  'fitforge_profile',
] as const;

/**
 * Sanitize Clerk userId into a valid CouchDB database name prefix.
 */
function sanitizeUserId(userId: string): string {
  return userId.toLowerCase().replace(/[^a-z0-9_$()+-]/g, '_');
}

/**
 * Parse admin URL — extract credentials for Authorization header.
 */
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

async function couchFetch(
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
      ...options.headers,
    },
  });
}

async function ensureDatabase(dbName: string): Promise<void> {
  const res = await couchFetch(`/${dbName}`, { method: 'PUT' });
  // 412 = already exists — that's fine
  if (!res.ok && res.status !== 412) {
    const body = await res.text();
    throw new Error(
      `Failed to create database ${dbName}: ${res.status} ${body}`,
    );
  }
}

export async function POST(): Promise<NextResponse> {
  if (!COUCHDB_ADMIN_URL) {
    return NextResponse.json(
      { error: 'CouchDB admin URL not configured' },
      { status: 503 },
    );
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const safePrefix = sanitizeUserId(userId);

    // Ensure all per-user databases exist
    const userDatabases = SYNCABLE_DBS.map((db) => `${safePrefix}_${db}`);
    await Promise.all(userDatabases.map(ensureDatabase));

    return NextResponse.json({
      clerkUserId: userId,
      provisionedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[provision-couch] Error:', error);
    return NextResponse.json(
      { error: 'Failed to provision CouchDB databases' },
      { status: 500 },
    );
  }
}
