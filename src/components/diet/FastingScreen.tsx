'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault, springSnappy, springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  useActiveFast,
  useFastingHistory,
  useStartFast,
  useEndFast,
  useCancelFast,
} from '@/hooks/useFasting';
import type { FastingLog } from '@/types';

// ─── Protocols ────────────────────────────────────────────────────

const PROTOCOLS = [
  { id: 16, label: '16:8', desc: 'Fast 16h, eat 8h' },
  { id: 18, label: '18:6', desc: 'Fast 18h, eat 6h' },
  { id: 20, label: '20:4', desc: 'Fast 20h, eat 4h' },
  { id: 23, label: 'OMAD', desc: 'One meal a day (23h)' },
] as const;

// ─── Duration helper ──────────────────────────────────────────────

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Progress Ring ────────────────────────────────────────────────

interface ProgressRingProps {
  elapsedHours: number;
  targetHours: number;
}

function ProgressRing({ elapsedHours, targetHours }: ProgressRingProps) {
  const radius = 60;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(elapsedHours / targetHours, 1);
  const offset = circumference * (1 - progress);
  const size = (radius + stroke) * 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--brand-lime)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      {/* Center label */}
      <div className="flex flex-col items-center">
        <span
          className="font-bold tabular-nums"
          style={{ fontSize: 13, color: 'var(--brand-lime)' }}
        >
          {elapsedHours.toFixed(1)}h
        </span>
        <span style={{ fontSize: 11, color: 'var(--brand-text-3)' }}>
          / {targetHours}h
        </span>
      </div>
    </div>
  );
}

// ─── Active Fast Card ─────────────────────────────────────────────

interface ActiveFastCardProps {
  fast: FastingLog;
  now: number;
  onEnd: () => void;
  onCancel: () => void;
  isEndPending: boolean;
  isCancelPending: boolean;
}

