// ═══════════════════════════════════════════════════════════════════
// FitForge — NotificationBell Component
// Bell icon with unread count badge for trainer nav bar
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useUnreadNotificationCount } from '@/hooks/useTrainerNotifications';

export function NotificationBell(): React.ReactElement {
  const router = useRouter();
  const { data: unread = 0 } = useUnreadNotificationCount();

  return (
    <motion.button
      onClick={() => router.push('/trainer/notifications')}
      whileTap={{ scale: 0.85 }}
      transition={springSnappy}
      className="relative flex items-center justify-center w-10 h-10"
    >
      <Icon
        name={unread > 0 ? 'bell.badge.fill' : 'bell.fill'}
        size={22}
        color={unread > 0 ? '#C5F74F' : 'rgba(245,245,245,0.70)'}
      />
      {unread > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springSnappy}
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
          style={{ background: '#FF3B30', color: '#FFFFFF' }}
        >
          {unread > 99 ? '99+' : unread}
        </motion.span>
      )}
    </motion.button>
  );
}
