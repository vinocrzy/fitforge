// ═══════════════════════════════════════════════════════════════════
// FitForge — Workout Execution Page (S-10 / S-11 / S-12)
// Three-phase session flow: warmUp → workout → stretch
// ═══════════════════════════════════════════════════════════════════

'use client';

import { use, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { useSessionStore } from '@/store/useSessionStore';
import { useProfileStore } from '@/store/useProfileStore';
import {
  useRoutine,
  useExercises,
  useCustomExercises,
  useSaveWorkout,
} from '@/hooks/useDatabase';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import { formatTimeLong } from '@/lib/calculations/time';
import { calculatePhaseCalories } from '@/lib/calculations/calories';
import { detectPRs } from '@/lib/calculations/prs';
import { calculateSessionXP } from '@/lib/calculations/xp';
import { Icon } from '@/components/ui/Icon';
import { PhaseProgressBar } from '@/components/workout/PhaseProgressBar';
import { ActiveSetCard } from '@/components/workout/ActiveSetCard';
import { RepCounter } from '@/components/workout/RepCounter';
import { WeightSelector } from '@/components/workout/WeightSelector';
import { HoldTimer } from '@/components/workout/HoldTimer';
import { RestTimer } from '@/components/workout/RestTimer';
import { PhaseTransitionBanner } from '@/components/workout/PhaseTransitionBanner';
import { RpePrompt } from '@/components/workout/RpePrompt';
import type {
  SessionPhase,
  CompletedSet,
  ActiveExercise,
  WorkoutSession,
  SessionExercise,
  ExerciseRecord,
} from '@/types';

const PHASE_ACCENT: Record<SessionPhase, string> = {
  warmUp: '#FF9F0A',
  workout: '#C5F74F',
  stretch: '#A18CD1',
};

export default function WorkoutExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Load routine data
  const { data: routine } = useRoutine(id);
  const { data: libraryExercises = [] } = useExercises();
  const { data: customExercises = [] } = useCustomExercises();
  const saveWorkout = useSaveWorkout();
  const unitPreference = useProfileStore((s) => s.unitPreference);

  // Session store
  const {
    sessionId,
    currentPhase,
    currentExerciseIndex,
    currentSetIndex,
    warmUp,
    workout,
    stretch,
    startedAt,
    isPaused,
    isResting,
    startSession,
    completeSet,
    startRest,
    skipRest,
    advancePhase,
    pauseSession,
    resumeSession,
    endSession,
    reset,
  } = useSessionStore();

  // Local state
  const [repCount, setRepCount] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [showRpe, setShowRpe] = useState(false);
  const [lastRpe, setLastRpe] = useState<number | undefined>(undefined);
  const [phaseStartTime, setPhaseStartTime] = useState<number>(() => Date.now());
  const [showTransition, setShowTransition] = useState(false);
  const [completedPhaseForTransition, setCompletedPhaseForTransition] =
    useState<SessionPhase>('warmUp');
  const [phaseElapsedSec, setPhaseElapsedSec] = useState(0); // Elapsed time
  const elapsed = useElapsedTime(startedAt, isPaused);

  // Exercise name map
  const exerciseNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    libraryExercises.forEach((ex) => {
      map[ex.id] = ex.name;
    });
    customExercises.forEach((ex) => {
      map[ex._id] = ex.name;
    });
    return map;
  }, [libraryExercises, customExercises]);

  // Start session on mount
  useEffect(() => {
    if (!sessionId && routine) {
      startSession(routine);
    }
  }, [routine, sessionId, startSession]);

  // Current phase exercises
  const phaseExercises: ActiveExercise[] = useMemo(() => {
    switch (currentPhase) {
      case 'warmUp': return warmUp;
      case 'workout': return workout;
      case 'stretch': return stretch;
      default: return [];
    }
  }, [currentPhase, warmUp, workout, stretch]);

  const currentExercise = phaseExercises[currentExerciseIndex] ?? null;

  // Phase progress
  const phaseProgress = useMemo(() => {
    if (phaseExercises.length === 0) return 0;
    const completed = phaseExercises.filter((e) => e.isComplete).length;
    const currentProg = currentExercise
      ? currentExercise.completedSets.length / currentExercise.targetSets
      : 0;
    return (completed + currentProg * (1 / phaseExercises.length)) / phaseExercises.length;
  }, [phaseExercises, currentExercise]);

  // Sync rep count & weight when exercise or set changes (state-based comparison)\n  const [prevExerciseKey, setPrevExerciseKey] = useState('');\n  const exerciseKey = currentExercise\n    ? `${currentExercise.exerciseId}_${currentSetIndex}`\n    : '';\n  if (exerciseKey && exerciseKey !== prevExerciseKey) {\n    setPrevExerciseKey(exerciseKey);\n    setRepCount(currentExercise?.targetReps ?? 0);\n    setCurrentWeight(currentExercise?.weightKg ?? 0);\n  }

  const getExerciseName = useCallback(
    (exerciseId: string) => exerciseNameMap[exerciseId] ?? 'Unknown Exercise',
    [exerciseNameMap]
  );

  // Check if current exercise is the last in the phase
  const isLastExercise = currentExerciseIndex >= phaseExercises.length - 1;
  const isLastSet = currentExercise
    ? currentExercise.completedSets.length >= currentExercise.targetSets - 1
    : false;

  // Get next exercise info (for rest timer preview)
  const getNextExerciseInfo = useCallback(() => {
    if (!isLastSet) {
      // Same exercise, next set
      return currentExercise
        ? { name: getExerciseName(currentExercise.exerciseId), config: `Set ${currentSetIndex + 2}` }
        : null;
    }
    if (!isLastExercise) {
      const next = phaseExercises[currentExerciseIndex + 1];
      if (next) {
        const name = getExerciseName(next.exerciseId);
        const config = next.holdSec
          ? `${next.targetSets}×${next.holdSec}s hold`
          : `${next.targetSets}×${next.targetReps ?? '?'}`;
        return { name, config };
      }
    }
    return null;
  }, [
    currentExercise,
    currentExerciseIndex,
    currentSetIndex,
    isLastExercise,
    isLastSet,
    phaseExercises,
    getExerciseName,
  ]);

  // ─── Calculate Completion Rate ─────────────────────────────────
  const calculateCompletionRate = useCallback(() => {
    const allExercises = [...warmUp, ...workout, ...stretch];
    if (allExercises.length === 0) return 1;
    const totalSets = allExercises.reduce((acc, e) => acc + e.targetSets, 0);
    const completedSets = allExercises.reduce(
      (acc, e) => acc + e.completedSets.length,
      0
    );
    return totalSets > 0 ? completedSets / totalSets : 1;
  }, [warmUp, workout, stretch]);

  // ─── Handle End Session ────────────────────────────────────────
  const doEndSession = useCallback(() => {
    if (!sessionId) return;

    const summary = endSession();
    const profileState = useProfileStore.getState();
    const userWeightKg = profileState.weightKg;

    // Build workout session document
    const buildSessionExercises = (exercises: ActiveExercise[]): SessionExercise[] =>
      exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        isCustom: ex.isCustom,
        sets: ex.completedSets,
      }));

    // ─── Calculate real calories ─────────────────────────────────
    const exerciseRecordMap = new Map<string, ExerciseRecord>();
    libraryExercises.forEach((ex) => exerciseRecordMap.set(ex.id, ex));
    customExercises.forEach((ex) => {
      exerciseRecordMap.set(ex._id, {
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

    const allCalorieInput = [
      ...warmUp.map((ex) => ({
        exerciseRecord: exerciseRecordMap.get(ex.exerciseId) ?? null,
        sets: ex.completedSets,
        phase: 'warmUp' as SessionPhase,
      })),
      ...workout.map((ex) => ({
        exerciseRecord: exerciseRecordMap.get(ex.exerciseId) ?? null,
        sets: ex.completedSets,
        phase: 'workout' as SessionPhase,
      })),
      ...stretch.map((ex) => ({
        exerciseRecord: exerciseRecordMap.get(ex.exerciseId) ?? null,
        sets: ex.completedSets,
        phase: 'stretch' as SessionPhase,
      })),
    ];

    // Average RPE from workout sets
    const allWorkoutRpes = workout
      .flatMap((ex) => ex.completedSets)
      .map((s) => s.rpe)
      .filter((r): r is number => r !== undefined);
    const avgRpe = allWorkoutRpes.length > 0
      ? allWorkoutRpes.reduce((a, b) => a + b, 0) / allWorkoutRpes.length
      : undefined;

    const phaseCalories = calculatePhaseCalories(allCalorieInput, userWeightKg, avgRpe);

    // ─── Detect PRs ──────────────────────────────────────────────
    const completedSetData = workout
      .flatMap((ex) =>
        ex.completedSets.map((s) => ({
          exerciseId: ex.exerciseId,
          weightKg: s.weightKg ?? 0,
          actualReps: s.actualReps ?? 0,
        }))
      )
      .filter((s) => s.weightKg > 0 && s.actualReps > 0);

    const newPRs = detectPRs(completedSetData, profileState.prs);

    // ─── Update profile: streak, PRs, XP ─────────────────────────
    profileState.incrementStreak();

    newPRs.forEach((pr) => {
      useProfileStore.getState().updatePR(pr.exerciseId, pr);
    });

    const exerciseCount =
      warmUp.filter((e) => e.completedSets.length > 0).length +
      workout.filter((e) => e.completedSets.length > 0).length +
      stretch.filter((e) => e.completedSets.length > 0).length;
    const completionRate = calculateCompletionRate();
    const streakDay = useProfileStore.getState().streakDays;

    const intensityScore = avgRpe
      ? Math.round(avgRpe * completionRate * 10)
      : 0;

    const fullSummary = {
      ...summary,
      totalTimeSec: elapsed,
      totalCalories: phaseCalories.total,
      warmUpCalories: phaseCalories.warmUp,
      workoutCalories: phaseCalories.workout,
      stretchCalories: phaseCalories.stretch,
      exerciseCount,
      completionRate,
      streakDay,
      intensityScore,
      avgRpe: avgRpe ? Math.round(avgRpe * 10) / 10 : undefined,
      prsAchieved: newPRs,
      xpEarned: 0, // placeholder, calculated below
    };

    const xpEarned = calculateSessionXP(fullSummary, newPRs);
    fullSummary.xpEarned = xpEarned;

    // Add XP to profile
    useProfileStore.getState().addXP(xpEarned);

    const workoutSession: WorkoutSession = {
      _id: `workout_${new Date().toISOString()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'workout_session',
      routineId: id,
      startedAt: startedAt?.toISOString() ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      mode: 'structured',
      unitPreference,
      warmUp: buildSessionExercises(warmUp),
      workout: buildSessionExercises(workout),
      stretch: buildSessionExercises(stretch),
      summary: fullSummary,
    };

    saveWorkout.mutate(workoutSession, {
      onSuccess: () => {
        reset();
        router.push(`/session/${id}/summary`);
      },
    });
  }, [sessionId, endSession, id, startedAt, unitPreference, warmUp, workout, stretch, elapsed, calculateCompletionRate, saveWorkout, reset, router, libraryExercises, customExercises]);

  // ─── Handle Phase Completion ───────────────────────────────────
  const handlePhaseComplete = useCallback(() => {
    const phaseOrder: SessionPhase[] = ['warmUp', 'workout', 'stretch'];
    const currentIdx = phaseOrder.indexOf(currentPhase);

    if (currentIdx >= phaseOrder.length - 1) {
      // All phases done — end session
      doEndSession();
      return;
    }

    // Skip to next phase if it has no exercises
    const nextPhase = phaseOrder[currentIdx + 1];
    const nextPhaseExercises =
      nextPhase === 'warmUp'
        ? warmUp
        : nextPhase === 'workout'
          ? workout
          : stretch;

    if (nextPhaseExercises.length === 0) {
      // Skip empty phases
      advancePhase();
      return;
    }

    setCompletedPhaseForTransition(currentPhase);
    setPhaseElapsedSec(Math.round((Date.now() - phaseStartTime) / 1000));
    setShowTransition(true);
  }, [currentPhase, warmUp, workout, stretch, phaseStartTime, advancePhase, doEndSession]);

  // ─── Handle Set Completion ─────────────────────────────────────
  const handleCompleteSet = useCallback(() => {
    if (!currentExercise) return;

    navigator.vibrate?.(50);

    const completedSetData: CompletedSet = {
      setNumber: currentSetIndex + 1,
      targetReps: currentExercise.targetReps,
      actualReps: currentPhase === 'stretch' ? undefined : repCount,
      holdSec: currentPhase === 'stretch' ? (currentExercise.holdSec ?? 30) : undefined,
      weightKg: currentPhase === 'stretch' ? null : currentWeight || null,
      rpe: lastRpe,
      completedAt: new Date().toISOString(),
    };

    completeSet(completedSetData);

    // Determine what happens next
    const wasLastSet =
      currentExercise.completedSets.length >= currentExercise.targetSets - 1;
    const wasLastExercise =
      currentExerciseIndex >= phaseExercises.length - 1;

    if (wasLastSet && wasLastExercise) {
      // Phase complete — show transition
      handlePhaseComplete();
    } else if (currentExercise.restTimeSec > 0) {
      // Start rest timer
      startRest(currentExercise.restTimeSec);
    }

    // Show RPE prompt for workout phase only
    if (currentPhase === 'workout') {
      setTimeout(() => setShowRpe(true), 1000);
    }

    setLastRpe(undefined);
  }, [
    currentExercise,
    currentExerciseIndex,
    currentPhase,
    currentSetIndex,
    currentWeight,
    lastRpe,
    phaseExercises.length,
    repCount,
    completeSet,
    startRest,
    handlePhaseComplete,
  ]);

  // ─── Phase transition handlers ─────────────────────────────────
  const handleTransitionContinue = useCallback(() => {
    setShowTransition(false);
    advancePhase();
    setPhaseStartTime(Date.now());
  }, [advancePhase]);

  // ─── Rest complete handler ─────────────────────────────────────
  const handleRestComplete = useCallback(() => {
    skipRest();
  }, [skipRest]);

  // ─── RPE handler ───────────────────────────────────────────────
  const handleRpeSelect = useCallback((rpe: number) => {
    setLastRpe(rpe);
    setShowRpe(false);
  }, []);

  // ─── End session early ─────────────────────────────────────────
  const handleEndSessionEarly = useCallback(() => {
    if (confirm('End workout early? Your progress will be saved.')) {
      doEndSession();
    }
  }, [doEndSession]);

  // ─── Pause/resume ──────────────────────────────────────────────
  const togglePause = useCallback(() => {
    if (isPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
  }, [isPaused, pauseSession, resumeSession]);

  // ─── Loading / no session ──────────────────────────────────────
  if (!sessionId || !currentExercise) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-transparent rounded-full mx-auto mb-4"
            style={{ borderTopColor: '#C5F74F' }}
          />
          <p style={{ color: 'rgba(245,245,245,0.55)' }}>
            Preparing your workout…
          </p>
        </div>
      </div>
    );
  }

  const isStretch = currentPhase === 'stretch';
  const exerciseName = getExerciseName(currentExercise.exerciseId);
  const accent = PHASE_ACCENT[currentPhase];
  const setsLabel = isStretch
    ? `${currentExercise.targetSets}×${currentExercise.holdSec ?? 30}s hold`
    : `${currentExercise.targetSets}×${currentExercise.targetReps ?? '?'} reps`;
  const isLastSetOfExercise =
    isLastSet && isLastExercise;
  const completeButtonText = isLastSetOfExercise
    ? currentPhase === 'stretch'
      ? 'FINISH SESSION'
      : 'FINISH PHASE →'
    : isLastSet
      ? 'FINISH EXERCISE →'
      : isStretch
        ? 'HELD IT'
        : 'DONE WITH SET';

  // Next exercise queue items (remaining in this phase)
  const queueExercises = phaseExercises.slice(currentExerciseIndex + 1);

  const nextInfo = getNextExerciseInfo();

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-4">
      {/* Nav Bar */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 glass-nav-bar"
        style={{
          height: 'calc(44px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Close / End session */}
          <motion.button
            onClick={handleEndSessionEarly}
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
            FitForge
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Pause / Resume */}
          <motion.button
            onClick={togglePause}
            whileTap={{ scale: 0.9 }}
            transition={springSnappy}
            className="w-8 h-8 flex items-center justify-center"
          >
            <Icon
              name={isPaused ? 'play.fill' : 'pause.fill'}
              size={18}
              color="#C5F74F"
            />
          </motion.button>

          {/* Elapsed Timer */}
          <span
            className="text-[17px] font-semibold tabular-nums"
            style={{ color: 'rgba(245,245,245,0.60)' }}
          >
            {formatTimeLong(elapsed)}
          </span>
        </div>
      </div>

      {/* Phase Progress Bar */}
      <PhaseProgressBar
        currentPhase={currentPhase}
        phaseProgress={phaseProgress}
      />

      {/* Paused Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.75)' }}
          >
            <div className="text-center">
              <Icon name="pause.fill" size={48} color="#C5F74F" />
              <p
                className="text-[28px] font-extrabold mt-4"
                style={{ color: '#F5F5F5' }}
              >
                Paused
              </p>
              <motion.button
                onClick={resumeSession}
                whileTap={{ scale: 0.96 }}
                className="mt-6 h-14 px-10 rounded-full text-[17px] font-semibold"
                style={{ background: '#C5F74F', color: '#0B0B0B' }}
              >
                RESUME
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-4 mt-2 space-y-4">
        {/* Active Exercise Card */}
        <ActiveSetCard
          exerciseId={currentExercise.exerciseId}
          exerciseName={exerciseName}
          isCustom={currentExercise.isCustom}
          setsLabel={setsLabel}
          currentSet={currentExercise.completedSets.length}
          totalSets={currentExercise.targetSets}
          phase={currentPhase}
        />

        {/* Rep Counter or Hold Timer */}
        {isStretch ? (
          <HoldTimer
            totalSeconds={currentExercise.holdSec ?? 30}
            onComplete={() => {}}
            isActive={!isPaused && !isResting}
            color="#A18CD1"
          />
        ) : (
          <>
            {/* Rep Counter */}
            <RepCounter
              value={repCount}
              onChange={setRepCount}
            />

            {/* Weight Selector (not during stretch) */}
            {currentExercise.weightKg !== null && (
              <WeightSelector
                value={currentWeight}
                onChange={setCurrentWeight}
                unit={unitPreference}
                step={unitPreference === 'kg' ? 2.5 : 5}
              />
            )}
          </>
        )}

        {/* Complete Set Button */}
        <div className="px-0">
          <motion.button
            onClick={handleCompleteSet}
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            className="w-full h-16 rounded-[20px] text-[18px] font-bold glow-primary-strong"
            style={{
              background: isStretch ? '#A18CD1' : '#C5F74F',
              color: '#0B0B0B',
            }}
          >
            {completeButtonText}
          </motion.button>
        </div>

        {/* Next Up */}
        {queueExercises.length > 0 && (
          <div className="mt-2">
            <p
              className="text-[14px] font-medium"
              style={{ color: 'rgba(245,245,245,0.40)' }}
            >
              NEXT UP:{' '}
              <span style={{ color: 'rgba(245,245,245,0.60)' }}>
                {getExerciseName(queueExercises[0].exerciseId)}
              </span>
            </p>
          </div>
        )}

        {/* Exercise Queue */}
        {queueExercises.length > 0 && (
          <div>
            <p
              className="text-[13px] font-semibold uppercase mb-2"
              style={{
                color: 'rgba(245,245,245,0.30)',
                letterSpacing: '0.06em',
              }}
            >
              Queue
            </p>
            <div className="space-y-1">
              {queueExercises.map((ex, i) => (
                <div
                  key={`${ex.exerciseId}-${i}`}
                  className="flex items-center justify-between py-2"
                  style={{
                    borderBottom:
                      i < queueExercises.length - 1
                        ? '1px solid rgba(255,255,255,0.05)'
                        : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: accent }}
                    />
                    <span
                      className="text-[15px]"
                      style={{ color: 'rgba(245,245,245,0.55)' }}
                    >
                      {getExerciseName(ex.exerciseId)}
                    </span>
                  </div>
                  <span
                    className="text-[13px] tabular-nums"
                    style={{ color: 'rgba(245,245,245,0.35)' }}
                  >
                    {ex.holdSec
                      ? `${ex.targetSets}×${ex.holdSec}s`
                      : `${ex.targetSets}×${ex.targetReps ?? '?'}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rest Timer Overlay */}
      <RestTimer
        initialSeconds={currentExercise.restTimeSec}
        isOpen={isResting}
        onComplete={handleRestComplete}
        onSkip={handleRestComplete}
        nextExerciseName={nextInfo?.name}
        nextExerciseConfig={nextInfo?.config}
      />

      {/* Phase Transition Banner */}
      <PhaseTransitionBanner
        isOpen={showTransition}
        completedPhase={completedPhaseForTransition}
        phaseTime={phaseElapsedSec}
        exerciseCount={
          phaseExercises.filter((e) => e.completedSets.length > 0).length
        }
        onContinue={handleTransitionContinue}
        onSkip={handleTransitionContinue}
      />

      {/* RPE Prompt */}
      <RpePrompt
        isOpen={showRpe}
        onSelect={handleRpeSelect}
        onDismiss={() => setShowRpe(false)}
      />
    </div>
  );
}
