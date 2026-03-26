// ═══════════════════════════════════════════════════════════════════
// FitForge — Connection Privacy API
//
// PATCH /api/connections/[id]/privacy — client updates shared data settings
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ensureConnectionDb,
  getConnectionDoc,
  putConnectionDoc,
} from '@/lib/db/connectionDb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_FIELDS = ['workoutHistory', 'personalRecords', 'bodyStats', 'streakData'];

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
    const body = await request.json() as { sharedData?: Record<string, boolean> };

    if (!body.sharedData || typeof body.sharedData !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'sharedData object is required' } },
        { status: 400 },
      );
    }

    // Validate only known fields
    const invalidFields = Object.keys(body.sharedData).filter((k) => !VALID_FIELDS.includes(k));
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: `Invalid fields: ${invalidFields.join(', ')}` } },
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

    // Only the client can update privacy settings
    if (doc.clientId !== userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the client can update privacy settings' } },
        { status: 403 },
      );
    }

    // Must be active
    if (doc.status !== 'active') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Can only update privacy on active connections' } },
        { status: 400 },
      );
    }

    const currentShared = (doc.sharedData as Record<string, boolean>) ?? {};
    const updatedShared = { ...currentShared };
    for (const key of VALID_FIELDS) {
      if (key in body.sharedData) {
        updatedShared[key] = Boolean(body.sharedData[key]);
      }
    }

    const updatedDoc = { ...doc, sharedData: updatedShared };
    await putConnectionDoc(updatedDoc);

    const { _rev: _discard, ...cleaned } = updatedDoc as Record<string, unknown>;

    return NextResponse.json({ success: true, data: cleaned });
  } catch (error) {
    console.error('[PATCH /api/connections/[id]/privacy] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to update privacy settings' } },
      { status: 500 },
    );
  }
}
