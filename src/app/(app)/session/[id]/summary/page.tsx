// ═══════════════════════════════════════════════════════════════════
// FitForge — Post-Workout Summary (S-15)
// Session results, stats, PR badges — celebratory screen
// ═══════════════════════════════════════════════════════════════════

'use client';

import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  springGentle,
  springCelebration,
  springSnappy,
} from '@/lib/motion/springs';
import { staggerContainer, fadeUpItem } from '@/lib/motion/variants';
import { formatTimeLong } from '@/lib/calculations/time';
import { useWorkoutHistory } from '@/hooks/useDatabase';
import { useProfileStore } from '@/store/useProfileStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon } from '@/components/ui/Icon';

export default function PostWorkoutSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: workouts = [] } = useWorkoutHistory();
  const profileLevel = useProfileStore((s) => s.level);

  // Get the most recent workout for this routine
  const session = useMemo(() => {
    return workouts.find((w) => w.routineId === id) ?? workouts[0] ?? null;
  }, [workouts, id]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-center">
          <p
            className="text-[17px]"
            style={{ color: 'rgba(245,245,245,0.55)' }}
          >
            No session data found
          </p>
          <motion.button
            onClick={() => router.push('/')}
            whileTap={{ scale: 0.97 }}
            className="mt-4 px-6 h-10 rounded-full text-[15px] font-semibold"
            style={{ background: '#C5F74F', color: '#0B0B0B' }}
          >
            Go Home
          </motion.button>
        </div>
      </div>
    );
  }

  const totalExercises =
    session.warmUp.length + session.workout.length + session.stretch.length;
  const totalSets = [
    ...session.warmUp,
    ...session.workout,
    ...session.stretch,
  ].reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalReps = [
    ...session.warmUp,
    ...session.workout,
    ...session.stretch,
  ].reduce(
    (sum, ex) =>
      sum + ex.sets.reduce((setSum, set) => setSum + (set.actualReps ?? 0), 0),
    0
  );

  // Calculate average RPE from workout sets
  const rpeValues = session.workout
    .flatMap((ex) => ex.sets)
    .map((s) => s.rpe)
    .filter((rpe): rpe is number => rpe !== undefined);
  const avgRpe =
    rpeValues.length > 0
      ? (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1)
      : null;

  // Stub XP earned (Phase 4 will calculate properly)
  const xpEarned = session.summary.xpEarned || Math.round(totalSets * 10 + totalExercises * 5);

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-8">
      {/* Nav */}
      <div
        className="flex items-center justify-between px-4 glass-nav-bar"
        style={{
          height: 'calc(44px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <motion.button
          onClick={() => router.push('/')}
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          className="w-8 h-8 flex items-center justify-center"
        >
          <Icon name="xmark" size={20} color="#F5F5F5" />
        </motion.button>
        <span
          className="text-[17px] font-semibold"
          style={{ color: '#F5F5F5' }}
        >
          Session Complete
        </span>
        <div className="w-8" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="px-4 mt-6 space-y-6"
      >
        {/* XP Celebration */}
        <motion.div
          variants={fadeUpItem}
          className="rounded-[20px] p-6 text-center relative overflow-hidden"
          style={{ background: '#141414' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.2 }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(197,247,79,0.08), transparent 60%)',
            }}
          />
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ ...springCelebration, delay: 0.1 }}
            >
              <span className="text-[40px]">🎉</span>
            </motion.div>
            <p
              className="text-[15px] font-semibold mt-2"
              style={{ color: 'rgba(245,245,245,0.55)' }}
            >
              Great session!
            </p>
            <p
              className="text-[34px] font-extrabold mt-1"
              style={{ color: '#C5F74F' }}
            >
              +{xpEarned} XP
            </p>

            {/* XP Progress Bar */}
            <div className="mt-3 mx-auto max-w-[200px]">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: '#C5F74F' }}
                  initial={{ width: '0%' }}
                  animate={{ width: '65%' }}
                  transition={{ ...springGentle, delay: 0.5, duration: 0.8 }}
                />
              </div>
              <p
                className="text-[12px] mt-1"
                style={{ color: 'rgba(245,245,245,0.40)' }}
              >
                Level {profileLevel}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Session Stats */}
        <motion.div variants={fadeUpItem}>
          <p
            className="text-[15px] font-semibold uppercase mb-3"
            style={{
              color: 'rgba(245,245,245,0.50)',
              letterSpacing: '0.06em',
            }}
          >
            Session Stats
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              value={formatTimeLong(session.summary.totalTimeSec)}
              label="Duration"
              delay={0.7}
            />
            <StatCard
              value={`${session.summary.totalCalories || '—'}`}
              label="Calories"
              suffix=" cal"
              delay={0.78}
            />
            <StatCard
              value={`${totalSets}`}
              label="Total Sets"
              delay={0.86}
            />
            <StatCard
              value={`${totalReps}`}
              label="Total Reps"
              delay={0.94}
            />
          </div>
        </motion.div>

        {/* Phase Breakdown */}
        <motion.div variants={fadeUpItem}>
          <p
            className="text-[15px] font-semibold uppercase mb-3"
            style={{
              color: 'rgba(245,245,245,0.50)',
              letterSpacing: '0.06em',
            }}
          >
            Phase Breakdown
          </p>
          <div className="space-y-2">
            {session.warmUp.length > 0 && (
              <PhaseRow
                label="Warm-Up"
                color="#FF9F0A"
                exerciseCount={session.warmUp.length}
                setCount={session.warmUp.reduce(
                  (s, e) => s + e.sets.length,
                  0
                )}
              />
            )}
            {session.workout.length > 0 && (
              <PhaseRow
                label="Workout"
                color="#C5F74F"
                exerciseCount={session.workout.length}
                setCount={session.workout.reduce(
                  (s, e) => s + e.sets.length,
                  0
                )}
              />
            )}
            {session.stretch.length > 0 && (
              <PhaseRow
                label="Stretch"
                color="#A18CD1"
                exerciseCount={session.stretch.length}
                setCount={session.stretch.reduce(
                  (s, e) => s + e.sets.length,
                  0
                )}
              />
            )}
          </div>
        </motion.div>

        {/* RPE Summary */}
        {avgRpe && (
          <motion.div variants={fadeUpItem}>
            <p
              className="text-[15px] font-semibold uppercase mb-3"
              style={{
                color: 'rgba(245,245,245,0.50)',
                letterSpacing: '0.06em',
              }}
            >
              Intensity
            </p>
            <div
              className="rounded-[14px] p-4 flex items-center gap-4"
              style={{ background: '#141414' }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(197,247,79,0.12)',
                  border: '2px solid rgba(197,247,79,0.30)',
                }}
              >
                <span
                  className="text-[20px] font-extrabold"
                  style={{ color: '#C5F74F' }}
                >
                  {avgRpe}
                </span>
              </div>
              <div>
                <p
                  className="text-[17px] font-semibold"
                  style={{ color: '#F5F5F5' }}
                >
                  Average RPE
                </p>
                <p
                  className="text-[14px]"
                  style={{ color: 'rgba(245,245,245,0.50)' }}
                >
                  {parseFloat(avgRpe) <= 5
                    ? 'Light session'
                    : parseFloat(avgRpe) <= 7
                      ? 'Moderate effort'
                      : 'High intensity'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Done Button */}
        <motion.div
          variants={fadeUpItem}
          className="pt-2"
        >
          <PrimaryButton onClick={() => router.push('/')}>
            DONE
          </PrimaryButton>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  suffix,
  delay = 0,
}: {
  value: string;
  label: string;
  suffix?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="rounded-[20px] p-4"
      style={{ background: '#141414' }}
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...springGentle, delay }}
    >
      <p
        className="text-[28px] font-extrabold tabular-nums"
        style={{ color: '#F5F5F5' }}
      >
        {value}
        {suffix && (
          <span
            className="text-[14px] font-normal"
            style={{ color: 'rgba(245,245,245,0.50)' }}
          >
            {suffix}
          </span>
        )}
      </p>
      <p
        className="text-[13px] mt-0.5"
        style={{ color: 'rgba(245,245,245,0.50)' }}
      >
        {label}
      </p>
    </motion.div>
  );
}

// ─── Phase Row ────────────────────────────────────────────────────

function PhaseRow({
  label,
  color,
  exerciseCount,
  setCount,
}: {
  label: string;
  color: string;
  exerciseCount: number;
  setCount: number;
}) {
  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-[14px]"
      style={{ background: '#141414' }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: color }}
        />
        <span className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>
          {label}
        </span>
      </div>
      <span
        className="text-[13px] tabular-nums"
        style={{ color: 'rgba(245,245,245,0.50)' }}
      >
        {exerciseCount} exercises • {setCount} sets
      </span>
    </div>
  );
}
