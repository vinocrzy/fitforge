// ═══════════════════════════════════════════════════════════════════
// FitForge — S-05 Dashboard (Home) — Phase 5 Enhanced
// Real recovery meter, workout calendar, analytics, deload detection
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useProfileStore } from '@/store/useProfileStore';
import { useRoutines, useWorkoutHistory, useExercises } from '@/hooks/useDatabase';
import { useDeloadDetector } from '@/hooks/useDeloadDetector';
import { calculateEnergyScore, calculateVolumeLoadRatio } from '@/lib/calculations/energyMeter';
import {
  weeklyVolume,
  rollingBaselineVolume,
  averageRecentRpe,
} from '@/lib/calculations/analytics';
import { WorkoutCalendar } from '@/components/dashboard/WorkoutCalendar';
import { DailyFeelPrompt } from '@/components/dashboard/DailyFeelPrompt';
import { VolumeTrendChart } from '@/components/dashboard/VolumeTrendChart';
import { BodyPartChart } from '@/components/dashboard/BodyPartChart';
import { DeloadSuggestionCard } from '@/components/dashboard/DeloadSuggestionCard';

// ─── Recovery Meter SVG Ring ──────────────────────────────────────

function RecoveryMeter({ score }: { score: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  const color =
    score >= 75
      ? '#C5F74F'
      : score >= 50
        ? '#64D2FF'
        : score >= 25
          ? '#FF9F0A'
          : '#FF453A';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width={120} height={120} viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={8}
        />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[32px] font-extrabold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
        <span
          className="text-[12px] font-medium -mt-1"
          style={{ color: 'rgba(245,245,245,0.55)' }}
        >
          Recovery
        </span>
      </div>
    </div>
  );
}

// ─── Weekly Activity Strip ────────────────────────────────────────

