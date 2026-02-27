// ═══════════════════════════════════════════════════════════════════
// FitForge — Daily Feel Prompt
// Quick 1-5 self-report for recovery meter input
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { useProfileStore } from '@/store/useProfileStore';

const FEEL_OPTIONS = [
  { value: 1, emoji: '😫', label: 'Exhausted' },
  { value: 2, emoji: '😕', label: 'Tired' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '💪', label: 'Great' },
];

export function DailyFeelPrompt() {
  const { lastFeelPromptDate, setManualFeelScore } = useProfileStore();
  const today = new Date().toISOString().split('T')[0];
  const alreadyAsked = lastFeelPromptDate === today;

  const [selected, setSelected] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (alreadyAsked || dismissed) return null;

  const handleSelect = (value: number) => {
    setSelected(value);
    setTimeout(() => {
      setManualFeelScore(value);
      setDismissed(true);
    }, 600);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -16, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="rounded-[20px] p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(197,247,79,0.08), rgba(197,247,79,0.02))',
          border: '1px solid rgba(197,247,79,0.15)',
        }}
      >
        <p
          className="text-[15px] font-semibold"
          style={{ color: '#F5F5F5' }}
        >
          How are you feeling today?
        </p>
        <p
          className="text-[13px] mt-1"
          style={{ color: 'rgba(245,245,245,0.50)' }}
        >
          This helps personalize your recovery score
        </p>

        <div className="flex justify-between mt-4">
          {FEEL_OPTIONS.map((opt) => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.9 }}
              transition={springSnappy}
              onClick={() => handleSelect(opt.value)}
              className="flex flex-col items-center gap-1.5"
            >
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center text-[24px]"
                style={{
                  background:
                    selected === opt.value
                      ? 'rgba(197,247,79,0.25)'
                      : 'rgba(255,255,255,0.06)',
                  border:
                    selected === opt.value
                      ? '2px solid #C5F74F'
                      : '1px solid rgba(255,255,255,0.06)',
                }}
                animate={
                  selected === opt.value
                    ? { scale: [1, 1.15, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.3 }}
              >
                {opt.emoji}
              </motion.div>
              <span
                className="text-[11px] font-medium"
                style={{
                  color:
                    selected === opt.value
                      ? '#C5F74F'
                      : 'rgba(245,245,245,0.40)',
                }}
              >
                {opt.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
