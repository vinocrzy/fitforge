// ═══════════════════════════════════════════════════════════════════
// FitForge — Push Notification Manager
// PT Feature 2: Web Push notification orchestration with Browser Notifications API
// ═══════════════════════════════════════════════════════════════════

/**
 * Notification types supported by FitForge
 */
export type NotificationType = 
  | 'rest_day_reminder'  // After N days of inactivity
  | 'streak_alert'       // Daily check-in reminder
  | 'deload_prompt'      // When deload detection fires
  | 'coaching_note';     // 2h after session completion with RPE advice

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  tag?: string; // For deduplication
  timestamp?: number;
}

/**
 * Request push notification permission from the user
 * @returns Permission status: 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Schedule a push notification to be shown at a specific time
 * Uses browser Notification API (not service worker push for now)
 * @param payload - Notification data
 * @param delayMs - Delay in milliseconds before showing (0 = immediate)
 */
export function schedulePushNotification(
  payload: NotificationPayload,
  delayMs = 0
): number | null {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  const timeoutId = window.setTimeout(() => {
    showNotification(payload);
  }, delayMs);

  return timeoutId;
}

/**
 * Show a notification immediately
 * @param payload - Notification data
 */
export function showNotification(payload: NotificationPayload): Notification | null {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: payload.tag ?? `fitforge-${payload.type}-${Date.now()}`,
      data: payload.data,
      requireInteraction: false, // Auto-dismiss after ~4 seconds
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Navigate based on notification type
      if (payload.type === 'coaching_note') {
        window.location.href = '/';
      } else if (payload.type === 'deload_prompt') {
        window.location.href = '/';
      } else if (payload.type === 'rest_day_reminder') {
        window.location.href = '/routines';
      } else if (payload.type === 'streak_alert') {
        window.location.href = '/';
      }
    };

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

/**
 * Dismiss a scheduled notification by timeout ID
 * @param timeoutId - ID returned from schedulePushNotification
 */
export function dismissPushNotification(timeoutId: number): void {
  window.clearTimeout(timeoutId);
}

/**
 * Check if notifications are supported in this environment
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}
