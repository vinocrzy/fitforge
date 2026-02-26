// ═══════════════════════════════════════════════════════════════════
// FitForge — Routine Exercise Row
// Draggable exercise config row for routine builder
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy, springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import type { RoutineExerciseConfig, SessionPhase } from '@/types';

interface RoutineExerciseRowProps {
  config: RoutineExerciseConfig;
  exerciseName: string;
  phase: SessionPhase;
  onChange: (updated: RoutineExerciseConfig) => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function RoutineExerciseRow({
  config,
  exerciseName,
  phase,
  onChange,
  onDelete,
  dragHandleProps,
}: RoutineExerciseRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isStretch = phase === 'stretch';

  const summary = isStretch
    ? `${config.sets}×${config.holdSec ?? 30}s hold`
    : `${config.sets}×${config.targetReps ?? 10} reps${config.weightKg ? ` • ${config.weightKg}kg` : ''}`;

  return (
    <motion.div
      layout
      className="rounded-[14px] mb-2 overflow-hidden"
      style={{ background: '#141414' }}
    >
      {/* Main Row */}
      <div
        className="flex items-center h-16 px-3 gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Drag Handle */}
        <div
          className="shrink-0 touch-none"
          {...dragHandleProps}
        >
          <Icon
            name="line.3.horizontal"
            size={18}
            color="rgba(245,245,245,0.30)"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div
            className="text-[17px] font-semibold truncate"
            style={{ color: '#F5F5F5' }}
          >
            {exerciseName}
          </div>
          <div
            className="text-[14px]"
            style={{ color: 'rgba(245,245,245,0.50)' }}
          >
            {summary}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {config.autoWarmUp && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: 'rgba(255,159,10,0.15)',
                color: '#FF9F0A',
              }}
            >
              AWU
            </span>
          )}
          {config.progressionScheme && config.progressionScheme !== 'none' && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize"
              style={{
                background: 'rgba(197,247,79,0.12)',
                color: '#C5F74F',
              }}
            >
              {config.progressionScheme}
            </span>
          )}
          <Icon
            name={expanded ? 'chevron.up' : 'chevron.down'}
            size={14}
            color="rgba(245,245,245,0.30)"
          />
        </div>
      </div>

      {/* Expanded Config */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springGentle}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 flex flex-col gap-3">
              {/* Sets */}
              <ConfigRow
                label="Sets"
                value={config.sets}
                onChange={(v) => onChange({ ...config, sets: v })}
                min={1}
                max={20}
              />

              {/* Reps or Hold */}
              {isStretch ? (
                <ConfigRow
                  label="Hold (sec)"
                  value={config.holdSec ?? 30}
                  onChange={(v) => onChange({ ...config, holdSec: v })}
                  min={5}
                  max={180}
                  step={5}
                />
              ) : (
                <ConfigRow
                  label="Reps"
                  value={config.targetReps ?? 10}
                  onChange={(v) => onChange({ ...config, targetReps: v })}
                  min={1}
                  max={100}
                />
              )}

              {/* Rest */}
              <ConfigRow
                label="Rest (sec)"
                value={config.restTimeSec}
                onChange={(v) => onChange({ ...config, restTimeSec: v })}
                min={0}
                max={600}
                step={15}
              />

              {/* Weight (not stretch) */}
              {!isStretch && (
                <ConfigRow
                  label="Weight (kg)"
                  value={config.weightKg ?? 0}
                  onChange={(v) =>
                    onChange({ ...config, weightKg: v === 0 ? null : v })
                  }
                  min={0}
                  max={500}
                  step={2.5}
                />
              )}

              {/* Progression Scheme (workout only) */}
              {phase === 'workout' && (
                <div className="flex items-center justify-between">
                  <span
                    className="text-[14px]"
                    style={{ color: 'rgba(245,245,245,0.55)' }}
                  >
                    Progression
                  </span>
                  <select
                    value={config.progressionScheme ?? 'none'}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        progressionScheme: e.target.value as RoutineExerciseConfig['progressionScheme'],
                      })
                    }
                    className="bg-transparent text-[14px] font-semibold text-right outline-none appearance-none"
                    style={{ color: '#C5F74F' }}
                  >
                    <option value="none">None</option>
                    <option value="linear">Linear</option>
                    <option value="double">Double Progression</option>
                    <option value="undulating">Undulating</option>
                  </select>
                </div>
              )}

              {/* Auto Warm-Up toggle (workout only, not bodyweight) */}
              {phase === 'workout' && (
                <div className="flex items-center justify-between">
                  <span
                    className="text-[14px]"
                    style={{ color: 'rgba(245,245,245,0.55)' }}
                  >
                    Auto warm-up sets
                  </span>
                  <button
                    onClick={() =>
                      onChange({ ...config, autoWarmUp: !config.autoWarmUp })
                    }
                    className="w-11 h-6 rounded-full relative"
                    style={{
                      background: config.autoWarmUp
                        ? '#C5F74F'
                        : 'rgba(255,255,255,0.10)',
                    }}
                  >
                    <motion.div
                      className="absolute top-0.5 w-5 h-5 rounded-full"
                      animate={{
                        left: config.autoWarmUp ? 22 : 2,
                      }}
                      transition={springSnappy}
                      style={{
                        background: config.autoWarmUp
                          ? '#0B0B0B'
                          : 'rgba(255,255,255,0.60)',
                      }}
                    />
                  </button>
                </div>
              )}

              {/* Delete */}
              <motion.button
                onClick={onDelete}
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                className="flex items-center justify-center gap-2 h-10 rounded-[10px]"
                style={{
                  background: 'rgba(255,59,48,0.10)',
                  color: '#FF3B30',
                }}
              >
                <Icon name="trash.fill" size={16} color="#FF3B30" />
                <span className="text-[14px] font-semibold">Remove</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Config Row (inline stepper) ──────────────────────────────────

function ConfigRow({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <div className="flex items-center justify-between">
      <span
        className="text-[14px]"
        style={{ color: 'rgba(245,245,245,0.55)' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-3">
        <motion.button
          onClick={decrement}
          whileTap={{ scale: 0.85 }}
          transition={springSnappy}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <Icon name="minus" size={14} color="#F5F5F5" />
        </motion.button>
        <span
          className="w-12 text-center tabular-nums text-[16px] font-semibold"
          style={{ color: '#F5F5F5' }}
        >
          {Number.isInteger(value) ? value : value.toFixed(1)}
        </span>
        <motion.button
          onClick={increment}
          whileTap={{ scale: 0.85 }}
          transition={springSnappy}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <Icon name="plus" size={14} color="#F5F5F5" />
        </motion.button>
      </div>
    </div>
  );
}
