// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-02: Trainer Detail
// Full trainer profile with subscribe CTA
// ═══════════════════════════════════════════════════════════════════

'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { springGentle } from '@/lib/motion/springs';
import { TopBar } from '@/components/layout/TopBar';
import { TrainerDetailView } from '@/components/trainer/TrainerDetailView';
import { SubscribeButton } from '@/components/trainer/SubscribeButton';
import { Icon } from '@/components/ui/Icon';
import { useTrainer } from '@/hooks/useTrainers';

interface TrainerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TrainerDetailPage({ params }: TrainerDetailPageProps): React.ReactElement {
  const { id } = use(params);
  const { data: trainer, isLoading, error } = useTrainer(id);

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="Trainer Profile" showBack />

      <div className="px-4 pt-[calc(44px+env(safe-area-inset-top,0px)+8px)] pb-28">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4 pt-8">
            <div className="w-24 h-24 rounded-full shimmer" style={{ background: '#141414' }} />
            <div className="w-40 h-6 rounded-lg shimmer" style={{ background: '#141414' }} />
            <div className="w-full h-32 rounded-2xl shimmer" style={{ background: '#141414' }} />
            <div className="w-full h-24 rounded-2xl shimmer" style={{ background: '#141414' }} />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springGentle}
          >
            <Icon name="exclamationmark.circle.fill" size={48} color="rgba(245,245,245,0.20)" />
            <p className="text-[17px] font-semibold mt-4" style={{ color: '#F5F5F5' }}>
              Trainer not found
            </p>
            <p className="mt-1 text-[15px]" style={{ color: 'rgba(245,245,245,0.50)' }}>
              This trainer profile may no longer be available.
            </p>
          </motion.div>
        )}

        {/* Trainer detail */}
        {trainer && !isLoading && (
          <TrainerDetailView trainer={trainer} />
        )}

        {/* Subscribe CTA */}
        {trainer && !isLoading && (
          <motion.div
            className="mt-6 px-1"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.24 }}
          >
            <SubscribeButton trainer={trainer} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
