// ═══════════════════════════════════════════════════════════════════
// FitForge — ConnectionRequestCard Component
// Trainer-side card for accepting/declining subscription requests
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { useRespondToConnection } from '@/hooks/useConnections';
import type { TrainerConnection } from '@/types';

export interface ConnectionRequestCardProps {
  connection: TrainerConnection;
  index?: number;
}

function getTimeSince(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ConnectionRequestCard({ connection, index = 0 }: ConnectionRequestCardProps): React.ReactElement {
  const respondMutation = useRespondToConnection();
  const isPending = respondMutation.isPending;

  return (
    <motion.div
      className="glass rounded-2xl p-4 flex items-center gap-3"
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.06 }}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-[15px] font-bold"
        style={{ background: 'rgba(197,247,79,0.15)', color: '#C5F74F' }}
      >
        {(connection.clientId ?? '??').slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold truncate" style={{ color: '#F5F5F5' }}>
          Client {connection.clientId.slice(-6)}
        </p>
        <p className="text-[13px]" style={{ color: 'rgba(245,245,245,0.50)' }}>
          {getTimeSince(connection.requestedAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.93 }}
          transition={springSnappy}
          disabled={isPending}
          onClick={() => respondMutation.mutate({ connectionId: connection._id, action: 'decline' })}
          className="h-9 px-4 rounded-full text-[13px] font-semibold"
          style={{
            background: 'rgba(255,69,58,0.12)',
            color: '#FF453A',
            opacity: isPending ? 0.5 : 1,
          }}
        >
          Decline
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.93 }}
          transition={springSnappy}
          disabled={isPending}
          onClick={() => respondMutation.mutate({ connectionId: connection._id, action: 'accept' })}
          className="h-9 px-4 rounded-full text-[13px] font-semibold"
          style={{
            background: '#C5F74F',
            color: '#0B0B0B',
            opacity: isPending ? 0.5 : 1,
          }}
        >
          Accept
        </motion.button>
      </div>
    </motion.div>
  );
}
