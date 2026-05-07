// ═══════════════════════════════════════════════════════════════════
// FitForge — DietWidget
// Dashboard card showing today's calorie & macro progress
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy, springDefault } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useDailyTotals } from '@/hooks/useMealEntries';
import { useDietProfile } from '@/hooks/useDietProfile';

// ─── Helpers ─────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function r0(n: number): number {
  return Math.round(n);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// ─── Mini progress bar ────────────────────────────────────────────

interface MacroBarProps {
  label: string;
  consumed: number;
  target: number;
  color: string;
}

function MacroBar({ label, consumed, target, color }: MacroBarProps) {
  const pct = target > 0 ? clamp01(consumed / target) : 0;
  const isOver = consumed > target && target > 0;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--brand-text-2)' }}
        >
          {label}
        </span>
        <span
          className="text-[11px] tabular-nums font-medium"
          style={{ color: isOver ? 'var(--brand-danger)' : 'var(--brand-text-2)' }}
        >
          {r0(consumed)}<span style={{ color: 'var(--brand-text-3)' }}>/{r0(target)}g</span>
        </span>
      </div>
      {/* Track */}
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}
      >
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct }}
          transition={springDefault}
          style={{
            height: '100%',
            borderRadius: 4,
            transformOrigin: 'left',
            background: isOver ? 'var(--brand-danger)' : color,
          }}
        />
      </div>
    </div>
  );
}

// ─── DietWidget ───────────────────────────────────────────────────

export function DietWidget() {
  const router = useRouter();
  const today = useMemo(todayISO, []);

  const { totals, isLoading } = useDailyTotals(today);
  const { data: dietProfile, isLoading: profileLoading } = useDietProfile();

  const targets = dietProfile?.dailyTargets;
  const calTarget = targets?.calories ?? 0;
  const calConsumed = r0(totals.calories);

  const calPct = calTarget > 0 ? clamp01(calConsumed / calTarget) : 0;
  const calRemaining = calTarget > 0 ? calTarget - calConsumed : null;
  const isOver = calConsumed > calTarget && calTarget > 0;
  const calRingColor = isOver ? 'var(--brand-danger)' : 'var(--brand-lime)';

  if (profileLoading || isLoading) {
    return (
      <div
        className="rounded-[20px] p-5 flex items-center justify-center"
        style={{ background: '#141414', minHeight: 120 }}
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

  // No diet profile set up yet
  if (!dietProfile) {
    return (
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onClick={() => router.push('/diet/setup')}
        className="rounded-[20px] p-5 cursor-pointer flex items-center justify-between"
        style={{ background: '#141414', border: '1px solid rgba(197,247,79,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(197,247,79,0.12)' }}
          >
            <Icon name="fork.knife" size={20} color="var(--brand-lime)" />
          </div>
          <div>
            <p className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>
              Set Up Nutrition
            </p>
            <p className="text-[13px]" style={{ color: 'rgba(245,245,245,0.50)' }}>
              Track calories &amp; macros
            </p>
          </div>
        </div>
        <Icon name="chevron.right" size={16} color="rgba(245,245,245,0.30)" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.52 }}
      className="rounded-[20px] p-5"
      style={{ background: '#141414' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[13px] font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.06em' }}
        >
          TODAY&apos;S NUTRITION
        </span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          onClick={() => router.push('/diet')}
          className="flex items-center gap-1 text-[13px] font-semibold"
          style={{ color: 'var(--brand-lime)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Open diet tracker"
        >
          Open
          <Icon name="chevron.right" size={13} color="var(--brand-lime)" />
        </motion.button>
      </div>

      {/* Calorie progress row */}
      <div className="flex items-center gap-4 mb-5">
        {/* Circular mini-ring */}
        <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
          <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={32}
              cy={32}
              r={26}
              fill="none"
              stroke={calRingColor}
              strokeWidth={5}
              strokeOpacity={0.2}
            />
            <motion.circle
              cx={32}
              cy={32}
              r={26}
              fill="none"
              stroke={calRingColor}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 26}
              initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - calPct) }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 1 }}>
            <span
              className="tabular-nums font-extrabold leading-none"
              style={{ fontSize: 15, color: isOver ? 'var(--brand-danger)' : '#F5F5F5' }}
            >
              {calConsumed}
            </span>
            <span style={{ fontSize: 9, color: 'rgba(245,245,245,0.45)' }}>kcal</span>
          </div>
        </div>

        {/* Calorie text */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[17px] font-bold tabular-nums"
            style={{ color: isOver ? 'var(--brand-danger)' : '#F5F5F5' }}
          >
            {calConsumed}
            <span className="text-[13px] font-normal" style={{ color: 'rgba(245,245,245,0.45)' }}>
              {' '}/ {r0(calTarget)} kcal
            </span>
          </p>
          {calRemaining !== null && (
            <p className="text-[13px] mt-0.5" style={{ color: 'rgba(245,245,245,0.55)' }}>
              {isOver
                ? `${r0(Math.abs(calRemaining))} kcal over target`
                : `${r0(calRemaining)} kcal remaining`}
            </p>
          )}
        </div>

        {/* Log food CTA */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          onClick={() => router.push('/diet/log/search?slot=snack&date=' + today)}
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(197,247,79,0.15)' }}
          aria-label="Log food"
        >
          <Icon name="plus" size={18} color="var(--brand-lime)" />
        </motion.button>
      </div>

      {/* Macro bars */}
      <div className="flex gap-4">
        <MacroBar
          label="Protein"
          consumed={totals.proteinG}
          target={targets?.proteinG ?? 0}
          color="#64D2FF"
        />
        <MacroBar
          label="Carbs"
          consumed={totals.carbsG}
          target={targets?.carbsG ?? 0}
          color="var(--brand-lime)"
        />
        <MacroBar
          label="Fat"
          consumed={totals.fatG}
          target={targets?.fatG ?? 0}
          color="#FF9F0A"
        />
      </div>
    </motion.div>
  );
}
