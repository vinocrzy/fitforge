// ═══════════════════════════════════════════════════════════════════
// FitForge — RepCounter
// Large tap-target rep counter with +/- buttons
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';

interface RepCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function RepCounter({ value, onChange, min = 0, max = 999 }: RepCounterProps) {
  const decrement = () => {
    if (value > min) {
      onChange(value - 1);
      navigator.vibrate?.(30);
    }
  };

  const increment = () => {
    if (value < max) {
      onChange(value + 1);
      navigator.vibrate?.(30);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 px-4">
      {/* Minus Button */}
      <motion.button
        onClick={decrement}
        whileTap={{ scale: 0.92 }}
        transition={springSnappy}
        className="w-16 h-16 rounded-[20px] flex items-center justify-center"
        style={{
          background: '#1E1E1E',
          opacity: value <= min ? 0.4 : 1,
        }}
        disabled={value <= min}
      >
        <span className="text-[28px] font-bold" style={{ color: '#F5F5F5' }}>
          −
        </span>
      </motion.button>

      {/* Count Display */}
      <div
        className="flex-1 h-16 rounded-[20px] flex items-center justify-center relative overflow-hidden"
        style={{ background: '#141414' }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={springSnappy}
            className="text-[48px] font-extrabold tabular-nums"
            style={{ color: '#C5F74F' }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Plus Button */}
      <motion.button
        onClick={increment}
        whileTap={{ scale: 0.92 }}
        transition={springSnappy}
        className="w-16 h-16 rounded-[20px] flex items-center justify-center"
        style={{
          background: '#1E1E1E',
          opacity: value >= max ? 0.4 : 1,
        }}
        disabled={value >= max}
      >
        <span className="text-[28px] font-bold" style={{ color: '#F5F5F5' }}>
          +
        </span>
      </motion.button>
    </div>
  );
}
