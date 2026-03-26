// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-08: Suggested Routines Inbox
// User views routines suggested by their PT
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '@/lib/motion/variants';
import { TopBar } from '@/components/layout/TopBar';
import { Icon } from '@/components/ui/Icon';
import { SuggestionCard } from '@/components/trainer/SuggestionCard';
import { useSuggestions, useRespondToSuggestion } from '@/hooks/useSuggestions';
import { useSaveRoutine } from '@/hooks/useDatabase';
import type { RoutineSuggestion, Routine } from '@/types';

export default function SuggestedRoutinesPage(): React.ReactElement {
  const { data: suggestions = [], isLoading } = useSuggestions();
  const respondMutation = useRespondToSuggestion();
  const saveRoutine = useSaveRoutine();

  const handleAccept = (suggestion: RoutineSuggestion): void => {
    // Copy routineSnapshot to local PouchDB
    const snapshot = suggestion.routineSnapshot;
    const newId = `routine_suggested_${Date.now()}`;
    const localRoutine: Routine = {
      ...snapshot,
      _id: newId,
      _rev: undefined,
    };

    saveRoutine.mutate(localRoutine, {
      onSuccess: () => {
        respondMutation.mutate({
          suggestionId: suggestion._id,
          action: 'accept',
          acceptedRoutineId: newId,
        });
      },
    });
  };

  const handleDecline = (suggestion: RoutineSuggestion): void => {
    respondMutation.mutate({
      suggestionId: suggestion._id,
      action: 'decline',
    });
  };

  // Sort: pending first, then by date desc
  const sorted = [...suggestions].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.suggestedAt).getTime() - new Date(a.suggestedAt).getTime();
  });

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="Suggested Routines" showBack />

      <div className="px-5 pt-3 pb-32">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl glass animate-pulse h-32" />
            ))}
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div className="text-center py-16">
            <Icon name="tray.fill" size={40} className="mx-auto mb-4 opacity-30" />
            <p
              className="text-[17px] font-semibold mb-1"
              style={{ color: '#F5F5F5' }}
            >
              No suggestions yet
            </p>
            <p
              className="text-[14px]"
              style={{ color: 'rgba(245,245,245,0.45)' }}
            >
              When your trainer suggests a routine, it will appear here
            </p>
          </div>
        )}

        {!isLoading && sorted.length > 0 && (
          <motion.div
            className="space-y-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {sorted.map((suggestion) => (
              <motion.div key={suggestion._id} variants={fadeUpItem}>
                <SuggestionCard
                  suggestion={suggestion}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
