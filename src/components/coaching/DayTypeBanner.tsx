// ═══════════════════════════════════════════════════════════════════
// FitForge — Undulating Day Type Banner
// PT Feature 3: Shows Heavy/Moderate/Light day indicator for undulating periodization
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Routine, WorkoutSession } from '@/types';
import { calculateDayType, DAY_TYPE_CONFIG } from '@/lib/coaching/undulatingDayType';

interface DayTypeBannerProps {
  routine: Routine | null;
  recentWorkouts: WorkoutSession[];
}

const BANNER_CONFIG = {
  heavy: {
    label: 'Heavy Day',
    gradient: 'linear-gradient(135deg, rgba(255,69,58,0.15), rgba(255,159,10,0.08))',
    border: 'rgba(255,69,58,0.25)',
  },
  moderate: {
    label: 'Moderate Day',
    gradient: 'linear-gradient(135deg, rgba(197,247,79,0.15), rgba(48,209,88,0.08))',
    border: 'rgba(197,247,79,0.25)',
  },
  light: {
    label: 'Light Day',
    gradient: 'linear-gradient(135deg, rgba(100,210,255,0.15), rgba(94,210,223,0.08))',
    border: 'rgba(100,210,255,0.25)',
  },
} as const;

export function DayTypeBanner({ routine, recentWorkouts }: DayTypeBannerProps) {
  const dayType = useMemo(
    () => calculateDayType(routine, recentWorkouts),
    [routine, recentWorkouts]
  );

  if (!dayType) return null;

  const typeConfig = DAY_TYPE_CONFIG[dayType];
  const bannerConfig = BANNER_CONFIG[dayType];

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
      className="rounded-[16px] p-3 flex items-center justify-center gap-2"
      style={{
        background: bannerConfig.gradient,
        border: `1px solid ${bannerConfig.border}`,
      }}
    >
      <span className="text-[18px]">{typeConfig.emoji}</span>
      <p className="text-[14px] font-semibold" style={{ color: typeConfig.color }}>
        Today is a {typeConfig.label} Day
      </p>
    </motion.div>
  );
}
