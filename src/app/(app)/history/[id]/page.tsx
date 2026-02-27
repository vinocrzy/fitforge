// ═══════════════════════════════════════════════════════════════════
// FitForge — History Session Detail (S-17)
// Read-only breakdown of a past session with expandable set logs
// ═══════════════════════════════════════════════════════════════════

'use client';

import { use, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import { formatTimeLong } from '@/lib/calculations/time';
import { exercisesToHighlighterData } from '@/lib/calculations/muscleMap';
import {
  useWorkoutHistory,
  useExercises,
  useCustomExercises,
  useRoutines,
} from '@/hooks/useDatabase';
import { Icon } from '@/components/ui/Icon';
import { toTitleCase } from '@/lib/utils/toTitleCase';
import type {
  ExerciseRecord,
  PersonalRecord,
  SessionExercise,
  CompletedSet,
} from '@/types';

const Model = dynamic(() => import('react-body-highlighter'), { ssr: false });

// ─── Exercise Row with Expandable Set Log ─────────────────────────

function ExerciseRow({
  exercise,
  exerciseName,
  prs,
  unitLabel,
}: {
  exercise: SessionExercise;
  exerciseName: string;
  prs: PersonalRecord[];
  unitLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const prExerciseIds = new Set(prs.map((pr) => pr.exerciseId));
  const hasPR = prExerciseIds.has(exercise.exerciseId);

  return (
    <div
      className="rounded-[14px] overflow-hidden"
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[15px] font-semibold"
            style={{ color: '#F5F5F5' }}
          >
            {exerciseName}
          </span>
          {hasPR && (
            <Icon
              name="trophy.fill"
              size={14}
              color="#C5F74F"
              weight="fill"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[13px] tabular-nums"
            style={{ color: 'rgba(245,245,245,0.50)' }}
          >
            {exercise.sets.length} sets
          </span>
          <Icon
            name={expanded ? 'chevron.up' : 'chevron.down'}
            size={14}
            color="rgba(245,245,245,0.40)"
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              {exercise.sets.map((set, idx) => (
                <SetRow
                  key={idx}
                  set={set}
                  setNumber={idx + 1}
                  unitLabel={unitLabel}
                  isPR={isSetPR(set, exercise.exerciseId, prs)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function isSetPR(
  set: CompletedSet,
  exerciseId: string,
  prs: PersonalRecord[]
): boolean {
  return prs.some(
    (pr) =>
      pr.exerciseId === exerciseId &&
      ((pr.type === 'weight' && set.weightKg === pr.value) ||
        (pr.type === 'reps' && set.actualReps === pr.value))
  );
}

function SetRow({
  set,
  setNumber,
  unitLabel,
  isPR,
}: {
  set: CompletedSet;
  setNumber: number;
  unitLabel: string;
  isPR: boolean;
}) {
  const weight = set.weightKg != null ? `${set.weightKg}${unitLabel}` : 'BW';
  const reps = set.actualReps ?? 0;
  const holdSec = set.holdSec;

  return (
    <div
      className="flex items-center h-10 px-4"
      style={{
        borderLeft: '2px solid rgba(255,255,255,0.08)',
        marginLeft: 4,
      }}
    >
      <span
        className="text-[15px] w-14"
        style={{ color: 'rgba(245,245,245,0.50)' }}
      >
        Set {setNumber}
      </span>
      <span
        className="text-[15px] font-semibold flex-1"
        style={{ color: '#F5F5F5' }}
      >
        {holdSec ? `${holdSec}s hold` : `${weight} × ${reps}`}
      </span>
      {set.rpe !== undefined && (
        <span
          className="text-[13px] mr-2"
          style={{ color: 'rgba(245,245,245,0.40)' }}
        >
          RPE {set.rpe}
        </span>
      )}
      {isPR && (
        <Icon name="trophy.fill" size={14} color="#C5F74F" weight="fill" />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// History Detail Page
// ═══════════════════════════════════════════════════════════════════

export default function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const rawId = use(params).id;
  const id = decodeURIComponent(rawId);
  const router = useRouter();
  const { data: workouts = [] } = useWorkoutHistory();
  const { data: libraryExercises = [] } = useExercises();
  const { data: customExercises = [] } = useCustomExercises();
  const { data: routines = [] } = useRoutines();

  const session = useMemo(() => {
    return workouts.find((w) => w._id === id) ?? null;
  }, [workouts, id]);

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
    toTitleCase(exerciseRecordMap.get(exerciseId)?.name ?? 'Unknown Exercise');

  const routineName = useMemo(() => {
    if (!session?.routineId) return 'Freestyle';
    return routines.find((r) => r._id === session.routineId)?.name ?? 'Workout';
  }, [session, routines]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <p style={{ color: 'rgba(245,245,245,0.55)' }}>Session not found</p>
      </div>
    );
  }

  const prsAchieved: PersonalRecord[] = session.summary.prsAchieved ?? [];
  const unitLabel = session.unitPreference === 'lbs' ? 'lbs' : 'kg';
  const avgRpe = session.summary.avgRpe ?? null;
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
      sum + ex.sets.reduce((ss, set) => ss + (set.actualReps ?? 0), 0),
    0
  );

  const completedDate = new Date(session.completedAt).toLocaleDateString(
    'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );

  // Muscle heatmap
  const allExercises: SessionExercise[] = [
    ...session.warmUp,
    ...session.workout,
    ...session.stretch,
  ];
  const highlighterData = exercisesToHighlighterData(
    allExercises,
    exerciseRecordMap
  );

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `FitForge — ${routineName}`,
        text: `Just crushed ${routineName}! ${formatTimeLong(session.summary.totalTimeSec)} • ${session.summary.totalCalories} kcal • ${totalSets} sets`,
      });
    } catch {
      // User cancelled
    }
  };

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
          onClick={() => router.back()}
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          className="w-8 h-8 flex items-center justify-center"
        >
          <Icon name="chevron.left" size={20} color="#C5F74F" />
        </motion.button>
        <div className="text-center">
          <span
            className="text-[17px] font-semibold block"
            style={{ color: '#F5F5F5' }}
          >
            {routineName}
          </span>
          <span
            className="text-[12px]"
            style={{ color: 'rgba(245,245,245,0.50)' }}
          >
            {completedDate}
          </span>
        </div>
        <div className="w-8" />
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Summary Stats */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springGentle}
        >
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              value={formatTimeLong(session.summary.totalTimeSec)}
              label="Duration"
            />
            <StatCard
              value={`${session.summary.totalCalories}`}
              label="Calories"
              suffix=" cal"
            />
            <StatCard value={`${totalSets}`} label="Total Sets" />
            <StatCard value={`${totalReps}`} label="Total Reps" />
          </div>
        </motion.div>

        {/* XP & Streak */}
        <motion.div
          className="rounded-[14px] p-4 flex items-center justify-between"
          style={{ background: '#141414' }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Icon name="bolt.fill" size={18} color="#C5F74F" weight="fill" />
            <span
              className="text-[15px] font-semibold"
              style={{ color: '#C5F74F' }}
            >
              +{session.summary.xpEarned} XP
            </span>
          </div>
          {avgRpe && (
            <span
              className="text-[14px]"
              style={{ color: 'rgba(245,245,245,0.50)' }}
            >
              Avg RPE: {avgRpe.toFixed(1)}
            </span>
          )}
        </motion.div>

        {/* PR Badges */}
        {prsAchieved.length > 0 && (
          <div>
            <SectionLabel text="Personal Records" />
            <div className="flex flex-wrap gap-2 mt-2">
              {prsAchieved.map((pr) => (
                <div
                  key={`${pr.exerciseId}_${pr.type}`}
                  className="flex items-center gap-2 h-10 px-4 rounded-full"
                  style={{
                    background: 'rgba(197,247,79,0.12)',
                    border: '1.5px solid #C5F74F',
                  }}
                >
                  <Icon
                    name="trophy.fill"
                    size={16}
                    color="#C5F74F"
                    weight="fill"
                  />
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: '#C5F74F' }}
                  >
                    {getExerciseName(pr.exerciseId)}{' '}
                    {pr.type === 'weight'
                      ? `${pr.value}${unitLabel}`
                      : pr.type === 'reps'
                        ? `${pr.value} reps`
                        : `${pr.value} vol`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Muscle Heatmap */}
        {highlighterData.length > 0 && (
          <div>
            <SectionLabel text="Muscles Worked" />
            <div
              className="mt-2 rounded-[20px] p-4 flex justify-center gap-2"
              style={{ background: '#141414' }}
            >
              <div className="flex-1 max-w-[140px]">
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
              <div className="flex-1 max-w-[140px]">
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
          </div>
        )}

        {/* Per-Phase Exercise Logs */}
        {session.warmUp.length > 0 && (
          <div>
            <SectionLabel text="Warm-Up" />
            <div className="mt-2 space-y-2">
              {session.warmUp.map((ex) => (
                <ExerciseRow
                  key={ex.exerciseId}
                  exercise={ex}
                  exerciseName={getExerciseName(ex.exerciseId)}
                  prs={prsAchieved}
                  unitLabel={unitLabel}
                />
              ))}
            </div>
          </div>
        )}

        {session.workout.length > 0 && (
          <div>
            <SectionLabel text="Workout" />
            <div className="mt-2 space-y-2">
              {session.workout.map((ex) => (
                <ExerciseRow
                  key={ex.exerciseId}
                  exercise={ex}
                  exerciseName={getExerciseName(ex.exerciseId)}
                  prs={prsAchieved}
                  unitLabel={unitLabel}
                />
              ))}
            </div>
          </div>
        )}

        {session.stretch.length > 0 && (
          <div>
            <SectionLabel text="Stretch" />
            <div className="mt-2 space-y-2">
              {session.stretch.map((ex) => (
                <ExerciseRow
                  key={ex.exerciseId}
                  exercise={ex}
                  exerciseName={getExerciseName(ex.exerciseId)}
                  prs={prsAchieved}
                  unitLabel={unitLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <motion.button
            onClick={handleShare}
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-[15px] font-semibold"
            style={{
              background: '#C5F74F',
              color: '#0B0B0B',
            }}
          >
            Share Workout
          </motion.button>
          {session.routineId && (
            <motion.button
              onClick={() => router.push(`/session/${session.routineId}`)}
              whileTap={{ scale: 0.97 }}
              transition={springSnappy}
              className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-[15px] font-semibold"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#F5F5F5',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              Repeat Workout
            </motion.button>
          )}
        </div>
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
}: {
  value: string;
  label: string;
  suffix?: string;
}) {
  return (
    <div
      className="rounded-[20px] p-4"
      style={{ background: '#141414' }}
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
    </div>
  );
}
