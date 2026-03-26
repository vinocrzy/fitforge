// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-01: Trainer Directory
// Browse, search, filter enrolled trainers
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import { SearchBar } from '@/components/ui/SearchBar';
import { MultiFilterSection } from '@/components/ui/FilterChip';
import { TopBar } from '@/components/layout/TopBar';
import { TrainerCard } from '@/components/trainer/TrainerCard';
import { Icon } from '@/components/ui/Icon';
import { useTrainers } from '@/hooks/useTrainers';
import { useGuestStore } from '@/store/useGuestStore';
import type { TrainerProfile, TrainerSpecialization } from '@/types';

const SPECIALIZATIONS: TrainerSpecialization[] = [
  'strength',
  'cardio',
  'flexibility',
  'weight_loss',
  'bodybuilding',
  'powerlifting',
  'rehabilitation',
  'sports_performance',
  'general_fitness',
];

const SPEC_DISPLAY: Record<TrainerSpecialization, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  flexibility: 'Flexibility',
  weight_loss: 'Weight Loss',
  bodybuilding: 'Bodybuilding',
  powerlifting: 'Powerlifting',
  rehabilitation: 'Rehab',
  sports_performance: 'Sports',
  general_fitness: 'General',
};

export default function TrainerDirectoryPage(): React.ReactElement {
  const router = useRouter();
  const isGuest = useGuestStore((s) => s.isGuest);

  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState<string | null>(null);

  const { data: trainers = [], isLoading } = useTrainers({
    search: search.trim() || undefined,
    specialization: (specFilter as TrainerSpecialization) ?? undefined,
  });

  const handleTrainerTap = useCallback(
    (trainer: TrainerProfile) => {
      router.push(`/trainers/${trainer.clerkUserId}`);
    },
    [router],
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="Find a Trainer" showBack />

      <div className="px-4 pt-[calc(44px+env(safe-area-inset-top,0px)+8px)]">
        {/* Search */}
        <div className="mt-2">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search trainers…"
          />
        </div>

        {/* Filter */}
        <MultiFilterSection
          sections={[
            {
              label: 'Specialization',
              options: SPECIALIZATIONS.map((s) => SPEC_DISPLAY[s]),
              selected: specFilter ? SPEC_DISPLAY[specFilter as TrainerSpecialization] : null,
              onSelect: (val) => {
                if (!val) {
                  setSpecFilter(null);
                  return;
                }
                const key = SPECIALIZATIONS.find((s) => SPEC_DISPLAY[s] === val) ?? null;
                setSpecFilter(key);
              },
            },
          ]}
        />

        {/* Guest upsell banner */}
        {isGuest && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springGentle}
            className="w-full glass rounded-2xl p-4 mb-3 flex items-start gap-3"
            style={{ border: '1px solid rgba(197,247,79,0.25)', background: 'rgba(197,247,79,0.06)' }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 40, height: 40, background: 'rgba(197,247,79,0.15)' }}
            >
              <Icon name="person.2.fill" size={20} color="#C5F74F" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>
                Get a Personal Trainer
              </p>
              <p className="text-[13px] mt-0.5 leading-snug" style={{ color: 'rgba(245,245,245,0.55)' }}>
                Sign up to subscribe to a trainer, receive personalised routines, and level up your fitness journey.
              </p>
              <div className="flex gap-2 mt-3">
                <motion.button
                  onClick={() => router.push('/sign-up')}
                  className="px-4 py-1.5 rounded-full text-[13px] font-semibold"
                  style={{ background: '#C5F74F', color: '#0B0B0B' }}
                  whileTap={{ scale: 0.96 }}
                  transition={springSnappy}
                >
                  Sign Up Free
                </motion.button>
                <motion.button
                  onClick={() => router.push('/sign-in')}
                  className="px-4 py-1.5 rounded-full text-[13px] font-medium glass"
                  style={{ color: 'rgba(245,245,245,0.75)' }}
                  whileTap={{ scale: 0.96 }}
                  transition={springSnappy}
                >
                  Log In
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between py-2">
          <span
            className="text-[13px] font-medium"
            style={{ color: 'rgba(245,245,245,0.45)' }}
          >
            {trainers.length} trainer{trainers.length !== 1 ? 's' : ''} available
          </span>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col gap-3 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[96px] shimmer rounded-2xl"
                style={{ background: '#141414' }}
              />
            ))}
          </div>
        )}

        {/* Trainer list */}
        {!isLoading && (
          <div className="flex flex-col gap-3 pb-28">
            {trainers.map((trainer, index) => (
              <TrainerCard
                key={trainer._id}
                trainer={trainer}
                onPress={() => handleTrainerTap(trainer)}
                index={index}
              />
            ))}

            {/* Empty state */}
            {trainers.length === 0 && (
              <motion.div
                className="flex flex-col items-center justify-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={springGentle}
              >
                <Icon name="person.crop.circle.fill" size={48} color="rgba(245,245,245,0.20)" />
                <p
                  className="text-[17px] font-semibold mt-4"
                  style={{ color: '#F5F5F5' }}
                >
                  No trainers found
                </p>
                <p
                  className="mt-1 text-[15px] text-center px-8"
                  style={{ color: 'rgba(245,245,245,0.50)' }}
                >
                  {search.trim()
                    ? 'Try a different search or clear filters.'
                    : 'No trainers have enrolled yet. Check back soon!'}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
