// ═══════════════════════════════════════════════════════════════════
// FitForge — Suggestion Respond API
//
// PATCH /api/suggestions/[id]/respond — user accepts/declines
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ensureSuggestionDb,
  getSuggestionDoc,
  putSuggestionDoc,
} from '@/lib/db/suggestionDb';
import { createTrainerNotification } from '@/lib/db/notificationDb';

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
    const body = await request.json() as { action?: string; acceptedRoutineId?: string };

    if (!body.action || !['accept', 'decline'].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'action must be "accept" or "decline"' } },
        { status: 400 },
      );
    }

    await ensureSuggestionDb();

    const doc = await getSuggestionDoc(id);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Suggestion not found' } },
        { status: 404 },
      );
    }

    // Only the target client can respond
    if (doc.clientId !== userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the target client can respond' } },
        { status: 403 },
      );
    }

    // Must be in pending state
    if (doc.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `Cannot respond to a ${doc.status as string} suggestion` } },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const newStatus = body.action === 'accept' ? 'accepted' : 'declined';

    const updatedDoc = {
      ...doc,
      status: newStatus,
      respondedAt: now,
      ...(body.action === 'accept' && body.acceptedRoutineId
        ? { acceptedRoutineId: body.acceptedRoutineId }
        : {}),
    };

    await putSuggestionDoc(updatedDoc);

    // Notify the trainer about the response
    const routineName = (doc.routineSnapshot as Record<string, unknown> | undefined)?.name as string ?? 'a routine';
    void createTrainerNotification({
      trainerId: doc.trainerId as string,
      notificationType: newStatus === 'accepted' ? 'suggestion_accepted' : 'suggestion_declined',
      title: newStatus === 'accepted' ? 'Suggestion Accepted' : 'Suggestion Declined',
      body: newStatus === 'accepted'
        ? `Your client accepted "${routineName}".`
        : `Your client declined "${routineName}".`,
      referenceId: id,
      clientId: userId,
    });

    const { _rev: _discard, ...cleaned } = updatedDoc as Record<string, unknown>;

    return NextResponse.json({ success: true, data: cleaned });
  } catch (error) {
    console.error('[PATCH /api/suggestions/[id]/respond] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to respond to suggestion' } },
      { status: 500 },
    );
  }
}
