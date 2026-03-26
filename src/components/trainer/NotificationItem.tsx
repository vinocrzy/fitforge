// ═══════════════════════════════════════════════════════════════════
// FitForge — NotificationItem Component
// Individual notification row with read/unread styling
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { fadeUpItem } from '@/lib/motion/variants';
import { Icon } from '@/components/ui/Icon';
import type { TrainerNotification, TrainerNotificationType } from '@/types';

export interface NotificationItemProps {
  notification: TrainerNotification;
  onPress?: (notification: TrainerNotification) => void;
}

const NOTIFICATION_ICONS: Record<TrainerNotificationType, { icon: string; color: string }> = {
  new_connection_request: { icon: 'person.crop.circle.fill', color: '#30D158' },
  connection_ended: { icon: 'person.crop.circle.fill', color: '#FF453A' },
  suggestion_accepted: { icon: 'checkmark.circle.fill', color: '#C5F74F' },
  suggestion_declined: { icon: 'xmark.circle.fill', color: '#FF9F0A' },
  client_workout_completed: { icon: 'dumbbell.fill', color: '#64D2FF' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationItem({
  notification,
  onPress,
}: NotificationItemProps): React.ReactElement {
  const config = NOTIFICATION_ICONS[notification.notificationType] ?? {
    icon: 'bell.fill',
    color: 'rgba(245,245,245,0.55)',
  };

  return (
    <motion.button
      variants={fadeUpItem}
      onClick={() => onPress?.(notification)}
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
      className="w-full text-left flex items-start gap-3 p-4 rounded-2xl"
      style={{
        background: notification.read ? 'transparent' : 'rgba(197,247,79,0.04)',
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${config.color}15` }}
      >
        <Icon name={config.icon} size={20} color={config.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="text-[15px] truncate"
            style={{
              color: '#F5F5F5',
              fontWeight: notification.read ? 400 : 600,
            }}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: '#C5F74F' }}
            />
          )}
        </div>
        <p
          className="text-[13px] mt-0.5 line-clamp-2"
          style={{ color: 'rgba(245,245,245,0.55)' }}
        >
          {notification.body}
        </p>
        <p
          className="text-[12px] mt-1"
          style={{ color: 'rgba(245,245,245,0.35)' }}
        >
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </motion.button>
  );
}
