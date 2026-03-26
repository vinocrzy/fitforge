// ═══════════════════════════════════════════════════════════════════
// FitForge — ClientProgressView Component
// Trainer-side client progress overview with stats + charts
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { springDefault } from '@/lib/motion/springs';
import { staggerContainer, fadeUpItem } from '@/lib/motion/variants';
import { VolumeTrendChart } from '@/components/dashboard/VolumeTrendChart';
import { BodyPartChart } from '@/components/dashboard/BodyPartChart';
import { useClientProgress } from '@/hooks/useClientProgress';
import { useClientWorkouts } from '@/hooks/useClientProgress';
import { useExercises } from '@/hooks/useDatabase';
import type { WorkoutSession } from '@/types';

export interface ClientProgressViewProps {
  clientId: string;
}

function StatCard({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <motion.div
      variants={fadeUpItem}
      className="rounded-2xl p-4 glass text-center"
    >
      <p
        className="text-[28px] font-extrabold tracking-tight"
        style={{ color: '#F5F5F5' }}
      >
        {value}
      </p>
      <p
        className="text-[12px] mt-0.5"
        style={{ color: 'rgba(245,245,245,0.45)' }}
      >
        {label}
      </p>
    </motion.div>
  );
}

export function ClientProgressView({
  clientId,
}: ClientProgressViewProps): React.ReactElement {
  const { data: progress, isLoading: progressLoading } = useClientProgress(clientId);
  const { data: workouts } = useClientWorkouts({ clientId, limit: 50 });
  const { data: exercises } = useExercises();

  if (progressLoading) {
    return (
      <div className="space-y-4">
        {/* Loading skeletons */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-4 glass animate-pulse h-20"
            />
          ))}
        </div>
        <div className="rounded-2xl glass animate-pulse h-48" />
        <div className="rounded-2xl glass animate-pulse h-48" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-12">
        <p
          className="text-[15px]"
          style={{ color: 'rgba(245,245,245,0.45)' }}
        >
          No progress data available yet
        </p>
      </div>
    );
  }

  // Cast workouts for chart components
  const workoutSessions = (workouts ?? []) as WorkoutSession[];

  return (
    <motion.div
      className="space-y-5"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Workouts"
          value={String(progress.monthlyWorkoutCount)}
        />
        <StatCard
          label="Compliance"
          value={`${Math.round(progress.complianceRate * 100)}%`}
        />
        <StatCard
          label="PRs"
          value={String(progress.prs.length)}
        />
      </div>

      {/* Streak & Volume */}
      <motion.div variants={fadeUpItem} className="flex gap-3">
        <div className="flex-1 rounded-2xl p-4 glass">
          <p className="text-[12px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
            Current Streak
          </p>
          <p className="text-[22px] font-bold mt-1" style={{ color: '#F5F5F5' }}>
            🔥 {progress.currentStreak} days
          </p>
        </div>
        <div className="flex-1 rounded-2xl p-4 glass">
          <p className="text-[12px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
            Weekly Volume
          </p>
          <p className="text-[22px] font-bold mt-1" style={{ color: '#F5F5F5' }}>
            {Math.round(progress.weeklyVolume).toLocaleString()} cal
          </p>
        </div>
      </motion.div>

      {/* Volume Trend Chart */}
      {workoutSessions.length > 0 && (
        <motion.div variants={fadeUpItem} className="rounded-2xl p-4 glass">
          <h3
            className="text-[15px] font-semibold mb-3"
            style={{ color: '#F5F5F5' }}
          >
            Volume Trend (8 weeks)
          </h3>
          <VolumeTrendChart workouts={workoutSessions} />
        </motion.div>
      )}

      {/* Body Part Chart */}
      {workoutSessions.length > 0 && exercises && exercises.length > 0 && (
        <motion.div variants={fadeUpItem} className="rounded-2xl p-4 glass">
          <h3
            className="text-[15px] font-semibold mb-3"
            style={{ color: '#F5F5F5' }}
          >
            Body Part Focus
          </h3>
          <BodyPartChart workouts={workoutSessions} exercises={exercises} />
        </motion.div>
      )}
    </motion.div>
  );
}
