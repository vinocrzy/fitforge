// ═══════════════════════════════════════════════════════════════════
// FitForge — Coaching Note Card
// PT Feature 2: Displays RPE-based coaching suggestions with apply/dismiss actions
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { springSnappy } from '@/lib/motion/springs';
import type { CoachingNote, ExerciseRecord, CustomExercise } from '@/types';
import { useProfileStore } from '@/store/useProfileStore';
import { useQuery } from '@tanstack/react-query';
import { exerciseDb, customExerciseDb } from '@/lib/db/pouchdb';
import { applyCoachingNote } from '@/lib/coaching/applyCoachingNote';
import { ProgressionHistorySheet } from '@/components/coaching/ProgressionHistorySheet';
import { useWorkoutHistory } from '@/hooks/useDatabase';

interface CoachingNoteCardProps {
  note: CoachingNote;
  onApply?: (noteId: string) => void;
}

export function CoachingNoteCard({ note, onApply }: CoachingNoteCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const dismissCoachingNote = useProfileStore((s) => s.dismissCoachingNote);
  const applyCoachingNoteToProfile = useProfileStore((s) => s.applyCoachingNote);
  const unitPreference = useProfileStore((s) => s.unitPreference);
  const { data: workouts = [] } = useWorkoutHistory();

  // Fetch exercise name
  const { data: exercise } = useQuery({
    queryKey: ['exercise', note.exerciseId, note.exerciseId.startsWith('custom_')],
    queryFn: async () => {
      try {
        if (note.exerciseId.startsWith('custom_')) {
          const doc = await customExerciseDb.get(note.exerciseId);
          return doc as unknown as CustomExercise;
        } else {
          const doc = await exerciseDb.get(note.exerciseId);
          return doc as unknown as ExerciseRecord;
        }
      } catch {
        return null;
      }
    },
  });

  const handleDismiss = () => {
    setDismissed(true);
    setTimeout(() => {
      dismissCoachingNote(note.id);
    }, 300);
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const result = await applyCoachingNote(note);
      if (result.success && result.routinesUpdated.length > 0) {
        applyCoachingNoteToProfile(note.id, result.routinesUpdated[0]);
        if (onApply) {
          onApply(note.id);
        }
      } else {
        console.error('Failed to apply coaching note:', result.error);
        alert(result.error ?? 'Failed to apply coaching note');
      }
    } catch (error) {
      console.error('Error applying coaching note:', error);
      alert('An error occurred while applying the coaching note');
    } finally {
      setApplying(false);
    }
  };

  if (dismissed || note.dismissed) return null;

  // Determine styling based on type
  const isIncrease = note.type === 'increase_load';
  const gradient = isIncrease
    ? 'linear-gradient(135deg, rgba(10,132,255,0.10), rgba(30,180,255,0.06))'
    : 'linear-gradient(135deg, rgba(255,159,10,0.10), rgba(255,69,58,0.06))';
  const borderColor = isIncrease ? 'rgba(10,132,255,0.20)' : 'rgba(255,159,10,0.20)';
  const iconName = isIncrease ? 'arrow.up.circle.fill' : 'arrow.down.circle.fill';
  const iconColor = isIncrease ? '#0A84FF' : '#FF9F0A';

  const exerciseName = exercise?.name ?? 'Exercise';

  // Format weight
  const formatWeight = (kg: number | undefined) => {
    if (kg === undefined) return '—';
    if (unitPreference === 'lbs') {
      return `${Math.round(kg * 2.20462)}lbs`;
    }
    return `${kg}kg`;
  };

  return (
    <>
    <AnimatePresence mode="wait">
      {!dismissed && !note.dismissed && (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-[20px] p-5 relative overflow-hidden"
          style={{
            background: gradient,
            border: `1px solid ${borderColor}`,
          }}
        >
        {/* Dismiss button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(0,0,0,0.20)' }}
        >
          <Icon name="xmark" size={12} color="rgba(245,245,245,0.70)" />
        </motion.button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Icon name={iconName} size={24} color={iconColor} />
          <div>
            <p className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>
              {exerciseName}
            </p>
            <p className="text-[12px]" style={{ color: 'rgba(245,245,245,0.50)' }}>
              {note.avgRpe ? `Avg RPE: ${note.avgRpe.toFixed(1)}` : 'RPE Analysis'}
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(245,245,245,0.70)' }}>
          {note.message}
        </p>

        {/* Comparison */}
        {note.currentValue !== undefined && note.suggestedValue !== undefined && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-[12px]" style={{ background: 'rgba(0,0,0,0.15)' }}>
            <div className="flex-1">
              <p className="text-[11px] uppercase font-semibold mb-1" style={{ color: 'rgba(245,245,245,0.40)', letterSpacing: '0.5px' }}>
                Current
              </p>
              <p className="text-[17px] font-bold tabular-nums" style={{ color: 'rgba(245,245,245,0.60)' }}>
                {formatWeight(note.currentValue)}
              </p>
            </div>
            <Icon name="arrow.right" size={16} color="rgba(245,245,245,0.35)" />
            <div className="flex-1">
              <p className="text-[11px] uppercase font-semibold mb-1" style={{ color: 'rgba(245,245,245,0.40)', letterSpacing: '0.5px' }}>
                Suggested
              </p>
              <p className="text-[17px] font-bold tabular-nums" style={{ color: iconColor }}>
                {formatWeight(note.suggestedValue)}
                {note.suggestedReps && (
                  <span className="text-[14px] ml-1" style={{ color: 'rgba(245,245,245,0.50)' }}>
                    × {note.suggestedReps}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={handleApply}
            disabled={applying}
            className="flex-1 h-[44px] rounded-full font-semibold text-[15px] flex items-center justify-center gap-2"
            style={{
              background: iconColor,
              color: '#0B0B0B',
              opacity: applying ? 0.6 : 1,
            }}
          >
            <Icon name="checkmark.circle.fill" size={18} color="#0B0B0B" />
            {applying ? 'Applying...' : 'Apply to Routine'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={handleDismiss}
            className="h-[44px] px-4 rounded-full font-medium text-[15px]"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(245,245,245,0.70)',
            }}
          >
            Dismiss
          </motion.button>
        </div>

        {/* View History Link */}
        {note.avgRpe !== undefined && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={springSnappy}
            onClick={() => setHistoryOpen(true)}
            className="w-full mt-3 py-2 flex items-center justify-center gap-1.5"
          >
            <Icon name="chart.line.uptrend.xyaxis" size={14} color="rgba(245,245,245,0.50)" />
            <span className="text-[13px] font-medium" style={{ color: 'rgba(245,245,245,0.50)' }}>
              View Progression History
            </span>
          </motion.button>
        )}

        {/* Applied badge */}
        {note.appliedAt && (
          <div className="mt-3 flex items-center gap-1.5">
            <Icon name="checkmark.circle.fill" size={14} color="#C5F74F" />
            <p className="text-[12px]" style={{ color: 'rgba(197,247,79,0.70)' }}>
              Applied {new Date(note.appliedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </motion.div>
      )}
    </AnimatePresence>

    {/* Progression History Sheet */}
    <ProgressionHistorySheet
      open={historyOpen}
      onClose={() => setHistoryOpen(false)}
      exerciseId={note.exerciseId}
      exerciseName={exerciseName}
      workouts={workouts}
    />
    </>
  );
}
