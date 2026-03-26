// ═══════════════════════════════════════════════════════════════════
// FitForge — Suggestions Pending Count API
//
// GET /api/suggestions/pending — user's pending suggestion count
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ensureSuggestionDb, countPendingSuggestions } from '@/lib/db/suggestionDb';

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    await ensureSuggestionDb();
    const count = await countPendingSuggestions(userId);

    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error('[GET /api/suggestions/pending] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to count pending suggestions' } },
      { status: 500 },
    );
  }
}
