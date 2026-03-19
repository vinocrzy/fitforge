// ═══════════════════════════════════════════════════════════════════
// FitForge — Deload Week View
// PT Feature 5: Shows active deload progress, replaces hero card during deload
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import type { Routine, WorkoutSession } from '@/types';

interface DeloadWeekViewProps {
  deloadRoutine: Routine;
  completedSessions: WorkoutSession[];
  targetDuration: number; // days
}

export function DeloadWeekView({
  deloadRoutine,
  completedSessions,
  targetDuration,
}: DeloadWeekViewProps) {
  const router = useRouter();

  // Calculate progress
  const progress = useMemo(() => {
    const sessionsCount = completedSessions.filter(
      (w) => w.routineId === deloadRoutine._id
    ).length;
    return {
      current: sessionsCount,
      total: targetDuration,
      percentage: Math.min((sessionsCount / targetDuration) * 100, 100),
    };
  }, [completedSessions, deloadRoutine._id, targetDuration]);

  const isComplete = progress.current >= progress.total;

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.16 }}
      className="rounded-[20px] p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(94,210,223,0.12), rgba(94,210,223,0.04))',
        border: '1px solid rgba(94,210,223,0.20)',
      }}
    >
      {/* Icon */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(94,210,223,0.20)' }}
        >
          <Icon name="bed.double.fill" size={22} color="#5ED2DF" weight="fill" />
        </div>
        <div>
          <p className="text-[11px] uppercase font-semibold tracking-wider" style={{ color: 'rgba(94,210,223,0.70)' }}>
            DELOAD WEEK
          </p>
          <p className="text-[17px] font-bold" style={{ color: '#5ED2DF' }}>
            {deloadRoutine.name}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-medium" style={{ color: 'rgba(245,245,245,0.65)' }}>
            Deload Day {progress.current} of {progress.total}
          </p>
          <p className="text-[13px] font-bold" style={{ color: '#5ED2DF' }}>
            {Math.round(progress.percentage)}%
          </p>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'rgba(94,210,223,0.15)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#5ED2DF' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>

      {/* Motivational copy */}
      <p
        className="text-[14px] leading-relaxed mb-4"
        style={{ color: 'rgba(245,245,245,0.70)' }}
      >
        {isComplete
          ? '🎉 Deload complete! Your body is recovered and ready.'
          : '💪 Recovery is training. Your CNS is adapting.'}
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        {!isComplete && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={() => router.push(`/session/${deloadRoutine._id}`)}
            className="flex-1 h-[48px] rounded-full font-semibold text-[15px] flex items-center justify-center gap-2"
            style={{
              background: '#5ED2DF',
              color: '#0B0B0B',
            }}
          >
            <Icon name="play.fill" size={16} color="#0B0B0B" weight="fill" />
            Continue Deload
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={springSnappy}
          onClick={() => router.push('/routines')}
          className={`${isComplete ? 'flex-1' : ''} h-[48px] px-5 rounded-full font-medium text-[15px]`}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(245,245,245,0.70)',
          }}
        >
          {isComplete ? 'Return to Training' : 'View All Routines'}
        </motion.button>
      </div>
    </motion.div>
  );
}
