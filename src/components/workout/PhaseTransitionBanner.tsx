// ═══════════════════════════════════════════════════════════════════
// FitForge — PhaseTransitionBanner (S-14)
// Interstitial card between workout phases
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springCelebration } from '@/lib/motion/springs';
import { phaseTransitionVariants } from '@/lib/motion/variants';
import { useSheetStore } from '@/store/useSheetStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon } from '@/components/ui/Icon';
import type { SessionPhase } from '@/types';

const PHASE_CONFIG: Record<
  SessionPhase,
  {
    completedTitle: string;
    completedSubtitle: string;
    nextLabel: string;
    icon: string;
    iconColor: string;
    gradient: string;
  }
> = {
  warmUp: {
    completedTitle: 'Warm-Up Complete!',
    completedSubtitle: 'Great work. Time to lift.',
    nextLabel: 'START WORKOUT',
    icon: 'flame.fill',
    iconColor: '#FF9F0A',
    gradient: 'linear-gradient(135deg, rgba(255,159,10,0.3), rgba(255,159,10,0.05))',
  },
  workout: {
    completedTitle: 'Workout Complete!',
    completedSubtitle: 'Awesome effort. Time to cool down.',
    nextLabel: 'START STRETCH',
    icon: 'figure.strengthtraining.traditional',
    iconColor: '#C5F74F',
    gradient: 'linear-gradient(135deg, rgba(197,247,79,0.3), rgba(197,247,79,0.05))',
  },
  stretch: {
    completedTitle: 'All Done!',
    completedSubtitle: 'Session complete. Great job.',
    nextLabel: 'VIEW SUMMARY',
    icon: 'figure.flexibility',
    iconColor: '#A18CD1',
    gradient: 'linear-gradient(135deg, rgba(161,140,209,0.3), rgba(161,140,209,0.05))',
  },
};

interface PhaseTransitionBannerProps {
  isOpen: boolean;
  completedPhase: SessionPhase;
  phaseTime: number;
  exerciseCount: number;
  onContinue: () => void;
  onSkip: () => void;
}

export function PhaseTransitionBanner({
  isOpen,
  completedPhase,
  phaseTime,
  exerciseCount,
  onContinue,
  onSkip,
}: PhaseTransitionBannerProps) {
  const config = PHASE_CONFIG[completedPhase];
  const [countdown, setCountdown] = useState(10);
  const { openSheet, closeSheet } = useSheetStore();

  // Manage sheet store for scale-behind effect
  useEffect(() => {
    if (isOpen) {
      openSheet('phase-transition');
      setCountdown(10);
    } else {
      closeSheet();
    }
    return () => closeSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-countdown
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown, onContinue]);

  const formatPhaseTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />

          {/* Banner Sheet */}
          <motion.div
            variants={phaseTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed left-0 right-0 bottom-0 z-50 glass-sheet"
            style={{
              borderRadius: '28px 28px 0 0',
              padding: '24px 20px 40px',
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center mb-6">
              <div
                className="w-9 h-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.20)' }}
              />
            </div>

            {/* Icon */}
            <motion.div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ background: config.gradient }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={springCelebration}
            >
              <Icon name={config.icon} size={40} color={config.iconColor} />
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-[28px] font-extrabold text-center"
              style={{ color: '#F5F5F5' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...springCelebration, delay: 0.15 }}
            >
              {config.completedTitle}
            </motion.h2>

            <p
              className="text-[17px] text-center mt-1"
              style={{ color: 'rgba(245,245,245,0.55)' }}
            >
              {config.completedSubtitle}
            </p>

            {/* Stats */}
            <div className="flex gap-3 mt-6">
              <div
                className="flex-1 rounded-[14px] p-4 text-center glass"
              >
                <p
                  className="text-[24px] font-extrabold tabular-nums"
                  style={{ color: '#C5F74F' }}
                >
                  {exerciseCount}
                </p>
                <p
                  className="text-[13px] mt-0.5"
                  style={{ color: 'rgba(245,245,245,0.50)' }}
                >
                  exercises done
                </p>
              </div>
              <div
                className="flex-1 rounded-[14px] p-4 text-center glass"
              >
                <p
                  className="text-[24px] font-extrabold tabular-nums"
                  style={{ color: '#C5F74F' }}
                >
                  {formatPhaseTime(phaseTime)}
                </p>
                <p
                  className="text-[13px] mt-0.5"
                  style={{ color: 'rgba(245,245,245,0.50)' }}
                >
                  phase time
                </p>
              </div>
            </div>

            {/* Continue button */}
            <div className="mt-6">
              <PrimaryButton onClick={onContinue}>
                {config.nextLabel}
              </PrimaryButton>
            </div>

            {/* Countdown */}
            <div className="text-center mt-3">
              <p
                className="text-[14px]"
                style={{ color: 'rgba(245,245,245,0.50)' }}
              >
                Starting in {countdown}s…
              </p>
              <button
                onClick={onSkip}
                className="text-[14px] font-medium mt-1"
                style={{ color: '#C5F74F' }}
              >
                Skip countdown
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
