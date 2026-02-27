// ═══════════════════════════════════════════════════════════════════
// FitForge — Workout History (S-16)
// Chronological log of past sessions, grouped by week
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import { staggerContainer, fadeUpItem } from '@/lib/motion/variants';
import { formatTimeLong } from '@/lib/calculations/time';
import { Icon } from '@/components/ui/Icon';
import {
  useWorkoutHistory,
  useExercises,
  useRoutines,
  useCustomExercises,
} from '@/hooks/useDatabase';
import type { WorkoutSession, ExerciseRecord } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  if (d >= startOfThisWeek) return 'This Week';
  if (d >= startOfLastWeek) return 'Last Week';

  // Weeks ago
  const weeksAgo = Math.ceil(
    (startOfThisWeek.getTime() - d.getTime()) / (7 * 86400000)
  );
  if (weeksAgo <= 4) return `${weeksAgo} Weeks Ago`;

  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getMuscleChips(
  session: WorkoutSession,
  exerciseRecordMap: Map<string, ExerciseRecord>
): string[] {
  const muscles = new Set<string>();
  [...session.warmUp, ...session.workout, ...session.stretch].forEach((se) => {
    const rec = exerciseRecordMap.get(se.exerciseId);
    if (rec && se.sets.length > 0) {
      muscles.add(rec.target);
    }
  });
  return Array.from(muscles).slice(0, 4); // Max 4
}

// ─── Filter type ──────────────────────────────────────────────────
type FilterMode = 'all' | 'week' | 'month';

// ─── Components ───────────────────────────────────────────────────

function MuscleChip({ label }: { label: string }) {
  return (
    <span
      className="h-[26px] px-2.5 rounded-full flex items-center text-[13px] font-medium capitalize"
      style={{
        background: 'rgba(197,247,79,0.10)',
        color: '#C5F74F',
      }}
    >
      {label}
    </span>
  );
}

