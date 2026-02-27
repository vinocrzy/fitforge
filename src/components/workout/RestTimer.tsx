// ═══════════════════════════════════════════════════════════════════
// FitForge — RestTimer (S-13)
// Full-screen glass countdown overlay between sets
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import { formatTime } from '@/lib/calculations/time';

interface RestTimerProps {
  initialSeconds: number;
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  nextExerciseName?: string;
  nextExerciseConfig?: string;
}

export function RestTimer({
  initialSeconds,
  isOpen,
  onComplete,
  onSkip,
  nextExerciseName,
  nextExerciseConfig,
}: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isPulsing, setIsPulsing] = useState(false);

  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / totalSeconds;
  const dashOffset = circumference * (1 - progress);

  // Reset when timer opens — track previous open state via state comparison
  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen && !prevOpen) {
    setTotalSeconds(initialSeconds);
    setRemaining(initialSeconds);
    setIsPulsing(false);
  }
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
  }

  // Countdown
  useEffect(() => {
    if (!isOpen || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsPulsing(true);
          navigator.vibrate?.([100, 50, 100]);
          // Auto-dismiss after pulse animation
          setTimeout(() => onComplete(), 1200);
          return 0;
        }
        // Haptic warning at 10s
        if (next === 10) {
          navigator.vibrate?.(40);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, remaining, onComplete]);

  const adjustTime = useCallback(
    (delta: number) => {
      setTotalSeconds((prev) => Math.max(10, prev + delta));
      setRemaining((prev) => Math.max(1, prev + delta));
    },
    []
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={springGentle}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center glass-sheet"
          style={{
            borderRadius: 0,
            backdropFilter: 'blur(60px)',
            WebkitBackdropFilter: 'blur(60px)',
          }}
        >
          {/* Drag handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <div
              className="w-9 h-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.20)' }}
            />
          </div>

          {/* REST label */}
          <span
            className="text-[17px] font-extrabold uppercase mb-8"
            style={{ color: 'rgba(197,247,79,0.60)', letterSpacing: '0.1em' }}
          >
            REST
          </span>

          {/* Ring Timer */}
          <motion.div
            className="relative"
            style={{ width: 200, height: 200 }}
            animate={isPulsing ? { opacity: [1, 0, 1, 0, 1] } : {}}
            transition={isPulsing ? { duration: 1.2, ease: 'easeInOut' } : {}}
          >
            <svg
              width={200}
              height={200}
              viewBox="0 0 200 200"
              className="transform -rotate-90"
            >
              {/* Background ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                strokeWidth={12}
                stroke="rgba(255,255,255,0.08)"
              />
              {/* Countdown ring */}
              <motion.circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                strokeWidth={12}
                stroke="#C5F74F"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.3, ease: 'linear' }}
              />
            </svg>

            {/* Time text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-[56px] font-extrabold tabular-nums"
                style={{
                  color: remaining <= 10 ? '#FF453A' : '#F5F5F5',
                }}
              >
                {formatTime(remaining)}
              </span>
            </div>
          </motion.div>

          {/* Next exercise preview */}
          {nextExerciseName && (
            <div className="mt-8 text-center">
              <span
                className="text-[13px] font-extrabold uppercase"
                style={{ color: 'rgba(245,245,245,0.40)', letterSpacing: '0.1em' }}
              >
                NEXT
              </span>
              <p
                className="text-[17px] font-semibold mt-1"
                style={{ color: '#F5F5F5' }}
              >
                {nextExerciseName}
              </p>
              {nextExerciseConfig && (
                <p
                  className="text-[15px] mt-0.5"
                  style={{ color: 'rgba(245,245,245,0.55)' }}
                >
                  {nextExerciseConfig}
                </p>
              )}
            </div>
          )}

          {/* Adjust buttons */}
          <div className="flex gap-4 mt-8">
            <motion.button
              onClick={() => adjustTime(-30)}
              whileTap={{ scale: 0.95 }}
              transition={springSnappy}
              className="h-10 px-5 rounded-full glass"
              style={{ color: '#C5F74F' }}
            >
              <span className="text-[15px] font-semibold">−30s</span>
            </motion.button>
            <motion.button
              onClick={() => adjustTime(30)}
              whileTap={{ scale: 0.95 }}
              transition={springSnappy}
              className="h-10 px-5 rounded-full glass"
              style={{ color: '#C5F74F' }}
            >
              <span className="text-[15px] font-semibold">+30s</span>
            </motion.button>
          </div>

          {/* Skip button */}
          <motion.button
            onClick={() => {
              navigator.vibrate?.([100, 50, 100]);
              onSkip();
            }}
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            className="mt-6 h-[52px] px-6 rounded-[14px] w-full max-w-[300px]"
            style={{
              border: '1px solid rgba(197,247,79,0.35)',
              background: 'transparent',
            }}
          >
            <span
              className="text-[17px] font-semibold"
              style={{ color: '#C5F74F' }}
            >
              SKIP REST
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
