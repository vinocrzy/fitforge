// ═══════════════════════════════════════════════════════════════════
// FitForge — Trainer API: Get Own Profile
//
// GET /api/trainers/me — get the current user's trainer profile
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ensureTrainerDb, getTrainerDoc } from '@/lib/db/trainerDb';

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    await ensureTrainerDb();
    const doc = await getTrainerDoc(`trainer_${userId}`);

    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Not enrolled as trainer' } },
        { status: 404 },
      );
    }

    const { _rev, ...cleaned } = doc;
    return NextResponse.json({ success: true, data: cleaned });
  } catch (error) {
    console.error('[GET /api/trainers/me] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to get trainer profile' } },
      { status: 500 },
    );
  }
}