function SessionCard({
  session,
  routineName,
  muscleChips,
  hasPRs,
  onPress,
}: {
  session: WorkoutSession;
  routineName: string;
  muscleChips: string[];
  hasPRs: boolean;
  onPress: () => void;
}) {
  const totalSets = [...session.warmUp, ...session.workout, ...session.stretch]
    .reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <motion.div
      variants={fadeUpItem}
      onClick={onPress}
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
      className="rounded-[16px] p-4 relative cursor-pointer"
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {hasPRs && (
        <div className="absolute top-3 right-3">
          <Icon name="trophy.fill" size={16} color="#C5F74F" weight="fill" />
        </div>
      )}
      <p
        className="text-[14px] font-medium"
        style={{ color: 'rgba(245,245,245,0.50)' }}
      >
        {formatDate(session.completedAt)}
      </p>
      <p
        className="text-[17px] font-bold mt-0.5"
        style={{ color: '#F5F5F5' }}
      >
        {routineName}
      </p>
      <p
        className="text-[14px] mt-1 tabular-nums"
        style={{ color: 'rgba(245,245,245,0.55)' }}
      >
        {formatTimeLong(session.summary.totalTimeSec)} •{' '}
        {session.summary.totalCalories} kcal •{' '}
        {totalSets} sets
      </p>
      {muscleChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {muscleChips.slice(0, 3).map((m) => (
            <MuscleChip key={m} label={m} />
          ))}
          {muscleChips.length > 3 && (
            <span
              className="text-[13px] font-medium self-center"
              style={{ color: 'rgba(245,245,245,0.40)' }}
            >
              +{muscleChips.length - 3} more
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// History Page
// ═══════════════════════════════════════════════════════════════════

export default function HistoryPage() {
  const router = useRouter();
  const { data: workouts = [] } = useWorkoutHistory();
  const { data: routines = [] } = useRoutines();
  const { data: libraryExercises = [] } = useExercises();
  const { data: customExercises = [] } = useCustomExercises();
  const [filter, setFilter] = useState<FilterMode>('all');

  // Routine name map
  const routineNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    routines.forEach((r) => {
      map[r._id] = r.name;
    });
    return map;
  }, [routines]);

  // Exercise record map
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

  // Filter workouts
  const filteredWorkouts = useMemo(() => {
    if (filter === 'all') return workouts;

    const now = new Date();
    if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      return workouts.filter((w) => new Date(w.completedAt) >= weekAgo);
    }
    // month
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    return workouts.filter((w) => new Date(w.completedAt) >= monthAgo);
  }, [workouts, filter]);

  // Group by week
  const groupedWorkouts = useMemo(() => {
    const groups: { label: string; sessions: WorkoutSession[] }[] = [];
    const groupMap = new Map<string, WorkoutSession[]>();

    // Sort by completedAt descending
    const sorted = [...filteredWorkouts].sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    sorted.forEach((w) => {
      const label = getWeekLabel(w.completedAt);
      if (!groupMap.has(label)) {
        groupMap.set(label, []);
      }
      groupMap.get(label)!.push(w);
    });

    groupMap.forEach((sessions, label) => {
      groups.push({ label, sessions });
    });

    return groups;
  }, [filteredWorkouts]);

  // Empty state
  if (workouts.length === 0) {
    return (
      <div className="min-h-screen px-6 pt-16 pb-28 bg-[#0B0B0B]">
        <motion.h1
          className="text-[34px] font-extrabold tracking-tight"
          style={{ color: '#F5F5F5' }}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springGentle}
        >
          History
        </motion.h1>

        <motion.div
          className="mt-8 flex flex-col items-center justify-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(197,247,79,0.10)' }}
          >
            <Icon
              name="clock.arrow.circlepath"
              size={28}
              color="#C5F74F"
            />
          </div>
          <p
            className="mt-4 text-[17px] font-semibold"
            style={{ color: '#F5F5F5' }}
          >
            No workouts yet
          </p>
          <p
            className="mt-1 text-[15px] text-center max-w-[260px]"
            style={{ color: 'rgba(245,245,245,0.50)' }}
          >
            Complete your first session to see your history here.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-16 pb-28 bg-[#0B0B0B]">
      {/* Title */}
      <motion.h1
        className="text-[34px] font-extrabold tracking-tight px-2"
        style={{ color: '#F5F5F5' }}
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springGentle}
      >
        History
      </motion.h1>

      {/* Filter Segmented Control */}
      <motion.div
        className="flex gap-1 mt-4 p-1 rounded-[12px]"
        style={{ background: 'rgba(255,255,255,0.06)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {(['all', 'week', 'month'] as FilterMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilter(mode)}
            className="flex-1 py-2 rounded-[10px] text-[14px] font-semibold capitalize transition-colors"
            style={{
              background:
                filter === mode ? 'rgba(197,247,79,0.15)' : 'transparent',
              color:
                filter === mode ? '#C5F74F' : 'rgba(245,245,245,0.50)',
            }}
          >
            {mode === 'all' ? 'All' : mode === 'week' ? 'Week' : 'Month'}
          </button>
        ))}
      </motion.div>

      {/* Grouped Sessions */}
      <motion.div
        className="mt-6 space-y-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {groupedWorkouts.map((group) => (
          <div key={group.label}>
            <span
              className="text-[15px] font-bold uppercase tracking-wider px-1"
              style={{
                color: 'rgba(245,245,245,0.40)',
                letterSpacing: '0.08em',
              }}
            >
              {group.label}
            </span>
            <div className="mt-2 space-y-3">
              {group.sessions.map((session) => {
                const routineName =
                  (session.routineId
                    ? routineNameMap[session.routineId]
                    : null) ?? 'Freestyle';
                const muscles = getMuscleChips(session, exerciseRecordMap);
                const hasPRs =
                  (session.summary.prsAchieved?.length ?? 0) > 0;

                return (
                  <SessionCard
                    key={session._id}
                    session={session}
                    routineName={routineName}
                    muscleChips={muscles}
                    hasPRs={hasPRs}
                    onPress={() =>
                      router.push(`/history/${session._id}`)
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}

        {filteredWorkouts.length === 0 && (
          <motion.p
            className="text-center py-12 text-[15px]"
            style={{ color: 'rgba(245,245,245,0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No workouts found for this period.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
