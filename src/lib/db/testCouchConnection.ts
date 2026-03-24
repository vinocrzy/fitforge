// ═══════════════════════════════════════════════════════════════════
// FitForge — CouchDB Connection Tester (Phase 7)
//
// Verifies credentials by hitting the CouchDB `/_session` endpoint
// (or `/_up` for a connectivity ping without credentials).
//
// CouchDB responds to GET /_session with the authenticated user info
// when Basic Auth credentials are valid.  Any 2xx response means the
// server is reachable and the credentials are accepted.
//
// SECURITY: credentials are only ever sent via HTTPS in production.
// The function warns (but does not block) when using plain HTTP so
// the developer is aware during local testing.
// ═══════════════════════════════════════════════════════════════════

export type ConnectionResult =
  | { ok: true; username: string; serverVersion: string }
  | { ok: false; reason: string };

/**
 * Tests a CouchDB connection by calling `GET /_session` with Basic Auth.
 *
 * @param serverUrl  Plain server URL, e.g. `https://db.example.com`
 * @param username   CouchDB username / email
 * @param password   CouchDB password (plain-text, sent over HTTPS only)
 * @param timeoutMs  Abort after this many milliseconds (default 8 000)
 */
export async function testCouchDbConnection(
  serverUrl: string,
  username: string,
  password: string,
  timeoutMs = 8_000,
): Promise<ConnectionResult> {
  // ── Validate & normalise URL ────────────────────────────────────
  let baseUrl: string;
  try {
    const u = new URL(serverUrl.trim().replace(/\/$/, ''));
    baseUrl = `${u.protocol}//${u.host}${u.pathname === '/' ? '' : u.pathname}`;
  } catch {
    return { ok: false, reason: 'Invalid server URL — must start with http:// or https://' };
  }

  if (process.env.NODE_ENV === 'production' && !baseUrl.startsWith('https://')) {
    return { ok: false, reason: 'Only HTTPS connections are allowed in production' };
  }

  // ── Build Basic Auth header ────────────────────────────────────
  // btoa is available in all modern browsers and Node 16+.
  const credentials = btoa(`${username}:${password}`);

  // ── Attempt /_session ─────────────────────────────────────────
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/_session`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.status === 401) {
      return { ok: false, reason: 'Invalid credentials — check your username and password' };
    }
    if (res.status === 403) {
      return { ok: false, reason: 'Access forbidden — the user may lack database permissions' };
    }
    if (!res.ok) {
      return { ok: false, reason: `Server returned ${res.status} ${res.statusText}` };
    }

    // Parse CouchDB session response: { ok: true, userCtx: { name, roles } }
    let body: { ok?: boolean; userCtx?: { name?: string } } = {};
    try {
      body = await res.json();
    } catch {
      // Non-JSON body but status 2xx — still connected
    }

    // Also try to get the server version from the root endpoint (best-effort)
    let serverVersion = 'CouchDB';
    try {
      const versionRes = await fetch(baseUrl, {
        headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
      });
      if (versionRes.ok) {
        const versionBody: { version?: string; couchdb?: string } = await versionRes.json();
        if (versionBody.couchdb && versionBody.version) {
          serverVersion = `${versionBody.couchdb} ${versionBody.version}`;
        }
      }
    } catch {
      // Version check is non-critical
    }

    const resolvedUsername = body.userCtx?.name ?? username;
    return { ok: true, username: resolvedUsername, serverVersion };
  } catch (err) {
    clearTimeout(timer);

    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, reason: `Connection timed out after ${timeoutMs / 1000}s — check the server URL` };
    }
    if (err instanceof TypeError) {
      // fetch() throws TypeError on network failure (e.g. CORS, no network, bad hostname)
      return {
        ok: false,
        reason: 'Could not reach the server — check the URL, network connection, and CORS settings',
      };
    }
    return { ok: false, reason: (err as Error).message ?? 'Unknown error' };
  }
}
