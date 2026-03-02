// ═══════════════════════════════════════════════════════════════════
// FitForge — S-06 Exercise Library
// Browse, search, filter 207+ exercises
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy, springGentle } from '@/lib/motion/springs';
import { SearchBar } from '@/components/ui/SearchBar';
import { MultiFilterSection } from '@/components/ui/FilterChip';
import { DifficultyDots } from '@/components/ui/DifficultyDots';
import { ExerciseGif } from '@/components/ui/ExerciseGif';
import { TopBar } from '@/components/layout/TopBar';
import { useExercises } from '@/hooks/useDatabase';
import { toTitleCase } from '@/lib/utils/toTitleCase';
import type { ExerciseDoc } from '@/types';

const BODY_PARTS = [
  'chest',
  'back',
  'upper legs',
  'lower legs',
  'shoulders',
  'upper arms',
  'lower arms',
  'waist',
];

const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'body weight',
  'cable',
  'leverage machine',
  'ez barbell',
  'assisted',
  'medicine ball',
  'stability ball',
  'rope',
];

export default function ExerciseLibraryPage() {
  const router = useRouter();
  const { data: exercises = [], isLoading } = useExercises();

  const [search, setSearch] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = exercises;

    // Body part filter
    if (bodyPartFilter) {
      result = result.filter(
        (ex) => ex.bodyPart.toLowerCase() === bodyPartFilter.toLowerCase()
      );
    }

    // Equipment filter
    if (equipmentFilter) {
      result = result.filter(
        (ex) => ex.equipment.toLowerCase() === equipmentFilter.toLowerCase()
      );
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.target.toLowerCase().includes(q) ||
          ex.equipment.toLowerCase().includes(q) ||
          ex.bodyPart.toLowerCase().includes(q)
      );
    }

    return result;
  }, [exercises, search, bodyPartFilter, equipmentFilter]);

  const handleExerciseTap = useCallback(
    (ex: ExerciseDoc) => {
      router.push(`/exercises/${ex.id}`);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="Exercises" />

      <div className="px-4 pt-[calc(44px+env(safe-area-inset-top,0px)+8px)]">
        {/* Search */}
        <div className="mt-2">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Filter Sections */}
        <MultiFilterSection
          sections={[
            {
              label: 'Body Part',
              options: BODY_PARTS,
              selected: bodyPartFilter,
              onSelect: setBodyPartFilter,
            },
            {
              label: 'Equipment',
              options: EQUIPMENT,
              selected: equipmentFilter,
              onSelect: setEquipmentFilter,
            },
          ]}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between py-2">
          <span
            className="text-[13px] font-medium"
            style={{ color: 'rgba(245,245,245,0.45)' }}
          >
            {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-3 mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 h-[72px] shimmer rounded-[12px]"
                style={{ background: '#141414' }}
              />
            ))}
          </div>
        )}

        {/* Exercise List */}
        {!isLoading && (
          <div className="flex flex-col pb-28">
            {filtered.map((ex, index) => (
              <motion.button
                key={ex._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springGentle, delay: Math.min(index * 0.03, 0.3) }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExerciseTap(ex)}
                className="flex items-center gap-3 py-2 text-left"
                style={{
                  borderBottom:
                    index < filtered.length - 1
                      ? '1px solid rgba(255,255,255,0.07)'
                      : 'none',
                }}
              >
                {/* GIF Thumbnail */}
                <div className="shrink-0 w-14 h-14 rounded-[12px] overflow-hidden">
                  <ExerciseGif
                    exerciseId={ex.id}
                    alt={ex.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[17px] font-semibold truncate"
                    style={{ color: '#F5F5F5' }}
                  >
                    {toTitleCase(ex.name)}
                  </div>
                  <div
                    className="text-[14px] mt-0.5"
                    style={{ color: 'rgba(245,245,245,0.50)' }}
                  >
                    {toTitleCase(ex.bodyPart)} • {toTitleCase(ex.equipment)}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="shrink-0">
                  <DifficultyDots level={ex.difficulty} />
                </div>
              </motion.button>
            ))}

            {/* Empty state */}
            {filtered.length === 0 && (
              <motion.div
                className="flex flex-col items-center justify-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={springGentle}
              >
                <p
                  className="text-[17px] font-semibold"
                  style={{ color: '#F5F5F5' }}
                >
                  No exercises found
                </p>
                <p
                  className="mt-1 text-[15px]"
                  style={{ color: 'rgba(245,245,245,0.50)' }}
                >
                  Try a different search or filter.
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
