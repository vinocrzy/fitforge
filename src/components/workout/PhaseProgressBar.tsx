// ═══════════════════════════════════════════════════════════════════
// FitForge — PhaseProgressBar
// 3-segment visual indicator for workout phase progression
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import type { SessionPhase } from '@/types';

const PHASES: { key: SessionPhase; label: string; activeColor: string; completeColor: string }[] = [
  { key: 'warmUp', label: 'WARM-UP', activeColor: '#C5F74F', completeColor: 'rgba(197,247,79,0.25)' },
  { key: 'workout', label: 'WORKOUT', activeColor: '#C5F74F', completeColor: 'rgba(197,247,79,0.25)' },
  { key: 'stretch', label: 'STRETCH', activeColor: '#A18CD1', completeColor: 'rgba(161,140,209,0.25)' },
];

interface PhaseProgressBarProps {
  currentPhase: SessionPhase;
  /** Fraction 0–1 of progress within the current phase */
  phaseProgress?: number;
}

export function PhaseProgressBar({ currentPhase, phaseProgress = 0 }: PhaseProgressBarProps) {
  const phaseOrder: SessionPhase[] = ['warmUp', 'workout', 'stretch'];
  const currentIdx = phaseOrder.indexOf(currentPhase);

  return (
    <div className="px-4 py-3">
      {/* Bar segments */}
      <div className="flex gap-1">
        {PHASES.map((phase, i) => {
          const isActive = i === currentIdx;
          const isComplete = i < currentIdx;
          const isUpcoming = i > currentIdx;

          return (
            <div
              key={phase.key}
              className="flex-1 h-1 rounded-full overflow-hidden"
              style={{
                background: isUpcoming
                  ? 'rgba(255,255,255,0.12)'
                  : isComplete
                    ? phase.completeColor
                    : 'rgba(255,255,255,0.12)',
              }}
            >
              {isActive && (
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: phase.activeColor }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.max(5, phaseProgress * 100)}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              )}
              {isComplete && (
                <div
                  className="h-full w-full rounded-full"
                  style={{ background: phase.activeColor }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Phase labels */}
      <div className="flex gap-1 mt-1.5">
        {PHASES.map((phase, i) => {
          const isActive = i === currentIdx;
          const isComplete = i < currentIdx;

          return (
            <span
              key={phase.key}
              className="flex-1 text-[13px] font-semibold uppercase text-center"
              style={{
                letterSpacing: '0.05em',
                color: isActive
                  ? phase.activeColor
                  : isComplete
                    ? 'rgba(245,245,245,0.40)'
                    : 'rgba(245,245,245,0.20)',
              }}
            >
              {phase.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
