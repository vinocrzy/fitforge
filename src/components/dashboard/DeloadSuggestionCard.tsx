// ═══════════════════════════════════════════════════════════════════
// FitForge — Deload Suggestion Card
// Shows on dashboard when deload is recommended
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import type { DeloadRecommendation } from '@/hooks/useDeloadDetector';

interface DeloadSuggestionCardProps {
  recommendation: DeloadRecommendation;
}

export function DeloadSuggestionCard({ recommendation }: DeloadSuggestionCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!recommendation.shouldDeload || dismissed) return null;

  const { signals, suggestedDurationDays, volumeReductionPercent } = recommendation;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -16, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="rounded-[20px] p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,159,10,0.10), rgba(255,69,58,0.06))',
          border: '1px solid rgba(255,159,10,0.20)',
        }}
      >
        {/* Dismiss button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <Icon name="xmark" size={11} color="rgba(245,245,245,0.50)" />
        </motion.button>

        <div className="flex items-center gap-2 mb-3">
          <Icon name="bed.double.fill" size={20} color="#FF9F0A" weight="fill" />
          <p className="text-[16px] font-bold" style={{ color: '#FF9F0A' }}>
            Deload Recommended
          </p>
        </div>

        <p className="text-[14px] leading-relaxed pr-6" style={{ color: 'rgba(245,245,245,0.70)' }}>
          Your body may benefit from a lighter week. We suggest reducing volume by{' '}
          <span style={{ color: '#FF9F0A', fontWeight: 600 }}>{volumeReductionPercent}%</span>{' '}
          for the next{' '}
          <span style={{ color: '#FF9F0A', fontWeight: 600 }}>{suggestedDurationDays} days</span>.
        </p>

        {/* Signals list */}
        <div className="mt-3 flex flex-col gap-1.5">
          {signals.slice(0, 3).map((signal, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    signal.severity === 'warning' ? '#FF9F0A' : 'rgba(245,245,245,0.30)',
                }}
              />
              <span className="text-[12px]" style={{ color: 'rgba(245,245,245,0.50)' }}>
                {signal.message.split('.')[0]}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
