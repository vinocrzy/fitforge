// ═══════════════════════════════════════════════════════════════════
// FitForge — Nutrition Suggestion Respond API
//
// PATCH /api/nutrition-suggestions/[id]/respond
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ensureNutritionSuggestionDb,
  getNutritionSuggestionDoc,
  putNutritionSuggestionDoc,
} from '@/lib/db/nutritionSuggestionDb';

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

    if (!body.action || !['accept', 'dismiss'].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'action must be "accept" or "dismiss"' } },
        { status: 400 },
      );
    }

    await ensureNutritionSuggestionDb();

    const doc = await getNutritionSuggestionDoc(id);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Suggestion not found' } },
        { status: 404 },
      );
    }

    if (doc.toClientId !== userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the target client can respond' } },
        { status: 403 },
      );
    }

    if (doc.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Suggestion already responded to' } },
        { status: 409 },
      );
    }

    const updated = {
      ...doc,
      status: body.action === 'accept' ? 'accepted' : 'dismissed',
      respondedAt: new Date().toISOString(),
    };

    await putNutritionSuggestionDoc(updated);

    return NextResponse.json({ success: true, data: { id, status: updated.status } });
  } catch (error) {
    console.error('[PATCH /api/nutrition-suggestions/[id]/respond]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to respond to suggestion' } },
      { status: 500 },
    );
  }
}
