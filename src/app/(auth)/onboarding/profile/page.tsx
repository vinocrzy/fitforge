// ═══════════════════════════════════════════════════════════════════
// FitForge — S-04 Onboarding Profile Setup
// Body weight input, unit toggle, experience level
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
import type { ExperienceLevel } from '@/types';

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'New to lifting (0–6 months)' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Consistent training (6–24 months)' },
  { id: 'advanced', label: 'Advanced', desc: 'Experienced lifter (2+ years)' },
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

export default function OnboardingProfilePage() {
  const router = useRouter();
  const store = useProfileStore();

  const [weight, setWeight] = useState<number>(70);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [experience, setExperience] = useState<ExperienceLevel>('beginner');

  const displayWeight = unit === 'lbs' ? Math.round(weight * 2.20462) : weight;

  const adjustWeight = (delta: number) => {
    const newWeight =
      unit === 'kg'
        ? Math.max(30, Math.min(250, weight + delta))
        : Math.max(30, Math.min(250, weight + Math.round(delta / 2.20462)));
    setWeight(newWeight);
  };

  const handleComplete = () => {
    store.setWeight(weight);
    store.setUnitPreference(unit);
    store.setExperienceLevel(experience);
    store.completeOnboarding();
    router.push('/');
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
        <ProgressDots current={3} total={4} />
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
        About You
      </motion.h1>

      <motion.p
        className="mt-2 text-[17px]"
        style={{ color: 'rgba(245,245,245,0.55)' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...springGentle, delay: 0.15 }}
      >
        We&apos;ll personalize your experience.
      </motion.p>

      {/* Weight Section */}
      <motion.div
        className="mt-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...springGentle, delay: 0.2 }}
      >
        <label
          className="text-[13px] font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(245,245,245,0.55)' }}
        >
          Body weight
        </label>

        {/* Unit Toggle */}
        <div className="flex gap-2 mt-3">
          {(['kg', 'lbs'] as const).map((u) => (
            <motion.button
              key={u}
              onClick={() => setUnit(u)}
              whileTap={{ scale: 0.95 }}
              transition={springSnappy}
              className="h-9 px-5 rounded-full text-[15px] font-semibold"
              style={{
                background:
                  unit === u ? '#C5F74F' : 'rgba(255,255,255,0.06)',
                color: unit === u ? '#0B0B0B' : '#F5F5F5',
              }}
            >
              {u.toUpperCase()}
            </motion.button>
          ))}
        </div>

        {/* Weight Picker */}
        <div className="flex items-center justify-center gap-8 mt-6">
          <motion.button
            onClick={() => adjustWeight(-1)}
            whileTap={{ scale: 0.9 }}
            transition={springSnappy}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <Icon name="minus" size={20} color="#F5F5F5" />
          </motion.button>

          <div className="text-center">
            <div
              className="text-[56px] font-bold tabular-nums leading-none"
              style={{ color: '#F5F5F5' }}
            >
              {displayWeight}
            </div>
            <div
              className="mt-1 text-[15px]"
              style={{ color: 'rgba(245,245,245,0.45)' }}
            >
              {unit}
            </div>
          </div>

          <motion.button
            onClick={() => adjustWeight(1)}
            whileTap={{ scale: 0.9 }}
            transition={springSnappy}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <Icon name="plus" size={20} color="#F5F5F5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Experience Level */}
      <motion.div
        className="mt-10"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <label
          className="text-[13px] font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(245,245,245,0.55)' }}
        >
          Experience level
        </label>

        <div className="flex flex-col gap-3 mt-3">
          {EXPERIENCE_LEVELS.map((lvl) => {
            const isSelected = experience === lvl.id;
            return (
              <motion.button
                key={lvl.id}
                variants={fadeUpItem}
                onClick={() => setExperience(lvl.id)}
                whileTap={{ scale: 0.97 }}
                transition={springSnappy}
                className="flex items-center gap-4 p-4 rounded-[16px] text-left"
                style={{
                  background: isSelected
                    ? 'rgba(197,247,79,0.12)'
                    : '#141414',
                  border: isSelected
                    ? '1.5px solid #C5F74F'
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{
                    background: isSelected
                      ? 'rgba(197,247,79,0.15)'
                      : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: isSelected ? '#C5F74F' : 'rgba(255,255,255,0.3)',
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[17px] font-semibold"
                    style={{
                      color: isSelected ? '#F5F5F5' : 'rgba(245,245,245,0.85)',
                    }}
                  >
                    {lvl.label}
                  </div>
                  <div
                    className="text-[14px] mt-0.5"
                    style={{ color: 'rgba(245,245,245,0.45)' }}
                  >
                    {lvl.desc}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA */}
      <div className="mt-6">
        <PrimaryButton onClick={handleComplete}>
          GET STARTED
        </PrimaryButton>
      </div>
    </div>
  );
}
