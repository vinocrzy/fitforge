// ═══════════════════════════════════════════════════════════════════
// FitForge — HoldTimer
// Countdown timer for stretch holds with SVG ring
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { springGentle } from '@/lib/motion/springs';

interface HoldTimerProps {
  totalSeconds: number;
  onComplete: () => void;
  isActive: boolean;
  color?: string;
}

export function HoldTimer({
  totalSeconds,
  onComplete,
  isActive,
  color = '#A18CD1',
}: HoldTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [started, setStarted] = useState(false);
  const [prevTotal, setPrevTotal] = useState(totalSeconds);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = 1 - remaining / totalSeconds;
  const dashOffset = circumference * (1 - progress);

  // Reset when totalSeconds changes (state-based comparison, React 19 compatible)
  if (prevTotal !== totalSeconds) {
    setPrevTotal(totalSeconds);
    setRemaining(totalSeconds);
    setStarted(false);
  }

  useEffect(() => {
    if (!isActive || !started) return;

    if (remaining <= 0) {
      navigator.vibrate?.([100, 50, 100]);
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, started, remaining, onComplete]);

  const handleStart = useCallback(() => {
    setStarted(true);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring Timer */}
      <div className="relative" style={{ width: 180, height: 180 }}>
        <svg
          width={180}
          height={180}
          viewBox="0 0 180 180"
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            strokeWidth={12}
            stroke="rgba(255,255,255,0.08)"
          />
          {/* Countdown ring */}
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            strokeWidth={12}
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: dashOffset }}
            transition={springGentle}
          />
        </svg>

        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[48px] font-extrabold tabular-nums"
            style={{ color: remaining <= 5 ? '#FF453A' : '#F5F5F5' }}
          >
            {remaining}
          </span>
        </div>
      </div>

      {/* Breathing cue */}
      <p
        className="text-[14px] text-center"
        style={{ color: 'rgba(245,245,245,0.35)' }}
      >
        Inhale 4s • Hold 4s • Exhale 4s
      </p>

      {/* Start button if not yet started */}
      {!started && isActive && (
        <motion.button
          onClick={handleStart}
          whileTap={{ scale: 0.96 }}
          className="px-8 h-12 rounded-full text-[17px] font-semibold"
          style={{ background: color, color: '#0B0B0B' }}
        >
          START HOLD
        </motion.button>
      )}
    </div>
  );
}
