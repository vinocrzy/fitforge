// ═══════════════════════════════════════════════════════════════════
// FitForge — Post-Workout Summary (S-15)
// Full celebration choreography with XP, PRs, muscle heatmap, RPE
// ═══════════════════════════════════════════════════════════════════

'use client';

import { use, useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  springGentle,
  springCelebration,
  springSnappy,
} from '@/lib/motion/springs';
import { formatTimeLong } from '@/lib/calculations/time';
import { exercisesToHighlighterData } from '@/lib/calculations/muscleMap';
import {
  useWorkoutHistory,
  useExercises,
  useCustomExercises,
} from '@/hooks/useDatabase';
import { useProfileStore } from '@/store/useProfileStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon } from '@/components/ui/Icon';
import type {
  ExerciseRecord,
  PersonalRecord,
  SessionExercise,
} from '@/types';

// Dynamic import for react-body-highlighter (SSR-incompatible)
const Model = dynamic(() => import('react-body-highlighter'), { ssr: false });

// ─── Level Thresholds (mirror from profile store) ─────────────────
const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 2900, 3500, 4200, 5000,
  5900, 6900, 8000, 9200, 10500, 12000, 13700,
];

function getXPProgress(totalXp: number, level: number) {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 1000;
  const range = nextThreshold - currentThreshold;
  const progress = totalXp - currentThreshold;
  return {
    pct: Math.min(1, progress / range),
    current: progress,
    needed: range,
  };
}

// ─── Confetti Particles ───────────────────────────────────────────

function ConfettiParticles() {
  // Use useState lazy initializer so random values are computed once,
  // outside of the render pass (avoids React Compiler impure-function error).
  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      endY: 60 + Math.random() * 40,
      rotate: Math.random() * 720 - 360,
      scale: 0.5 + Math.random() * 0.8,
      color: ['#C5F74F', '#FF9F0A', '#64D2FF', '#A18CD1', '#30D158'][
        Math.floor(Math.random() * 5)
      ],
      delay: Math.random() * 0.3,
      size: 4 + Math.random() * 6,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
          }}
          initial={{ y: `${p.y}vh`, opacity: 1, rotate: 0, scale: 0 }}
          animate={{
            y: `${p.endY}vh`,
            opacity: [1, 1, 0],
            rotate: p.rotate,
            scale: [0, p.scale, p.scale * 0.3],
          }}
          transition={{
            duration: 2,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── PR Badge ─────────────────────────────────────────────────────

function PRBadge({
  pr,
  exerciseName,
  index,
}: {
  pr: PersonalRecord;
  exerciseName: string;
  index: number;
}) {
  const delta =
    pr.type === 'weight'
      ? `+${pr.value}kg`
      : pr.type === 'reps'
        ? `+${pr.value} reps`
        : `${pr.value} vol`;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigator.vibrate?.([30, 30, 80]);
    }, 1200 + index * 120);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <motion.div
      className="flex items-center gap-2 h-10 px-4 rounded-full"
      style={{
        background: 'rgba(197,247,79,0.12)',
        border: '1.5px solid #C5F74F',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.2, 1], opacity: 1 }}
      transition={{
        ...springCelebration,
        delay: 1.2 + index * 0.12,
      }}
    >
      <Icon name="trophy.fill" size={18} color="#C5F74F" weight="fill" />
      <span
        className="text-[15px] font-semibold whitespace-nowrap"
        style={{ color: '#C5F74F' }}
      >
        {exerciseName} {delta}
      </span>
    </motion.div>
  );
}

// ─── RPE Donut Chart (SVG) ────────────────────────────────────────

function RpeDonut({ rpe, delay }: { rpe: number; delay: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const pct = rpe / 10;
  const offset = circumference * (1 - pct);

  const label =
    rpe <= 5
      ? 'Light session'
      : rpe <= 7
        ? 'Moderate effort'
        : 'High intensity';

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative flex items-center justify-center"
        style={{ width: 96, height: 96 }}
      >
        <svg width={96} height={96} viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={6}
          />
          <motion.circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke="#C5F74F"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ ...springGentle, delay: delay + 0.2, duration: 0.8 }}
            transform="rotate(-90 48 48)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[20px] font-extrabold tabular-nums"
            style={{ color: '#C5F74F' }}
          >
            {rpe.toFixed(1)}
          </span>
        </div>
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
          {label}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Summary Page