function WeeklyActivity({ workoutDates }: { workoutDates: string[] }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

  return (
    <div className="flex justify-between">
      {days.map((label, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = dateStr === today.toISOString().split('T')[0];
        const trained = workoutDates.some((d) => d.startsWith(dateStr));

        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: trained
                  ? 'linear-gradient(135deg, #C5F74F, #30D158)'
                  : 'rgba(255,255,255,0.06)',
                border: isToday && !trained ? '2px solid #C5F74F' : 'none',
              }}
            >
              {trained && (
                <Icon name="checkmark.circle.fill" size={18} color="#0B0B0B" weight="fill" />
              )}
            </div>
            <span
              className="text-[11px] font-medium"
              style={{
                color: isToday ? '#C5F74F' : 'rgba(245,245,245,0.45)',
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { streakDays, manualFeelScore } = useProfileStore();
  const { data: routines = [] } = useRoutines();
  const { data: workouts = [] } = useWorkoutHistory();
  const { data: libraryExercises = [] } = useExercises();

  // Real recovery score using calculateEnergyScore
  const recoveryScore = useMemo(() => {
    if (workouts.length === 0) return 100;
    const lastWorkout = workouts[0];
    if (!lastWorkout?.completedAt) return 85;

    const hoursSince =
      (Date.now() - new Date(lastWorkout.completedAt).getTime()) / 3600000;
    const wkVol = weeklyVolume(workouts);
    const baseline = rollingBaselineVolume(workouts);
    const volRatio = calculateVolumeLoadRatio(wkVol, baseline);
    const avgRpe = averageRecentRpe(workouts, 3);

    return calculateEnergyScore(hoursSince, volRatio, avgRpe, manualFeelScore);
  }, [workouts, manualFeelScore]);

  const recoveryLabel =
    recoveryScore >= 75
      ? 'Ready to crush it'
      : recoveryScore >= 50
        ? 'Good to train — monitor RPE'
        : recoveryScore >= 25
          ? 'Take it easy today'
          : 'Rest day recommended';

  // Deload detection
  const deloadRecommendation = useDeloadDetector(workouts, streakDays);

  // Workout dates for weekly strip
  const workoutDates = useMemo(
    () => workouts.map((w) => w.completedAt).filter(Boolean),
    [workouts]
  );

  // Most recent routine
  const latestRoutine = routines[0] ?? null;

  // Quick stats
  const thisMonthWorkouts = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return workouts.filter((w) => {
      const d = new Date(w.completedAt);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [workouts]);

  const totalCalories = thisMonthWorkouts.reduce(
    (acc, w) => acc + (w.summary?.totalCalories ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B] px-4 pt-16 pb-28">
      {/* Greeting */}
      <motion.div
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1
          className="text-[34px] font-extrabold tracking-tight leading-tight"
          style={{ color: '#F5F5F5' }}
        >
          Good{' '}
          {new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 17
              ? 'afternoon'
              : 'evening'}
        </h1>
        <p
          className="text-[17px]"
          style={{ color: 'rgba(245,245,245,0.55)' }}
        >
          Build. Track. Dominate.
        </p>
      </motion.div>

      <motion.div
        className="mt-6 flex flex-col gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Daily Feel Prompt */}
        <DailyFeelPrompt />

        {/* Deload Suggestion */}
        <DeloadSuggestionCard recommendation={deloadRecommendation} />

        {/* Recovery Meter Card */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          className="rounded-[20px] p-5 flex items-center gap-5"
          style={{ background: '#141414' }}
        >
          <RecoveryMeter score={recoveryScore} />
          <div className="flex-1">
            <p
              className="text-[15px] font-semibold"
              style={{
                color:
                  recoveryScore >= 75
                    ? '#C5F74F'
                    : recoveryScore >= 50
                      ? '#64D2FF'
                      : recoveryScore >= 25
                        ? '#FF9F0A'
                        : '#FF453A',
              }}
            >
              Recovery Score
            </p>
            <p
              className="text-[15px] mt-1"
              style={{ color: 'rgba(245,245,245,0.65)' }}
            >
              {recoveryLabel}
            </p>
          </div>
        </motion.div>

        {/* Today's Workout Hero Card */}
        {latestRoutine ? (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.16 }}
            onClick={() => router.push(`/routines/${latestRoutine._id}`)}
            className="relative w-full rounded-[20px] overflow-hidden cursor-pointer"
            style={{ height: 200, background: '#141414' }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, rgba(197,247,79,0.12), rgba(197,247,79,0.03))',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(0,0,0,0.92) 100%)',
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
              <div>
                <SectionLabel text="TODAY'S WORKOUT" />
                <h2
                  className="text-[28px] font-extrabold tracking-tight mt-1"
                  style={{ color: '#F5F5F5' }}
                >
                  {latestRoutine.name}
                </h2>
                <p
                  className="text-[14px]"
                  style={{ color: 'rgba(245,245,245,0.60)' }}
                >
                  {(latestRoutine.warmUp?.length ?? 0) +
                    (latestRoutine.workout?.length ?? 0) +
                    (latestRoutine.stretch?.length ?? 0)}{' '}
                  exercises
                </p>
              </div>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/routines/${latestRoutine._id}`);
                }}
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                className="flex items-center gap-1.5 h-10 px-5 rounded-full glow-primary"
                style={{ background: '#C5F74F' }}
              >
                <Icon name="play.fill" size={14} color="#0B0B0B" weight="fill" />
                <span
                  className="text-[15px] font-semibold"
                  style={{ color: '#0B0B0B' }}
                >
                  START
                </span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.16 }}
            className="rounded-[20px] p-6"
            style={{ background: '#141414' }}
          >
            <SectionLabel text="QUICK START" />
            <p
              className="mt-2 text-[17px]"
              style={{ color: 'rgba(245,245,245,0.65)' }}
            >
              Create your first routine to get started.
            </p>
            <div className="mt-4">
              <PrimaryButton onClick={() => router.push('/routines/new/edit')}>
                CREATE ROUTINE
              </PrimaryButton>
            </div>
          </motion.div>
        )}

        {/* Weekly Activity */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.22 }}
          onClick={() => router.push('/history')}
          className="rounded-[20px] p-5 cursor-pointer"
          style={{ background: '#141414' }}
        >
          <div className="flex items-center justify-between">
            <SectionLabel text="WEEKLY ACTIVITY" />
            <Icon name="chevron.right" size={14} color="rgba(245,245,245,0.30)" />
          </div>
          <div className="mt-3">
            <WeeklyActivity workoutDates={workoutDates} />
          </div>
        </motion.div>

        {/* Workout Calendar (Monthly Heatmap) */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.28 }}
        >
          <WorkoutCalendar workouts={workouts} />
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.34 }}
        >
          <SectionLabel text="QUICK STATS" />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <StatCard
              value={String(thisMonthWorkouts.length)}
              label="Workouts This Mo."
              icon="figure.strengthtraining.traditional"
              color="#F5F5F5"
            />
            <StatCard
              value={totalCalories.toLocaleString()}
              label="kcal Burned"
              icon="flame.fill"
              color="#FF9F0A"
            />
            <StatCard
              value={String(streakDays)}
              label="Day Streak"
              icon="bolt.fill"
              color="#FF9F0A"
            />
            <StatCard
              value={String(Object.keys(useProfileStore.getState().prs).length)}
              label="PRs This Mo."
              icon="trophy.fill"
              color="#C5F74F"
            />
          </div>
        </motion.div>

        {/* Volume Trend Chart */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}
        >
          <VolumeTrendChart workouts={workouts} />
        </motion.div>

        {/* Body Part Frequency Chart */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.46 }}
        >
          <BodyPartChart workouts={workouts} exercises={libraryExercises} />
        </motion.div>

        {/* Browse Exercises */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.52 }}
          onClick={() => router.push('/exercises')}
          className="rounded-[20px] p-4 flex items-center justify-between cursor-pointer"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(197,247,79,0.12)' }}
            >
              <Icon name="figure.strengthtraining.traditional" size={20} color="#C5F74F" weight="fill" />
            </div>
            <div>
              <p className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>Browse Exercises</p>
              <p className="text-[13px]" style={{ color: 'rgba(245,245,245,0.50)' }}>{libraryExercises.length}+ exercises with guides</p>
            </div>
          </div>
          <Icon name="chevron.right" size={16} color="rgba(245,245,245,0.30)" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <span
      className="text-[13px] font-semibold uppercase tracking-wider"
      style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.06em' }}
    >
      {text}
    </span>
  );
}

function StatCard({
  value,
  label,
  icon,
  color,
}: {
  value: string;
  label: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      className="rounded-[20px] p-4 relative"
      style={{ background: '#141414', height: 100 }}
    >
      <div className="absolute top-3 right-3">
        <Icon name={icon} size={22} color={`${color}99`} weight="fill" />
      </div>
      <div
        className="text-[34px] font-extrabold tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
      <div
        className="text-[13px] mt-auto"
        style={{ color: 'rgba(245,245,245,0.55)' }}
      >
        {label}
      </div>
    </div>
  );
}
