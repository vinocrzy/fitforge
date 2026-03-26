// ═══════════════════════════════════════════════════════════════════
// FitForge — Suggestions API: Create + List
//
// POST /api/suggestions     — trainer creates routine suggestion
// GET  /api/suggestions     — list suggestions (role-aware)
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ensureSuggestionDb,
  putSuggestionDoc,
  listSuggestions,
} from '@/lib/db/suggestionDb';
import { ensureConnectionDb, listConnections } from '@/lib/db/connectionDb';

// ─── GET /api/suggestions ─────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    await ensureSuggestionDb();

    const url = request.nextUrl;
    const status = url.searchParams.get('status') ?? undefined;
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);
    const skip = Number(url.searchParams.get('skip') ?? 0);

    const isTrainer = (sessionClaims?.metadata as Record<string, unknown> | undefined)?.role === 'trainer';

    // Trainers see suggestions they sent; users see suggestions they received
    const queryOptions = isTrainer
      ? { trainerId: userId, status, limit, skip }
      : { clientId: userId, status, limit, skip };

    const { suggestions, total } = await listSuggestions(queryOptions);

    const cleaned = suggestions.map(({ _rev, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: cleaned,
      pagination: { total, page: Math.floor(skip / limit) + 1, pageSize: limit, hasMore: total >= limit },
    });
  } catch (error) {
    console.error('[GET /api/suggestions] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to list suggestions' } },
      { status: 500 },
    );
  }
}

// ─── POST /api/suggestions ────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  // Must be a trainer
  const role = (sessionClaims?.metadata as Record<string, unknown> | undefined)?.role;
  if (role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Trainer role required' } },
      { status: 403 },
    );
  }

  try {
    const body = await request.json() as {
      clientId?: string;
      routineSnapshot?: Record<string, unknown>;
      trainerNote?: string;
    };

    if (!body.clientId?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'clientId is required' } },
        { status: 400 },
      );
    }

    if (!body.routineSnapshot || typeof body.routineSnapshot !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'routineSnapshot is required' } },
        { status: 400 },
      );
    }

    const trainerNote = body.trainerNote?.trim().slice(0, 1000) ?? '';

    // Verify active connection with client
    await ensureConnectionDb();
    const { connections } = await listConnections({
      trainerId: userId,
      clientId: body.clientId.trim(),
      status: 'active',
      limit: 1,
    });

    if (connections.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No active connection with this client' } },
        { status: 403 },
      );
    }

    await ensureSuggestionDb();

    const now = new Date().toISOString();
    const suggestionDoc = {
      _id: `suggestion_${userId}_${body.clientId.trim()}_${Date.now()}`,
      type: 'routine_suggestion',
      trainerId: userId,
      clientId: body.clientId.trim(),
      routineSnapshot: body.routineSnapshot,
      trainerNote,
      status: 'pending',
      suggestedAt: now,
    };

    await putSuggestionDoc(suggestionDoc);

    return NextResponse.json({ success: true, data: suggestionDoc }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/suggestions] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to create suggestion' } },
      { status: 500 },
    );
  }
}
