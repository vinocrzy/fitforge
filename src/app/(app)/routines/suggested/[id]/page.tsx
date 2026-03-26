// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-09: Suggestion Preview
// User previews and accepts/declines a suggested routine
// ═══════════════════════════════════════════════════════════════════

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { staggerContainer, fadeUpItem } from '@/lib/motion/variants';
import { TopBar } from '@/components/layout/TopBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon } from '@/components/ui/Icon';
import { useSuggestions, useRespondToSuggestion } from '@/hooks/useSuggestions';
import { useSaveRoutine } from '@/hooks/useDatabase';
import type { Routine, RoutineExerciseConfig } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

function PhaseSection({ title, exercises }: { title: string; exercises: RoutineExerciseConfig[] }): React.ReactElement | null {
  if (exercises.length === 0) return null;

  return (
    <motion.div variants={fadeUpItem} className="space-y-2">
      <h3
        className="text-[14px] font-semibold uppercase tracking-wide"
        style={{ color: 'rgba(245,245,245,0.45)' }}
      >
        {title} ({exercises.length})
      </h3>
      {exercises.map((ex, i) => (
        <div
          key={`${ex.exerciseId}-${i}`}
          className="rounded-xl p-3 glass flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-medium truncate"
              style={{ color: '#F5F5F5' }}
            >
              {ex.exerciseId}
            </p>
            <p className="text-[12px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
              {ex.sets} sets
              {ex.targetReps ? ` × ${ex.targetReps} reps` : ''}
              {ex.holdSec ? ` × ${ex.holdSec}s hold` : ''}
            </p>
          </div>
          {ex.weightKg !== undefined && ex.weightKg !== null && ex.weightKg > 0 && (
            <span className="text-[13px] font-medium ml-2" style={{ color: '#C5F74F' }}>
              {ex.weightKg}kg
            </span>
          )}
        </div>
      ))}
    </motion.div>
  );
}

export default function SuggestionPreviewPage({ params }: PageProps): React.ReactElement {
  const { id: suggestionId } = use(params);
  const router = useRouter();
  const { data: suggestions = [], isLoading } = useSuggestions();
  const respondMutation = useRespondToSuggestion();
  const saveRoutine = useSaveRoutine();

  const suggestion = suggestions.find((s) => s._id === suggestionId);

  const handleAccept = (): void => {
    if (!suggestion) return;

    const snapshot = suggestion.routineSnapshot;
    const newId = `routine_suggested_${Date.now()}`;
    const localRoutine: Routine = {
      ...snapshot,
      _id: newId,
      _rev: undefined,
    };

    saveRoutine.mutate(localRoutine, {
      onSuccess: () => {
        respondMutation.mutate(
          {
            suggestionId: suggestion._id,
            action: 'accept',
            acceptedRoutineId: newId,
          },
          {
            onSuccess: () => {
              router.push(`/routines/${encodeURIComponent(newId)}`);
            },
          },
        );
      },
    });
  };

  const handleDecline = (): void => {
    if (!suggestion) return;
    respondMutation.mutate(
      {
        suggestionId: suggestion._id,
        action: 'decline',
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B]">
        <TopBar title="Suggestion" showBack />
        <div className="px-5 pt-3 space-y-4">
          <div className="rounded-2xl glass animate-pulse h-24" />
          <div className="rounded-2xl glass animate-pulse h-48" />
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="min-h-screen bg-[#0B0B0B]">
        <TopBar title="Suggestion" showBack />
        <div className="text-center py-16 px-5">
          <Icon name="exclamationmark.triangle.fill" size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-[17px] font-semibold" style={{ color: '#F5F5F5' }}>
            Suggestion not found
          </p>
        </div>
      </div>
    );
  }

  const routine = suggestion.routineSnapshot;
  const isPending = suggestion.status === 'pending';

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="Preview" showBack />

      <div className="px-5 pt-3 pb-32">
        <motion.div
          className="space-y-5"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Header */}
          <motion.div variants={fadeUpItem} className="rounded-2xl p-4 glass">
            <h2
              className="text-[22px] font-bold tracking-tight"
              style={{ color: '#F5F5F5' }}
            >
              {routine.name}
            </h2>
            <p className="text-[14px] mt-1" style={{ color: 'rgba(245,245,245,0.55)' }}>
              {routine.unitPreference ?? 'Custom'}
            </p>

            {suggestion.trainerNote && (
              <div
                className="mt-3 p-3 rounded-xl"
                style={{ background: 'rgba(197,247,79,0.08)' }}
              >
                <p className="text-[12px] font-medium mb-1" style={{ color: '#C5F74F' }}>
                  Trainer&apos;s Note
                </p>
                <p className="text-[14px]" style={{ color: 'rgba(245,245,245,0.75)' }}>
                  {suggestion.trainerNote}
                </p>
              </div>
            )}
          </motion.div>

          {/* Phases */}
          <PhaseSection title="Warm-Up" exercises={routine.warmUp} />
          <PhaseSection title="Workout" exercises={routine.workout} />
          <PhaseSection title="Stretch" exercises={routine.stretch} />

          {/* Actions */}
          {isPending && (
            <motion.div variants={fadeUpItem} className="space-y-3 pt-4">
              <PrimaryButton
                onClick={handleAccept}
                disabled={respondMutation.isPending || saveRoutine.isPending}
              >
                {respondMutation.isPending || saveRoutine.isPending
                  ? 'ACCEPTING…'
                  : 'ACCEPT & ADD TO ROUTINES'}
              </PrimaryButton>
              <motion.button
                onClick={handleDecline}
                disabled={respondMutation.isPending}
                whileTap={{ scale: 0.97 }}
                transition={springSnappy}
                className="w-full h-12 rounded-full text-[15px] font-medium"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(245,245,245,0.55)',
                }}
              >
                Decline
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
