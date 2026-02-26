// ═══════════════════════════════════════════════════════════════════
// FitForge — S-03 Onboarding Goals Screen
// Select 1–3 fitness goals from 6 options
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy, springGentle } from '@/lib/motion/springs';
import { staggerContainer, fadeUpItem } from '@/lib/motion/variants';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon } from '@/components/ui/Icon';
import { useProfileStore } from '@/store/useProfileStore';
import type { FitnessGoal } from '@/types';

const GOALS: { id: FitnessGoal; label: string; icon: string }[] = [
  {
    id: 'muscle_gain',
    label: 'Muscle Gain',
    icon: 'figure.strengthtraining.traditional',
  },
  { id: 'cardio', label: 'Cardio', icon: 'figure.run' },
  { id: 'athletic', label: 'Athletic', icon: 'bolt.fill' },
  { id: 'flexibility', label: 'Flexibility', icon: 'figure.flexibility' },
  { id: 'fat_loss', label: 'Fat Loss', icon: 'flame.fill' },
  { id: 'maintain', label: 'Maintain', icon: 'scale.3d' },
];

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: i < current ? '#C5F74F' : 'rgba(255,255,255,0.25)',
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingGoalsPage() {
  const router = useRouter();
  const setGoals = useProfileStore((s) => s.setGoals);
  const [selected, setSelected] = useState<FitnessGoal[]>([]);

  const toggleGoal = (goal: FitnessGoal) => {
    setSelected((prev) => {
      if (prev.includes(goal)) {
        return prev.filter((g) => g !== goal);
      }
      if (prev.length >= 3) return prev;
      return [...prev, goal];
    });
  };

  const handleContinue = () => {
    setGoals(selected);
    router.push('/onboarding/profile');
  };

  return (
    <div className="min-h-screen px-6 pt-16 pb-8 bg-[#0B0B0B] flex flex-col">
      {/* Back + Progress */}
      <div className="flex items-center justify-between">
        <motion.button
          onClick={() => router.back()}
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          className="w-10 h-10 flex items-center justify-center -ml-2"
        >
          <Icon
            name="chevron.left"
            size={22}
            color="rgba(245,245,245,0.70)"
          />
        </motion.button>
        <ProgressDots current={2} total={4} />
        <div className="w-10" />
      </div>

      {/* Header */}
      <motion.h1
        className="mt-8 text-[34px] font-extrabold tracking-tight leading-[1.15]"
        style={{ color: '#F5F5F5' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...springGentle, delay: 0.1 }}
      >
        What&apos;s your
        <br />
        main goal?
      </motion.h1>

      <motion.p
        className="mt-2 text-[17px]"
        style={{ color: 'rgba(245,245,245,0.55)' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...springGentle, delay: 0.15 }}
      >
        Choose up to 3.
      </motion.p>

      {/* Goal Grid */}
      <motion.div
        className="grid grid-cols-2 gap-3 mt-8 flex-1"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {GOALS.map((goal) => {
          const isSelected = selected.includes(goal.id);
          return (
            <motion.button
              key={goal.id}
              variants={fadeUpItem}
              onClick={() => toggleGoal(goal.id)}
              whileTap={{ scale: 0.96 }}
              transition={springSnappy}
              className="flex flex-col items-start justify-center gap-3 p-4 rounded-[20px] text-left"
              style={{
                height: 88,
                background: isSelected
                  ? 'rgba(197,247,79,0.12)'
                  : '#141414',
                border: isSelected
                  ? '1.5px solid #C5F74F'
                  : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                style={{
                  background: isSelected
                    ? 'rgba(197,247,79,0.15)'
                    : 'rgba(255,255,255,0.06)',
                }}
              >
                <Icon
                  name={goal.icon}
                  size={20}
                  color={isSelected ? '#C5F74F' : '#F5F5F5'}
                  weight={isSelected ? 'fill' : 'regular'}
                />
              </div>
              <span
                className="text-[15px] font-semibold"
                style={{
                  color: isSelected ? '#C5F74F' : '#F5F5F5',
                }}
              >
                {goal.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* CTA */}
      <div className="mt-6">
        <PrimaryButton
          onClick={handleContinue}
          disabled={selected.length === 0}
        >
          CONTINUE
        </PrimaryButton>
      </div>
    </div>
  );
}