// ═══════════════════════════════════════════════════════════════════

export default function PostWorkoutSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: workouts = [] } = useWorkoutHistory();
  const { data: libraryExercises = [] } = useExercises();
  const { data: customExercises = [] } = useCustomExercises();
  const profileXp = useProfileStore((s) => s.xp);
  const profileLevel = useProfileStore((s) => s.level);

  const [showConfetti, setShowConfetti] = useState(true);

  // Hide confetti after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Get the most recent workout for this routine
  const session = useMemo(() => {
    return workouts.find((w) => w.routineId === id) ?? workouts[0] ?? null;
  }, [workouts, id]);

  // Exercise record map for lookups
  const exerciseRecordMap = useMemo(() => {
    const map = new Map<string, ExerciseRecord>();
    libraryExercises.forEach((ex) => map.set(ex.id, ex));
    customExercises.forEach((ex) => {
      map.set(ex._id, {
        id: ex._id,
        name: ex.name,
        bodyPart: ex.bodyPart,
        equipment: ex.equipment,
        target: ex.target,
        secondaryMuscles: ex.secondaryMuscles,
        instructions: ex.instructions,
        description: ex.description,
        difficulty: ex.difficulty,
        category: ex.category,
      });
    });
    return map;
  }, [libraryExercises, customExercises]);

  const getExerciseName = (exerciseId: string): string =>
    exerciseRecordMap.get(exerciseId)?.name ?? 'Unknown Exercise';

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

  // ─── Derived Data ──────────────────────────────────────────────
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
      sum +
      ex.sets.reduce((setSum, set) => setSum + (set.actualReps ?? 0), 0),
    0
  );

  const xpEarned = session.summary.xpEarned || 0;
  const prsAchieved: PersonalRecord[] = session.summary.prsAchieved ?? [];
  const avgRpe = session.summary.avgRpe ?? null;
  const xpProgress = getXPProgress(profileXp, profileLevel);

  // Muscle heatmap data
  const allSessionExercises: SessionExercise[] = [
    ...session.warmUp,
    ...session.workout,
    ...session.stretch,
  ];
  const highlighterData = exercisesToHighlighterData(
    allSessionExercises,
    exerciseRecordMap
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-8">
      {/* Step 1: Confetti particles (0ms) */}
      <AnimatePresence>
        {showConfetti && <ConfettiParticles />}
      </AnimatePresence>

      {/* Nav */}
      <div
        className="flex items-center justify-between px-4 glass-nav-bar relative z-40"
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

      <div className="px-4 mt-6 space-y-6">
        {/* Step 2: Hero Card (200ms) — XP Celebration */}
        <motion.div
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
                'linear-gradient(135deg, rgba(197,247,79,0.10), transparent 60%)',
            }}
          />
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ ...springCelebration, delay: 0.15 }}
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

            {/* Step 3: XP Progress Bar (500ms) */}
            <div className="mt-3 mx-auto max-w-[220px]">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: '#C5F74F' }}
                  initial={{ width: '0%' }}
                  animate={{
                    width: `${Math.round(xpProgress.pct * 100)}%`,
                  }}
                  transition={{
                    ...springGentle,
                    delay: 0.5,
                    duration: 0.8,
                  }}
                />
              </div>
              <p
                className="text-[12px] mt-1.5 tabular-nums"
                style={{ color: 'rgba(245,245,245,0.40)' }}
              >
                Level {profileLevel} — {xpProgress.current}/
                {xpProgress.needed} XP
              </p>
            </div>
          </div>
        </motion.div>

        {/* Step 4: Session Stats (700ms) */}
        <div>
          <SectionLabel text="Session Stats" />
          <div className="grid grid-cols-2 gap-3 mt-3">
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
            <StatCard value={`${totalSets}`} label="Total Sets" delay={0.86} />
            <StatCard
              value={`${totalReps}`}
              label="Total Reps"
              delay={0.94}
            />
          </div>
        </div>

        {/* Phase Breakdown */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 1.0 }}
        >
          <SectionLabel text="Phase Breakdown" />
          <div className="space-y-2 mt-3">
            {session.warmUp.length > 0 && (
              <PhaseRow
                label="Warm-Up"
                color="#FF9F0A"
                exerciseCount={session.warmUp.length}
                setCount={session.warmUp.reduce(
                  (s, e) => s + e.sets.length,
                  0
                )}
                calories={session.summary.warmUpCalories}
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
                calories={session.summary.workoutCalories}
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
                calories={session.summary.stretchCalories}
              />
            )}
          </div>
        </motion.div>

        {/* Step 5: PR Badges (1200ms) */}
        {prsAchieved.length > 0 && (
          <div>
            <SectionLabel text="Personal Records" />
            <div className="flex flex-wrap gap-2 mt-3">
              {prsAchieved.map((pr, i) => (
                <PRBadge
                  key={`${pr.exerciseId}_${pr.type}`}
                  pr={pr}
                  exerciseName={getExerciseName(pr.exerciseId)}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Muscle Heatmap (1600ms) */}
        {highlighterData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...springGentle, delay: 1.6 }}
          >
            <SectionLabel text="Muscles Worked" />
            <div
              className="mt-3 rounded-[20px] p-4 flex justify-center gap-2"
              style={{ background: '#141414' }}
            >
              <div className="flex-1 max-w-[160px]">
                <Model
                  data={highlighterData}
                  style={{ width: '100%' }}
                  bodyColor="rgba(245,245,245,0.08)"
                  highlightedColors={[
                    'rgba(197,247,79,0.25)',
                    'rgba(197,247,79,0.45)',
                    'rgba(197,247,79,0.65)',
                    'rgba(197,247,79,0.85)',
                    '#C5F74F',
                  ]}
                  type="anterior"
                />
                <p
                  className="text-center text-[12px] mt-1"
                  style={{ color: 'rgba(245,245,245,0.40)' }}
                >
                  Front
                </p>
              </div>
              <div className="flex-1 max-w-[160px]">
                <Model
                  data={highlighterData}
                  style={{ width: '100%' }}
                  bodyColor="rgba(245,245,245,0.08)"
                  highlightedColors={[
                    'rgba(197,247,79,0.25)',
                    'rgba(197,247,79,0.45)',
                    'rgba(197,247,79,0.65)',
                    'rgba(197,247,79,0.85)',
                    '#C5F74F',
                  ]}
                  type="posterior"
                />
                <p
                  className="text-center text-[12px] mt-1"
                  style={{ color: 'rgba(245,245,245,0.40)' }}
                >
                  Back
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 7: RPE Donut (2000ms) */}
        {avgRpe !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springGentle, delay: 2.0 }}
          >
            <SectionLabel text="Intensity" />
            <div
              className="mt-3 rounded-[14px] p-4"
              style={{ background: '#141414' }}
            >
              <RpeDonut rpe={avgRpe} delay={2.0} />
            </div>
          </motion.div>
        )}

        {/* Streak indicator */}
        {(session.summary.streakDay ?? 0) > 1 && (
          <motion.div
            className="rounded-[14px] p-4 flex items-center gap-3"
            style={{ background: '#141414' }}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springGentle, delay: 2.2 }}
          >
            <Icon
              name="flame.fill"
              size={22}
              color="#FF9F0A"
              weight="fill"
            />
            <div>
              <p
                className="text-[15px] font-semibold"
                style={{ color: '#F5F5F5' }}
              >
                {session.summary.streakDay} Day Streak!
              </p>
              <p
                className="text-[13px]"
                style={{ color: 'rgba(245,245,245,0.50)' }}
              >
                +{(session.summary.streakDay ?? 0) * 5} bonus XP
              </p>
            </div>
          </motion.div>
        )}

        {/* Done Button */}
        <motion.div
          className="pt-2"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 2.4 }}
        >
          <PrimaryButton onClick={() => router.push('/')}>DONE</PrimaryButton>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────

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

function PhaseRow({
  label,
  color,
  exerciseCount,
  setCount,
  calories,
}: {
  label: string;
  color: string;
  exerciseCount: number;
  setCount: number;
  calories: number;
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
        <span
          className="text-[15px] font-semibold"
          style={{ color: '#F5F5F5' }}
        >
          {label}
        </span>
      </div>
      <span
        className="text-[13px] tabular-nums"
        style={{ color: 'rgba(245,245,245,0.50)' }}
      >
        {exerciseCount} ex • {setCount} sets
        {calories > 0 ? ` • ${calories} cal` : ''}
      </span>
    </div>
  );
}
