// ═══════════════════════════════════════════════════════════════════
// FitForge — Connection Respond API
//
// PATCH /api/connections/[id]/respond — trainer accepts/declines
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ensureConnectionDb,
  getConnectionDoc,
  putConnectionDoc,
} from '@/lib/db/connectionDb';
import { getTrainerDoc, putTrainerDoc, ensureTrainerDb } from '@/lib/db/trainerDb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const body = await request.json() as { action?: string };

    if (!body.action || !['accept', 'decline'].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'action must be "accept" or "decline"' } },
        { status: 400 },
      );
    }

    await ensureConnectionDb();

    const doc = await getConnectionDoc(id);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Connection not found' } },
        { status: 404 },
      );
    }

    // Only the trainer can respond
    if (doc.trainerId !== userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the trainer can respond to requests' } },
        { status: 403 },
      );
    }

    // Must be in pending state
    if (doc.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `Cannot respond to a ${doc.status} connection` } },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const newStatus = body.action === 'accept' ? 'active' : 'declined';

    const updatedDoc = {
      ...doc,
      status: newStatus,
      respondedAt: now,
    };

    await putConnectionDoc(updatedDoc);

    // If accepted, increment trainer clientCount
    if (newStatus === 'active') {
      await ensureTrainerDb();
      const trainerDoc = await getTrainerDoc(`trainer_${userId}`);
      if (trainerDoc) {
        await putTrainerDoc({
          ...trainerDoc,
          clientCount: ((trainerDoc.clientCount as number) || 0) + 1,
          updatedAt: now,
        });
      }
    }

    const { _rev: _discard, ...cleaned } = updatedDoc as Record<string, unknown>;

    return NextResponse.json({ success: true, data: cleaned });
  } catch (error) {
    console.error('[PATCH /api/connections/[id]/respond] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to respond to connection' } },
      { status: 500 },
    );
  }
}
