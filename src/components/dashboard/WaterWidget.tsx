// ═══════════════════════════════════════════════════════════════════
// FitForge — WaterWidget
// Dashboard card for today's water intake with quick-log buttons
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { springSnappy, springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useTotalHydrationMl, useLogHydration } from '@/hooks/useHydration';

const GOAL_ML = 2500;
const QUICK_AMOUNTS = [250, 500] as const;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Drop icon indicator ──────────────────────────────────────────

function DropIndicator({ filled }: { filled: boolean }) {
  return (
    <motion.div
      animate={{ opacity: filled ? 1 : 0.2, scale: filled ? 1 : 0.85 }}
      transition={springGentle}
      className="w-4 h-4 rounded-full"
      style={{
        background: filled
          ? 'linear-gradient(135deg, #64D2FF, #0A84FF)'
          : 'rgba(255,255,255,0.10)',
      }}
    />
  );
}

// ─── WaterWidget ─────────────────────────────────────────────────

export function WaterWidget() {
  const today = useMemo(todayISO, []);
  const { totalMl, isLoading } = useTotalHydrationMl(today);
  const logHydration = useLogHydration();

  const fillPct = Math.min((totalMl / GOAL_ML) * 100, 100);
  const remaining = Math.max(GOAL_ML - totalMl, 0);
  const isGoalMet = totalMl >= GOAL_ML;

  // 5 drop indicators
  const drops = Array.from({ length: 5 }, (_, i) =>
    totalMl >= ((i + 1) / 5) * GOAL_ML,
  );

  if (isLoading) {
    return (
      <div
        className="rounded-[20px] p-5 flex items-center justify-center"
        style={{ background: '#141414', minHeight: 100 }}
      >
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-8 h-8 rounded-full"
          style={{ background: 'var(--brand-surface-2)' }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.56 }}
      className="rounded-[20px] p-5"
      style={{ background: '#141414' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="text-[13px] font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.06em' }}
          >
            WATER INTAKE
          </span>
        </div>
        {isGoalMet && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springSnappy}
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(100,210,255,0.15)', color: '#64D2FF' }}
          >
            Goal met!
          </motion.span>
        )}
      </div>

      {/* Main row: drop visual + stats */}
      <div className="flex items-center gap-4 mb-4">
        {/* Large drop icon */}
        <div
          className="relative shrink-0 flex items-center justify-center rounded-full"
          style={{ width: 56, height: 56, background: 'rgba(100,210,255,0.12)' }}
        >
          <Icon name="drop.fill" size={26} color="#64D2FF" />
          {/* Fill overlay clipped bottom-up */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-full overflow-hidden pointer-events-none"
            animate={{ height: `${fillPct}%` }}
            transition={springGentle}
            style={{ background: 'rgba(100,210,255,0.20)' }}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[17px] font-bold tabular-nums"
            style={{ color: '#64D2FF' }}
          >
            {totalMl.toLocaleString()}
            <span className="text-[13px] font-normal" style={{ color: 'rgba(245,245,245,0.45)' }}>
              {' '}/ {GOAL_ML.toLocaleString()} ml
            </span>
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: 'rgba(245,245,245,0.55)' }}>
            {isGoalMet
              ? `${(totalMl - GOAL_ML).toLocaleString()} ml over goal`
              : `${remaining.toLocaleString()} ml remaining`}
          </p>
        </div>

        {/* Drop indicators */}
        <div className="flex gap-1.5 shrink-0">
          {drops.map((filled, i) => (
            <DropIndicator key={i} filled={filled} />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="rounded-full overflow-hidden mb-4"
        style={{ height: 5, background: 'rgba(255,255,255,0.08)' }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={springGentle}
          style={{ background: isGoalMet ? '#30D158' : '#64D2FF' }}
        />
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-2">
        {QUICK_AMOUNTS.map(amount => (
          <motion.button
            key={amount}
            whileTap={{ scale: 0.92 }}
            transition={springSnappy}
            onClick={() => logHydration.mutate({ date: today, amountMl: amount })}
            disabled={logHydration.isPending}
            className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-1.5 font-semibold"
            style={{
              background: 'rgba(100,210,255,0.12)',
              color: '#64D2FF',
              fontSize: 13,
              border: 'none',
              cursor: logHydration.isPending ? 'not-allowed' : 'pointer',
              opacity: logHydration.isPending ? 0.6 : 1,
            }}
            aria-label={`Add ${amount}ml water`}
          >
            <Icon name="plus" size={14} color="#64D2FF" />
            {amount}ml
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
