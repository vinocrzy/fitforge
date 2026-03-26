// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-12: Trainer Notification Center
// Full notification feed for trainers
// ═══════════════════════════════════════════════════════════════════

'use client';

import { TopBar } from '@/components/layout/TopBar';
import { NotificationList } from '@/components/trainer/NotificationList';

export default function TrainerNotificationsPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="Notifications" showBack />

      <div className="px-4 pt-[calc(44px+env(safe-area-inset-top,0px)+8px)] pb-28">
        <NotificationList />
      </div>
    </div>
  );
}
