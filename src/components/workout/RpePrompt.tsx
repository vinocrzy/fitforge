// ═══════════════════════════════════════════════════════════════════
// FitForge — RPE Prompt
// Inline RPE collection after workout sets (emoji scale)
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { bannerVariants } from '@/lib/motion/variants';

const RPE_OPTIONS = [
  { emoji: '😴', label: 'Easy', value: 2 },
  { emoji: '🙂', label: 'Light', value: 4 },
  { emoji: '😤', label: 'Moderate', value: 6 },
  { emoji: '😰', label: 'Hard', value: 8 },
  { emoji: '🔥', label: 'Max', value: 10 },
];

interface RpePromptProps {
  isOpen: boolean;
  onSelect: (rpe: number) => void;
  onDismiss: () => void;
  autoCloseMs?: number;
}

export function RpePrompt({
  isOpen,
  onSelect,
  onDismiss,
  autoCloseMs = 8000,
}: RpePromptProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  // Reset selected when prompt opens (state-based comparison, React 19 compatible)
  if (isOpen && !prevOpen) {
    setSelected(null);
  }
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
  }

  // Auto-dismiss after timeout
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, autoCloseMs);

    return () => clearTimeout(timer);
  }, [isOpen, autoCloseMs, onDismiss]);

  const handleSelect = (value: number) => {
    setSelected(value);
    navigator.vibrate?.(30);
    // Brief delay for visual feedback
    setTimeout(() => {
      onSelect(value);
    }, 200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={bannerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed left-4 right-4 z-40 glass-sheet"
          style={{
            bottom: 'calc(16px + 72px + env(safe-area-inset-bottom, 0px))',
            borderRadius: 20,
            padding: '16px 20px',
          }}
        >
          <p
            className="text-[14px] font-semibold text-center mb-3"
            style={{ color: 'rgba(245,245,245,0.60)' }}
          >
            How hard was that set?
          </p>

          <div className="flex justify-between">
            {RPE_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                whileTap={{ scale: 0.9 }}
                transition={springSnappy}
                className="flex flex-col items-center gap-1 px-2"
              >
                <span
                  className="text-[28px] rounded-full w-12 h-12 flex items-center justify-center"
                  style={{
                    background:
                      selected === option.value
                        ? 'rgba(197,247,79,0.20)'
                        : 'rgba(255,255,255,0.06)',
                    border:
                      selected === option.value
                        ? '2px solid #C5F74F'
                        : '2px solid transparent',
                  }}
                >
                  {option.emoji}
                </span>
                <span
                  className="text-[11px]"
                  style={{
                    color:
                      selected === option.value
                        ? '#C5F74F'
                        : 'rgba(245,245,245,0.40)',
                  }}
                >
                  {option.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
