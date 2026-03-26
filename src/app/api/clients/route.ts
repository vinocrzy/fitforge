// ═══════════════════════════════════════════════════════════════════
// FitForge — Clients API (Trainer-side)
//
// GET /api/clients — trainer's connected client list with brief stats
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { resolveRole } from '@/lib/auth/resolveRole';
import { NextRequest, NextResponse } from 'next/server';
import { ensureConnectionDb, listConnections } from '@/lib/db/connectionDb';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  // Must be a trainer
  const role = await resolveRole(userId, sessionClaims as Record<string, unknown>);
  if (role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Trainer role required' } },
      { status: 403 },
    );
  }

  try {
    await ensureConnectionDb();

    const url = request.nextUrl;
    const status = url.searchParams.get('status') ?? 'active';
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);
    const skip = Number(url.searchParams.get('skip') ?? 0);

    const { connections, total } = await listConnections({
      trainerId: userId,
      status,
      limit,
      skip,
    });

    // Build client list from connections
    const clients = connections.map((conn) => {
      const { _rev, ...rest } = conn as Record<string, unknown>;
      return {
        connectionId: rest._id,
        clientId: rest.clientId,
        status: rest.status,
        connectedAt: rest.respondedAt ?? rest.requestedAt,
        sharedData: rest.sharedData,
      };
    });

    return NextResponse.json({
      success: true,
      data: clients,
      pagination: { total, page: Math.floor(skip / limit) + 1, pageSize: limit, hasMore: total >= limit },
    });
  } catch (error) {
    console.error('[GET /api/clients] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to list clients' } },
      { status: 500 },
    );
  }
}
