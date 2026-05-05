// ═══════════════════════════════════════════════════════════════════
// FitForge — Client Nutrition Summary API
//
// GET /api/clients/[clientId]/nutrition
// Trainer-only. Requires active connection.
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { resolveRole } from '@/lib/auth/resolveRole';
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

  const role = await resolveRole(userId, sessionClaims as Record<string, unknown>);
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
    const nutritionDbName = `${safePrefix}_fitforge_nutrition`;

    // ── Read diet profile ────────────────────────────────────────
    const profileDocId = `diet_profile_user_${clientId}`;
    const profileRes = await couchFetch(
      `/${nutritionDbName}/${encodeURIComponent(profileDocId)}`,
    );
    let dietProfile: Record<string, unknown> | null = null;
    if (profileRes.ok) {
      dietProfile = await profileRes.json() as Record<string, unknown>;
    }

    // ── Read last 7 days of meal entries ─────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const entriesRes = await couchFetch(`/${nutritionDbName}/_all_docs`, {
      method: 'POST',
      body: JSON.stringify({
        startkey: `meal_entry_${sevenDaysAgo}`,
        endkey: `meal_entry_${today}T23:59:59.999Z\uffff`,
        include_docs: true,
      }),
    });

    interface AllDocsRow {
      id?: string;
      doc?: { macros?: { calories?: number; proteinG?: number; carbsG?: number; fatG?: number } };
    }
    interface AllDocsResult {
      rows: AllDocsRow[];
    }

    let avgCalories = 0;
    let avgProteinG = 0;
    let avgCarbsG = 0;
    let avgFatG = 0;
    let loggedDays = 0;

    if (entriesRes.ok) {
      const allDocs = await entriesRes.json() as AllDocsResult;
      // Aggregate per-day
      const dailyTotals = new Map<string, { calories: number; proteinG: number; carbsG: number; fatG: number }>();

      for (const row of allDocs.rows) {
        const doc = row.doc;
        if (!doc?.macros) continue;
        // Extract date from _id key (meal_entry_YYYY-MM-DD...)
        const key = row.id ?? '';
        const date = key.slice('meal_entry_'.length, 'meal_entry_'.length + 10);
        if (!date || date < sevenDaysAgo || date > today) continue;

        const existing = dailyTotals.get(date) ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
        dailyTotals.set(date, {
          calories: existing.calories + (doc.macros.calories ?? 0),
          proteinG: existing.proteinG + (doc.macros.proteinG ?? 0),
          carbsG: existing.carbsG + (doc.macros.carbsG ?? 0),
          fatG: existing.fatG + (doc.macros.fatG ?? 0),
        });
      }

      loggedDays = dailyTotals.size;
      if (loggedDays > 0) {
        const totals = Array.from(dailyTotals.values());
        avgCalories = Math.round(totals.reduce((s, d) => s + d.calories, 0) / loggedDays);
        avgProteinG = Math.round((totals.reduce((s, d) => s + d.proteinG, 0) / loggedDays) * 10) / 10;
        avgCarbsG = Math.round((totals.reduce((s, d) => s + d.carbsG, 0) / loggedDays) * 10) / 10;
        avgFatG = Math.round((totals.reduce((s, d) => s + d.fatG, 0) / loggedDays) * 10) / 10;
      }
    }

    // Strip _rev from profile before returning
    if (dietProfile) {
      const { _rev, ...safeProfile } = dietProfile;
      void _rev;
      dietProfile = safeProfile;
    }

    return NextResponse.json({
      success: true,
      data: {
        dietProfile,
        last7Days: { loggedDays, avgCalories, avgProteinG, avgCarbsG, avgFatG },
      },
    });
  } catch (error) {
    console.error('[GET /api/clients/[clientId]/nutrition]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to read client nutrition' } },
      { status: 500 },
    );
  }
}
