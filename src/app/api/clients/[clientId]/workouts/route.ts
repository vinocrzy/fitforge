// ═══════════════════════════════════════════════════════════════════
// FitForge — Client Workouts API
//
// GET /api/clients/[clientId]/workouts — client workout history
// Trainer-only. Requires active connection with client.
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { resolveRole } from '@/lib/auth/resolveRole';
import { NextRequest, NextResponse } from 'next/server';
import { ensureConnectionDb, listConnections } from '@/lib/db/connectionDb';
import { couchFetch } from '@/lib/db/trainerDb';

function sanitizeUserId(userId: string): string {
  return userId.toLowerCase().replace(/[^a-z0-9_$()+-]/g, '_');
}

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  const role = await resolveRole(userId, sessionClaims as Record<string, unknown>);
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

    const url = request.nextUrl;
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 50);
    const skip = Number(url.searchParams.get('skip') ?? 0);

    const safePrefix = sanitizeUserId(clientId);
    const workoutDbName = `${safePrefix}_fitforge_workouts`;

    const workoutsRes = await couchFetch(`/${workoutDbName}/_find`, {
      method: 'POST',
      body: JSON.stringify({
        selector: { type: 'workout_session' },
        limit: 200,   // Fetch a wider set; we sort + slice client-side
        skip: 0,
      }),
    });

    if (!workoutsRes.ok) {
      // Database may not exist yet (no workouts)
      if (workoutsRes.status === 404) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { total: 0, page: 1, pageSize: limit, hasMore: false },
        });
      }
      const body = await workoutsRes.text();
      throw new Error(`CouchDB query failed: ${workoutsRes.status} ${body}`);
    }

    const result = await workoutsRes.json() as { docs: Record<string, unknown>[] };

    // Sort client-side — per-user PouchDB DBs have no guaranteed Mango index
    const sorted = result.docs.slice().sort((a, b) => {
      const aDate = typeof a.completedAt === 'string' ? a.completedAt : '';
      const bDate = typeof b.completedAt === 'string' ? b.completedAt : '';
      return bDate.localeCompare(aDate);
    });

    const page = Math.floor(skip / limit) + 1;
    const sliced = sorted.slice(skip, skip + limit);
    const workouts = sliced.map(({ _rev, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: workouts,
      pagination: { total: sorted.length, page, pageSize: limit, hasMore: sorted.length > skip + limit },
    });
  } catch (error) {
    console.error('[GET /api/clients/[clientId]/workouts] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to fetch client workouts' } },
      { status: 500 },
    );
  }
}
