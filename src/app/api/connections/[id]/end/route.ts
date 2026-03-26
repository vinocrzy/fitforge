// ═══════════════════════════════════════════════════════════════════
// FitForge — Connection End API
//
// PATCH /api/connections/[id]/end — either party ends the connection
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

export async function PATCH(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;

    await ensureConnectionDb();

    const doc = await getConnectionDoc(id);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Connection not found' } },
        { status: 404 },
      );
    }

    // Only the trainer or client in this connection can end it
    const isTrainer = doc.trainerId === userId;
    const isClient = doc.clientId === userId;
    if (!isTrainer && !isClient) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not part of this connection' } },
        { status: 403 },
      );
    }

    // Must be in pending or active state
    if (doc.status !== 'pending' && doc.status !== 'active') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `Cannot end a ${doc.status} connection` } },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const wasActive = doc.status === 'active';

    const updatedDoc = {
      ...doc,
      status: 'ended',
      endedAt: now,
      endedBy: isTrainer ? 'trainer' : 'client',
    };

    await putConnectionDoc(updatedDoc);

    // If was active, decrement trainer clientCount
    if (wasActive) {
      await ensureTrainerDb();
      const trainerId = doc.trainerId as string;
      const trainerDoc = await getTrainerDoc(`trainer_${trainerId}`);
      if (trainerDoc) {
        await putTrainerDoc({
          ...trainerDoc,
          clientCount: Math.max(0, ((trainerDoc.clientCount as number) || 0) - 1),
          updatedAt: now,
        });
      }
    }

    const { _rev: _discard, ...cleaned } = updatedDoc as Record<string, unknown>;

    return NextResponse.json({ success: true, data: cleaned });
  } catch (error) {
    console.error('[PATCH /api/connections/[id]/end] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to end connection' } },
      { status: 500 },
    );
  }
}
