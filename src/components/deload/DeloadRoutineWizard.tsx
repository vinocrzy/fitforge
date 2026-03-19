// ═══════════════════════════════════════════════════════════════════
// FitForge — Deload Routine Generator Wizard
// PT Feature 5: 3-step wizard to create deload variants of routines
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/ui/Icon';
import { springSnappy } from '@/lib/motion/springs';
import { useRoutines, useSaveRoutine } from '@/hooks/useDatabase';
import { useProfileStore } from '@/store/useProfileStore';
import type { Routine, RoutineExerciseConfig } from '@/types';

interface DeloadRoutineWizardProps {
  open: boolean;
  onClose: () => void;
  suggestedReduction?: number;
  suggestedDuration?: number;
  preselectedRoutineId?: string;
}

type WizardStep = 'select' | 'configure' | 'preview';

export function DeloadRoutineWizard({
  open,
  onClose,
  suggestedReduction = 40,
  suggestedDuration = 7,
  preselectedRoutineId,
}: DeloadRoutineWizardProps) {
  const { data: routines = [] } = useRoutines();
  const saveMutation = useSaveRoutine();
  const unitPreference = useProfileStore((s) => s.unitPreference);

  const [step, setStep] = useState<WizardStep>('select');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    preselectedRoutineId ?? null
  );
  const [reductionPercent, setReductionPercent] = useState(suggestedReduction);
  const [durationDays, setDurationDays] = useState(suggestedDuration);
  const [saving, setSaving] = useState(false);

  const selectedRoutine = useMemo(
    () => routines.find((r) => r._id === selectedRoutineId) ?? null,
    [routines, selectedRoutineId]
  );

  // Generate deload routine
  const deloadRoutine = useMemo((): Routine | null => {
    if (!selectedRoutine) return null;

    const reduceExercise = (ex: RoutineExerciseConfig): RoutineExerciseConfig => {
      const reduced: RoutineExerciseConfig = { ...ex };
      // Reduce sets to 2
      reduced.sets = Math.min(2, ex.sets);
      // Reduce weight by reduction %
      if (ex.weightKg) {
        reduced.weightKg = Math.round(ex.weightKg * (1 - reductionPercent / 100) * 4) / 4;
      }
      return reduced;
    };

    return {
      _id: `routine_deload_${Date.now()}`,
      type: 'routine',
      name: `${selectedRoutine.name} — Deload ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unitPreference: selectedRoutine.unitPreference,
      warmUp: selectedRoutine.warmUp, // Keep warmup unchanged
      workout: selectedRoutine.workout.map(reduceExercise),
      stretch: selectedRoutine.stretch, // Keep stretch unchanged
      isDeload: true,
      sourceRoutineId: selectedRoutine._id,
    };
  }, [selectedRoutine, reductionPercent]);

  // Handle save
  const handleSave = async () => {
    if (!deloadRoutine) return;
    setSaving(true);
    try {
      await saveMutation.mutateAsync(deloadRoutine);
      onClose();
      // Reset wizard state
      setStep('select');
      setSelectedRoutineId(null);
    } catch (error) {
      console.error('Failed to save deload routine:', error);
      alert('Failed to save deload routine');
    } finally {
      setSaving(false);
    }
  };

  // Reset on close
  const handleClose = () => {
    setStep('select');
    setSelectedRoutineId(null);
    onClose();
  };

  const formatWeight = (kg: number) => {
    if (unitPreference === 'lbs') {
      return `${Math.round(kg * 2.20462)}lbs`;
    }
    return `${kg}kg`;
  };

  return (
    <BottomSheet
      id="deload-wizard"
      open={open}
      onClose={handleClose}
      title={
        step === 'select'
          ? 'Select Routine'
          : step === 'configure'
            ? 'Configure Deload'
            : 'Preview & Save'
      }
      fullHeight
    >
      <div className="flex flex-col h-full">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pb-4 border-b border-white/5">
          {(['select', 'configure', 'preview'] as WizardStep[]).map((s, i) => (
            <div
              key={s}
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  s === step
                    ? '#C5F74F'
                    : ['select', 'configure', 'preview'].indexOf(step) > i
                      ? 'rgba(197,247,79,0.30)'
                      : 'rgba(255,255,255,0.10)',
              }}
            />
          ))}
        </div>

        {/* Step 1: Select Routine */}
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto py-4"
            >
              <p className="text-[14px] px-4 mb-4" style={{ color: 'rgba(245,245,245,0.60)' }}>
                Choose a routine to create a deload variant
              </p>
              <div className="flex flex-col gap-2 px-4">
                {routines
                  .filter((r) => !r.isDeload)
                  .map((routine) => {
                    const totalEx =
                      (routine.warmUp?.length ?? 0) +
                      (routine.workout?.length ?? 0) +
                      (routine.stretch?.length ?? 0);
                    const isSelected = selectedRoutineId === routine._id;
                    return (
                      <motion.button
                        key={routine._id}
                        whileTap={{ scale: 0.98 }}
                        transition={springSnappy}
                        onClick={() => setSelectedRoutineId(routine._id)}
                        className="p-4 rounded-[16px] text-left"
                        style={{
                          background: isSelected
                            ? 'rgba(197,247,79,0.15)'
                            : 'rgba(255,255,255,0.04)',
                          border: isSelected
                            ? '2px solid #C5F74F'
                            : '2px solid transparent',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-[17px] font-semibold" style={{ color: '#F5F5F5' }}>
                              {routine.name}
                            </p>
                            <p className="text-[13px] mt-0.5" style={{ color: 'rgba(245,245,245,0.50)' }}>
                              {totalEx} exercises
                            </p>
                          </div>
                          {isSelected && (
                            <Icon name="checkmark.circle.fill" size={24} color="#C5F74F" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Configure Parameters */}
          {step === 'configure' && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto py-4 px-4"
            >
              <p className="text-[14px] mb-6" style={{ color: 'rgba(245,245,245,0.60)' }}>
                Customize deload parameters to match your recovery needs
              </p>

              {/* Weight Reduction */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>
                    Weight Reduction
                  </label>
                  <span className="text-[17px] font-bold" style={{ color: '#C5F74F' }}>
                    {reductionPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="60"
                  step="5"
                  value={reductionPercent}
                  onChange={(e) => setReductionPercent(Number(e.target.value))}
                  className="w-full"
                  style={{
                    accentColor: '#C5F74F',
                  }}
                />
                <div className="flex justify-between text-[12px] mt-1" style={{ color: 'rgba(245,245,245,0.40)' }}>
                  <span>30%</span>
                  <span>45%</span>
                  <span>60%</span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>
                    Duration
                  </label>
                  <span className="text-[17px] font-bold" style={{ color: '#C5F74F' }}>
                    {durationDays} days
                  </span>
                </div>
                <div className="flex gap-2">
                  {[5, 7, 10].map((d) => (
                    <motion.button
                      key={d}
                      whileTap={{ scale: 0.95 }}
                      transition={springSnappy}
                      onClick={() => setDurationDays(d)}
                      className="flex-1 py-3 rounded-[12px] font-semibold text-[15px]"
                      style={{
                        background:
                          durationDays === d
                            ? '#C5F74F'
                            : 'rgba(255,255,255,0.06)',
                        color: durationDays === d ? '#0B0B0B' : 'rgba(245,245,245,0.65)',
                      }}
                    >
                      {d}d
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Info box */}
              <div
                className="mt-6 p-4 rounded-[12px]"
                style={{ background: 'rgba(100,210,255,0.10)', border: '1px solid rgba(100,210,255,0.20)' }}
              >
                <div className="flex items-start gap-2">
                  <Icon name="info.circle.fill" size={18} color="#64D2FF" />
                  <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(245,245,245,0.70)' }}>
                    Deload weeks reduce training stress while maintaining movement patterns.
                    Warm-up and stretch phases remain unchanged.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && deloadRoutine && selectedRoutine && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto py-4 px-4"
            >
              <p className="text-[14px] mb-4" style={{ color: 'rgba(245,245,245,0.60)' }}>
                Review changes before saving
              </p>

              {/* Routine name */}
              <div className="p-4 rounded-[16px] mb-4" style={{ background: 'rgba(197,247,79,0.10)' }}>
                <p className="text-[12px] uppercase font-semibold mb-1" style={{ color: 'rgba(197,247,79,0.60)', letterSpacing: '0.5px' }}>
                  New Routine Name
                </p>
                <p className="text-[17px] font-bold" style={{ color: '#F5F5F5' }}>
                  {deloadRoutine.name}
                </p>
              </div>

              {/* Before/After comparison */}
              <div className="flex gap-2 mb-2">
                <div className="flex-1 text-center text-[12px] uppercase font-semibold" style={{ color: 'rgba(245,245,245,0.40)', letterSpacing: '0.5px' }}>
                  Original
                </div>
                <div className="flex-1 text-center text-[12px] uppercase font-semibold" style={{ color: '#C5F74F', letterSpacing: '0.5px' }}>
                  Deload
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {selectedRoutine.workout.map((original, i) => {
                  const deload = deloadRoutine.workout[i];
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-[12px]"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <p className="text-[14px] font-medium mb-2" style={{ color: '#F5F5F5' }}>
                        Exercise {i + 1}
                      </p>
                      <div className="flex gap-2">
                        <div className="flex-1 p-2 rounded-[8px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <p className="text-[11px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
                            {original.sets}× • {original.weightKg ? formatWeight(original.weightKg) : 'BW'}
                          </p>
                        </div>
                        <Icon name="arrow.right" size={14} color="rgba(245,245,245,0.25)" />
                        <div className="flex-1 p-2 rounded-[8px]" style={{ background: 'rgba(197,247,79,0.10)' }}>
                          <p className="text-[11px]" style={{ color: '#C5F74F' }}>
                            {deload.sets}× • {deload.weightKg ? formatWeight(deload.weightKg) : 'BW'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="p-4 border-t border-white/5 flex gap-2">
          {step !== 'select' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={springSnappy}
              onClick={() => {
                if (step === 'configure') setStep('select');
                if (step === 'preview') setStep('configure');
              }}
              className="h-[48px] px-6 rounded-full font-medium text-[15px]"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(245,245,245,0.70)',
              }}
            >
              Back
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={() => {
              if (step === 'select' && selectedRoutineId) setStep('configure');
              else if (step === 'configure') setStep('preview');
              else if (step === 'preview') handleSave();
            }}
            disabled={
              (step === 'select' && !selectedRoutineId) ||
              (step === 'preview' && saving)
            }
            className="flex-1 h-[48px] rounded-full font-semibold text-[15px]"
            style={{
              background:
                (step === 'select' && !selectedRoutineId) || saving
                  ? 'rgba(197,247,79,0.30)'
                  : '#C5F74F',
              color: '#0B0B0B',
            }}
          >
            {step === 'preview'
              ? saving
                ? 'Saving...'
                : 'Create Deload Routine'
              : 'Next'}
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
}
