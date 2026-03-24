// ═══════════════════════════════════════════════════════════════════
// FitForge — Sync Status Badge (Phase 7)
// Displays the current cloud sync state in a compact pill.
// States: idle | syncing | synced | error | offline
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { springSnappy } from '@/lib/motion/springs';
import type { SyncStatus, SyncState } from '@/types';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  /** If provided, clicking "error" badge triggers a manual retry */
  onRetry?: () => void;
}

const STATE_CONFIG: Record<
  SyncState,
  { label: string; color: string; icon: string; pulse?: boolean }
> = {
  idle: {
    label: 'Not syncing',
    color: 'rgba(245,245,245,0.35)',
    icon: 'icloud',
  },
  syncing: {
    label: 'Syncing…',
    color: '#64D2FF',
    icon: 'arrow.triangle.2.circlepath',
    pulse: true,
  },
  synced: {
    label: 'Synced',
    color: '#30D158',
    icon: 'checkmark.icloud.fill',
  },
  error: {
    label: 'Sync error',
    color: '#FF453A',
    icon: 'exclamationmark.icloud.fill',
  },
  offline: {
    label: 'Offline',
    color: 'rgba(245,245,245,0.35)',
    icon: 'icloud.slash.fill',
  },
};

export function SyncStatusBadge({ status, onRetry }: SyncStatusBadgeProps) {
  const cfg = STATE_CONFIG[status.state];

  const badge = (
    <motion.div
      key={status.state}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={springSnappy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${cfg.color}40`,
      }}
    >
      {/* Pulse dot for syncing */}
      {cfg.pulse && (
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: cfg.color }}
        />
      )}
      <Icon name={cfg.icon} size={14} color={cfg.color} />
      <span className="text-[12px] font-medium" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
      {status.state === 'error' && onRetry && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          onClick={onRetry}
          className="text-[11px] underline ml-1"
          style={{ color: cfg.color }}
        >
          Retry
        </motion.button>
      )}
    </motion.div>
  );

  return (
    <div>
      <AnimatePresence mode="wait">{badge}</AnimatePresence>
      {status.lastSyncedAt && status.state === 'synced' && (
        <p className="text-[11px] mt-1" style={{ color: 'rgba(245,245,245,0.35)' }}>
          Last synced{' '}
          {new Date(status.lastSyncedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
      {status.errorMessage && status.state === 'error' && (
        <p className="text-[11px] mt-1" style={{ color: 'rgba(255,69,58,0.70)' }}>
          {status.errorMessage}
        </p>
      )}
    </div>
  );
}
