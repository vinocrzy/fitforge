// ═══════════════════════════════════════════════════════════════════
// FitForge — TrainerDetailView Component
// Full trainer profile display with sections
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { SPEC_LABELS, SPEC_COLORS } from '@/components/trainer/TrainerCard';
import type { TrainerProfile } from '@/types';

export interface TrainerDetailViewProps {
  trainer: TrainerProfile;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function TrainerDetailView({ trainer }: TrainerDetailViewProps): React.ReactElement {
  const availabilityLabel =
    trainer.availability === 'accepting'
      ? 'Accepting new clients'
      : trainer.availability === 'full'
        ? 'Currently full'
        : 'Paused';

  const availabilityColor =
    trainer.availability === 'accepting' ? '#30D158' : '#FF9F0A';

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header (avatar + name + rating) ──────────────── */}
      <motion.div
        className="flex flex-col items-center gap-3 pt-2"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Avatar */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-[32px] font-bold"
          style={{
            background: 'linear-gradient(135deg, #C5F74F, #8BC34A)',
            color: '#0B0B0B',
            border: trainer.availability === 'accepting'
              ? '3px solid rgba(197,247,79,0.50)'
              : '3px solid rgba(255,255,255,0.12)',
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

        {/* Name */}
        <h2
          className="text-[28px] font-extrabold text-center"
          style={{ color: '#F5F5F5', letterSpacing: '-0.025em' }}
        >
          {trainer.displayName}
        </h2>

        {/* Rating */}
        {trainer.rating != null && trainer.rating > 0 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon
                key={i}
                name="star.fill"
                size={16}
                color={i < Math.round(trainer.rating ?? 0) ? '#C5F74F' : 'rgba(255,255,255,0.15)'}
                weight="fill"
              />
            ))}
            <span className="text-[15px] font-medium ml-1" style={{ color: 'rgba(245,245,245,0.60)' }}>
              {trainer.rating.toFixed(1)}
            </span>
          </div>
        )}
      </motion.div>

      {/* ── About ────────────────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl p-4"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.06 }}
      >
        <SectionTitle icon="list.bullet.clipboard.fill">About</SectionTitle>
        <p className="text-[15px] leading-relaxed mt-2" style={{ color: 'rgba(245,245,245,0.75)' }}>
          {trainer.bio}
        </p>
      </motion.div>

      {/* ── Specializations ──────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl p-4"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.10 }}
      >
        <SectionTitle icon="figure.strengthtraining.traditional">Specializations</SectionTitle>
        <div className="flex flex-wrap gap-2 mt-3">
          {trainer.specializations.map((spec) => (
            <span
              key={spec}
              className="px-3 py-1.5 rounded-full text-[13px] font-semibold"
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
      </motion.div>

      {/* ── Certifications ───────────────────────────────── */}
      {trainer.certifications.length > 0 && (
        <motion.div
          className="glass rounded-2xl p-4"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.14 }}
        >
          <SectionTitle icon="checkmark.circle.fill">Certifications</SectionTitle>
          <div className="flex flex-col gap-2 mt-3">
            {trainer.certifications.map((cert, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C5F74F' }} />
                <span className="text-[15px]" style={{ color: 'rgba(245,245,245,0.75)' }}>
                  {cert.name}
                  {cert.issuedBy && (
                    <span style={{ color: 'rgba(245,245,245,0.45)' }}> — {cert.issuedBy}</span>
                  )}
                  <span style={{ color: 'rgba(245,245,245,0.35)' }}> ({cert.year})</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Stats ────────────────────────────────────────── */}
      <motion.div
        className="glass rounded-2xl p-4"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.18 }}
      >
        <SectionTitle icon="chart.line.uptrend.xyaxis">Stats</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <StatBox label="Clients" value={String(trainer.clientCount)} />
          <StatBox label="Experience" value={`${trainer.experienceYears} yr`} />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: availabilityColor }}
          />
          <span className="text-[14px] font-medium" style={{ color: availabilityColor }}>
            {availabilityLabel}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} size={16} color="rgba(245,245,245,0.50)" weight="fill" />
      <span
        className="text-[13px] font-bold uppercase tracking-[0.08em]"
        style={{ color: 'rgba(245,245,245,0.40)' }}
      >
        {children}
      </span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div
      className="flex flex-col items-center gap-1 py-3 rounded-[12px]"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <span className="text-[22px] font-bold tabular-nums" style={{ color: '#F5F5F5' }}>
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'rgba(245,245,245,0.45)' }}>
        {label}
      </span>
    </div>
  );
}
