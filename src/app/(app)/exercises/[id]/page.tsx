// ═══════════════════════════════════════════════════════════════════
// FitForge — S-07 Exercise Detail Page
// GIF hero, muscles, instructions, equipment
// ═══════════════════════════════════════════════════════════════════

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy, springCelebration, springGentle } from '@/lib/motion/springs';
import { TopBar } from '@/components/layout/TopBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ExerciseGif } from '@/components/ui/ExerciseGif';
import { DifficultyDots } from '@/components/ui/DifficultyDots';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { Icon } from '@/components/ui/Icon';
import { useExercise } from '@/hooks/useDatabase';
import { toTitleCase } from '@/lib/utils/toTitleCase';

export default function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: exercise, isLoading } = useExercise(id);
  const [isFavourite, setIsFavourite] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B]">
        <TopBar title="Exercise" showBack />
        <div className="pt-24 px-4">
          <div className="h-[280px] rounded-[20px] shimmer" style={{ background: '#141414' }} />
          <div className="h-8 w-48 mt-5 rounded-lg shimmer" style={{ background: '#141414' }} />
          <div className="h-4 w-32 mt-3 rounded shimmer" style={{ background: '#141414' }} />
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <p className="text-[17px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
          Exercise not found
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-36 overscroll-contain">
      {/* Nav */}
      <TopBar
        title="Exercise"
        showBack
        rightAction={
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setIsFavourite(!isFavourite)}
              whileTap={{ scale: 0.8 }}
              animate={{ scale: isFavourite ? [1, 1.3, 1] : 1 }}
              transition={isFavourite ? springCelebration : springSnappy}
            >
              <Icon
                name="heart.fill"
                size={22}
                color={isFavourite ? '#FF453A' : 'rgba(245,245,245,0.40)'}
                weight={isFavourite ? 'fill' : 'regular'}
              />
            </motion.button>
          </div>
        }
      />

      {/* GIF Hero */}
      <div className="relative w-full" style={{ height: 280 }}>
        <ExerciseGif
          exerciseId={exercise.id}
          alt={exercise.name}
          animated
          className="w-full h-full object-cover"
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(11,11,11,0), rgba(11,11,11,1))',
          }}
        />
      </div>

      {/* Content */}
      <div className="px-4 -mt-2 relative z-10">
        {/* Title + Meta */}
        <motion.h1
          className="text-[28px] font-extrabold tracking-tight"
          style={{ color: '#F5F5F5' }}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.05 }}
        >
          {toTitleCase(exercise.name)}
        </motion.h1>

        <motion.div
          className="flex items-center gap-3 mt-2"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.1 }}
        >
          <DifficultyDots level={exercise.difficulty} />
          <span
            className="text-[14px] capitalize"
            style={{ color: 'rgba(245,245,245,0.55)' }}
          >
            {exercise.difficulty}
          </span>
          <CategoryBadge category={exercise.category} />
        </motion.div>

        {/* Description */}
        {exercise.description && (
          <motion.p
            className="mt-4 text-[15px] leading-relaxed"
            style={{ color: 'rgba(245,245,245,0.65)' }}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springGentle, delay: 0.15 }}
          >
            {exercise.description}
          </motion.p>
        )}

        {/* Muscles Worked */}
        <motion.div
          className="mt-6"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.2 }}
        >
          <SectionHeader title="Muscles Worked" />
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: '#C5F74F' }}
              />
              <span className="text-[15px]" style={{ color: '#F5F5F5' }}>
                {toTitleCase(exercise.target)} <span style={{ color: 'rgba(245,245,245,0.45)' }}>(primary)</span>
              </span>
            </div>
            {exercise.secondaryMuscles.length > 0 && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'rgba(197,247,79,0.40)' }}
                />
                <span className="text-[15px]" style={{ color: 'rgba(245,245,245,0.70)' }}>
                  {exercise.secondaryMuscles.map(m => toTitleCase(m)).join(', ')}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Instructions */}
        {exercise.instructions.length > 0 && (
          <motion.div
            className="mt-6"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springGentle, delay: 0.25 }}
          >
            <SectionHeader title="How To" />
            <div className="mt-3 flex flex-col gap-4">
              {exercise.instructions.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[12px] font-semibold"
                    style={{
                      background: 'rgba(197,247,79,0.15)',
                      color: '#C5F74F',
                    }}
                  >
                    {i + 1}
                  </div>
                  <p
                    className="text-[15px] leading-relaxed flex-1"
                    style={{ color: 'rgba(245,245,245,0.75)' }}
                  >
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Equipment */}
        <motion.div
          className="mt-6"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.3 }}
        >
          <SectionHeader title="Equipment" />
          <div className="mt-3 flex flex-wrap gap-2">
            <EquipmentChip label={toTitleCase(exercise.equipment)} />
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA */}
      <div
        className="px-4 z-30 my-4"
        style={{ bottom: 'calc(16px + 72px + env(safe-area-inset-bottom, 0px))' }}
      >
        <PrimaryButton onClick={() => router.back()}>
          ADD TO ROUTINE
        </PrimaryButton>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2
      className="text-[15px] font-semibold uppercase tracking-wider"
      style={{ color: 'rgba(245,245,245,0.50)' }}
    >
      {title}
    </h2>
  );
}

function EquipmentChip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center h-[34px] px-4 rounded-full text-[14px] font-medium capitalize"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.10)',
        color: '#F5F5F5',
      }}
    >
      {label}
    </span>
  );
}
