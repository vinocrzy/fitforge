// ═══════════════════════════════════════════════════════════════════
// FitForge — Trainer Notifications API
//
// GET /api/trainer-notifications — paginated notifications
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ensureNotificationDb,
  listNotifications,
  countUnreadNotifications,
} from '@/lib/db/notificationDb';

export async function GET(request: NextRequest): Promise<NextResponse> {
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
    await ensureNotificationDb();

    const url = request.nextUrl;
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 30), 100);
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const countOnly = url.searchParams.get('countOnly') === 'true';

    if (countOnly) {
      const unread = await countUnreadNotifications(userId);
      return NextResponse.json({ success: true, data: { unread } });
    }

    const { notifications, total } = await listNotifications({
      trainerId: userId,
      limit,
      skip,
    });

    const cleaned = notifications.map(({ _rev, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: cleaned,
      pagination: { total, page: Math.floor(skip / limit) + 1, pageSize: limit, hasMore: total >= limit },
    });
  } catch (error) {
    console.error('[GET /api/trainer-notifications] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to list notifications' } },
      { status: 500 },
    );
  }
}
