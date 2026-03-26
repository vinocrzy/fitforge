// ═══════════════════════════════════════════════════════════════════
// FitForge — Client Progress API
//
// GET /api/clients/[clientId]/progress — aggregated client stats
// Trainer-only. Requires active connection with client.
// Reads from the client's per-user CouchDB databases.
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { ensureConnectionDb, listConnections } from '@/lib/db/connectionDb';
import { couchFetch } from '@/lib/db/trainerDb';

function sanitizeUserId(userId: string): string {
  return userId.toLowerCase().replace(/[^a-z0-9_$()+-]/g, '_');
}

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  const role = (sessionClaims?.metadata as Record<string, unknown> | undefined)?.role;
  if (role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Trainer role required' } },
      { status: 403 },
    );
  }

  try {
    const { clientId } = await params;

    // Verify active connection
    await ensureConnectionDb();
    const { connections } = await listConnections({
      trainerId: userId,
      clientId,
      status: 'active',
      limit: 1,
    });

    if (connections.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No active connection with this client' } },
        { status: 403 },
      );
    }

    const safePrefix = sanitizeUserId(clientId);
    const workoutDbName = `${safePrefix}_fitforge_workouts`;
    const profileDbName = `${safePrefix}_fitforge_profile`;

    // Fetch recent workouts (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const workoutsRes = await couchFetch(`/${workoutDbName}/_find`, {
      method: 'POST',
      body: JSON.stringify({
        selector: {
          type: 'workout_session',
          completedAt: { $gte: thirtyDaysAgo },
        },
        sort: [{ completedAt: 'desc' }],
        limit: 100,
      }),
    });

    let recentWorkouts: Record<string, unknown>[] = [];
    if (workoutsRes.ok) {
      const workoutsData = await workoutsRes.json() as { docs: Record<string, unknown>[] };
      recentWorkouts = workoutsData.docs;
    }

    // Fetch profile for PRs and streak
    const profileRes = await couchFetch(`/${profileDbName}/profile`);
    let profile: Record<string, unknown> | null = null;
    if (profileRes.ok) {
      profile = await profileRes.json() as Record<string, unknown>;
    }

    // Compute summary briefs
    const workoutBriefs = recentWorkouts.map((w) => {
      const summary = w.summary as Record<string, unknown> | undefined;
      const warmUp = w.warmUp as unknown[] | undefined;
      const workout = w.workout as unknown[] | undefined;
      const stretch = w.stretch as unknown[] | undefined;
      const exerciseCount = (warmUp?.length ?? 0) + (workout?.length ?? 0) + (stretch?.length ?? 0);
      const startedAt = w.startedAt as string | undefined;
      const completedAt = w.completedAt as string | undefined;
      const durationSec = startedAt && completedAt
        ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000)
        : 0;

      return {
        sessionId: w._id as string,
        routineName: (w.routineId as string | null) ?? null,
        completedAt: completedAt ?? '',
        durationSec,
        totalCalories: (summary?.totalCalories as number) ?? 0,
        exerciseCount,
        avgRpe: summary?.avgRpe as number | undefined,
      };
    });

    // Compute weekly volume (total calories this week)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekWorkouts = recentWorkouts.filter(
      (w) => (w.completedAt as string) >= weekAgo,
    );
    const weeklyVolume = weekWorkouts.reduce((sum, w) => {
      const summary = w.summary as Record<string, unknown> | undefined;
      return sum + ((summary?.totalCalories as number) ?? 0);
    }, 0);

    // Monthly workout count
    const monthlyWorkoutCount = recentWorkouts.length;

    // Streak and PRs from profile
    const currentStreak = (profile?.streakDays as number) ?? 0;
    const prsMap = (profile?.prs as Record<string, Record<string, unknown>>) ?? {};
    const prs = Object.values(prsMap);

    // Compliance rate: workouts per 7 days over last 30 days
    const totalDays = 30;
    const expectedPerWeek = 3; // assume 3x/week target
    const expectedTotal = Math.round((totalDays / 7) * expectedPerWeek);
    const complianceRate = expectedTotal > 0
      ? Math.min(1, recentWorkouts.length / expectedTotal)
      : 0;

    const snapshot = {
      clientId,
      trainerId: userId,
      snapshotDate: new Date().toISOString(),
      recentWorkouts: workoutBriefs,
      weeklyVolume,
      monthlyWorkoutCount,
      currentStreak,
      complianceRate: Math.round(complianceRate * 100) / 100,
      prs,
      bodyWeightKg: (profile?.weightKg as number) ?? undefined,
    };

    return NextResponse.json({ success: true, data: snapshot });
  } catch (error) {
    console.error('[GET /api/clients/[clientId]/progress] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to fetch client progress' } },
      { status: 500 },
    );
  }
}
