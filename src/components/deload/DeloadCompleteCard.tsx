// ═══════════════════════════════════════════════════════════════════
// FitForge — Deload Complete Card
// PT Feature 5: Celebrates deload completion with XP bonus
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { springCelebration, springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useProfileStore } from '@/store/useProfileStore';

interface DeloadCompleteCardProps {
  onDismiss: () => void;
}

const DELOAD_XP_BONUS = 200;

export function DeloadCompleteCard({ onDismiss }: DeloadCompleteCardProps) {
  const addXP = useProfileStore((s) => s.addXP);

  // Award XP on mount
  useEffect(() => {
    addXP(DELOAD_XP_BONUS);
  }, [addXP]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={springCelebration}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <motion.div
        className="w-full max-w-sm rounded-[24px] p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(94,210,223,0.15), rgba(100,210,255,0.08))',
          border: '2px solid rgba(94,210,223,0.30)',
        }}
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ ...springCelebration, delay: 0.1 }}
      >
        {/* Celebration particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 2 === 0 ? '#5ED2DF' : '#64D2FF',
              left: '50%',
              top: '30%',
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 0,
            }}
            animate={{
              x: Math.cos((i * Math.PI) / 4) * 80,
              y: Math.sin((i * Math.PI) / 4) * 80,
              opacity: 0,
              scale: 1.5,
            }}
            transition={{
              duration: 1.2,
              ease: 'easeOut',
              delay: 0.3 + i * 0.05,
            }}
          />
        ))}

        {/* Icon */}
        <motion.div
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(94,210,223,0.20)' }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...springCelebration, delay: 0.2 }}
        >
          <Icon name="checkmark.circle.fill" size={42} color="#5ED2DF" weight="fill" />
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-[28px] font-extrabold text-center mb-2"
          style={{ color: '#5ED2DF' }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Deload Complete!
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="text-[15px] text-center mb-6"
          style={{ color: 'rgba(245,245,245,0.70)' }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your body is recovered and primed for progress.
        </motion.p>

        {/* XP Badge */}
        <motion.div
          className="rounded-[16px] p-4 mb-4"
          style={{
            background: 'rgba(197,247,79,0.12)',
            border: '1px solid rgba(197,247,79,0.25)',
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springCelebration, delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="star.fill" size={20} color="#C5F74F" weight="fill" />
              <span className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>
                XP Bonus Earned
              </span>
            </div>
            <motion.span
              className="text-[24px] font-extrabold tabular-nums"
              style={{ color: '#C5F74F' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springCelebration, delay: 0.7 }}
            >
              +{DELOAD_XP_BONUS}
            </motion.span>
          </div>
        </motion.div>

        {/* Info box */}
        <motion.div
          className="rounded-[12px] p-3 mb-6"
          style={{ background: 'rgba(94,210,223,0.10)' }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-[13px] text-center leading-relaxed" style={{ color: 'rgba(245,245,245,0.65)' }}>
            💪 <strong>New Baseline</strong>: Ready to lift heavier. Next cycle: +5% estimated
            capacity.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDismiss}
          className="w-full h-[52px] rounded-full font-semibold text-[16px]"
          style={{
            background: '#5ED2DF',
            color: '#0B0B0B',
          }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, ...springSnappy }}
        >
          Return to Training
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
