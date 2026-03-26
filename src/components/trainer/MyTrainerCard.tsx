// ═══════════════════════════════════════════════════════════════════
// FitForge — MyTrainerCard Component
// Dashboard card showing user's active trainer connection
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { SPEC_LABELS } from '@/components/trainer/TrainerCard';
import { useActiveConnection } from '@/hooks/useConnections';
import type { TrainerProfile } from '@/types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function MyTrainerCard(): React.ReactElement | null {
  const router = useRouter();
  const { data, isLoading } = useActiveConnection();

  if (isLoading) return null;

  const connection = data?.connection;
  const trainer = data?.trainer as TrainerProfile | null;

  if (!connection || !trainer) return null;

  const isPending = connection.status === 'pending';

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.12 }}
      className="glass rounded-[20px] p-4 cursor-pointer"
      onClick={() => router.push('/my-trainer')}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[12px] font-medium tracking-wide uppercase"
          style={{ color: 'rgba(245,245,245,0.45)' }}
        >
          My Trainer
        </span>
        {isPending && (
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,159,10,0.15)', color: '#FF9F0A' }}
          >
            Pending
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-[17px] font-bold"
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

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-semibold truncate" style={{ color: '#F5F5F5' }}>
            {trainer.displayName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {trainer.rating != null && trainer.rating > 0 && (
              <>
                <Icon name="star.fill" size={12} color="#C5F74F" weight="fill" />
                <span className="text-[13px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
                  {trainer.rating.toFixed(1)}
                </span>
                <span className="text-[13px]" style={{ color: 'rgba(245,245,245,0.25)' }}>·</span>
              </>
            )}
            <span className="text-[13px] truncate" style={{ color: 'rgba(245,245,245,0.55)' }}>
              {trainer.specializations.slice(0, 2).map((s) => SPEC_LABELS[s] ?? s).join(', ')}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <motion.div transition={springSnappy}>
          <Icon name="chevron.right" size={16} color="rgba(245,245,245,0.30)" />
        </motion.div>
      </div>
    </motion.div>
  );
}
