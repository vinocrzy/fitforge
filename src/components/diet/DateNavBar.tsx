'use client';

import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { springSnappy } from '@/lib/motion/springs';

export interface DateNavBarProps {
  date: string;
  onDateChange: (date: string) => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatNavDate(iso: string): string {
  if (iso === todayISO()) return 'Today';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function DateNavBar({ date, onDateChange }: DateNavBarProps) {
  const today = todayISO();
  const minDate = offsetDate(today, -30);
  const canGoBack = date > minDate;
  const canGoForward = date < today;

  const handleBack = () => {
    if (canGoBack) onDateChange(offsetDate(date, -1));
  };

  const handleForward = () => {
    if (canGoForward) onDateChange(offsetDate(date, 1));
  };

  const handlePanEnd = (_e: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 50 && canGoBack) onDateChange(offsetDate(date, -1));
    else if (info.offset.x < -50 && canGoForward) onDateChange(offsetDate(date, 1));
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onPanEnd={handlePanEnd}
      className="flex items-center justify-between w-full px-1 py-2"
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        transition={springSnappy}
        onClick={handleBack}
        disabled={!canGoBack}
        className="p-2 rounded-xl"
        style={{ opacity: canGoBack ? 1 : 0.3 }}
        aria-label="Previous day"
      >
        <Icon name="chevron.left" size={20} color="var(--brand-text-2)" />
      </motion.button>

      <span
        className="font-semibold text-base"
        style={{ color: 'var(--brand-text)' }}
      >
        {formatNavDate(date)}
      </span>

      <motion.button
        whileTap={{ scale: 0.85 }}
        transition={springSnappy}
        onClick={handleForward}
        disabled={!canGoForward}
        className="p-2 rounded-xl"
        style={{ opacity: canGoForward ? 1 : 0.3 }}
        aria-label="Next day"
      >
        <Icon name="chevron.right" size={20} color="var(--brand-text-2)" />
      </motion.button>
    </motion.div>
  );
}
