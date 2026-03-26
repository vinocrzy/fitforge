// ═══════════════════════════════════════════════════════════════════
// FitForge — Client PRs API
//
// GET /api/clients/[clientId]/prs — client personal records
// Trainer-only. Requires active connection with client.
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { ensureConnectionDb, listConnections } from '@/lib/db/connectionDb';
import { couchFetch } from '@/lib/db/trainerDb';

function sanitizeUserId(userId: string): string {
  return userId.toLowerCase().replace(/[^a-z0-9_$()+-]/g, '_');
}

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  const role = (sessionClaims?.metadata as Record<string, unknown> | undefined)?.role;
  if (role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Trainer role required' } },
      { status: 403 },
    );
  }

  try {
    const { clientId } = await params;

    // Verify active connection
    await ensureConnectionDb();
    const { connections } = await listConnections({
      trainerId: userId,
      clientId,
      status: 'active',
      limit: 1,
    });

    if (connections.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No active connection with this client' } },
        { status: 403 },
      );
    }

    const safePrefix = sanitizeUserId(clientId);
    const profileDbName = `${safePrefix}_fitforge_profile`;

    const profileRes = await couchFetch(`/${profileDbName}/profile`);

    if (!profileRes.ok) {
      if (profileRes.status === 404) {
        return NextResponse.json({ success: true, data: [] });
      }
      const body = await profileRes.text();
      throw new Error(`CouchDB query failed: ${profileRes.status} ${body}`);
    }

    const profile = await profileRes.json() as Record<string, unknown>;
    const prsMap = (profile.prs as Record<string, Record<string, unknown>>) ?? {};
    const prs = Object.values(prsMap);

    return NextResponse.json({ success: true, data: prs });
  } catch (error) {
    console.error('[GET /api/clients/[clientId]/prs] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to fetch client PRs' } },
      { status: 500 },
    );
  }
}
