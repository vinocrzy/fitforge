// ═══════════════════════════════════════════════════════════════════
// FitForge — Exercise Picker Sheet
// Bottom sheet for adding exercises to a routine phase
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SearchBar } from '@/components/ui/SearchBar';
import { MultiFilterSection } from '@/components/ui/FilterChip';
import { DifficultyDots } from '@/components/ui/DifficultyDots';
import { ExerciseGif } from '@/components/ui/ExerciseGif';
import { Icon } from '@/components/ui/Icon';
import { useExercises, useCustomExercises } from '@/hooks/useDatabase';
import { toTitleCase } from '@/lib/utils/toTitleCase';
import type { ExerciseDoc, CustomExercise, SessionPhase } from '@/types';

type ExerciseItem = (ExerciseDoc | CustomExercise) & { _isCustom?: boolean };

const BODY_PARTS = [
  'chest', 'back', 'upper legs', 'lower legs',
  'shoulders', 'upper arms', 'lower arms', 'waist', 'cardio',
];

const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'body weight',
  'cable',
  'leverage machine',
  'ez barbell',
  'assisted',
  'medicine ball',
  'stability ball',
  'rope',
];

interface ExercisePickerSheetProps {
  open: boolean;
  onClose: () => void;
  activePhase: SessionPhase;
  onSelect: (exercise: ExerciseItem, isCustom: boolean) => void;
  onCreateCustom?: () => void;
}

export function ExercisePickerSheet({
  open,
  onClose,
  activePhase,
  onSelect,
  onCreateCustom,
}: ExercisePickerSheetProps) {
  const { data: libraryExercises = [] } = useExercises();
  const { data: customExercises = [] } = useCustomExercises();

  const [source, setSource] = useState<'library' | 'custom'>('library');
  const [search, setSearch] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);

  const exercises: ExerciseItem[] = useMemo(() => {
    const pool: ExerciseItem[] =
      source === 'library'
        ? libraryExercises
        : customExercises.map((ex) => ({ ...ex, _isCustom: true }));

    let result = pool;

    if (bodyPartFilter) {
      result = result.filter(
        (ex) => ex.bodyPart.toLowerCase() === bodyPartFilter.toLowerCase()
      );
    }

    if (equipmentFilter) {
      result = result.filter(
        (ex) => ex.equipment.toLowerCase() === equipmentFilter.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.target.toLowerCase().includes(q) ||
          ex.equipment.toLowerCase().includes(q)
      );
    }

    return result;
  }, [libraryExercises, customExercises, source, search, bodyPartFilter, equipmentFilter]);

  return (
    <BottomSheet
      id="exercise-picker"
      open={open}
      onClose={onClose}
      title="Add Exercise"
      fullHeight
    >
      {/* Source Toggle */}
      <div className="flex gap-2 mb-3">
        {(['library', 'custom'] as const).map((s) => (
          <motion.button
            key={s}
            onClick={() => setSource(s)}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
            className="h-9 px-4 rounded-full text-[14px] font-semibold capitalize"
            style={{
              background: source === s ? '#C5F74F' : 'rgba(255,255,255,0.06)',
              color: source === s ? '#0B0B0B' : '#F5F5F5',
            }}
          >
            {s === 'library' ? 'Library' : 'My Exercises'}
          </motion.button>
        ))}
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* Filters */}
      <MultiFilterSection
        sections={[
          {
            label: 'Body Part',
            options: BODY_PARTS,
            selected: bodyPartFilter,
            onSelect: setBodyPartFilter,
          },
          {
            label: 'Equipment',
            options: EQUIPMENT,
            selected: equipmentFilter,
            onSelect: setEquipmentFilter,
          },
        ]}
      />

      {/* Create Custom Button (in custom tab) */}
      {source === 'custom' && onCreateCustom && (
        <motion.button
          onClick={onCreateCustom}
          whileTap={{ scale: 0.97 }}
          transition={springSnappy}
          className="flex items-center justify-center gap-2 w-full h-[52px] rounded-[14px] mb-3"
          style={{
            background: 'rgba(197,247,79,0.08)',
            border: '1.5px dashed rgba(197,247,79,0.35)',
          }}
        >
          <Icon name="plus.circle.fill" size={22} color="#C5F74F" />
          <span className="text-[17px] font-medium" style={{ color: '#C5F74F' }}>
            Create Exercise
          </span>
        </motion.button>
      )}

      {/* Results */}
      <div className="flex flex-col">
        <span
          className="text-[13px] font-medium mb-2"
          style={{ color: 'rgba(245,245,245,0.45)' }}
        >
          {exercises.length} result{exercises.length !== 1 ? 's' : ''}
        </span>

        {exercises.map((ex) => (
          <motion.button
            key={ex._id}
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={() => onSelect(ex, !!ex._isCustom)}
            className="flex items-center gap-3 py-2.5"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="shrink-0 w-12 h-12 rounded-[10px] overflow-hidden">
              {'id' in ex ? (
                <ExerciseGif
                  exerciseId={ex.id}
                  alt={ex.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'rgba(197,247,79,0.10)' }}
                >
                  <Icon name="figure.strengthtraining.traditional" size={20} color="#C5F74F" weight="fill" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div
                className="text-[16px] font-semibold truncate"
                style={{ color: '#F5F5F5' }}
              >
                {toTitleCase(ex.name)}
              </div>
              <div
                className="text-[13px]"
                style={{ color: 'rgba(245,245,245,0.45)' }}
              >
                {ex.bodyPart} • {ex.equipment}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <DifficultyDots level={ex.difficulty} size={5} />
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(197,247,79,0.15)' }}
              >
                <Icon name="plus" size={14} color="#C5F74F" />
              </div>
            </div>
          </motion.button>
        ))}

        {exercises.length === 0 && (
          <div className="flex flex-col items-center py-12">
            <p
              className="text-[15px]"
              style={{ color: 'rgba(245,245,245,0.45)' }}
            >
              No exercises found
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
