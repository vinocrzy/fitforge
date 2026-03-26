// ═══════════════════════════════════════════════════════════════════
// FitForge — ClientWorkoutList Component
// Read-only session history for PT viewing client's workouts
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { springDefault } from '@/lib/motion/springs';
import { staggerContainer, fadeUpItem } from '@/lib/motion/variants';
import { Icon } from '@/components/ui/Icon';
import { useClientWorkouts } from '@/hooks/useClientProgress';
import type { WorkoutSession } from '@/types';

export interface ClientWorkoutListProps {
  clientId: string;
}

function formatDuration(sec: number): string {
  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function WorkoutRow({ workout }: { workout: WorkoutSession }): React.ReactElement {
  const exerciseCount =
    (workout.warmUp?.length ?? 0) +
    (workout.workout?.length ?? 0) +
    (workout.stretch?.length ?? 0);
  const durationSec =
    workout.startedAt && workout.completedAt
      ? Math.round(
          (new Date(workout.completedAt).getTime() - new Date(workout.startedAt).getTime()) / 1000,
        )
      : 0;

  return (
    <motion.div
      variants={fadeUpItem}
      className="rounded-2xl p-4 glass"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] font-semibold truncate"
            style={{ color: '#F5F5F5' }}
          >
            {workout.routineId ?? 'Freestyle Session'}
          </p>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: 'rgba(245,245,245,0.45)' }}
          >
            {formatDate(workout.completedAt)}
          </p>
        </div>
        <div className="text-right ml-3">
          <p className="text-[13px] font-medium" style={{ color: '#F5F5F5' }}>
            {formatDuration(durationSec)}
          </p>
          <p className="text-[12px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
            {exerciseCount} exercises
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mt-3">
        <span className="text-[12px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
          🔥 {Math.round(workout.summary?.totalCalories ?? 0)} cal
        </span>
        {workout.summary?.avgRpe !== undefined && (
          <span className="text-[12px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
            RPE {workout.summary.avgRpe.toFixed(1)}
          </span>
        )}
        {workout.mode && (
          <span className="text-[12px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
            {workout.mode === 'structured' ? 'Structured' : 'Freestyle'}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function ClientWorkoutList({
  clientId,
}: ClientWorkoutListProps): React.ReactElement {
  const { data: workouts, isLoading } = useClientWorkouts({ clientId, limit: 20 });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl glass animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="dumbbell.fill" size={32} className="mx-auto mb-3 opacity-30" />
        <p
          className="text-[15px]"
          style={{ color: 'rgba(245,245,245,0.45)' }}
        >
          No workouts recorded yet
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {workouts.map((workout) => (
        <WorkoutRow key={workout._id} workout={workout} />
      ))}
    </motion.div>
  );
}