function ActiveFastCard({ fast, now, onEnd, onCancel, isEndPending, isCancelPending }: ActiveFastCardProps) {
  const startedMs = new Date(fast.startedAt).getTime();
  const elapsedMs = now - startedMs;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const goalReached = elapsedHours >= fast.targetHours;

  const protocolEntry = PROTOCOLS.find(p => p.id === fast.targetHours);
  const protocolLabel = protocolEntry ? protocolEntry.label : `${fast.targetHours}h`;

  const startedFormatted = new Date(fast.startedAt).toLocaleString('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springDefault}
      className="glass rounded-2xl p-6"
    >
      {/* Protocol label */}
      <p
        className="text-sm font-semibold uppercase mb-4"
        style={{ color: 'var(--brand-lime)', letterSpacing: '0.08em', fontSize: 14 }}
      >
        {protocolLabel} Fast
      </p>

      {/* Timer + ring row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Countdown */}
        <div className="flex-1">
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: 48,
              color: 'var(--brand-text)',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {formatDuration(elapsedMs)}
          </span>
        </div>
        {/* Progress ring */}
        <ProgressRing elapsedHours={elapsedHours} targetHours={fast.targetHours} />
      </div>

      {/* Goal reached badge */}
      <AnimatePresence>
        {goalReached && (
          <motion.div
            key="goal-badge"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={springSnappy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl mb-4"
            style={{ background: 'rgba(197,247,79,0.18)' }}
          >
            <span style={{ fontSize: 16 }}>🎉</span>
            <span className="font-bold" style={{ color: 'var(--brand-lime)', fontSize: 13 }}>
              Goal Reached!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Started at */}
      <p className="mb-5" style={{ color: 'var(--brand-text-2)', fontSize: 13 }}>
        Started: {startedFormatted}
      </p>

      {/* Action buttons */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={springSnappy}
          onClick={onEnd}
          disabled={isEndPending || isCancelPending}
          className="flex-1 rounded-2xl py-3.5 font-bold"
          style={{
            background: 'var(--brand-lime)',
            color: '#0B0B0B',
            fontSize: 15,
            border: 'none',
            cursor: isEndPending ? 'not-allowed' : 'pointer',
            opacity: isEndPending ? 0.7 : 1,
          }}
        >
          {isEndPending ? 'Ending…' : 'End Fast'}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={springSnappy}
          onClick={onCancel}
          disabled={isEndPending || isCancelPending}
          className="flex-1 rounded-2xl py-3.5 font-bold"
          style={{
            background: 'rgba(255,69,58,0.10)',
            color: 'var(--brand-danger)',
            fontSize: 15,
            border: 'none',
            cursor: isCancelPending ? 'not-allowed' : 'pointer',
            opacity: isCancelPending ? 0.7 : 1,
          }}
        >
          {isCancelPending ? 'Cancelling…' : 'Cancel'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── History Row ──────────────────────────────────────────────────

interface HistoryRowProps {
  fast: FastingLog;
  isLast: boolean;
}

function HistoryRow({ fast, isLast }: HistoryRowProps) {
  const protocolEntry = PROTOCOLS.find(p => p.id === fast.targetHours);
  const label = protocolEntry ? protocolEntry.label : `${fast.targetHours}h`;

  const durationMs = fast.endedAt
    ? new Date(fast.endedAt).getTime() - new Date(fast.startedAt).getTime()
    : null;
  const durationHours = durationMs !== null ? durationMs / (1000 * 60 * 60) : null;
  const goalMet = durationHours !== null && durationHours >= fast.targetHours;

  const dateFormatted = new Date(fast.startedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 14 }}>{goalMet ? '✅' : '⏱'}</span>
            <span className="font-semibold" style={{ color: 'var(--brand-text)', fontSize: 15 }}>
              {label} Fast
            </span>
          </div>
          <p style={{ color: 'var(--brand-text-3)', fontSize: 12, marginTop: 2 }}>{dateFormatted}</p>
        </div>
        <span className="font-semibold tabular-nums" style={{ color: 'var(--brand-text-2)', fontSize: 14 }}>
          {durationHours !== null ? `${durationHours.toFixed(1)}h` : '—'}
        </span>
      </div>
      {!isLast && (
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginLeft: 16, marginRight: 16 }} />
      )}
    </>
  );
}

// ─── FastingScreen ────────────────────────────────────────────────

export function FastingScreen() {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [isStartSheetOpen, setIsStartSheetOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<16 | 18 | 20 | 23>(16);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: activeFast } = useActiveFast();
  const { data: history = [] } = useFastingHistory(20);
  const startFast = useStartFast();
  const endFast = useEndFast();
  const cancelFast = useCancelFast();

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--brand-bg)',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 112,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={springSnappy}
          onClick={() => router.back()}
          aria-label="Go back"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Icon name="chevron.left" size={24} color="var(--brand-text)" />
        </motion.button>
        <h1
          className="font-black"
          style={{ fontSize: 22, color: 'var(--brand-text)', letterSpacing: '-0.02em' }}
        >
          Intermittent Fasting
        </h1>
      </div>

      <div className="space-y-4">
        {/* Active fast or empty state */}
        <AnimatePresence mode="wait">
          {activeFast ? (
            <ActiveFastCard
              key="active"
              fast={activeFast}
              now={now}
              onEnd={() => endFast.mutate({ id: activeFast._id, rev: activeFast._rev ?? '' })}
              onCancel={() => cancelFast.mutate({ id: activeFast._id, rev: activeFast._rev ?? '' })}
              isEndPending={endFast.isPending}
              isCancelPending={cancelFast.isPending}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={springDefault}
              className="glass rounded-2xl p-5 flex flex-col items-center text-center gap-3"
            >
              <Icon name="timer" size={48} color="var(--brand-text-3)" />
              <div>
                <p className="font-bold mb-1" style={{ color: 'var(--brand-text)', fontSize: 20 }}>
                  No active fast
                </p>
                <p style={{ color: 'var(--brand-text-2)', fontSize: 14, lineHeight: 1.5 }}>
                  Track your intermittent fasting window to stay on schedule.
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                onClick={() => setIsStartSheetOpen(true)}
                className="rounded-2xl px-6 py-3 font-bold mt-1"
                style={{ background: 'var(--brand-lime)', color: '#0B0B0B', fontSize: 15, border: 'none', cursor: 'pointer' }}
              >
                Start Fast
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springGentle}
            className="glass rounded-2xl overflow-hidden"
          >
            <p
              className="uppercase px-4 pt-3 pb-2"
              style={{ color: 'var(--brand-text-2)', fontSize: 12, letterSpacing: '0.08em', fontWeight: 600 }}
            >
              History
            </p>
            {history.map((fast, i) => (
              <HistoryRow key={fast._id} fast={fast} isLast={i === history.length - 1} />
            ))}
          </motion.div>
        )}
      </div>

      {/* Start Fast Sheet */}
      <BottomSheet
        id="start-fast-sheet"
        open={isStartSheetOpen}
        onClose={() => setIsStartSheetOpen(false)}
        title="Start a Fast"
      >
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Protocol selector grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            {PROTOCOLS.map(protocol => {
              const isActive = selectedProtocol === protocol.id;
              return (
                <motion.button
                  key={protocol.id}
                  whileTap={{ scale: 0.96 }}
                  transition={springSnappy}
                  onClick={() => setSelectedProtocol(protocol.id as 16 | 18 | 20 | 23)}
                  className={cn('rounded-2xl p-4 text-left', isActive ? '' : 'glass')}
                  style={{
                    background: isActive ? 'var(--brand-lime)' : undefined,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <p
                    className="font-bold"
                    style={{ color: isActive ? '#0B0B0B' : 'var(--brand-text)', fontSize: 18 }}
                  >
                    {protocol.label}
                  </p>
                  <p
                    style={{ color: isActive ? 'rgba(0,0,0,0.55)' : 'var(--brand-text-2)', fontSize: 12, marginTop: 2 }}
                  >
                    {protocol.desc}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {/* Start button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            onClick={() => {
              startFast.mutate({ targetHours: selectedProtocol });
              setIsStartSheetOpen(false);
            }}
            disabled={startFast.isPending}
            className="rounded-2xl py-4 font-bold"
            style={{
              background: 'var(--brand-lime)',
              color: '#0B0B0B',
              fontSize: 16,
              border: 'none',
              cursor: startFast.isPending ? 'not-allowed' : 'pointer',
              opacity: startFast.isPending ? 0.7 : 1,
            }}
          >
            {startFast.isPending ? 'Starting…' : 'Start Fasting Now'}
          </motion.button>
        </div>
      </BottomSheet>
    </div>
  );
}
