// ═══════════════════════════════════════════════════════════════════
// FitForge — Nutrition Suggestions API: Create + List
//
// POST /api/nutrition-suggestions  — trainer sends nutrition suggestion
// GET  /api/nutrition-suggestions  — role-aware list
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { resolveRole } from '@/lib/auth/resolveRole';
import { NextRequest, NextResponse } from 'next/server';
import {
  ensureNutritionSuggestionDb,
  putNutritionSuggestionDoc,
  listNutritionSuggestions,
} from '@/lib/db/nutritionSuggestionDb';
import { ensureConnectionDb, listConnections } from '@/lib/db/connectionDb';

// ─── GET /api/nutrition-suggestions ──────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    await ensureNutritionSuggestionDb();

    const url = request.nextUrl;
    const status = url.searchParams.get('status') ?? undefined;
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);
    const skip = Number(url.searchParams.get('skip') ?? 0);

    const isTrainer =
      (await resolveRole(userId, sessionClaims as Record<string, unknown>)) === 'trainer';

    const queryOptions = isTrainer
      ? { trainerId: userId, status, limit, skip }
      : { clientId: userId, status, limit, skip };

    const { suggestions, total } = await listNutritionSuggestions(queryOptions);
    const cleaned = suggestions.map(({ _rev, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: cleaned,
      pagination: {
        total,
        page: Math.floor(skip / limit) + 1,
        pageSize: limit,
        hasMore: total >= limit,
      },
    });
  } catch (error) {
    console.error('[GET /api/nutrition-suggestions]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to list suggestions' } },
      { status: 500 },
    );
  }
}

// ─── POST /api/nutrition-suggestions ─────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const body = await request.json() as {
      clientId?: string;
      message?: string;
      suggestedGoalPhase?: string;
      suggestedDailyCalories?: number;
    };

    if (!body.clientId || typeof body.clientId !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'clientId is required' } },
        { status: 400 },
      );
    }
    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'message is required' } },
        { status: 400 },
      );
    }
    if (
      body.suggestedGoalPhase !== undefined &&
      !['cut', 'maintain', 'bulk'].includes(body.suggestedGoalPhase)
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Invalid suggestedGoalPhase' } },
        { status: 400 },
      );
    }
    if (
      body.suggestedDailyCalories !== undefined &&
      (typeof body.suggestedDailyCalories !== 'number' ||
        body.suggestedDailyCalories < 800 ||
        body.suggestedDailyCalories > 10000)
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'suggestedDailyCalories must be 800–10000' } },
        { status: 400 },
      );
    }

    // Verify active connection
    await ensureConnectionDb();
    const { connections } = await listConnections({
      trainerId: userId,
      clientId: body.clientId,
      status: 'active',
      limit: 1,
    });
    if (connections.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No active connection with this client' } },
        { status: 403 },
      );
    }

    await ensureNutritionSuggestionDb();

    const now = new Date().toISOString();
    const shortId = Math.random().toString(36).slice(2, 8);
    const doc: Record<string, unknown> = {
      _id: `nutrition_suggestion_${now}_${shortId}`,
      type: 'nutrition_suggestion',
      fromTrainerId: userId,
      toClientId: body.clientId,
      message: body.message.trim(),
      status: 'pending',
      createdAt: now,
    };
    if (body.suggestedGoalPhase) doc.suggestedGoalPhase = body.suggestedGoalPhase;
    if (body.suggestedDailyCalories) doc.suggestedDailyCalories = body.suggestedDailyCalories;

    const result = await putNutritionSuggestionDoc(doc);

    return NextResponse.json({ success: true, data: { id: result.id } }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/nutrition-suggestions]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to create suggestion' } },
      { status: 500 },
    );
  }
}
