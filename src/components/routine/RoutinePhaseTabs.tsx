// ═══════════════════════════════════════════════════════════════════
// FitForge — Routine Phase Tabs (Warm-Up | Workout | Stretch)
// Animated tab indicator with layoutId
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import type { SessionPhase } from '@/types';

const PHASES: {
  id: SessionPhase;
  label: string;
  icon: string;
  color: string;
}[] = [
  { id: 'warmUp', label: 'Warm-Up', icon: 'flame.fill', color: '#FF9F0A' },
  {
    id: 'workout',
    label: 'Workout',
    icon: 'figure.strengthtraining.traditional',
    color: '#C5F74F',
  },
  {
    id: 'stretch',
    label: 'Stretch',
    icon: 'figure.flexibility',
    color: '#A18CD1',
  },
];

interface RoutinePhaseTabsProps {
  activePhase: SessionPhase;
  onPhaseChange: (phase: SessionPhase) => void;
  counts?: Record<SessionPhase, number>;
}

export function RoutinePhaseTabs({
  activePhase,
  onPhaseChange,
  counts,
}: RoutinePhaseTabsProps) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-[14px]"
      style={{ background: '#141414' }}
    >
      {PHASES.map((phase) => {
        const isActive = activePhase === phase.id;
        const count = counts?.[phase.id] ?? 0;
        return (
          <button
            key={phase.id}
            onClick={() => onPhaseChange(phase.id)}
            className="relative flex-1 h-9 flex items-center justify-center gap-1.5 rounded-[10px] text-[14px] font-semibold"
            style={{
              color: isActive ? '#0B0B0B' : 'rgba(245,245,245,0.55)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="phase-tab"
                className="absolute inset-0 rounded-[10px]"
                style={{ background: '#C5F74F' }}
                transition={springSnappy}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon
                name={phase.icon}
                size={15}
                color={isActive ? '#0B0B0B' : phase.color}
                weight="fill"
              />
              {phase.label}
              {count > 0 && (
                <span
                  className="text-[11px] font-bold"
                  style={{ opacity: isActive ? 0.6 : 0.4 }}
                >
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
