// ═══════════════════════════════════════════════════════════════════
// FitForge — Undulating Day Type Banner
// PT Feature 3: Shows Heavy/Moderate/Light day indicator for undulating periodization
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Routine, WorkoutSession } from '@/types';

interface DayTypeBannerProps {
  routine: Routine | null;
  recentWorkouts: WorkoutSession[];
}

type DayType = 'heavy' | 'moderate' | 'light' | null;

const DAY_TYPE_CONFIG = {
  heavy: {
    label: 'Heavy Day',
    emoji: '🏋️',
    gradient: 'linear-gradient(135deg, rgba(255,69,58,0.15), rgba(255,159,10,0.08))',
    border: 'rgba(255,69,58,0.25)',
    textColor: '#FF453A',
  },
  moderate: {
    label: 'Moderate Day',
    emoji: '💪',
    gradient: 'linear-gradient(135deg, rgba(197,247,79,0.15), rgba(48,209,88,0.08))',
    border: 'rgba(197,247,79,0.25)',
    textColor: '#C5F74F',
  },
  light: {
    label: 'Light Day',
    emoji: '💨',
    gradient: 'linear-gradient(135deg, rgba(100,210,255,0.15), rgba(94,210,223,0.08))',
    border: 'rgba(100,210,255,0.25)',
    textColor: '#64D2FF',
  },
};

/**
 * Calculates the current day type based on undulating periodization 3-day cycle
 * Assumes 48h rest between sessions
 */
function calculateDayType(
  routine: Routine | null,
  recentWorkouts: WorkoutSession[]
): DayType {
  if (!routine) return null;

  // Check if routine has any undulating exercises
  const hasUndulating = routine.workout.some(
    (ex) => ex.progressionScheme === 'undulating'
  );

  if (!hasUndulating) return null;

  // Find last completed session for this routine
  const lastSession = recentWorkouts
    .filter((w) => w.routineId === routine._id)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

  if (!lastSession) {
    // First session → start with Heavy
    return 'heavy';
  }

  // Calculate days since last session
  const daysSinceLastSession = Math.floor(
    (Date.now() - new Date(lastSession.completedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // If last session was within 48h, same day type
  if (daysSinceLastSession < 2) {
    // Need to determine what day type the last session was
    // For now, use session count mod 3 as a proxy
    const sessionCount = recentWorkouts.filter((w) => w.routineId === routine._id).length;
    const cyclePosition = sessionCount % 3;
    return cyclePosition === 0 ? 'heavy' : cyclePosition === 1 ? 'moderate' : 'light';
  }

  // Count sessions to determine position in 3-day cycle
  const routineSessionCount = recentWorkouts.filter(
    (w) => w.routineId === routine._id
  ).length;

  const nextCyclePosition = routineSessionCount % 3;

  return nextCyclePosition === 0 ? 'heavy' : nextCyclePosition === 1 ? 'moderate' : 'light';
}

export function DayTypeBanner({ routine, recentWorkouts }: DayTypeBannerProps) {
  const dayType = useMemo(
    () => calculateDayType(routine, recentWorkouts),
    [routine, recentWorkouts]
  );

  if (!dayType) return null;

  const config = DAY_TYPE_CONFIG[dayType];

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
      className="rounded-[16px] p-3 flex items-center justify-center gap-2"
      style={{
        background: config.gradient,
        border: `1px solid ${config.border}`,
      }}
    >
      <span className="text-[18px]">{config.emoji}</span>
      <p className="text-[14px] font-semibold" style={{ color: config.textColor }}>
        Today is a {config.label}
      </p>
    </motion.div>
  );
}
