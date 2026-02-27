// ═══════════════════════════════════════════════════════════════════
// FitForge — ActiveSetCard
// Large exercise card with GIF and current set info
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { springDefault } from '@/lib/motion/springs';
import { ExerciseGif } from '@/components/ui/ExerciseGif';
import type { SessionPhase } from '@/types';

interface ActiveSetCardProps {
  exerciseId: string;
  exerciseName: string;
  isCustom: boolean;
  setsLabel: string;
  currentSet: number;
  totalSets: number;
  phase: SessionPhase;
}

const PHASE_ACCENT: Record<SessionPhase, string> = {
  warmUp: '#FF9F0A',
  workout: '#C5F74F',
  stretch: '#A18CD1',
};

export function ActiveSetCard({
  exerciseId,
  exerciseName,
  isCustom,
  setsLabel,
  currentSet,
  totalSets,
  phase,
}: ActiveSetCardProps) {
  const accent = PHASE_ACCENT[phase];

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={exerciseId}
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '-100%', opacity: 0 }}
        transition={springDefault}
        className="rounded-[20px] overflow-hidden"
        style={{
          background: '#141414',
          borderLeft: phase === 'workout' ? `2px solid ${accent}` : undefined,
        }}
      >
        {/* GIF */}
        <div className="relative" style={{ height: 240 }}>
          <ExerciseGif
            exerciseId={isCustom ? '' : exerciseId}
            alt={exerciseName}
            animated
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 50%, #141414 100%)',
            }}
          />
        </div>

        {/* Info */}
        <div className="px-4 pb-4 -mt-8 relative">
          <h2
            className="text-[28px] font-extrabold tracking-tight"
            style={{ color: '#F5F5F5' }}
          >
            {exerciseName}
          </h2>
          <p
            className="text-[17px] mt-0.5"
            style={{ color: 'rgba(245,245,245,0.55)' }}
          >
            {setsLabel}
          </p>

          {/* Set progress bar */}
          <div className="flex items-center gap-2 mt-3">
            <div
              className="flex-1 h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: accent }}
                initial={{ width: '0%' }}
                animate={{
                  width: `${((currentSet) / totalSets) * 100}%`,
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{ color: 'rgba(245,245,245,0.50)' }}
            >
              {currentSet}/{totalSets}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
