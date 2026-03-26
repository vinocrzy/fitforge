// ═══════════════════════════════════════════════════════════════════
// FitForge — SubscribeButton Component
// Context-aware CTA for trainer subscription states
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useActiveConnection, useSubscribeToTrainer, useEndConnection } from '@/hooks/useConnections';
import type { TrainerProfile } from '@/types';

export interface SubscribeButtonProps {
  trainer: TrainerProfile;
}

export function SubscribeButton({ trainer }: SubscribeButtonProps): React.ReactElement {
  const { data: activeData, isLoading } = useActiveConnection();
  const subscribeMutation = useSubscribeToTrainer();
  const endMutation = useEndConnection();
  const [showConfirm, setShowConfirm] = useState(false);

  const trainerId = trainer.clerkUserId;
  const connection = activeData?.connection;

  // Determine state
  const isConnectedToThisTrainer = connection?.trainerId === trainerId;
  const isPending = isConnectedToThisTrainer && connection?.status === 'pending';
  const isActive = isConnectedToThisTrainer && connection?.status === 'active';
  const hasOtherConnection = connection && !isConnectedToThisTrainer &&
    (connection.status === 'pending' || connection.status === 'active');
  const isUnavailable = trainer.availability === 'full' || trainer.availability === 'paused';

  if (isLoading) {
    return (
      <div className="h-14 rounded-full shimmer" style={{ background: '#1E1E1E' }} />
    );
  }

  // Active connection — show unsubscribe
  if (isActive) {
    if (showConfirm) {
      return (
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={springSnappy}
        >
          <p className="text-[15px] text-center" style={{ color: 'rgba(245,245,245,0.65)' }}>
            Are you sure you want to unsubscribe from {trainer.displayName}?
          </p>
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={springSnappy}
              onClick={() => setShowConfirm(false)}
              className="flex-1 h-14 rounded-full glass font-semibold text-[17px]"
              style={{ color: '#F5F5F5' }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={springSnappy}
              onClick={() => {
                if (connection?._id) {
                  endMutation.mutate(connection._id);
                  setShowConfirm(false);
                }
              }}
              disabled={endMutation.isPending}
              className="flex-1 h-14 rounded-full font-semibold text-[17px]"
              style={{ background: '#FF453A', color: '#F5F5F5', opacity: endMutation.isPending ? 0.6 : 1 }}
            >
              {endMutation.isPending ? 'Ending...' : 'Unsubscribe'}
            </motion.button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={springSnappy}
        onClick={() => setShowConfirm(true)}
        className="w-full h-14 rounded-full font-semibold text-[17px]"
        style={{ background: 'rgba(255,69,58,0.15)', color: '#FF453A', border: '1px solid rgba(255,69,58,0.30)' }}
      >
        UNSUBSCRIBE
      </motion.button>
    );
  }

  // Pending — show waiting state
  if (isPending) {
    return (
      <motion.button
        disabled
        className="w-full h-14 rounded-full font-semibold text-[17px]"
        style={{ background: 'rgba(255,159,10,0.12)', color: '#FF9F0A', border: '1px solid rgba(255,159,10,0.25)' }}
      >
        REQUEST PENDING
      </motion.button>
    );
  }

  // Trainer not accepting
  if (isUnavailable) {
    return (
      <motion.button
        disabled
        className="w-full h-14 rounded-full font-semibold text-[17px]"
        style={{ background: 'rgba(245,245,245,0.06)', color: 'rgba(245,245,245,0.30)' }}
      >
        NOT ACCEPTING CLIENTS
      </motion.button>
    );
  }

  // Has connection with another trainer
  if (hasOtherConnection) {
    return (
      <motion.button
        disabled
        className="w-full h-14 rounded-full font-semibold text-[17px]"
        style={{ background: 'rgba(245,245,245,0.06)', color: 'rgba(245,245,245,0.40)' }}
      >
        END CURRENT SUBSCRIPTION FIRST
      </motion.button>
    );
  }

  // Default — subscribe CTA
  return (
    <div className="flex flex-col gap-2">
      <PrimaryButton
        onClick={() => subscribeMutation.mutate(trainerId)}
        disabled={subscribeMutation.isPending}
      >
        {subscribeMutation.isPending ? 'SENDING REQUEST...' : 'SUBSCRIBE TO TRAINER'}
      </PrimaryButton>
      {subscribeMutation.isError && (
        <p className="text-[13px] text-center" style={{ color: '#FF453A' }}>
          {subscribeMutation.error.message}
        </p>
      )}
    </div>
  );
}
