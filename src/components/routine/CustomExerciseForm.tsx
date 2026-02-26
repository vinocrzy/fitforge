// ═══════════════════════════════════════════════════════════════════
// FitForge — Custom Exercise Form
// Create user-defined exercises stored in fitforge_custom_exercises
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { springSnappy, springGentle } from '@/lib/motion/springs';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useCreateCustomExercise } from '@/hooks/useDatabase';
import type { CustomExercise, SessionPhase } from '@/types';

const BODY_PARTS = [
  'chest', 'back', 'shoulders', 'upper arms', 'lower arms',
  'upper legs', 'lower legs', 'waist', 'cardio',
];
const EQUIPMENT_OPTIONS = [
  'body weight', 'barbell', 'dumbbell', 'cable', 'machine',
  'band', 'kettlebell', 'medicine ball', 'other',
];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const CATEGORIES = ['strength', 'cardio', 'stretching', 'plyometrics'] as const;
const PHASE_HINTS: { id: SessionPhase; label: string }[] = [
  { id: 'warmUp', label: 'Warm-Up' },
  { id: 'workout', label: 'Workout' },
  { id: 'stretch', label: 'Stretch' },
];

interface CustomExerciseFormProps {
  open: boolean;
  onClose: () => void;
  defaultPhase?: SessionPhase;
}

export function CustomExerciseForm({
  open,
  onClose,
  defaultPhase = 'workout',
}: CustomExerciseFormProps) {
  const createMutation = useCreateCustomExercise();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bodyPart, setBodyPart] = useState('chest');
  const [equipment, setEquipment] = useState('body weight');
  const [target, setTarget] = useState('');
  const [secondaryMuscles, setSecondaryMuscles] = useState('');
  const [difficulty, setDifficulty] = useState<CustomExercise['difficulty']>('beginner');
  const [category, setCategory] = useState<CustomExercise['category']>('strength');
  const [phaseHint, setPhaseHint] = useState<SessionPhase>(defaultPhase);

  const canSave = name.trim().length >= 2;

  const handleSave = async () => {
    if (!canSave) return;

    const exercise: CustomExercise = {
      _id: `custom_${Date.now()}`,
      type: 'custom_exercise',
      name: name.trim(),
      description: description.trim(),
      bodyPart,
      equipment,
      target: target.trim() || bodyPart,
      secondaryMuscles: secondaryMuscles
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      instructions: [],
      difficulty,
      category,
      phaseHint,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    await createMutation.mutateAsync(exercise);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTarget('');
    setSecondaryMuscles('');
  };

  return (
    <BottomSheet
      id="custom-exercise-form"
      open={open}
      onClose={onClose}
      title="Create Exercise"
      fullHeight
    >
      <div className="flex flex-col gap-4 pb-4">
        {/* Name */}
        <FormField label="Exercise Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Cable Face Pull"
            className="w-full bg-transparent text-[17px] outline-none"
            style={{ color: '#F5F5F5' }}
          />
        </FormField>

        {/* Description */}
        <FormField label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description…"
            rows={2}
            className="w-full bg-transparent text-[15px] outline-none resize-none"
            style={{ color: '#F5F5F5' }}
          />
        </FormField>

        {/* Body Part */}
        <FormField label="Body Part">
          <ChipSelect
            options={BODY_PARTS}
            selected={bodyPart}
            onSelect={setBodyPart}
          />
        </FormField>

        {/* Equipment */}
        <FormField label="Equipment">
          <ChipSelect
            options={EQUIPMENT_OPTIONS}
            selected={equipment}
            onSelect={setEquipment}
          />
        </FormField>

        {/* Target Muscle */}
        <FormField label="Target Muscle">
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g., rear deltoids"
            className="w-full bg-transparent text-[15px] outline-none"
            style={{ color: '#F5F5F5' }}
          />
        </FormField>

        {/* Secondary Muscles */}
        <FormField label="Secondary Muscles (comma-separated)">
          <input
            type="text"
            value={secondaryMuscles}
            onChange={(e) => setSecondaryMuscles(e.target.value)}
            placeholder="e.g., traps, rhomboids"
            className="w-full bg-transparent text-[15px] outline-none"
            style={{ color: '#F5F5F5' }}
          />
        </FormField>

        {/* Difficulty */}
        <FormField label="Difficulty">
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <motion.button
                key={d}
                onClick={() => setDifficulty(d)}
                whileTap={{ scale: 0.95 }}
                transition={springSnappy}
                className="h-9 px-4 rounded-full text-[14px] font-semibold capitalize"
                style={{
                  background:
                    difficulty === d ? '#C5F74F' : 'rgba(255,255,255,0.06)',
                  color: difficulty === d ? '#0B0B0B' : '#F5F5F5',
                }}
              >
                {d}
              </motion.button>
            ))}
          </div>
        </FormField>

        {/* Category */}
        <FormField label="Category">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <motion.button
                key={c}
                onClick={() => setCategory(c)}
                whileTap={{ scale: 0.95 }}
                transition={springSnappy}
                className="h-9 px-4 rounded-full text-[14px] font-semibold capitalize"
                style={{
                  background:
                    category === c ? '#C5F74F' : 'rgba(255,255,255,0.06)',
                  color: category === c ? '#0B0B0B' : '#F5F5F5',
                }}
              >
                {c}
              </motion.button>
            ))}
          </div>
        </FormField>

        {/* Phase Hint */}
        <FormField label="Default Phase">
          <div className="flex gap-2">
            {PHASE_HINTS.map((p) => (
              <motion.button
                key={p.id}
                onClick={() => setPhaseHint(p.id)}
                whileTap={{ scale: 0.95 }}
                transition={springSnappy}
                className="h-9 px-4 rounded-full text-[14px] font-semibold"
                style={{
                  background:
                    phaseHint === p.id ? '#C5F74F' : 'rgba(255,255,255,0.06)',
                  color: phaseHint === p.id ? '#0B0B0B' : '#F5F5F5',
                }}
              >
                {p.label}
              </motion.button>
            ))}
          </div>
        </FormField>

        {/* Save */}
        <div className="mt-2">
          <PrimaryButton
            onClick={handleSave}
            disabled={!canSave || createMutation.isPending}
          >
            {createMutation.isPending ? 'SAVING…' : 'CREATE EXERCISE'}
          </PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── Helper Components ────────────────────────────────────────────

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="text-[13px] font-semibold uppercase tracking-wider block mb-2"
        style={{ color: 'rgba(245,245,245,0.50)' }}
      >
        {label}
      </label>
      <div
        className="rounded-[14px] px-4 py-3"
        style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ChipSelect({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <motion.button
          key={opt}
          onClick={() => onSelect(opt)}
          whileTap={{ scale: 0.95 }}
          transition={springSnappy}
          className="h-8 px-3 rounded-full text-[13px] font-medium capitalize"
          style={{
            background:
              selected === opt
                ? 'rgba(197,247,79,0.15)'
                : 'rgba(255,255,255,0.06)',
            border:
              selected === opt
                ? '1.5px solid #C5F74F'
                : '1px solid rgba(255,255,255,0.08)',
            color: selected === opt ? '#C5F74F' : '#F5F5F5',
          }}
        >
          {opt}
        </motion.button>
      ))}
    </div>
  );
}
