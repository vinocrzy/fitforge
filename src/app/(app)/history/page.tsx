// ═══════════════════════════════════════════════════════════════════
// FitForge — History Tab (placeholder)
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';

export default function HistoryPage() {
  return (
    <div className="min-h-screen px-6 pt-16 pb-28 bg-[#0B0B0B]">
      <motion.h1
        className="text-[34px] font-extrabold tracking-tight"
        style={{ color: '#F5F5F5' }}
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springGentle}
      >
        History
      </motion.h1>

      <motion.div
        className="mt-8 flex flex-col items-center justify-center py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(197,247,79,0.10)' }}
        >
          <Icon name="clock.arrow.circlepath" size={28} color="#C5F74F" />
        </div>
        <p
          className="mt-4 text-[17px] font-semibold"
          style={{ color: '#F5F5F5' }}
        >
          No workouts yet
        </p>
        <p
          className="mt-1 text-[15px] text-center max-w-[260px]"
          style={{ color: 'rgba(245,245,245,0.50)' }}
        >
          Complete your first session to see your history here.
        </p>
      </motion.div>
    </div>
  );
}
