// ═══════════════════════════════════════════════════════════════════
// FitForge — CouchDB Proxy API Route (Phase 8 — Clerk)
//
// Proxies all PouchDB replication requests to CouchDB through the
// Next.js server. This keeps CouchDB admin credentials server-side
// and authenticates users via Clerk session.
//
// Route: /api/couch/[...path]
//   - Clerk middleware ensures the user is authenticated
//   - The first path segment is the local DB name (e.g. fitforge_routines)
//   - Mapped to per-user CouchDB DB: {userId_prefix}_{dbName}
//   - Remaining path segments are forwarded as-is
//
// Supports all HTTP methods PouchDB uses for replication:
//   GET, PUT, POST, DELETE, HEAD
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const COUCHDB_ADMIN_URL = process.env.COUCHDB_ADMIN_URL ?? '';

/** Databases the client is allowed to sync through this proxy. */
const ALLOWED_DBS = new Set([
  'fitforge_custom_exercises',
  'fitforge_routines',
  'fitforge_workouts',
  'fitforge_profile',
]);

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

/**
 * Sanitize Clerk userId into a valid CouchDB database name prefix.
 */
function sanitizeUserId(userId: string): string {
  return userId.toLowerCase().replace(/[^a-z0-9_$()+-]/g, '_');
}

async function proxyToCouchDb(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  if (!COUCHDB_ADMIN_URL) {
    return NextResponse.json(
      { error: 'CouchDB not configured' },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // First segment = local DB name, rest = CouchDB sub-path
  const [dbName, ...rest] = pathSegments;

  if (!dbName || !ALLOWED_DBS.has(dbName)) {
    return NextResponse.json(
      { error: `Database not allowed: ${dbName}` },
      { status: 403 },
    );
  }

  const safePrefix = sanitizeUserId(userId);
  const remoteDbName = `${safePrefix}_${dbName}`;
  const subPath = rest.length > 0 ? `/${rest.join('/')}` : '';

  const { baseUrl, authHeader } = parseCouchAdminUrl();
  const targetUrl = `${baseUrl.replace(/\/$/, '')}/${remoteDbName}${subPath}`;

  // Preserve query string
  const qs = request.nextUrl.search;
  const fullUrl = `${targetUrl}${qs}`;

  // Forward the request body for POST/PUT
  let body: BodyInit | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }

  // Build headers — forward Content-Type but override auth
  const headers: Record<string, string> = {
    Authorization: authHeader,
    Accept: 'application/json',
  };

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  try {
    const couchRes = await fetch(fullUrl, {
      method: request.method,
      headers,
      body,
    });

    // Stream the response back to the client
    const responseHeaders = new Headers();
    const couchContentType = couchRes.headers.get('content-type');
    if (couchContentType) {
      responseHeaders.set('Content-Type', couchContentType);
    }
    // Forward ETag for caching
    const etag = couchRes.headers.get('etag');
    if (etag) {
      responseHeaders.set('ETag', etag);
    }

    const responseBody = await couchRes.arrayBuffer();

    return new NextResponse(responseBody, {
      status: couchRes.status,
      statusText: couchRes.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[couch-proxy] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to reach CouchDB server' },
      { status: 502 },
    );
  }
}

// ─── HTTP method handlers ───────────────────────────────────────────

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxyToCouchDb(request, path);
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxyToCouchDb(request, path);
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxyToCouchDb(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxyToCouchDb(request, path);
}

export async function HEAD(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxyToCouchDb(request, path);
}
