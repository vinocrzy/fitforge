// ═══════════════════════════════════════════════════════════════════
// FitForge — S-08 Routine Builder Page
// Three-phase routine editor with drag-reorder
// ═══════════════════════════════════════════════════════════════════

'use client';

import { use, useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { springSnappy } from '@/lib/motion/springs';
import { TopBar } from '@/components/layout/TopBar';
import { RoutinePhaseTabs } from '@/components/routine/RoutinePhaseTabs';
import { RoutineExerciseRow } from '@/components/routine/RoutineExerciseRow';
import { RoutineSummaryBar } from '@/components/routine/RoutineSummaryBar';
import { ExercisePickerSheet } from '@/components/routine/ExercisePickerSheet';
import { CustomExerciseForm } from '@/components/routine/CustomExerciseForm';
import { Icon } from '@/components/ui/Icon';
import { useRoutine, useSaveRoutine, useExercises, useCustomExercises } from '@/hooks/useDatabase';
import { toTitleCase } from '@/lib/utils/toTitleCase';
import type {
  SessionPhase,
  Routine,
  RoutineExerciseConfig,
  ExerciseDoc,
  CustomExercise,
} from '@/types';

// Warm-up set generator (PT Feature 4)
function generateAutoWarmUpSets(
  workingWeight: number,
  exerciseId: string,
  isCustom: boolean
): RoutineExerciseConfig[] {
  if (!workingWeight || workingWeight <= 0) return [];
  return [
    { exerciseId, isCustom, sets: 1, targetReps: 8, restTimeSec: 60, weightKg: Math.round(workingWeight * 0.4 * 2) / 2 },
    { exerciseId, isCustom, sets: 1, targetReps: 5, restTimeSec: 60, weightKg: Math.round(workingWeight * 0.6 * 2) / 2 },
    { exerciseId, isCustom, sets: 1, targetReps: 3, restTimeSec: 90, weightKg: Math.round(workingWeight * 0.8 * 2) / 2 },
    { exerciseId, isCustom, sets: 1, targetReps: 1, restTimeSec: 120, weightKg: Math.round(workingWeight * 0.9 * 2) / 2 },
  ];
}

// Sortable wrapper
function SortableExerciseRow({
  id,
  config,
  exerciseName,
  phase,
  onChange,
  onDelete,
}: {
  id: string;
  config: RoutineExerciseConfig;
  exerciseName: string;
  phase: SessionPhase;
  onChange: (updated: RoutineExerciseConfig) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <RoutineExerciseRow
        config={config}
        exerciseName={exerciseName}
        phase={phase}
        onChange={onChange}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export default function RoutineBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = id === 'new';

  const { data: existingRoutine } = useRoutine(isNew ? '' : id);
  const saveMutation = useSaveRoutine();
  const { data: libraryExercises = [] } = useExercises();
  const { data: customExercises = [] } = useCustomExercises();

  // Phase from URL
  const phaseParam = searchParams.get('phase') as SessionPhase | null;
  const [activePhase, setActivePhase] = useState<SessionPhase>(phaseParam ?? 'workout');

  // Routine state
  const [routineName, setRoutineName] = useState('');
  const [warmUp, setWarmUp] = useState<RoutineExerciseConfig[]>([]);
  const [workout, setWorkout] = useState<RoutineExerciseConfig[]>([]);
  const [stretch, setStretch] = useState<RoutineExerciseConfig[]>([]);

  // Sheet states
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customFormOpen, setCustomFormOpen] = useState(false);

  // Hydrate from existing routine
  useEffect(() => {
    if (existingRoutine) {
      setRoutineName(existingRoutine.name);
      setWarmUp(existingRoutine.warmUp ?? []);
      setWorkout(existingRoutine.workout ?? []);
      setStretch(existingRoutine.stretch ?? []);
    }
  }, [existingRoutine]);

  // Exercise name lookup
  const exerciseNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    libraryExercises.forEach((ex) => { map[ex.id] = ex.name; });
    customExercises.forEach((ex) => { map[ex._id] = ex.name; });
    return map;
  }, [libraryExercises, customExercises]);

  const getExerciseName = (config: RoutineExerciseConfig) =>
    toTitleCase(exerciseNameMap[config.exerciseId] ?? 'Unknown Exercise');

  // Current phase data
  const phaseData = activePhase === 'warmUp' ? warmUp : activePhase === 'workout' ? workout : stretch;
  const setPhaseData =
    activePhase === 'warmUp' ? setWarmUp : activePhase === 'workout' ? setWorkout : setStretch;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setPhaseData((items) => {
        const oldIndex = items.findIndex(
          (_, i) => `${activePhase}-${i}` === active.id
        );
        const newIndex = items.findIndex(
          (_, i) => `${activePhase}-${i}` === over.id
        );
        return arrayMove(items, oldIndex, newIndex);
      });
    },
    [activePhase, setPhaseData]
  );

  const handleAddExercise = useCallback(
    (exercise: ExerciseDoc | CustomExercise, isCustom: boolean) => {
      const newConfig: RoutineExerciseConfig = {
        exerciseId: isCustom ? exercise._id : (exercise as ExerciseDoc).id,
        isCustom,
        sets: activePhase === 'stretch' ? 1 : 3,
        targetReps: activePhase === 'stretch' ? undefined : 10,
        holdSec: activePhase === 'stretch' ? 30 : undefined,
        restTimeSec: activePhase === 'warmUp' ? 30 : activePhase === 'stretch' ? 15 : 90,
        weightKg: null,
      };
      setPhaseData((prev) => [...prev, newConfig]);
      setPickerOpen(false);
    },
    [activePhase, setPhaseData]
  );

  const handleUpdateExercise = useCallback(
    (index: number, updated: RoutineExerciseConfig) => {
      setPhaseData((prev) => {
        const next = [...prev];
        next[index] = updated;

        // Auto warm-up generator
        if (
          activePhase === 'workout' &&
          updated.autoWarmUp &&
          !prev[index].autoWarmUp &&
          updated.weightKg
        ) {
          const warmUpSets = generateAutoWarmUpSets(
            updated.weightKg,
            updated.exerciseId,
            updated.isCustom
          );
          // Append generated warm-up sets to warm-up phase
          setWarmUp((prevWU) => {
            const existingIds = prevWU.map((w) => w.exerciseId);
            const newSets = warmUpSets.filter(
              (s) => !existingIds.includes(s.exerciseId) || true
            );
            return [...prevWU, ...newSets];
          });
        }

        return next;
      });
    },
    [activePhase, setPhaseData]
  );

  const handleDeleteExercise = useCallback(
    (index: number) => {
      setPhaseData((prev) => prev.filter((_, i) => i !== index));
    },
    [setPhaseData]
  );

  const handleSave = async () => {
    const routine: Routine = {
      _id: isNew ? `routine_${Date.now()}` : id,
      _rev: existingRoutine?._rev,
      type: 'routine',
      name: routineName || 'Untitled Routine',
      createdAt: existingRoutine?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unitPreference: 'kg',
      warmUp,
      workout,
      stretch,
    };
    await saveMutation.mutateAsync(routine);
    router.push(`/routines/${routine._id}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-36">
      {/* Nav bar */}
      <TopBar
        title=""
        showBack
        rightAction={
          <motion.button
            onClick={handleSave}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
            className="text-[17px] font-semibold"
            style={{ color: '#C5F74F' }}
          >
            Save
          </motion.button>
        }
      />

      <div className="px-4 pt-[calc(44px+env(safe-area-inset-top,0px)+8px)]">
        {/* Routine Name */}
        <input
          type="text"
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
          placeholder="Routine name…"
          className="w-full text-[28px] font-extrabold tracking-tight bg-transparent outline-none mb-4"
          style={{ color: '#F5F5F5' }}
        />

        {/* Phase Tabs */}
        <RoutinePhaseTabs
          activePhase={activePhase}
          onPhaseChange={setActivePhase}
          counts={{
            warmUp: warmUp.length,
            workout: workout.length,
            stretch: stretch.length,
          }}
        />

        {/* Exercise List */}
        <div className="mt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={phaseData.map((_, i) => `${activePhase}-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              {phaseData.map((config, index) => (
                <SortableExerciseRow
                  key={`${activePhase}-${index}`}
                  id={`${activePhase}-${index}`}
                  config={config}
                  exerciseName={getExerciseName(config)}
                  phase={activePhase}
                  onChange={(updated) => handleUpdateExercise(index, updated)}
                  onDelete={() => handleDeleteExercise(index)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Empty state */}
          {phaseData.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-12"
              style={{ color: 'rgba(245,245,245,0.35)' }}
            >
              <p className="text-[15px]">
                No exercises in {activePhase === 'warmUp' ? 'Warm-Up' : activePhase === 'workout' ? 'Workout' : 'Stretch'}
              </p>
            </div>
          )}

          {/* Add Exercise Button */}
          <motion.button
            onClick={() => setPickerOpen(true)}
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            className="flex items-center justify-center gap-2 w-full h-[52px] rounded-[14px] mt-2"
            style={{
              background: 'rgba(197,247,79,0.08)',
              border: '1.5px dashed rgba(197,247,79,0.35)',
            }}
          >
            <Icon name="plus.circle.fill" size={22} color="#C5F74F" />
            <span
              className="text-[17px] font-medium"
              style={{ color: '#C5F74F' }}
            >
              Add Exercise
            </span>
          </motion.button>
        </div>
      </div>

      {/* Summary Bar */}
      <div
        className="fixed left-4 right-4 z-20"
        style={{ bottom: 'calc(12px + 72px + env(safe-area-inset-bottom, 0px))' }}
      >
        <RoutineSummaryBar warmUp={warmUp} workout={workout} stretch={stretch} />
      </div>

      {/* Exercise Picker Sheet */}
      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        activePhase={activePhase}
        onSelect={handleAddExercise}
        onCreateCustom={() => {
          setPickerOpen(false);
          setCustomFormOpen(true);
        }}
      />

      {/* Custom Exercise Form */}
      <CustomExerciseForm
        open={customFormOpen}
        onClose={() => setCustomFormOpen(false)}
        defaultPhase={activePhase}
      />
    </div>
  );
}
