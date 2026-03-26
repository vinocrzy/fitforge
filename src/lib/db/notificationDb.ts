// ═══════════════════════════════════════════════════════════════════
// FitForge — Trainer Notification Database Server Utilities
// CouchDB operations for the shared fitforge_trainer_notifications
// database. Server-side only — never import in client components.
// ═══════════════════════════════════════════════════════════════════

import { couchFetch } from '@/lib/db/trainerDb';

const NOTIFICATION_DB = 'fitforge_trainer_notifications';

export async function ensureNotificationDb(): Promise<void> {
  const res = await couchFetch(`/${NOTIFICATION_DB}`, { method: 'PUT' });
  if (!res.ok && res.status !== 412) {
    const body = await res.text();
    throw new Error(`Failed to create ${NOTIFICATION_DB}: ${res.status} ${body}`);
  }

  // Index for trainer queries sorted by createdAt
  await couchFetch(`/${NOTIFICATION_DB}/_index`, {
    method: 'POST',
    body: JSON.stringify({
      index: { fields: ['type', 'trainerId', 'createdAt'] },
      ddoc: 'notification-trainer-index',
      type: 'json',
    }),
  });

  // Index for unread count
  await couchFetch(`/${NOTIFICATION_DB}/_index`, {
    method: 'POST',
    body: JSON.stringify({
      index: { fields: ['type', 'trainerId', 'read', 'createdAt'] },
      ddoc: 'notification-unread-index',
      type: 'json',
    }),
  });
}

export async function getNotificationDoc(docId: string): Promise<Record<string, unknown> | null> {
  const res = await couchFetch(`/${NOTIFICATION_DB}/${encodeURIComponent(docId)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get ${docId}: ${res.status} ${body}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function putNotificationDoc(doc: Record<string, unknown>): Promise<Record<string, unknown>> {
  const docId = doc._id as string;
  const res = await couchFetch(`/${NOTIFICATION_DB}/${encodeURIComponent(docId)}`, {
    method: 'PUT',
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to put ${docId}: ${res.status} ${body}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export interface NotificationQueryOptions {
  trainerId: string;
  read?: boolean;
  limit?: number;
  skip?: number;
}

export async function listNotifications(options: NotificationQueryOptions): Promise<{
  notifications: Record<string, unknown>[];
  total: number;
}> {
  const { trainerId, limit = 50, skip = 0 } = options;

  const selector: Record<string, unknown> = {
    type: 'trainer_notification',
    trainerId,
  };

  if (options.read !== undefined) selector.read = options.read;

  const findRes = await couchFetch(`/${NOTIFICATION_DB}/_find`, {
    method: 'POST',
    body: JSON.stringify({
      selector,
      sort: [{ createdAt: 'desc' }],
      limit,
      skip,
    }),
  });

  if (!findRes.ok) {
    const body = await findRes.text();
    throw new Error(`Failed to query notifications: ${findRes.status} ${body}`);
  }

  const result = await findRes.json() as { docs: Record<string, unknown>[] };

  return {
    notifications: result.docs,
    total: result.docs.length,
  };
}

/** Count unread notifications for a trainer */
export async function countUnreadNotifications(trainerId: string): Promise<number> {
  const { notifications } = await listNotifications({
    trainerId,
    read: false,
    limit: 100,
  });
  return notifications.length;
}

/** Create a notification for a trainer (fire-and-forget helper) */
export async function createTrainerNotification(params: {
  trainerId: string;
  notificationType: string;
  title: string;
  body: string;
  referenceId?: string;
  clientId?: string;
}): Promise<void> {
  try {
    await ensureNotificationDb();
    const now = new Date().toISOString();
    await putNotificationDoc({
      _id: `notif_${params.trainerId}_${Date.now()}`,
      type: 'trainer_notification',
      trainerId: params.trainerId,
      notificationType: params.notificationType,
      title: params.title,
      body: params.body,
      referenceId: params.referenceId,
      clientId: params.clientId,
      read: false,
      createdAt: now,
    });
  } catch (error) {
    // Fire-and-forget: log but don't throw to avoid breaking the main flow
    console.error('[createTrainerNotification] Error:', error);
  }
}
