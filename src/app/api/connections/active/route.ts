// ═══════════════════════════════════════════════════════════════════
// FitForge — Active Connection API
//
// GET /api/connections/active — user's current active connection
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ensureConnectionDb, findActiveConnection } from '@/lib/db/connectionDb';
import { getTrainerDoc, ensureTrainerDb } from '@/lib/db/trainerDb';

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    await ensureConnectionDb();

    const connection = await findActiveConnection(userId);
    if (!connection) {
      return NextResponse.json({ success: true, data: null });
    }

    // Enrich with trainer profile data
    await ensureTrainerDb();
    const trainerId = connection.trainerId as string;
    const trainerDoc = await getTrainerDoc(`trainer_${trainerId}`);

    const { _rev: _discardConn, ...cleanedConnection } = connection as Record<string, unknown>;

    let trainerProfile = null;
    if (trainerDoc) {
      const { _rev: _discardTrainer, ...cleanedTrainer } = trainerDoc as Record<string, unknown>;
      trainerProfile = cleanedTrainer;
    }

    return NextResponse.json({
      success: true,
      data: {
        connection: cleanedConnection,
        trainer: trainerProfile,
      },
    });
  } catch (error) {
    console.error('[GET /api/connections/active] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to get active connection' } },
      { status: 500 },
    );
  }
}
