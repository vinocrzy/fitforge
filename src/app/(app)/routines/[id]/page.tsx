// ═══════════════════════════════════════════════════════════════════
// FitForge — S-09 Routine Detail (Preview)
// Read-only view before starting workout
// ═══════════════════════════════════════════════════════════════════

'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy, springGentle } from '@/lib/motion/springs';
import { TopBar } from '@/components/layout/TopBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon } from '@/components/ui/Icon';
import {
  useRoutine,
  useExercises,
  useCustomExercises,
  useDeleteRoutine,
  useSaveRoutine,
} from '@/hooks/useDatabase';
import { toTitleCase } from '@/lib/utils/toTitleCase';
import type { RoutineExerciseConfig, SessionPhase } from '@/types';

const PHASE_META: Record<
  SessionPhase,
  { label: string; color: string }
> = {
  warmUp: { label: 'WARM-UP', color: '#FF9F0A' },
  workout: { label: 'WORKOUT', color: '#C5F74F' },
  stretch: { label: 'STRETCH', color: '#A18CD1' },
};

export default function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: routine, isLoading } = useRoutine(id);
  const { data: libraryExercises = [] } = useExercises();
  const { data: customExercises = [] } = useCustomExercises();
  const deleteMutation = useDeleteRoutine();
  const saveMutation = useSaveRoutine();

  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});

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

  const toggleSection = (key: string) =>
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const getExerciseName = (config: RoutineExerciseConfig) =>
    toTitleCase(exerciseNameMap[config.exerciseId] ?? 'Unknown Exercise');

  const formatConfig = (config: RoutineExerciseConfig, phase: SessionPhase) => {
    if (phase === 'stretch') {
      return `${config.sets}×${config.holdSec ?? 30}s`;
    }
    const weight = config.weightKg ? ` @ ${config.weightKg}kg` : '';
    return `${config.sets}×${config.targetReps ?? 10}${weight}`;
  };

  const totalExercises =
    (routine?.warmUp?.length ?? 0) +
    (routine?.workout?.length ?? 0) +
    (routine?.stretch?.length ?? 0);

  const estimatedMinutes = useMemo(() => {
    if (!routine) return 0;
    const allExercises = [
      ...(routine.warmUp ?? []),
      ...(routine.workout ?? []),
      ...(routine.stretch ?? []),
    ];
    const totalSec = allExercises.reduce((acc, ex) => {
      const repTime = ex.holdSec ?? (ex.targetReps ?? 10) * 3;
      return acc + ex.sets * (repTime + ex.restTimeSec);
    }, 0);
    return Math.ceil(totalSec / 60);
  }, [routine]);

  const handleDelete = async () => {
    if (!routine) return;
    await deleteMutation.mutateAsync(routine);
    router.push('/routines');
  };

  const handleDuplicate = async () => {
    if (!routine) return;
    const dup = {
      ...routine,
      _id: `routine_${Date.now()}`,
      _rev: undefined,
      name: `${routine.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveMutation.mutateAsync(dup);
    router.push(`/routines/${dup._id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B]">
        <TopBar title="Routine" showBack />
        <div className="pt-24 px-4">
          <div className="h-[180px] rounded-[20px] shimmer" style={{ background: '#141414' }} />
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <p className="text-[17px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
          Routine not found
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-36">
      <TopBar
        title="Routine"
        showBack
        rightAction={
          <motion.button
            onClick={() => router.push(`/routines/${id}/edit`)}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
            className="text-[17px] font-semibold"
            style={{ color: '#C5F74F' }}
          >
            Edit
          </motion.button>
        }
      />

      <div className="px-4 pt-[calc(44px+env(safe-area-inset-top,0px)+8px)]">
        {/* Hero Card */}
        <motion.div
          className="relative w-full rounded-[20px] overflow-hidden"
          style={{ height: 180, background: '#141414' }}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springGentle}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(197,247,79,0.15), rgba(197,247,79,0.03))',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h1
              className="text-[28px] font-extrabold tracking-tight"
              style={{ color: '#F5F5F5' }}
            >
              {routine.name}
            </h1>
            <p
              className="text-[14px] mt-0.5"
              style={{ color: 'rgba(245,245,245,0.60)' }}
            >
              {totalExercises} exercises • {estimatedMinutes} min
            </p>
          </div>
        </motion.div>

        {/* Actions Row */}
        <div className="flex gap-2 mt-4">
          <ActionButton
            icon="doc.on.doc"
            label="Duplicate"
            onClick={handleDuplicate}
          />
          <ActionButton
            icon="trash.fill"
            label="Delete"
            onClick={handleDelete}
            danger
          />
        </div>

        {/* Phase Sections */}
        {(['warmUp', 'workout', 'stretch'] as SessionPhase[]).map((phase) => {
          const exercises = routine[phase] ?? [];
          if (exercises.length === 0) return null;
          const meta = PHASE_META[phase];
          const collapsed = collapsedSections[phase] ?? false;

          return (
            <div key={phase} className="mt-5">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(phase)}
                className="flex items-center justify-between w-full"
              >
                <span
                  className="text-[15px] font-semibold uppercase tracking-wider"
                  style={{ color: 'rgba(245,245,245,0.50)', letterSpacing: '0.06em' }}
                >
                  {meta.label}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[13px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${meta.color}20`,
                      color: meta.color,
                    }}
                  >
                    {exercises.length}
                  </span>
                  <Icon
                    name={collapsed ? 'chevron.right' : 'chevron.down'}
                    size={12}
                    color="rgba(245,245,245,0.30)"
                  />
                </div>
              </button>

              {/* Exercises */}
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={springGentle}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 flex flex-col gap-1">
                      {exercises.map((config, i) => (
                        <button
                          key={i}
                          onClick={() => router.push(`/exercises/${config.exerciseId}`)}
                          className="flex items-center justify-between py-2.5 w-full text-left"
                          style={{
                            borderBottom:
                              i < exercises.length - 1
                                ? '1px solid rgba(255,255,255,0.05)'
                                : 'none',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: meta.color }}
                            />
                            <span
                              className="text-[17px]"
                              style={{ color: '#F5F5F5' }}
                            >
                              {getExerciseName(config)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[15px] tabular-nums"
                              style={{ color: 'rgba(245,245,245,0.55)' }}
                            >
                              {formatConfig(config, phase)}
                            </span>
                            <Icon
                              name="chevron.right"
                              size={12}
                              color="rgba(245,245,245,0.25)"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Sticky Start Button */}
      <div
        className="px-4 z-30 my-4"
        style={{
          bottom: 'calc(16px + 72px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <PrimaryButton
          onClick={() => {
            router.push(`/session/${id}`);
          }}
        >
          START WORKOUT
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={springSnappy}
      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-[12px]"
      style={{
        background: danger
          ? 'rgba(255,59,48,0.08)'
          : 'rgba(255,255,255,0.05)',
        border: '1px solid ' + (danger ? 'rgba(255,59,48,0.15)' : 'rgba(255,255,255,0.08)'),
      }}
    >
      <Icon
        name={icon}
        size={16}
        color={danger ? '#FF3B30' : 'rgba(245,245,245,0.55)'}
      />
      <span
        className="text-[14px] font-medium"
        style={{ color: danger ? '#FF3B30' : 'rgba(245,245,245,0.55)' }}
      >
        {label}
      </span>
    </motion.button>
  );
}
