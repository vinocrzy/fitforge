// ═══════════════════════════════════════════════════════════════════
// FitForge — Mark Notification Read API
//
// PATCH /api/trainer-notifications/[id]/read — mark single as read
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { resolveRole } from '@/lib/auth/resolveRole';
import { NextRequest, NextResponse } from 'next/server';
import {
  ensureNotificationDb,
  getNotificationDoc,
  putNotificationDoc,
} from '@/lib/db/notificationDb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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
    const { id } = await params;

    await ensureNotificationDb();

    const doc = await getNotificationDoc(id);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } },
        { status: 404 },
      );
    }

    // Only the target trainer can mark as read
    if (doc.trainerId !== userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not your notification' } },
        { status: 403 },
      );
    }

    const updatedDoc = { ...doc, read: true };
    await putNotificationDoc(updatedDoc);

    const { _rev: _discard, ...cleaned } = updatedDoc as Record<string, unknown>;
    return NextResponse.json({ success: true, data: cleaned });
  } catch (error) {
    console.error('[PATCH /api/trainer-notifications/[id]/read] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to mark notification read' } },
      { status: 500 },
    );
  }
}
