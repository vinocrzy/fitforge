// ═══════════════════════════════════════════════════════════════════
// FitForge — NotificationList Component
// Full notification feed with mark-all-read action
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { staggerContainer } from '@/lib/motion/variants';
import { Icon } from '@/components/ui/Icon';
import { NotificationItem } from '@/components/trainer/NotificationItem';
import {
  useTrainerNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useTrainerNotifications';
import type { TrainerNotification } from '@/types';

export function NotificationList(): React.ReactElement {
  const router = useRouter();
  const { data: notifications = [], isLoading } = useTrainerNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handlePress = (notification: TrainerNotification): void => {
    // Mark as read on tap
    if (!notification.read) {
      markRead.mutate(notification._id);
    }

    // Navigate to reference if available
    if (notification.notificationType === 'new_connection_request') {
      router.push('/trainer/requests');
    } else if (
      notification.notificationType === 'suggestion_accepted' ||
      notification.notificationType === 'suggestion_declined'
    ) {
      if (notification.clientId) {
        router.push(`/trainer/clients/${notification.clientId}`);
      }
    } else if (notification.notificationType === 'client_workout_completed') {
      if (notification.clientId) {
        router.push(`/trainer/clients/${notification.clientId}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl animate-pulse h-20" style={{ background: '#141414' }} />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <Icon name="bell.fill" size={40} className="mx-auto mb-4 opacity-20" />
        <p
          className="text-[17px] font-semibold mb-1"
          style={{ color: '#F5F5F5' }}
        >
          No notifications
        </p>
        <p
          className="text-[14px]"
          style={{ color: 'rgba(245,245,245,0.45)' }}
        >
          You&apos;ll be notified about client activity here
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mark all read action */}
      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <motion.button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
            className="text-[13px] font-semibold"
            style={{ color: '#C5F74F' }}
          >
            {markAllRead.isPending ? 'Marking…' : 'Mark all read'}
          </motion.button>
        </div>
      )}

      <motion.div
        className="flex flex-col gap-1"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {notifications.map((notification) => (
          <NotificationItem
            key={notification._id}
            notification={notification}
            onPress={handlePress}
          />
        ))}
      </motion.div>
    </div>
  );
}
