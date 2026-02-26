// ═══════════════════════════════════════════════════════════════════
// FitForge — Profile Tab (placeholder)
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useProfileStore } from '@/store/useProfileStore';

export default function ProfilePage() {
  const { level, xp, streakDays, unitPreference, weightKg, experienceLevel } =
    useProfileStore();
  const displayWeight =
    unitPreference === 'lbs'
      ? `${Math.round(weightKg * 2.20462)} lbs`
      : `${weightKg} kg`;

  return (
    <div className="min-h-screen px-6 pt-16 pb-28 bg-[#0B0B0B]">
      <motion.h1
        className="text-[34px] font-extrabold tracking-tight"
        style={{ color: '#F5F5F5' }}
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springGentle}
      >
        Profile
      </motion.h1>

      <motion.div
        className="mt-8 flex flex-col gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Level', value: String(level), icon: 'star.fill' },
            { label: 'XP', value: String(xp), icon: 'bolt.fill' },
            { label: 'Streak', value: `${streakDays}d`, icon: 'flame.fill' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 py-4 rounded-[16px]"
              style={{ background: '#141414' }}
            >
              <Icon name={stat.icon} size={20} color="#C5F74F" weight="fill" />
              <div
                className="text-[22px] font-bold tabular-nums"
                style={{ color: '#F5F5F5' }}
              >
                {stat.value}
              </div>
              <div
                className="text-[12px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(245,245,245,0.45)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Info Cards */}
        <div
          className="rounded-[16px] p-4 flex flex-col gap-3"
          style={{
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {[
            { label: 'Weight', value: displayWeight },
            { label: 'Experience', value: experienceLevel },
            { label: 'Units', value: unitPreference.toUpperCase() },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span
                className="text-[15px]"
                style={{ color: 'rgba(245,245,245,0.55)' }}
              >
                {row.label}
              </span>
              <span
                className="text-[15px] font-semibold capitalize"
                style={{ color: '#F5F5F5' }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
