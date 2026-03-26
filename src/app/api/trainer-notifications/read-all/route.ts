// ═══════════════════════════════════════════════════════════════════
// FitForge — Mark All Notifications Read API
//
// POST /api/trainer-notifications/read-all — mark all as read
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  ensureNotificationDb,
  listNotifications,
  putNotificationDoc,
} from '@/lib/db/notificationDb';

export async function POST(): Promise<NextResponse> {
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

    const { notifications } = await listNotifications({
      trainerId: userId,
      read: false,
      limit: 200,
    });

    // Mark each unread notification as read
    await Promise.all(
      notifications.map((doc) =>
        putNotificationDoc({ ...doc, read: true }),
      ),
    );

    return NextResponse.json({
      success: true,
      data: { markedRead: notifications.length },
    });
  } catch (error) {
    console.error('[POST /api/trainer-notifications/read-all] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to mark all read' } },
      { status: 500 },
    );
  }
}
