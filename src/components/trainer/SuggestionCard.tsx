// ═══════════════════════════════════════════════════════════════════
// FitForge — SuggestionCard Component
// User-side suggestion card (preview, accept, decline)
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import type { RoutineSuggestion } from '@/types';
import Link from 'next/link';

export interface SuggestionCardProps {
  suggestion: RoutineSuggestion;
  onAccept?: (suggestion: RoutineSuggestion) => void;
  onDecline?: (suggestion: RoutineSuggestion) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onDecline,
}: SuggestionCardProps): React.ReactElement {
  const routine = suggestion.routineSnapshot;
  const exerciseCount =
    (routine.warmUp?.length ?? 0) +
    (routine.workout?.length ?? 0) +
    (routine.stretch?.length ?? 0);

  const isPending = suggestion.status === 'pending';
  const isAccepted = suggestion.status === 'accepted';
  const isDeclined = suggestion.status === 'declined';

  return (
    <motion.div
      className="rounded-2xl p-4 glass"
      style={{
        opacity: isDeclined ? 0.5 : 1,
      }}
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
    >
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-2">
        {isPending && (
          <span
            className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(197,247,79,0.15)', color: '#C5F74F' }}
          >
            NEW
          </span>
        )}
        {isAccepted && (
          <span
            className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }}
          >
            Accepted
          </span>
        )}
        {isDeclined && (
          <span
            className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(245,245,245,0.45)' }}
          >
            Declined
          </span>
        )}
      </div>

      {/* Routine info */}
      <h3
        className="text-[17px] font-semibold"
        style={{ color: '#F5F5F5' }}
      >
        {routine.name}
      </h3>

      {/* Trainer note */}
      {suggestion.trainerNote && isPending && (
        <p
          className="text-[14px] mt-1 line-clamp-2"
          style={{ color: 'rgba(245,245,245,0.65)' }}
        >
          &ldquo;{suggestion.trainerNote}&rdquo;
        </p>
      )}

      {/* Meta */}
      <p
        className="text-[13px] mt-1.5"
        style={{ color: 'rgba(245,245,245,0.45)' }}
      >
        {exerciseCount} exercises
        {' · '}
        {isPending ? `Suggested ${timeAgo(suggestion.suggestedAt)}` : ''}
        {isAccepted && suggestion.respondedAt ? `Accepted ${timeAgo(suggestion.respondedAt)}` : ''}
        {isDeclined && suggestion.respondedAt ? `Declined ${timeAgo(suggestion.respondedAt)}` : ''}
      </p>

      {/* Actions */}
      {isPending && (
        <div className="flex gap-3 mt-4">
          <Link
            href={`/routines/suggested/${encodeURIComponent(suggestion._id)}`}
            className="flex-1"
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              transition={springSnappy}
              className="h-10 rounded-full flex items-center justify-center text-[15px] font-medium"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#F5F5F5',
              }}
            >
              Preview
            </motion.div>
          </Link>
          {onAccept && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={springSnappy}
              onClick={() => onAccept(suggestion)}
              className="flex-1 h-10 rounded-full flex items-center justify-center text-[15px] font-semibold"
              style={{
                background: '#C5F74F',
                color: '#0B0B0B',
              }}
            >
              Accept
            </motion.button>
          )}
        </div>
      )}

      {/* Accepted: link to the copied routine */}
      {isAccepted && suggestion.acceptedRoutineId && (
        <Link
          href={`/routines/${encodeURIComponent(suggestion.acceptedRoutineId)}`}
          className="flex items-center gap-1 mt-3 text-[14px] font-medium"
          style={{ color: 'var(--brand-lime, #C5F74F)' }}
        >
          View Routine
          <Icon name="chevron.right" size={14} />
        </Link>
      )}
    </motion.div>
  );
}
