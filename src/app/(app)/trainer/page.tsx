// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-04: Trainer Dashboard
// Hub page for trainers: stats, pending requests, client list
// ═══════════════════════════════════════════════════════════════════

'use client';

import { TopBar } from '@/components/layout/TopBar';
import { TrainerDashboard } from '@/components/trainer/TrainerDashboard';

export default function TrainerDashboardPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="Trainer Hub" />

      <div className="px-4 pt-[calc(44px+env(safe-area-inset-top,0px)+8px)] pb-28">
        <TrainerDashboard />
      </div>
    </div>
  );
}
