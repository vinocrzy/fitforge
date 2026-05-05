// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-10: My Trainer (User View)
// User's active trainer connection with privacy controls
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { springSnappy, springGentle, springDefault } from '@/lib/motion/springs';
import { TopBar } from '@/components/layout/TopBar';
import { Icon } from '@/components/ui/Icon';
import { SPEC_LABELS, SPEC_COLORS } from '@/components/trainer/TrainerCard';
import { PrivacySettingsSheet } from '@/components/trainer/PrivacySettingsSheet';
import { useActiveConnection, useEndConnection } from '@/hooks/useConnections';
import { useNutritionSuggestions, useRespondNutritionSuggestion } from '@/hooks/useNutritionSuggestions';
import { useDietStore } from '@/store/useDietStore';
import { useUser } from '@clerk/nextjs';
import { useSheetStore } from '@/store/useSheetStore';
import type { TrainerProfile, SharedDataSettings } from '@/types';

function NutritionSuggestionsSection(): React.ReactElement {
  const { user } = useUser();
  const { data: suggestions = [], isLoading } = useNutritionSuggestions('pending');
  const respond = useRespondNutritionSuggestion();
  const updateGoalPhase = useDietStore((s) => s.updateGoalPhase);

  if (isLoading || suggestions.length === 0) return <></>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springDefault}
      className="flex flex-col gap-3"
    >
      <p
        className="text-[13px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--brand-text-2)' }}
      >
        Nutrition Suggestions
      </p>
      {suggestions.map((s) => (
        <div key={s._id} className="glass-elevated rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-[15px]" style={{ color: 'var(--brand-text)' }}>
            {s.message}
          </p>
          {(s.suggestedGoalPhase || s.suggestedDailyCalories) && (
            <div className="flex gap-2 flex-wrap">
              {s.suggestedGoalPhase && (
                <span
                  className="text-[12px] font-semibold px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(197,247,79,0.12)', color: 'var(--brand-lime)' }}
                >
                  Phase: {s.suggestedGoalPhase.charAt(0).toUpperCase() + s.suggestedGoalPhase.slice(1)}
                </span>
              )}
              {s.suggestedDailyCalories && (
                <span
                  className="text-[12px] font-semibold px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--brand-text-2)' }}
                >
                  {s.suggestedDailyCalories} kcal/day
                </span>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={springSnappy}
              disabled={respond.isPending}
              onClick={() => {
                respond.mutate(
                  { id: s._id, action: 'accept' },
                  {
                    onSuccess: () => {
                      if (s.suggestedGoalPhase && user?.id) {
                        updateGoalPhase(s.suggestedGoalPhase);
                      }
                    },
                  },
                );
              }}
              className="flex-1 py-2 rounded-xl text-[14px] font-semibold"
              style={{ background: 'var(--brand-lime)', color: '#0B0B0B' }}
            >
              Accept
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={springSnappy}
              disabled={respond.isPending}
              onClick={() => respond.mutate({ id: s._id, action: 'dismiss' })}
              className="flex-1 py-2 rounded-xl text-[14px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--brand-text-2)' }}
            >
              Dismiss
            </motion.button>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function MyTrainerPage(): React.ReactElement {
  const { data, isLoading } = useActiveConnection();
  const endMutation = useEndConnection();
  const openSheet = useSheetStore((s) => s.openSheet);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const connection = data?.connection;
  const trainer = data?.trainer as TrainerProfile | null;

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="My Trainer" showBack />

      <div className="px-4 pt-[calc(44px+env(safe-area-inset-top,0px)+8px)] pb-28">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4 pt-8">
            <div className="w-20 h-20 rounded-full shimmer" style={{ background: '#141414' }} />
            <div className="w-40 h-6 rounded-lg shimmer" style={{ background: '#141414' }} />
            <div className="w-full h-24 rounded-2xl shimmer" style={{ background: '#141414' }} />
          </div>
        )}

        {/* No Connection */}
        {!isLoading && (!connection || !trainer) && (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springGentle}
          >
            <Icon name="person.crop.circle.fill" size={48} color="rgba(245,245,245,0.15)" />
            <p className="text-[17px] font-semibold mt-4" style={{ color: '#F5F5F5' }}>
              No active trainer
            </p>
            <p className="mt-1 text-[15px] text-center" style={{ color: 'rgba(245,245,245,0.50)' }}>
              Browse the trainer directory to find your perfect fit.
            </p>
          </motion.div>
        )}

        {/* Trainer View */}
        {!isLoading && connection && trainer && (
          <div className="flex flex-col gap-5">
            {/* Trainer Header */}
            <motion.div
              className="glass rounded-2xl p-5 flex items-center gap-4"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div
                className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-[22px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, #C5F74F, #8BC34A)',
                  color: '#0B0B0B',
                }}
              >
                {trainer.photoUrl ? (
                  <img
                    src={trainer.photoUrl}
                    alt={trainer.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(trainer.displayName)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[20px] font-bold truncate" style={{ color: '#F5F5F5' }}>
                  {trainer.displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {trainer.rating != null && trainer.rating > 0 && (
                    <>
                      <Icon name="star.fill" size={13} color="#C5F74F" weight="fill" />
                      <span className="text-[14px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
                        {trainer.rating.toFixed(1)}
                      </span>
                      <span style={{ color: 'rgba(245,245,245,0.25)' }}>·</span>
                    </>
                  )}
                  <span className="text-[14px] truncate" style={{ color: 'rgba(245,245,245,0.55)' }}>
                    {trainer.specializations.map((s) => SPEC_LABELS[s] ?? s).join(', ')}
                  </span>
                </div>
                {connection.status === 'pending' ? (
                  <span
                    className="inline-block mt-1.5 text-[12px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,159,10,0.15)', color: '#FF9F0A' }}
                  >
                    Request Pending
                  </span>
                ) : (
                  <p className="mt-1 text-[12px]" style={{ color: 'rgba(245,245,245,0.40)' }}>
                    Connected since {new Date(connection.respondedAt ?? connection.requestedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Specialization Chips */}
            <motion.div
              className="flex flex-wrap gap-2"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.06 }}
            >
              {trainer.specializations.map((spec) => (
                <span
                  key={spec}
                  className="text-[12px] font-semibold px-3 py-1 rounded-full"
                  style={{
                    background: `${SPEC_COLORS[spec] ?? '#C5F74F'}20`,
                    color: SPEC_COLORS[spec] ?? '#C5F74F',
                  }}
                >
                  {SPEC_LABELS[spec] ?? spec}
                </span>
              ))}
            </motion.div>

            {/* Privacy Settings */}
            {connection.status === 'active' && (
              <motion.div
                className="glass rounded-2xl p-4 cursor-pointer"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.12 }}
                onClick={() => openSheet('privacy-settings')}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(100,210,255,0.12)' }}
                    >
                      <Icon name="gear" size={18} color="#64D2FF" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>Privacy Settings</p>
                      <p className="text-[12px]" style={{ color: 'rgba(245,245,245,0.45)' }}>Control what your trainer sees</p>
                    </div>
                  </div>
                  <Icon name="chevron.right" size={16} color="rgba(245,245,245,0.30)" />
                </div>
              </motion.div>
            )}

            {/* What Your Trainer Sees */}
            {connection.status === 'active' && (
              <motion.div
                className="glass rounded-2xl p-4"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.18 }}
              >
                <p className="text-[14px] font-semibold mb-3" style={{ color: 'rgba(245,245,245,0.65)' }}>
                  What your trainer sees
                </p>
                {Object.entries(connection.sharedData).map(([key, enabled]) => {
                  const labels: Record<string, string> = {
                    workoutHistory: 'Workout History',
                    personalRecords: 'Personal Records',
                    bodyStats: 'Body Stats',
                    streakData: 'Streak Data',
                  };
                  return (
                    <div key={key} className="flex items-center justify-between py-2">
                      <span className="text-[14px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
                        {labels[key] ?? key}
                      </span>
                      <span
                        className="text-[12px] font-semibold"
                        style={{ color: enabled ? '#30D158' : 'rgba(245,245,245,0.30)' }}
                      >
                        {enabled ? 'Shared' : 'Hidden'}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Nutrition Suggestions */}
            <NutritionSuggestionsSection />

            {/* Unsubscribe */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.24 }}
            >
              {showEndConfirm ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[15px] text-center" style={{ color: 'rgba(245,245,245,0.65)' }}>
                    End your connection with {trainer.displayName}?
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      transition={springSnappy}
                      onClick={() => setShowEndConfirm(false)}
                      className="flex-1 h-14 rounded-full glass font-semibold text-[17px]"
                      style={{ color: '#F5F5F5' }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      transition={springSnappy}
                      onClick={() => {
                        if (connection._id) {
                          endMutation.mutate(connection._id);
                          setShowEndConfirm(false);
                        }
                      }}
                      disabled={endMutation.isPending}
                      className="flex-1 h-14 rounded-full font-semibold text-[17px]"
                      style={{ background: '#FF453A', color: '#F5F5F5', opacity: endMutation.isPending ? 0.6 : 1 }}
                    >
                      {endMutation.isPending ? 'Ending...' : 'Unsubscribe'}
                    </motion.button>
                  </div>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={springSnappy}
                  onClick={() => setShowEndConfirm(true)}
                  className="w-full h-14 rounded-full font-semibold text-[17px]"
                  style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A', border: '1px solid rgba(255,69,58,0.25)' }}
                >
                  {connection.status === 'pending' ? 'CANCEL REQUEST' : 'UNSUBSCRIBE'}
                </motion.button>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Privacy Sheet */}
      {connection && connection.status === 'active' && (
        <PrivacySettingsSheet
          connectionId={connection._id}
          currentSettings={connection.sharedData as SharedDataSettings}
        />
      )}
    </div>
  );
}
