'use client';

import { motion } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useTotalHydrationMl, useLogHydration, useHydrationToday } from '@/hooks/useHydration';

// ─── Types ────────────────────────────────────────────────────────

export interface HydrationCardProps {
  date: string;    // YYYY-MM-DD
  goalMl?: number; // Default 2500
}

// ─── Quick-add increments ─────────────────────────────────────────

const AMOUNTS = [250, 500, 750, 1000] as const;

// ─── HydrationCard ────────────────────────────────────────────────

export function HydrationCard({ date, goalMl = 2500 }: HydrationCardProps) {
  const { totalMl } = useTotalHydrationMl(date);
  const { data: entries = [] } = useHydrationToday(date);
  const logHydration = useLogHydration();

  const fillPercent = Math.min((totalMl / goalMl) * 100, 100);
  const recentEntries = [...entries].reverse().slice(0, 5);

  return (
    <div className="glass rounded-2xl p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="drop.fill" size={18} color="var(--brand-lime)" />
          <span className="font-bold" style={{ color: 'var(--brand-text)', fontSize: 15 }}>
            Hydration
          </span>
        </div>
        <span style={{ color: 'var(--brand-text-2)', fontSize: 13 }}>
          {totalMl}ml / {goalMl}ml
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="rounded-full overflow-hidden mb-3"
        style={{ height: 8, background: 'rgba(255,255,255,0.08)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--brand-lime)' }}
          animate={{ width: `${fillPercent}%` }}
          transition={springGentle}
        />
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-2 mb-3">
        {AMOUNTS.map(amount => (
          <motion.button
            key={amount}
            whileTap={{ scale: 0.92 }}
            transition={springSnappy}
            onClick={() => logHydration.mutate({ date, amountMl: amount })}
            disabled={logHydration.isPending}
            className="glass flex-1 rounded-xl py-2 font-semibold"
            style={{
              color: 'var(--brand-lime)',
              fontSize: 13,
              border: 'none',
              cursor: logHydration.isPending ? 'not-allowed' : 'pointer',
              opacity: logHydration.isPending ? 0.6 : 1,
            }}
          >
            +{amount}ml
          </motion.button>
        ))}
      </div>

      {/* Today's log */}
      {recentEntries.length > 0 && (
        <div className="space-y-1">
          {recentEntries.map(e => (
            <p key={e._id} style={{ color: 'var(--brand-text-3)', fontSize: 12 }}>
              {new Date(e.loggedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}{' '}
              &mdash; {e.amountMl}ml
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
