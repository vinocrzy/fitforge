// ═══════════════════════════════════════════════════════════════════
// FitForge — Routines List Page
// Shows saved routines or empty-state CTA
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import { staggerContainer, fadeUpItem } from '@/lib/motion/variants';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useRoutines, useWorkoutHistory } from '@/hooks/useDatabase';
import { usePendingSuggestionCount } from '@/hooks/useSuggestions';
import { calculateDayType, DAY_TYPE_CONFIG, hasUndulatingExercises } from '@/lib/coaching/undulatingDayType';

export default function RoutinesPage() {
  const router = useRouter();
  const { data: routines = [], isLoading } = useRoutines();
  const { data: workouts = [] } = useWorkoutHistory();
  const { data: pendingCount = 0 } = usePendingSuggestionCount();

  const exerciseCount = (r: (typeof routines)[number]) =>
    (r.warmUp?.length ?? 0) + (r.workout?.length ?? 0) + (r.stretch?.length ?? 0);

  // Calculate day type for each routine
  const getDayType = (routine: (typeof routines)[number]) => {
    if (!hasUndulatingExercises(routine)) return null;
    return calculateDayType(routine, workouts.slice(0, 30));
  };

  return (
    <div className="min-h-screen px-4 pt-16 pb-28 bg-[#0B0B0B]">
      {/* Title row */}
      <div className="flex items-end justify-between">
        <motion.h1
          className="text-[34px] font-extrabold tracking-tight"
          style={{ color: '#F5F5F5' }}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springGentle}
        >
          Routines
        </motion.h1>

        <motion.button
          onClick={() => router.push('/routines/new/edit')}
          whileTap={{ scale: 0.92 }}
          className="flex items-center gap-1.5 h-9 px-4 rounded-full"
          style={{ background: '#C5F74F' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springGentle}
        >
          <Icon name="plus" size={15} color="#0B0B0B" weight="bold" />
          <span className="text-[14px] font-semibold" style={{ color: '#0B0B0B' }}>
            New
          </span>
        </motion.button>
      </div>

      {/* Suggested routines banner */}
      {pendingCount > 0 && (
        <motion.button
          onClick={() => router.push('/routines/suggested')}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-4 flex items-center justify-between rounded-2xl p-4 glass"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={springGentle}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(197,247,79,0.12)' }}
            >
              <Icon name="tray.fill" size={18} color="#C5F74F" />
            </div>
            <div>
              <p className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>
                Suggested Routines
              </p>
              <p className="text-[13px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
                {pendingCount} pending from your trainer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[12px] font-bold px-1.5"
              style={{ background: '#C5F74F', color: '#0B0B0B' }}
            >
              {pendingCount}
            </span>
            <Icon name="chevron.right" size={14} color="rgba(245,245,245,0.30)" />
          </div>
        </motion.button>
      )}

      {/* Loading shimmers */}
      {isLoading && (
        <div className="mt-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[72px] rounded-[16px] animate-pulse"
              style={{ background: '#141414' }}
            />
          ))}
        </div>
      )}

      {/* Routine list */}
      <AnimatePresence mode="wait">
        {!isLoading && routines.length > 0 && (
          <motion.div
            className="mt-5 flex flex-col gap-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            key="list"
          >
            {routines.map((routine) => (
              <motion.button
                key={routine._id}
                variants={fadeUpItem}
                onClick={() => router.push(`/routines/${routine._id}`)}
                whileTap={{ scale: 0.98 }}
                transition={springSnappy}
                className="w-full flex items-center gap-4 rounded-[16px] p-4 text-left"
                style={{ background: '#141414' }}
              >
                {/* Icon circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(197,247,79,0.10)' }}
                >
                  <Icon
                    name="figure.strengthtraining.traditional"
                    size={22}
                    color="#C5F74F"
                    weight="fill"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-[17px] font-semibold truncate"
                      style={{ color: '#F5F5F5' }}
                    >
                      {routine.name}
                    </p>
                    {(() => {
                      const dayType = getDayType(routine);
                      if (!dayType) return null;
                      const config = DAY_TYPE_CONFIG[dayType];
                      return (
                        <div
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 shrink-0"
                          style={{
                            background: `${config.color}15`,
                            color: config.color,
                          }}
                        >
                          <span>{config.emoji}</span>
                          <span>{config.label}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <p
                    className="text-[13px] mt-0.5"
                    style={{ color: 'rgba(245,245,245,0.50)' }}
                  >
                    {exerciseCount(routine)} exercises
                  </p>
                </div>

                {/* Chevron */}
                <Icon
                  name="chevron.right"
                  size={16}
                  color="rgba(245,245,245,0.30)"
                />
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && routines.length === 0 && (
          <motion.div
            className="mt-8 flex flex-col items-center justify-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            key="empty"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(197,247,79,0.10)' }}
            >
              <Icon name="list.bullet.rectangle" size={28} color="#C5F74F" />
            </div>
            <p
              className="mt-4 text-[17px] font-semibold"
              style={{ color: '#F5F5F5' }}
            >
              No routines yet
            </p>
            <p
              className="mt-1 text-[15px] text-center max-w-[260px]"
              style={{ color: 'rgba(245,245,245,0.50)' }}
            >
              Build a workout routine with exercises from the library.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => router.push('/routines/new/edit')} className='px-6'>
                CREATE ROUTINE
              </PrimaryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
