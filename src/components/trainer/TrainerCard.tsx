// ═══════════════════════════════════════════════════════════════════
// FitForge — TrainerCard Component
// Directory list item — avatar, name, rating, specializations
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import type { TrainerProfile, TrainerSpecialization } from '@/types';

// ─── Specialization display config ────────────────────────────────
const SPEC_LABELS: Record<TrainerSpecialization, string> = {
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

const SPEC_COLORS: Record<TrainerSpecialization, string> = {
  strength: '#FF6B35',
  cardio: '#64D2FF',
  flexibility: '#BF5AF2',
  weight_loss: '#FF453A',
  bodybuilding: '#FF9F0A',
  powerlifting: '#C5F74F',
  rehabilitation: '#30D158',
  sports_performance: '#FFD60A',
  general_fitness: '#A8A8A8',
};

export { SPEC_LABELS, SPEC_COLORS };

// ─── Component ────────────────────────────────────────────────────

export interface TrainerCardProps {
  trainer: TrainerProfile;
  onPress: () => void;
  index?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function TrainerCard({ trainer, onPress, index = 0 }: TrainerCardProps): React.ReactElement {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: Math.min(index * 0.04, 0.3) }}
      whileTap={{ scale: 0.98 }}
      onClick={onPress}
      className="w-full glass rounded-2xl p-4 flex items-start gap-3.5 text-left"
    >
      {/* Avatar */}
      <div
        className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold"
        style={{
          background: 'linear-gradient(135deg, #C5F74F, #8BC34A)',
          color: '#0B0B0B',
          border: trainer.availability === 'accepting'
            ? '2px solid rgba(197,247,79,0.40)'
            : '2px solid rgba(255,255,255,0.10)',
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

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-semibold truncate" style={{ color: '#F5F5F5' }}>
            {trainer.displayName}
          </span>
        </div>

        {/* Rating + client count */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {trainer.rating != null && trainer.rating > 0 && (
            <>
              <Icon name="star.fill" size={12} color="#C5F74F" weight="fill" />
              <span className="text-[13px] font-medium" style={{ color: 'rgba(245,245,245,0.65)' }}>
                {trainer.rating.toFixed(1)}
              </span>
              <span className="text-[13px]" style={{ color: 'rgba(245,245,245,0.30)' }}>·</span>
            </>
          )}
          <span className="text-[13px] font-medium" style={{ color: 'rgba(245,245,245,0.55)' }}>
            {trainer.clientCount} client{trainer.clientCount !== 1 ? 's' : ''}
          </span>
          <span className="text-[13px]" style={{ color: 'rgba(245,245,245,0.30)' }}>·</span>
          <span className="text-[13px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
            {trainer.experienceYears}yr exp
          </span>
        </div>

        {/* Specialization chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {trainer.specializations.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: `${SPEC_COLORS[spec]}20`,
                color: SPEC_COLORS[spec],
                border: `1px solid ${SPEC_COLORS[spec]}30`,
              }}
            >
              {SPEC_LABELS[spec]}
            </span>
          ))}
        </div>
      </div>

      {/* Chevron */}
      <div className="shrink-0 mt-1">
        <Icon name="chevron.right" size={14} color="rgba(245,245,245,0.30)" />
      </div>
    </motion.button>
  );
}
