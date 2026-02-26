// ═══════════════════════════════════════════════════════════════════
// FitForge — Routine Summary Bar
// Floating bar with estimated time + calories per phase
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import type { RoutineExerciseConfig } from '@/types';

interface RoutineSummaryBarProps {
  warmUp: RoutineExerciseConfig[];
  workout: RoutineExerciseConfig[];
  stretch: RoutineExerciseConfig[];
}

function estimatePhaseTime(exercises: RoutineExerciseConfig[]): number {
  return exercises.reduce((total, ex) => {
    const sets = ex.sets;
    const repTime = ex.holdSec ?? (ex.targetReps ?? 10) * 3; // ~3s per rep
    const rest = ex.restTimeSec;
    return total + sets * (repTime + rest);
  }, 0);
}

function estimateCalories(
  exercises: RoutineExerciseConfig[],
  met: number
): number {
  const timeSec = estimatePhaseTime(exercises);
  // MET × 3.5 × weightKg / 200 × (time/60)
  return Math.round(met * 3.5 * 70 / 200 * (timeSec / 60));
}

export function RoutineSummaryBar({
  warmUp,
  workout,
  stretch,
}: RoutineSummaryBarProps) {
  const [expanded, setExpanded] = useState(false);

  const warmUpTime = estimatePhaseTime(warmUp);
  const workoutTime = estimatePhaseTime(workout);
  const stretchTime = estimatePhaseTime(stretch);
  const totalTime = warmUpTime + workoutTime + stretchTime;

  const warmUpCals = estimateCalories(warmUp, 3);
  const workoutCals = estimateCalories(workout, 6);
  const stretchCals = estimateCalories(stretch, 2.5);
  const totalCals = warmUpCals + workoutCals + stretchCals;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    return `${m} min`;
  };

  if (warmUp.length + workout.length + stretch.length === 0) return null;

  return (
    <motion.div
      layout
      onClick={() => setExpanded(!expanded)}
      className="glass rounded-[16px] cursor-pointer"
      style={{ padding: '0 20px' }}
    >
      {/* Compact */}
      <div className="flex items-center justify-between h-[52px]">
        <span className="text-[15px] font-medium" style={{ color: '#F5F5F5' }}>
          Est. {formatTime(totalTime)} • ~{totalCals} kcal
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={springSnappy}
          style={{ color: 'rgba(245,245,245,0.40)' }}
        >
          ▾
        </motion.span>
      </div>

      {/* Expanded Breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springGentle}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 pb-3 border-t border-white/5 pt-2.5">
              <PhaseRow
                label="Warm-Up"
                color="#FF9F0A"
                time={formatTime(warmUpTime)}
                cals={warmUpCals}
              />
              <PhaseRow
                label="Workout"
                color="#C5F74F"
                time={formatTime(workoutTime)}
                cals={workoutCals}
              />
              <PhaseRow
                label="Stretch"
                color="#A18CD1"
                time={formatTime(stretchTime)}
                cals={stretchCals}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PhaseRow({
  label,
  color,
  time,
  cals,
}: {
  label: string;
  color: string;
  time: string;
  cals: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: color }}
        />
        <span className="text-[13px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
          {label}
        </span>
      </div>
      <span
        className="text-[13px] tabular-nums"
        style={{ color: 'rgba(245,245,245,0.45)' }}
      >
        {time} • {cals} kcal
      </span>
    </div>
  );
}
