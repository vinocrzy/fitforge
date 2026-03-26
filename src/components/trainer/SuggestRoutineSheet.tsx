// ═══════════════════════════════════════════════════════════════════
// FitForge — SuggestRoutineSheet Component (S-PT-07)
// Bottom sheet for PT to select a routine and suggest to client
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon } from '@/components/ui/Icon';
import { useRoutines } from '@/hooks/useDatabase';
import { useCreateSuggestion } from '@/hooks/useSuggestions';
import type { Routine } from '@/types';

export interface SuggestRoutineSheetProps {
  clientId: string;
  clientName?: string;
  open: boolean;
  onClose: () => void;
}

export function SuggestRoutineSheet({
  clientId,
  clientName,
  open,
  onClose,
}: SuggestRoutineSheetProps): React.ReactElement {
  const { data: routines, isLoading } = useRoutines();
  const createSuggestion = useCreateSuggestion();
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const handleSelect = (routine: Routine): void => {
    setSelectedRoutine(routine);
    setStep('confirm');
  };

  const handleBack = (): void => {
    setStep('select');
    setSelectedRoutine(null);
  };

  const handleSend = (): void => {
    if (!selectedRoutine) return;

    // Freeze the routine snapshot (strip _rev so it's a clean copy)
    const { _rev, ...snapshot } = selectedRoutine;
    void _rev; // unused

    createSuggestion.mutate(
      {
        clientId,
        routineSnapshot: snapshot as unknown as Record<string, unknown>,
        trainerNote: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setStep('select');
          setSelectedRoutine(null);
          setNote('');
          onClose();
        },
      },
    );
  };

  const handleClose = (): void => {
    setStep('select');
    setSelectedRoutine(null);
    setNote('');
    onClose();
  };

  const exerciseCount = (routine: Routine): number => {
    return (routine.warmUp?.length ?? 0) + (routine.workout?.length ?? 0) + (routine.stretch?.length ?? 0);
  };

  return (
    <BottomSheet
      id="suggest-routine"
      open={open}
      onClose={handleClose}
      title={step === 'select' ? 'Suggest a Routine' : 'Confirm Suggestion'}
      fullHeight
    >
      {step === 'select' && (
        <div className="space-y-3">
          {clientName && (
            <p className="text-[15px] mb-4" style={{ color: 'rgba(245,245,245,0.55)' }}>
              Select a routine to suggest to {clientName}
            </p>
          )}

          {isLoading && (
            <div className="text-center py-8" style={{ color: 'rgba(245,245,245,0.45)' }}>
              Loading routines…
            </div>
          )}

          {!isLoading && (!routines || routines.length === 0) && (
            <div className="text-center py-8">
              <Icon name="dumbbell.fill" size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-[15px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
                No routines yet. Create one first.
              </p>
            </div>
          )}

          {routines?.map((routine) => (
            <motion.button
              key={routine._id}
              onClick={() => handleSelect(routine)}
              whileTap={{ scale: 0.97 }}
              transition={springSnappy}
              className="w-full text-left p-4 rounded-2xl glass"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-[17px] font-semibold truncate"
                    style={{ color: '#F5F5F5' }}
                  >
                    {routine.name}
                  </h3>
                  <p
                    className="text-[13px] mt-0.5"
                    style={{ color: 'rgba(245,245,245,0.55)' }}
                  >
                    {exerciseCount(routine)} exercises
                  </p>
                </div>
                <Icon name="chevron.right" size={16} className="ml-2 opacity-40" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {step === 'confirm' && selectedRoutine && (
        <div className="space-y-5">
          <motion.button
            onClick={handleBack}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
            className="flex items-center gap-1 text-[15px]"
            style={{ color: 'var(--brand-lime, #C5F74F)' }}
          >
            <Icon name="chevron.left" size={16} />
            Back
          </motion.button>

          <div className="p-4 rounded-2xl glass">
            <h3
              className="text-[17px] font-semibold"
              style={{ color: '#F5F5F5' }}
            >
              {selectedRoutine.name}
            </h3>
            <p
              className="text-[13px] mt-1"
              style={{ color: 'rgba(245,245,245,0.55)' }}
            >
              {exerciseCount(selectedRoutine)} exercises
            </p>

            {/* Phase breakdown */}
            <div className="flex gap-4 mt-3">
              {selectedRoutine.warmUp.length > 0 && (
                <span className="text-[12px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
                  Warm-up: {selectedRoutine.warmUp.length}
                </span>
              )}
              <span className="text-[12px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
                Workout: {selectedRoutine.workout.length}
              </span>
              {selectedRoutine.stretch.length > 0 && (
                <span className="text-[12px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
                  Stretch: {selectedRoutine.stretch.length}
                </span>
              )}
            </div>
          </div>

          {/* Trainer note */}
          <div>
            <label
              className="block text-[15px] font-medium mb-2"
              style={{ color: '#F5F5F5' }}
            >
              Add a note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 1000))}
              placeholder="Focus on progressive overload this week…"
              rows={3}
              className="w-full rounded-xl p-3 text-[15px] resize-none glass"
              style={{
                color: '#F5F5F5',
                border: '1px solid rgba(255,255,255,0.10)',
                outline: 'none',
              }}
            />
            <p
              className="text-right text-[12px] mt-1"
              style={{ color: 'rgba(245,245,245,0.35)' }}
            >
              {note.length}/1000
            </p>
          </div>

          <PrimaryButton
            onClick={handleSend}
            disabled={createSuggestion.isPending}
          >
            {createSuggestion.isPending ? 'SENDING…' : 'SEND SUGGESTION'}
          </PrimaryButton>
        </div>
      )}
    </BottomSheet>
  );
}
